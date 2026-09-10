/**
 * Server-Side Telegram Notification API Handler
 * Endpoint: POST /api/notify/telegram
 *
 * Token is read from server-only env vars (no VITE_ prefix).
 * This ensures the Telegram bot token is NEVER exposed in the client bundle.
 */

interface TelegramNotifyBody {
  message: string;
  token?: string;  // Optional: override from DB settings (still server-to-server)
  chatId?: string; // Optional: override from DB settings
}

function getServerEnvVar(key: string, env?: unknown): string {
  const envObj = (env || {}) as Record<string, string | undefined>;
  return (
    envObj[key] ||
    (typeof process !== "undefined" && process.env ? process.env[key] : undefined) ||
    ""
  ).trim();
}

/**
 * Handles POST /api/notify/telegram
 * Sends a pre-built message to the Telegram bot — token is server-only.
 */
export async function handleTelegramNotify(request: Request, env?: unknown): Promise<Response> {
  const corsHeaders = {
    "Content-Type": "application/json",
  };

  try {
    // Only allow POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const body = (await request.json()) as TelegramNotifyBody;
    const { message, token: bodyToken, chatId: bodyChatId } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ success: false, error: "message is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Read token from server-only env (no VITE_ prefix) — falls back to body token if DB-provided
    const token =
      bodyToken?.trim() ||
      getServerEnvVar("TELEGRAM_BOT_TOKEN", env);

    const chatId =
      bodyChatId?.trim() ||
      getServerEnvVar("TELEGRAM_CHAT_ID", env);

    if (!token || !chatId) {
      // Not configured — silently succeed so order flow is not blocked
      console.warn("[Telegram] Bot token or chat ID not configured. Skipping notification.");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Telegram not configured" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Call Telegram API from server (token never leaves the server)
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
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
        { status: 502, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: unknown) {
    console.error("[Telegram] handleTelegramNotify error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Internal error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
