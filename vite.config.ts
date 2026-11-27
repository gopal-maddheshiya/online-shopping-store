// TanStack Start & Vite Configuration for Arun Gopal Traders
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { IncomingMessage } from "node:http";

async function readNodeRequestBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const fullUrl = `http://${req.headers.host || "localhost:8080"}${req.url || "/"}`;
  const method = req.method || "GET";
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) headers.set(k, v.join(", "));
    else if (v !== undefined) headers.set(k, v);
  }
  if (method !== "GET" && method !== "HEAD") {
    const body = await readNodeRequestBody(req);
    return new Request(fullUrl, { method, headers, body });
  }
  return new Request(fullUrl, { method, headers });
}

export default defineConfig({
  plugins: [
    {
      name: "agt-dev-api-middleware",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url || "";
          const isApi =
            url.startsWith("/api/search/images") ||
            url.startsWith("/api/ai/gemini") ||
            url.startsWith("/api/notify/telegram") ||
            url.startsWith("/api/payment/");

          if (!isApi) {
            next();
            return;
          }

          try {
            const webReq = await toWebRequest(req);
            let webRes: Response | null = null;

            if (url.startsWith("/api/search/images")) {
              const mod = (await server.ssrLoadModule("/src/lib/server-image-search.ts")) as {
                handleWebImageSearchRoute: (r: Request) => Promise<Response>;
              };
              webRes = await mod.handleWebImageSearchRoute(webReq);
            } else if (url.startsWith("/api/ai/gemini")) {
              const mod = (await server.ssrLoadModule("/src/lib/server-ai-api.ts")) as {
                handleGeminiProxyRoute: (r: Request, e?: unknown) => Promise<Response>;
              };
              webRes = await mod.handleGeminiProxyRoute(webReq, process.env);
            } else if (url.startsWith("/api/notify/telegram")) {
              const mod = (await server.ssrLoadModule("/src/lib/server-telegram-api.ts")) as {
                handleTelegramNotify: (r: Request, e?: unknown) => Promise<Response>;
              };
              webRes = await mod.handleTelegramNotify(webReq, process.env);
            } else if (url.startsWith("/api/payment/")) {
              const mod = (await server.ssrLoadModule("/src/lib/server-payment-api.ts")) as {
                dispatchPaymentApiRoute: (r: Request, e?: unknown) => Promise<Response | null>;
              };
              webRes = await mod.dispatchPaymentApiRoute(webReq, process.env);
            }

            if (!webRes) {
              next();
              return;
            }

            res.statusCode = webRes.status;
            webRes.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });
            const body = await webRes.text();
            res.end(body);
          } catch (e) {
            console.error("[Vite Dev API] Handler error:", e);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      },
    },
  ],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});
