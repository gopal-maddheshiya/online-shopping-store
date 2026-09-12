// TanStack Start & Vite Configuration for Arun Gopal Traders
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { handleWebImageSearchRoute } from "./src/lib/server-image-search";

export default defineConfig({
  plugins: [
    {
      name: "api-search-images-dev-middleware",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith("/api/search/images")) {
            try {
              const fullUrl = `http://${req.headers.host || "localhost:3000"}${req.url}`;
              const webReq = new Request(fullUrl, {
                method: req.method || "GET",
                headers: req.headers as any,
              });
              const webRes = await handleWebImageSearchRoute(webReq);
              res.statusCode = webRes.status;
              webRes.headers.forEach((value, key) => {
                res.setHeader(key, value);
              });
              const body = await webRes.text();
              res.end(body);
              return;
            } catch (e) {
              console.error("[Vite Dev API] Image search error:", e);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: false, results: [], error: String(e) }));
              return;
            }
          }
          next();
        });
      },
    },
  ],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
