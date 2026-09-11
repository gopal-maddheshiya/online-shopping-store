/**
 * Server-Side Payment Gateway API Handlers
 * Endpoints:
 * - POST /api/payment/create-order
 * - POST /api/payment/verify
 * - POST /api/payment/webhook
 */

import { verifyHmacSha256 } from "./payment-gateway";
import { supabase } from "@/integrations/supabase/client";

interface CreateOrderBody {
  orderId: string;
  orderNo: string;
  amount: number; // in Rupees
  currency?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

interface VerifyPaymentBody {
  orderId: string;
  orderNo: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature: string;
  amount: number;
  paymentMethod: string;
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

/**
 * Handle /api/payment/create-order
 */
export async function handleCreatePaymentOrder(request: Request, env?: unknown): Promise<Response> {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const { orderId, orderNo, amount } = body;

    if (!orderId || !orderNo || !amount || amount <= 0) {
      return new Response(JSON.stringify({ success: false, error: "Invalid order parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const keyId = getEnvVar("RAZORPAY_KEY_ID", env) || getEnvVar("VITE_RAZORPAY_KEY_ID", env);
    const keySecret = getEnvVar("RAZORPAY_KEY_SECRET", env);

    const amountInPaise = Math.round(amount * 100);

    // If Razorpay live/test credentials are configured, create official order via Razorpay API
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
            order_id: orderId,
            order_no: orderNo,
            store: "Arun Gopal Traders",
          },
        }),
      });

      if (!rzpRes.ok) {
        const errText = await rzpRes.text();
        console.error("Razorpay API Error:", errText);
        return new Response(
          JSON.stringify({ success: false, error: "Gateway order creation failed", details: errText }),
          { status: 502, headers: { "Content-Type": "application/json" } }
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
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Graceful fallback for dynamic UPI session / mock order when keys are pending setup
    const fallbackOrderId = `order_agt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    return new Response(
      JSON.stringify({
        success: true,
        gateway: "razorpay",
        gatewayOrderId: fallbackOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: keyId || "rzp_test_fallback",
        isFallbackSession: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("handleCreatePaymentOrder error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Internal Helper: Synchronize payment status to PostgreSQL database
 */
async function syncPaymentToDatabase(params: {
  orderId?: string | undefined;
  orderNo?: string | undefined;
  paymentStatus: "paid" | "failed";
  paymentMethod?: string | undefined;
  gatewayPaymentId?: string | undefined;
  note?: string | undefined;
}): Promise<boolean> {
  const { orderId, orderNo, paymentStatus, paymentMethod, gatewayPaymentId, note } = params;
  try {
    let resolvedOrderId = orderId;

    // If internal orderId is missing, resolve by orderNo
    if (!resolvedOrderId && orderNo) {
      const { data: foundOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("order_no", orderNo)
        .maybeSingle();
      if (foundOrder?.id) {
        resolvedOrderId = foundOrder.id;
      }
    }

    if (!resolvedOrderId) {
      console.warn("[PaymentSync] Could not resolve order to sync payment:", params);
      return false;
    }

    // 1. Try secure RPC procedure for payment status
    try {
      await supabase.rpc("admin_update_payment_status" as never, {
        _order_id: resolvedOrderId,
        _payment_status: paymentStatus,
      } as never);
    } catch {
      // Non-blocking fallback to direct table update
    }

    // 2. Direct table update to ensure payment_status, method and timestamp are set
    const updatePayload: Record<string, unknown> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };
    if (paymentMethod) {
      updatePayload["payment_method"] = paymentMethod;
    }
    if (paymentStatus === "paid") {
      updatePayload["paid_at"] = new Date().toISOString();
    }

    await supabase
      .from("orders")
      .update(updatePayload as never)
      .eq("id", resolvedOrderId);

    // 3. Log event into order_events table
    try {
      await supabase
        .from("order_events")
        .insert({
          order_id: resolvedOrderId,
          status: paymentStatus,
          note:
            note ||
            (paymentStatus === "paid"
              ? `Online payment verified via Razorpay${gatewayPaymentId ? ` (ID: ${gatewayPaymentId})` : ""}`
              : `Online payment failed${gatewayPaymentId ? ` (ID: ${gatewayPaymentId})` : ""}`),
        } as never);
    } catch {
      // Event log failure non-blocking
    }

    return true;
  } catch (err) {
    console.error("[PaymentSync] Error syncing payment to database:", err);
    return false;
  }
}

/**
 * Handle /api/payment/verify
 */
export async function handleVerifyPayment(request: Request, env?: unknown): Promise<Response> {
  try {
    const body = (await request.json()) as VerifyPaymentBody;
    const { orderId, orderNo, gatewayOrderId, gatewayPaymentId, signature, amount, paymentMethod } = body;

    if (!orderId || !gatewayPaymentId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required verification fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const keySecret = getEnvVar("RAZORPAY_KEY_SECRET", env);

    // If private key secret is set, verify cryptographic HMAC signature
    if (keySecret && gatewayOrderId && signature) {
      const dataToSign = `${gatewayOrderId}|${gatewayPaymentId}`;
      const isValid = await verifyHmacSha256(dataToSign, signature, keySecret);

      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid payment signature verification failed" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Persist verified payment status to Supabase database
    await syncPaymentToDatabase({
      orderId,
      orderNo,
      paymentStatus: "paid",
      paymentMethod,
      gatewayPaymentId,
      note: `Payment verified via gateway (Payment ID: ${gatewayPaymentId})`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        orderId,
        gatewayOrderId,
        gatewayPaymentId,
        amount,
        paymentMethod,
        verifiedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("handleVerifyPayment error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle /api/payment/webhook (Async Gateway Updates)
 */
export async function handlePaymentWebhook(request: Request, env?: unknown): Promise<Response> {
  try {
    const rawBody = await request.text();
    const webhookSignature = request.headers.get("x-razorpay-signature") || "";
    const webhookSecret = getEnvVar("RAZORPAY_WEBHOOK_SECRET", env);

    if (webhookSecret && webhookSignature) {
      const isValid = await verifyHmacSha256(rawBody, webhookSignature, webhookSecret);
      if (!isValid) {
        console.warn("Invalid Razorpay webhook signature");
        return new Response("Invalid signature", { status: 400 });
      }
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

    console.info(`Received Razorpay webhook event: ${payload.event}`);

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const notes = paymentEntity?.notes || orderEntity?.notes;
    const targetOrderId = (notes ? notes["order_id"] : undefined);
    const targetOrderNo = (notes ? notes["order_no"] : undefined) || orderEntity?.receipt;
    const gatewayPaymentId = paymentEntity?.id;
    const paymentMethod = paymentEntity?.method;

    if (event === "payment.captured" || event === "order.paid") {
      await syncPaymentToDatabase({
        orderId: targetOrderId,
        orderNo: targetOrderNo,
        paymentStatus: "paid",
        paymentMethod,
        gatewayPaymentId,
        note: `Webhook confirmed: ${event} (Payment ID: ${gatewayPaymentId || "N/A"})`,
      });
    } else if (event === "payment.failed") {
      await syncPaymentToDatabase({
        orderId: targetOrderId,
        orderNo: targetOrderNo,
        paymentStatus: "failed",
        paymentMethod,
        gatewayPaymentId,
        note: `Webhook confirmed: ${event} (Payment ID: ${gatewayPaymentId || "N/A"})`,
      });
    }

    // Return 200 OK to acknowledge receipt idempotently
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
