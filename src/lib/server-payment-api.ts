/**
 * Server-Side Payment Gateway API Handlers (Fail-Closed HMAC Verification)
 * Endpoints:
 * - POST /api/payment/create-order
 * - POST /api/payment/verify
 * - POST /api/payment/webhook
 */

import { verifyHmacSha256 } from "./payment-gateway";

interface CreateOrderBody {
  orderId: string;
  orderNo: string;
  phone?: string;
  amount: number; // Cross-checked against authoritative DB order total
  currency?: string;
}

interface VerifyPaymentBody {
  orderId: string;
  orderNo?: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature: string;
  amount?: number;
  paymentMethod?: string;
  metadata?: Record<string, unknown>;
}

function getEnvVar(key: string, env?: unknown): string {
  const envObj = (env || {}) as Record<string, string | undefined>;
  return (
    envObj[key] ||
    (typeof process !== "undefined" && process.env ? process.env[key] : undefined) ||
    ""
  ).trim();
}

async function getAuthoritativeOrderTotal(
  orderId: string,
  orderNo?: string,
  phone?: string,
): Promise<{ total: number; resolvedOrderId: string } | null> {
  if (typeof process !== "undefined" && process.env?.["SUPABASE_SERVICE_ROLE_KEY"]) {
    try {
      const { supabaseAdmin } = await import("../integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("orders")
        .select("id, total")
        .eq("id", orderId)
        .maybeSingle();
      if (data?.id) {
        return { resolvedOrderId: data.id, total: Number(data.total || 0) };
      }
    } catch {
      // Fall through to lookup_order RPC
    }
  }

  const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10);
  if (orderNo && cleanPhone.length === 10) {
    try {
      const { supabase } = await import("../integrations/supabase/client");
      const { data } = await supabase.rpc("lookup_order", {
        _order_no: orderNo,
        _phone: cleanPhone,
      });
      if (data && typeof data === "object" && "id" in data) {
        const rec = data as { id: string; total?: number };
        return { resolvedOrderId: rec.id, total: Number(rec.total || 0) };
      }
    } catch {
      // Non-blocking
    }
  }

  return null;
}

/**
 * Handle /api/payment/create-order
 */
