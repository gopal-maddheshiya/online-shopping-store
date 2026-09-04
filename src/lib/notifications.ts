/**
 * Telegram & WhatsApp Order Alerts & Notifications
 * Store: Arun Gopal Traders
 */

import { inr, formatDate } from "@/lib/format";
import type { Order, StoreSettings } from "@/lib/queries";

export const DEFAULT_TELEGRAM_BOT_TOKEN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TELEGRAM_BOT_TOKEN) || "";
export const DEFAULT_TELEGRAM_CHAT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TELEGRAM_CHAT_ID) || "";

export interface TelegramOrderAlertPayload {
  orderNo: string;
  customerName: string;
  customerPhone: string;
  orderType: "delivery" | "pickup";
  address?: {
    house?: string;
    area?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
  } | null;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    variant_label?: string | null;
  }>;
  total: number;
  paymentMethod: string;
  paymentStatus?: string | null;
  createdAt?: string;
  customerNote?: string | null;
}

/**
 * Generates beautifully formatted, clean Hindi alert for Telegram bot
 */
export function buildTelegramOrderMessage(payload: TelegramOrderAlertPayload): string {
  const isDelivery = payload.orderType === "delivery";
  const itemsText = payload.items
    .map(
      (it) =>
        ` • ${it.name}${it.variant_label ? ` (${it.variant_label})` : ""} - ${it.qty} x ${inr(it.price)} = ${inr(it.qty * it.price)}`
    )
    .join("\n");

  const addressText = isDelivery && payload.address
    ? [
        payload.address.house,
        payload.address.area,
        payload.address.landmark,
        payload.address.city || "महराजगंज",
        payload.address.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : "दुकान से पिकअप (रामनगर, अड्डा बाजार रोड, महराजगंज)";

  const paymentMethodLabel =
    payload.paymentMethod === "cod"
      ? "कैश ऑन डिलीवरी (घर पर भुगतान)"
      : payload.paymentMethod === "pay_at_store"
      ? "दुकान काउंटर पर भुगतान"
      : payload.paymentMethod === "upi"
      ? "UPI द्वारा"
      : "ऑनलाइन भुगतान";

  return `🔔 *${isDelivery ? "नया डिलीवरी ऑर्डर!" : "नया पिकअप ऑर्डर!"} • अरुण गोपाल ट्रेडर्स*
━━━━━━━━━━━━━━━━━━━━━━━━
📦 *ऑर्डर नंबर:* #${payload.orderNo}
👤 *ग्राहक:* ${payload.customerName}
📞 *मोबाइल:* +91 ${payload.customerPhone.replace(/\D/g, "").slice(-10)}
${isDelivery ? `📍 *डिलीवरी पता:* ${addressText}` : `🏪 *ऑर्डर प्रकार:* दुकान पर आकर सामान लेना है (Store Pickup)`}
🚚 *Fulfillment:* ${isDelivery ? "⚡ होम डिलीवरी (30 मिनट एक्सप्रेस)" : "🏬 दुकान से पिकअप"}

🛒 *सामान की सूची:*
${itemsText || " • किराना सामान"}

💰 *कुल राशि:* ${inr(payload.total)} (${paymentMethodLabel})
⏰ *समय:* ${formatDate(payload.createdAt || new Date().toISOString())}
${payload.customerNote ? `📝 *ग्राहक का नोट:* ${payload.customerNote}\n` : ""}━━━━━━━━━━━━━━━━━━━━━━━━
👉 *एडमिन पैनल में प्रबंधित करें:*
https://arungopaltraders.com/admin?order=${payload.orderNo}`;
}

/**
 * Sends Instant Order Alert to Telegram Bot
 */
export async function sendTelegramOrderNotification(
  payload: TelegramOrderAlertPayload,
  settings?: StoreSettings | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = settings?.telegram_bot_token?.trim() || DEFAULT_TELEGRAM_BOT_TOKEN;
    const chatId = settings?.telegram_chat_id?.trim() || DEFAULT_TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return { success: false, error: "Telegram bot token or chat ID is not configured" };
    }

    const message = buildTelegramOrderMessage(payload);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.warn("Telegram bot send error:", data);
      return { success: false, error: data.description || "Telegram notification failed" };
    }

    return { success: true };
  } catch (err: unknown) {
    console.warn("Failed to dispatch Telegram order alert:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Builds well-organized, respectful Hindi WhatsApp message for the customer
 * Differentiates accurately between Delivery and Store Pickup
 */
export function buildCustomerWhatsAppMessage(
  order: Order,
  settings?: StoreSettings | null
): string {
  const isDelivery = order.order_type === "delivery";
  const customerName = order.customer_name?.trim() || "ग्राहक";
  const storePhone = settings?.phone || "6388354988";
  const cleanPhone = storePhone.replace(/\D/g, "").slice(-10);

  if (isDelivery) {
    const addressStr = order.address
      ? [
          order.address.house,
          order.address.area,
          order.address.landmark,
          order.address.city || "महराजगंज",
        ]
          .filter(Boolean)
          .join(", ")
      : "महराजगंज";

    return `नमस्ते ${customerName} जी! 🙏

अरुण गोपाल ट्रेडर्स (महराजगंज) में आपका स्वागत है।

आपका ऑर्डर #${order.order_no} हमें प्राप्त हो गया है और सामान पैक किया जा रहा है। हमारे डिलीवरी पार्टनर जल्द ही आपके पते पर सामान पहुँचा देंगे।

📦 *ऑर्डर नंबर:* #${order.order_no}
💰 *कुल भुगतान राशि:* ${inr(order.total)} (${order.payment_status === "paid" ? "भुगतान हो चुका है" : "कैश ऑन डिलीवरी"})
📍 *डिलीवरी का पता:* ${addressStr}
🚚 *डिलीवरी समय:* 30 मिनट एक्सप्रेस

किसी भी सहायता के लिए हमें संपर्क करें: ${cleanPhone}

धन्यवाद! आपका दिन शुभ हो। ✨
*अरुण गोपाल ट्रेडर्स*`;
  }

  // Store Pickup Template
  return `नमस्ते ${customerName} जी! 🙏

अरुण गोपाल ट्रेडर्स (महराजगंज) में आपका स्वागत है।

आपका ऑर्डर #${order.order_no} हमें मिल गया है। आपका सामान दुकान पर पैक करके तैयार रखा जा रहा है।

कृपया दुकान पर पधारकर अपना सामान प्राप्त करें और काउंटर पर भुगतान करें।

📦 *ऑर्डर नंबर:* #${order.order_no}
💰 *कुल राशि:* ${inr(order.total)} (काउंटर पर भुगतान)
📍 *दुकान का पता:* रामनगर, अड्डा बाजार रोड, महराजगंज (उ.प्र.)
🗺️ *गूगल मैप:* https://maps.google.com/?q=Arun+Gopal+Traders+Maharajganj

दुकान पर आने से पहले या किसी प्रश्न के लिए संपर्क करें: ${cleanPhone}

धन्यवाद! ✨
*अरुण गोपाल ट्रेडर्स*`;
}
