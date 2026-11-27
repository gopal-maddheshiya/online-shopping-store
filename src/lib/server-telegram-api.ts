/**
 * Server-Side Telegram Notification API Handler
 * Endpoint: POST /api/notify/telegram
 *
 * Security rules:
 * - Bot token and chat ID are NEVER accepted from browser requests.
 * - Credentials come ONLY from server env vars (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)
 *   or admin-only `store_secrets` via authenticated/service client.
 * - Order alerts reconstruct order summary from PostgreSQL via lookup_order/DB (no forged amounts).
 * - Custom test messages require a verified Admin Bearer JWT.
 */

import { verifyAdminRequest } from "../integrations/supabase/auth-middleware";
import { inr, formatDate } from "./format";
import { SITE_URL } from "./site-config";
import { createClient } from "@supabase/supabase-js";

interface TelegramNotifyBody {
  action?: "order_alert" | "upi_claimed" | "test";
  orderNo?: string;
  phone?: string;
  utrRef?: string | undefined;
  message?: string;
}

function getServerEnvVar(key: string, env?: unknown): string {
  const envObj = (env || {}) as Record<string, string | undefined>;
  return (
    envObj[key] ||
    (typeof process !== "undefined" && process.env ? process.env[key] : undefined) ||
    ""
  ).trim();
}

