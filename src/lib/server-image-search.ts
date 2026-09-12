/**
 * Server-Side Real Web Image Search for Grocery Products
 * Queries live web image search to find real packaging and product photographs from the internet.
 */

export interface ServerImageResult {
  id: string;
  url: string;
  title: string;
  source: string;
  thumbnail: string;
}

export async function handleWebImageSearchRoute(request: Request): Promise<Response> {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") || "").trim();

    if (!query) {
      return new Response(JSON.stringify({ success: true, results: [] }), {
        headers: corsHeaders,
      });
    }

    // Refine search query for packaging / e-commerce photo
    let searchQuery = query;
    if (!/product|packet|bottle|pack|box|grocery|packaging|1l|1kg/i.test(query)) {
      searchQuery = `${query} product packet`;
    }

    // 1. Fetch DuckDuckGo VQD token
    const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&iax=images&ia=images`;
    const tokenRes = await fetch(tokenUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=([\"']?)([\d-]+)\1/) || html.match(/vqd=([\d-]+)/);
    const vqd = vqdMatch ? vqdMatch[2] || vqdMatch[1] : null;

    if (!vqd) {
      return new Response(JSON.stringify({ success: true, results: [] }), {
        headers: corsHeaders,
      });
    }

    // 2. Fetch image results
    const imgUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(searchQuery)}&vqd=${vqd}&f=,,,`;
    const imgRes = await fetch(imgUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://duckduckgo.com/",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
    });

    if (!imgRes.ok) {
      return new Response(JSON.stringify({ success: true, results: [] }), {
        headers: corsHeaders,
      });
    }

    const data = await imgRes.json();
    const items = Array.isArray(data.results) ? data.results : [];

    const results: ServerImageResult[] = items
      .slice(0, 16)
      .filter((it: any) => it.image && typeof it.image === "string" && it.image.startsWith("http"))
      .map((it: any, idx: number) => {
        let domain = "Web";
        try {
          if (it.url) domain = new URL(it.url).hostname.replace(/^www\./, "");
        } catch {
          // ignore
        }

        return {
          id: `web-${idx}-${Date.now()}`,
          url: it.image,
          title: it.title ? it.title.replace(/<[^>]+>/g, "") : query,
          source: domain,
          thumbnail: it.thumbnail || it.image,
        };
      });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("[Server Image Search] Error:", err);
    return new Response(JSON.stringify({ success: false, results: [], error: String(err) }), {
      headers: corsHeaders,
      status: 500,
    });
  }
}