export async function handleCreatePaymentOrder(request: Request, env?: unknown): Promise<Response> {
  const jsonHeaders = { "Content-Type": "application/json" };
  try {
    const body = (await request.json()) as CreateOrderBody;
    const { orderId, orderNo, phone, amount } = body;

    if (!orderId || !orderNo) {
      return new Response(JSON.stringify({ success: false, error: "Invalid order parameters" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const dbOrder = await getAuthoritativeOrderTotal(orderId, orderNo, phone);
    const authoritativeAmount = dbOrder ? dbOrder.total : Number(amount || 0);

    if (!authoritativeAmount || authoritativeAmount <= 0) {
      return new Response(JSON.stringify({ success: false, error: "Invalid order total" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const keyId = getEnvVar("RAZORPAY_KEY_ID", env) || getEnvVar("VITE_RAZORPAY_KEY_ID", env);
    const keySecret = getEnvVar("RAZORPAY_KEY_SECRET", env);
    const amountInPaise = Math.round(authoritativeAmount * 100);

    if (keyId && keySecret) {
      const auth = btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: body.currency || "INR",
          receipt: orderNo.slice(-40),
          notes: {
            order_id: dbOrder?.resolvedOrderId || orderId,
            order_no: orderNo,
            store: "Arun Gopal Traders",
          },
        }),
      });

      if (!rzpRes.ok) {
        const errText = await rzpRes.text();
        console.error("Razorpay API Error:", errText);
        return new Response(
          JSON.stringify({ success: false, error: "Gateway order creation failed" }),
          { status: 502, headers: jsonHeaders },
        );
      }

      const rzpData = (await rzpRes.json()) as { id: string; amount: number; currency: string };
      return new Response(
        JSON.stringify({
          success: true,
          gateway: "razorpay",
          gatewayOrderId: rzpData.id,
          amount: rzpData.amount,
          currency: rzpData.currency,
          keyId,
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        gatewayUnavailable: true,
        error: "Razorpay gateway credentials are not configured on server",
      }),
      { status: 503, headers: jsonHeaders },
    );
  } catch (err: unknown) {
    console.error("handleCreatePaymentOrder error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: jsonHeaders },
    );
  }
}

/**
 * Persist verified payment using trusted service_role supabaseAdmin ONLY.
 */
async function syncVerifiedPaymentWithAdmin(params: {
  orderId?: string | undefined;
  orderNo?: string | undefined;
  paymentStatus: "paid" | "failed";
  paymentMethod?: string | undefined;
  gatewayOrderId?: string | undefined;
  gatewayPaymentId?: string | undefined;
  signature?: string | undefined;
  amount?: number | undefined;
  note?: string | undefined;
}): Promise<{ ok: boolean; error?: string }> {
  if (typeof process === "undefined" || !process.env?.["SUPABASE_SERVICE_ROLE_KEY"]) {
    return {
      ok: false,
      error: "Server SUPABASE_SERVICE_ROLE_KEY is required to record verified gateway payments",
    };
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let resolvedOrderId = params.orderId;
    let orderTotal = Number(params.amount || 0);
    let currentOrderStatus = "placed";

    if (!resolvedOrderId && params.orderNo) {
      const { data: found } = await supabaseAdmin
        .from("orders")
        .select("id, total, status")
        .eq("order_no", params.orderNo)
        .maybeSingle();
      if (found?.id) {
        resolvedOrderId = found.id;
        orderTotal = Number(found.total || orderTotal);
        currentOrderStatus = String(found.status || "placed");
      }
    } else if (resolvedOrderId) {
      const { data: found } = await supabaseAdmin
        .from("orders")
        .select("id, total, status")
        .eq("id", resolvedOrderId)
        .maybeSingle();
      if (found?.id) {
        orderTotal = Number(found.total || orderTotal);
        currentOrderStatus = String(found.status || "placed");
      }
    }

    if (!resolvedOrderId) {
      return { ok: false, error: "Order not found for payment synchronization" };
    }

    if (params.paymentStatus === "paid") {
      const verifiedAmount = params.amount && params.amount > 0 ? params.amount : orderTotal;
      const { data: rpcRes, error: rpcErr } = await (supabaseAdmin.rpc as Function)(
        "verify_and_confirm_payment",
        {
          p_order_id: resolvedOrderId,
          p_gateway_order_id: params.gatewayOrderId || null,
          p_gateway_payment_id: params.gatewayPaymentId || "",
          p_signature: params.signature || "webhook_verified",
          p_amount: verifiedAmount,
          p_method: params.paymentMethod || "razorpay",
          p_metadata: {},
        },
      );

      if (rpcErr || !rpcRes?.success) {
        return { ok: false, error: rpcErr?.message || rpcRes?.error || "Database payment verification failed" };
      }
      return { ok: true };
    }

    // Failure path: mark payment_status='failed' and preserve valid order_status enum on order_events
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "failed",
        payment_error: params.note || "Online payment failed",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", resolvedOrderId);

    await supabaseAdmin
      .from("order_events")
      .insert({
        order_id: resolvedOrderId,
        status: currentOrderStatus,
        note: params.note || "Online payment failed",
      } as never);

    return { ok: true };
  } catch (err) {
    console.error("[PaymentSync] Error syncing verified payment:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Database sync error" };
  }
}

/**
 * Handle /api/payment/verify (Strict Fail-Closed HMAC-SHA256)
 */
export async function handleVerifyPayment(request: Request, env?: unknown): Promise<Response> {
  const jsonHeaders = { "Content-Type": "application/json" };
  try {
    const body = (await request.json()) as VerifyPaymentBody;
    const { orderId, orderNo, gatewayOrderId, gatewayPaymentId, signature, amount, paymentMethod } = body;

    if (!orderId || !gatewayOrderId || !gatewayPaymentId || !signature) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required verification fields (orderId, gatewayOrderId, gatewayPaymentId, signature)",
        }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const keySecret = getEnvVar("RAZORPAY_KEY_SECRET", env);
    if (!keySecret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Razorpay key secret is not configured on the server",
        }),
        { status: 503, headers: jsonHeaders },
      );
    }

    const dataToSign = `${gatewayOrderId}|${gatewayPaymentId}`;
    const isValid = await verifyHmacSha256(dataToSign, signature, keySecret);

    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payment signature verification failed" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const syncRes = await syncVerifiedPaymentWithAdmin({
      orderId,
      orderNo,
      paymentStatus: "paid",
      paymentMethod,
      gatewayOrderId,
      gatewayPaymentId,
      signature,
      amount,
    });

    if (!syncRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: syncRes.error || "Could not persist payment" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        orderId,
        gatewayOrderId,
        gatewayPaymentId,
        transactionId: gatewayPaymentId,
        paymentMethod,
        verifiedAt: new Date().toISOString(),
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err: unknown) {
    console.error("handleVerifyPayment error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: jsonHeaders },
    );
  }
}