async function resolveTelegramCredentials(
  env?: unknown,
  adminClient?: ReturnType<typeof createClient>,
): Promise<{ token: string; chatId: string }> {
  let token = getServerEnvVar("TELEGRAM_BOT_TOKEN", env);
  let chatId = getServerEnvVar("TELEGRAM_CHAT_ID", env);

  if ((!token || !chatId) && process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
    try {
      const { supabaseAdmin } = await import("../integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("store_secrets" as never)
        .select("telegram_bot_token, telegram_chat_id")
        .eq("id", 1)
        .maybeSingle();
      const row = data as { telegram_bot_token?: string | null; telegram_chat_id?: string | null } | null;
      if (!token && row?.telegram_bot_token) token = row.telegram_bot_token.trim();
      if (!chatId && row?.telegram_chat_id) chatId = row.telegram_chat_id.trim();
    } catch {
      // Optional service role lookup
    }
  }

  if ((!token || !chatId) && adminClient) {
    try {
      const { data } = await adminClient
        .from("store_secrets" as never)
        .select("telegram_bot_token, telegram_chat_id")
        .eq("id", 1)
        .maybeSingle();
      const row = data as { telegram_bot_token?: string | null; telegram_chat_id?: string | null } | null;
      if (!token && row?.telegram_bot_token) token = row.telegram_bot_token.trim();
      if (!chatId && row?.telegram_chat_id) chatId = row.telegram_chat_id.trim();
    } catch {
      // Ignore fallback
    }
  }

  return { token, chatId };
}

function buildVerifiedOrderTelegramText(order: Record<string, unknown>, event: "order_alert" | "upi_claimed", utrRef?: string | undefined): string {
  const orderType = String(order["order_type"] || "delivery");
  const isDelivery = orderType === "delivery";
  const addr = (order["address"] || {}) as Record<string, string | undefined>;
  const addressText = isDelivery
    ? [addr["house"], addr["area"], addr["landmark"], addr["city"] || "महराजगंज", addr["pincode"]]
        .filter(Boolean)
        .join(", ")
    : "दुकान से पिकअप (रामनगर, अड्डा बाजार रोड, महराजगंज)";

  const itemsList = (Array.isArray(order["order_items"]) ? order["order_items"] : []) as Array<Record<string, unknown>>;
  const itemsText = itemsList
    .map((it) => {
      const name = String(it["name_hi"] || it["name"] || "सामान");
      const variant = String(it["variant_label_hi"] || it["variant_label"] || "");
      const qty = Number(it["qty"] || 1);
      const price = Number(it["price"] || 0);
      return ` • ${name}${variant ? ` (${variant})` : ""} - ${qty} x ${inr(price)} = ${inr(qty * price)}`;
    })
    .join("\n");

  const method = String(order["payment_method"] || "cod");
  const methodLabel =
    method === "cod"
      ? "कैश ऑन डिलीवरी"
      : method === "pay_at_store"
      ? "दुकान काउंटर पर भुगतान"
      : method === "qr"
      ? "डायनामिक UPI QR"
      : method === "upi"
      ? "UPI"
      : "ऑनलाइन भुगतान";

  const paymentStatus = String(order["payment_status"] || "pending");
  const statusBanner =
    event === "upi_claimed"
      ? `💸 *ग्राहक ने UPI/QR भुगतान की पुष्टि की (जांच बाकी)*\n⚠️ कृपया PhonePe/GPay ऐप में *${inr(Number(order["total"] || 0))}* आने की जांच करके Admin पैनल से Paid मार्क करें।${utrRef ? `\n🔖 *UTR / Ref:* \`${utrRef}\`` : ""}`
      : `🔔 *${isDelivery ? "नया डिलीवरी ऑर्डर!" : "नया पिकअप ऑर्डर!"} • अरुण गोपाल ट्रेडर्स*`;

  const phone = String(order["customer_phone"] || "").replace(/\D/g, "").slice(-10);

  return `${statusBanner}
━━━━━━━━━━━━━━━━━━━━━━━━
📦 *ऑर्डर नंबर:* #${String(order["order_no"] || "")}
👤 *ग्राहक:* ${String(order["customer_name"] || "Customer")}
📞 *मोबाइल:* +91 ${phone}
${isDelivery ? `📍 *डिलीवरी पता:* ${addressText}` : `🏪 *ऑर्डर प्रकार:* दुकान से पिकअप`}
💳 *भुगतान स्थिति:* ${paymentStatus === "paid" ? "✅ PAID" : "⏳ PENDING VERIFICATION"} (${methodLabel})

🛒 *सामान की सूची:*
${itemsText || " • किराना सामान"}

💰 *कुल राशि:* ${inr(Number(order["total"] || 0))}
⏰ *समय:* ${formatDate(String(order["created_at"] || new Date().toISOString()))}
${order["notes"] ? `📝 *नोट:* ${String(order["notes"])}\n` : ""}━━━━━━━━━━━━━━━━━━━━━━━━
👉 *एडमिन पैनल में देखें:*
${SITE_URL}/admin`;
}

export async function handleTelegramNotify(request: Request, env?: unknown): Promise<Response> {
  const jsonHeaders = { "Content-Type": "application/json" };

  try {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers: jsonHeaders,
      });
    }

    const body = (await request.json()) as TelegramNotifyBody;
    const action = body.action || "order_alert";
    let textToSend = "";
    let adminClient: ReturnType<typeof createClient> | undefined;

    if (action === "test") {
      const admin = await verifyAdminRequest(request);
      if (!admin.isAdmin) {
        return new Response(JSON.stringify({ success: false, error: "Admin authorization required" }), {
          status: 401,
          headers: jsonHeaders,
        });
      }
      adminClient = admin.supabase as unknown as ReturnType<typeof createClient>;
      if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
        return new Response(JSON.stringify({ success: false, error: "message is required" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }
      textToSend = body.message.trim().slice(0, 2000);
    } else if (action === "order_alert" || action === "upi_claimed") {
      const orderNo = (body.orderNo || "").trim();
      const cleanPhone = (body.phone || "").replace(/\D/g, "").slice(-10);
      if (!orderNo || cleanPhone.length !== 10) {
        return new Response(
          JSON.stringify({ success: false, error: "Valid orderNo and 10-digit phone required" }),
          { status: 400, headers: jsonHeaders },
        );
      }

      const supabaseUrl =
        getServerEnvVar("SUPABASE_URL", env) ||
        getServerEnvVar("VITE_SUPABASE_URL", env) ||
        "https://rvpskkgrobztgcfznawl.supabase.co";
      const anonKey =
        getServerEnvVar("SUPABASE_PUBLISHABLE_KEY", env) ||
        getServerEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY", env) ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cHNra2dyb2J6dGdjZnpuYXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDc0MzAsImV4cCI6MjEwMzQyMzQzMH0.FCO6H2AWcHQ_QznsOVBsAuJxOUjMLs_qTjvrnsCxK4k";

      const publicClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: orderData, error: lookupErr } = await publicClient.rpc("lookup_order", {
        _order_no: orderNo,
        _phone: cleanPhone,
      });

      if (lookupErr || !orderData || typeof orderData !== "object") {
        return new Response(JSON.stringify({ success: false, error: "Order verification failed" }), {
          status: 404,
          headers: jsonHeaders,
        });
      }

      textToSend = buildVerifiedOrderTelegramText(
        orderData as Record<string, unknown>,
        action,
        body.utrRef,
      );
    } else {
      return new Response(JSON.stringify({ success: false, error: "Invalid notification action" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const { token, chatId } = await resolveTelegramCredentials(env, adminClient);
    if (!token || !chatId) {
      console.warn("[Telegram] Bot token or chat ID not configured on server. Skipping notification.");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Telegram not configured" }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: textToSend,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });

    const tgData = (await tgRes.json()) as { ok?: boolean; description?: string };
    if (!tgRes.ok || !tgData.ok) {
      console.warn("[Telegram] Send error:", tgData);
      return new Response(
        JSON.stringify({
          success: false,
          error: tgData.description || "Telegram send failed",
        }),
        { status: 502, headers: jsonHeaders },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err: unknown) {
    console.error("[Telegram] handleTelegramNotify error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Internal error",
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
}
