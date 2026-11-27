/**
 * Server-Side Gemini AI Proxy API Handler
 * Endpoint: POST /api/ai/gemini
 * Keeps GEMINI_API_KEY strictly on the server (never bundled in client JS).
 */

import { verifyAdminRequest } from "../integrations/supabase/auth-middleware";

type AiAction =
  | "smart_ration"
  | "semantic_search"
  | "admin_parse_bill"
  | "admin_translate"
  | "admin_autocomplete";

interface GeminiProxyBody {
  action: AiAction;
  requestBody: Record<string, unknown>;
}

const ADMIN_ACTIONS = new Set<AiAction>([
  "admin_parse_bill",
  "admin_translate",
  "admin_autocomplete",
]);

const ALLOWED_ACTIONS = new Set<AiAction>([
  "smart_ration",
  "semantic_search",
  "admin_parse_bill",
  "admin_translate",
  "admin_autocomplete",
]);

// Lightweight per-IP sliding window rate limiter for public AI actions
const publicRateMap = new Map<string, { count: number; resetAt: number }>();
const PUBLIC_RATE_LIMIT = 20;
const PUBLIC_WINDOW_MS = 60 * 1000;

function checkPublicRateLimit(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = (forwarded.split(",")[0] || request.headers.get("x-real-ip") || "local").trim();
  const now = Date.now();
  const entry = publicRateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    publicRateMap.set(ip, { count: 1, resetAt: now + PUBLIC_WINDOW_MS });
    return true;
  }

  if (entry.count >= PUBLIC_RATE_LIMIT) {
    return false;
  }

  entry.count += 1;
  return true;
}

function getServerGeminiKey(env?: unknown): string {
  const envObj = (env || {}) as Record<string, string | undefined>;
  return (
    envObj["GEMINI_API_KEY"] ||
    (typeof process !== "undefined" && process.env ? process.env["GEMINI_API_KEY"] : undefined) ||
    ""
  ).trim();
}

export async function handleGeminiProxyRoute(request: Request, env?: unknown): Promise<Response> {
  const jsonHeaders = { "Content-Type": "application/json" };

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const rawText = await request.text();
    if (!rawText || rawText.length > 8 * 1024 * 1024) {
      return new Response(JSON.stringify({ success: false, error: "Payload size invalid" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const body = JSON.parse(rawText) as GeminiProxyBody;
    const action = body?.action;

    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid AI action" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    if (ADMIN_ACTIONS.has(action)) {
      const adminCheck = await verifyAdminRequest(request);
      if (!adminCheck.isAdmin) {
        return new Response(JSON.stringify({ success: false, error: "Admin authentication required" }), {
          status: 401,
          headers: jsonHeaders,
        });
      }
    } else if (!checkPublicRateLimit(request)) {
      return new Response(
        JSON.stringify({ success: false, error: "बहुत अधिक अनुरोध भेजे गए। कृपया 1 मिनट बाद प्रयास करें।" }),
        { status: 429, headers: jsonHeaders },
      );
    }

    const apiKey = getServerGeminiKey(env);
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server GEMINI_API_KEY is not configured.",
        }),
        { status: 503, headers: jsonHeaders },
      );
    }

    const payload = { ...(body.requestBody || {}) };
    if (payload["generation_config"] && !payload["generationConfig"]) {
      payload["generationConfig"] = payload["generation_config"];
      delete payload["generation_config"];
    }
    if (payload["system_instruction"] && !payload["systemInstruction"]) {
      payload["systemInstruction"] = payload["system_instruction"];
      delete payload["system_instruction"];
    }

    const modelCandidates = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.0-flash",
    ];

    let lastStatus = 502;
    let lastError = "AI service unavailable";

    for (const model of modelCandidates) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );

          if (!upstream.ok) {
            lastStatus = upstream.status;
            lastError = (await upstream.text()).slice(0, 200);
            if (upstream.status === 503 && attempt === 0) {
              await new Promise((r) => setTimeout(r, 350));
              continue;
            }
            break;
          }

          const json = await upstream.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof text === "string" && text.trim()) {
            return new Response(JSON.stringify({ success: true, text, model }), {
              status: 200,
              headers: jsonHeaders,
            });
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : "Upstream fetch failed";
          break;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: lastError, status: lastStatus }),
      { status: 502, headers: jsonHeaders },
    );
  } catch (err) {
    console.error("[Gemini Proxy] Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Internal AI proxy error",
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
}