/**
 * Handle /api/payment/webhook (Strict Fail-Closed Razorpay Webhook Signature Check)
 */
export async function handlePaymentWebhook(request: Request, env?: unknown): Promise<Response> {
  try {
    const rawBody = await request.text();
    const webhookSignature = request.headers.get("x-razorpay-signature") || "";
    const webhookSecret = getEnvVar("RAZORPAY_WEBHOOK_SECRET", env);

    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 503 });
    }
    if (!webhookSignature) {
      return new Response("Missing x-razorpay-signature header", { status: 401 });
    }

    const isValid = await verifyHmacSha256(rawBody, webhookSignature, webhookSecret);
    if (!isValid) {
      console.warn("Invalid Razorpay webhook signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            amount?: number;
            status?: string;
            method?: string;
            notes?: Record<string, string>;
          };
        };
        order?: {
          entity?: {
            id?: string;
            amount?: number;
            status?: string;
            receipt?: string;
            notes?: Record<string, string>;
          };
        };
      };
    };

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const notes = paymentEntity?.notes || orderEntity?.notes;
    const targetOrderId = notes ? notes["order_id"] : undefined;
    const targetOrderNo = (notes ? notes["order_no"] : undefined) || orderEntity?.receipt;
    const gatewayPaymentId = paymentEntity?.id;
    const gatewayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentMethod = paymentEntity?.method;
    const amountRupees = paymentEntity?.amount ? paymentEntity.amount / 100 : undefined;

    if (event === "payment.captured" || event === "order.paid") {
      const res = await syncVerifiedPaymentWithAdmin({
        orderId: targetOrderId,
        orderNo: targetOrderNo,
        paymentStatus: "paid",
        paymentMethod,
        gatewayOrderId,
        gatewayPaymentId,
        signature: webhookSignature,
        amount: amountRupees,
        note: `Webhook confirmed: ${event} (Payment ID: ${gatewayPaymentId || "N/A"})`,
      });
      if (!res.ok) {
        return new Response(res.error || "Payment verification sync failed", { status: 400 });
      }
    } else if (event === "payment.failed") {
      await syncVerifiedPaymentWithAdmin({
        orderId: targetOrderId,
        orderNo: targetOrderNo,
        paymentStatus: "failed",
        paymentMethod,
        gatewayOrderId,
        gatewayPaymentId,
        note: `Webhook confirmed: ${event} (Payment ID: ${gatewayPaymentId || "N/A"})`,
      });
    }

    return new Response(JSON.stringify({ status: "ok", received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("handlePaymentWebhook error:", err);
    return new Response("Webhook processing error", { status: 500 });
  }
}

/**
 * Route Dispatcher for /api/payment/*
 */
export async function dispatchPaymentApiRoute(request: Request, env?: unknown): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "POST") {
    if (path === "/api/payment/create-order") {
      return await handleCreatePaymentOrder(request, env);
    }
    if (path === "/api/payment/verify") {
      return await handleVerifyPayment(request, env);
    }
    if (path === "/api/payment/webhook") {
      return await handlePaymentWebhook(request, env);
    }
  }

  return null;
}
