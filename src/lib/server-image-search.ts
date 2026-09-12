/**
 * Server-Side Real Web Image Search for Grocery Products
 * Queries live web image search engines to return 50-100 real packaging and product photographs.
 */

export interface ServerImageResult {
  id: string;
  url: string;
  title: string;
  source: string;
  thumbnail: string;
  width?: number;
  height?: number;
}

export async function handleWebImageSearchRoute(request: Request): Promise<Response> {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    if (!/product|packet|bottle|pack|box|grocery|packaging|1l|1kg|5kg/i.test(query)) {
      searchQuery = `${query} product packet`;
    }

    const results: ServerImageResult[] = [];
    const seenUrls = new Set<string>();

    const browserHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    };

    // 1. DuckDuckGo Image Search Engine (Bing-powered backend)
    try {
      const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&iax=images&ia=images`;
      const tokenRes = await fetch(tokenUrl, {
        headers: {
          ...browserHeaders,
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
        },
      });

      if (tokenRes.ok) {
        const html = await tokenRes.text();
        const vqdRegexes = [
          /vqd=([0-9-]+)/,
          /vqd="([0-9-]+)"/,
          /vqd='([0-9-]+)'/,
          /"vqd":\s*"([0-9-]+)"/,
          /'vqd':\s*'([0-9-]+)'/,
          /data-vqd="([0-9-]+)"/,
        ];
        let vqd: string | null = null;
        for (const rx of vqdRegexes) {
          const m = html.match(rx);
          if (m && m[1]) {
            vqd = m[1];
            break;
          }
        }

        if (vqd) {
          // Fetch Page 1 (up to 100 images)
          const imgUrl = `https://duckduckgo.com/i.js?l=in-en&o=json&q=${encodeURIComponent(searchQuery)}&vqd=${vqd}&f=,,,`;
          const imgRes = await fetch(imgUrl, {
            headers: {
              ...browserHeaders,
              Accept: "application/json, text/javascript, */*; q=0.01",
              Referer: "https://duckduckgo.com/",
              "x-requested-with": "XMLHttpRequest",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
            },
          });

          if (imgRes.ok) {
            const data = (await imgRes.json()) as { results?: any[]; next?: string };
            const items = Array.isArray(data.results) ? data.results : [];

            for (const it of items) {
              const rawImg = it.image;
              if (
                rawImg &&
                typeof rawImg === "string" &&
                rawImg.startsWith("http") &&
                !/\.(pdf|svg|webm|ogv|ogg|mp4)(\?|$)/i.test(rawImg)
              ) {
                if (!seenUrls.has(rawImg)) {
                  seenUrls.add(rawImg);
                  let domain = "Web";
                  try {
                    if (it.url) domain = new URL(it.url).hostname.replace(/^www\./, "");
                  } catch {
                    // ignore
                  }

                  results.push({
                    id: `ddg-${results.length}-${Date.now()}`,
                    url: rawImg,
                    title: it.title ? String(it.title).replace(/<[^>]+>/g, "").trim() : query,
                    source: domain,
                    thumbnail: it.thumbnail || rawImg,
                    width: typeof it.width === "number" ? it.width : undefined,
                    height: typeof it.height === "number" ? it.height : undefined,
                  });
                }
              }
            }

            // If we have less than 50 results and there is a "next" page, fetch page 2
            if (results.length < 50 && data.next && typeof data.next === "string") {
              try {
                const nextUrl = `https://duckduckgo.com/${data.next.replace(/^\//, "")}`;
                const nextRes = await fetch(nextUrl, {
                  headers: {
                    ...browserHeaders,
                    Accept: "application/json, text/javascript, */*; q=0.01",
                    Referer: "https://duckduckgo.com/",
                    "x-requested-with": "XMLHttpRequest",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                  },
                });
                if (nextRes.ok) {
                  const nextData = (await nextRes.json()) as { results?: any[] };
                  const nextItems = Array.isArray(nextData.results) ? nextData.results : [];
                  for (const it of nextItems) {
                    const rawImg = it.image;
                    if (
                      rawImg &&
                      typeof rawImg === "string" &&
                      rawImg.startsWith("http") &&
                      !/\.(pdf|svg|webm|ogv|ogg|mp4)(\?|$)/i.test(rawImg)
                    ) {
                      if (!seenUrls.has(rawImg)) {
                        seenUrls.add(rawImg);
                        let domain = "Web";
                        try {
                          if (it.url) domain = new URL(it.url).hostname.replace(/^www\./, "");
                        } catch {
                          // ignore
                        }

                        results.push({
                          id: `ddg-${results.length}-${Date.now()}`,
                          url: rawImg,
                          title: it.title ? String(it.title).replace(/<[^>]+>/g, "").trim() : query,
                          source: domain,
                          thumbnail: it.thumbnail || rawImg,
                          width: typeof it.width === "number" ? it.width : undefined,
                          height: typeof it.height === "number" ? it.height : undefined,
                        });
                      }
                    }
                  }
                }
              } catch {
                // non-blocking
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("[Server Image Search] DDG attempt error:", err);
    }

    // 2. Secondary Fallback: Wikimedia Commons Photo Archive (Up to 50 results)
    if (results.length < 30) {
      try {
        const wikiTerms = encodeURIComponent(query);
        const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${wikiTerms}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;

        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const wikiData = (await wikiRes.json()) as any;
          const pages = wikiData?.query?.pages || {};

          for (const pageId of Object.keys(pages)) {
            const page = pages[pageId];
            const info = page?.imageinfo?.[0];
            const imgUrl = info?.thumburl || info?.url;

            if (
              imgUrl &&
              typeof imgUrl === "string" &&
              imgUrl.startsWith("http") &&
              !/\.(pdf|svg|webm|ogv|ogg|mp4)(\?|$)/i.test(imgUrl) &&
              !imgUrl.includes(".pdf") &&
              !seenUrls.has(imgUrl)
            ) {
              seenUrls.add(imgUrl);
              results.push({
                id: `wiki-${page.pageid || pageId}`,
                url: imgUrl,
                title: page.title
                  ? page.title.replace(/^File:/i, "").replace(/\.[^/.]+$/, "")
                  : query,
                source: "Wikimedia",
                thumbnail: imgUrl,
              });
            }
          }
        }
      } catch (err) {
        console.warn("[Server Image Search] Wikimedia error:", err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: results.length,
        results,
      }),
      {
        headers: corsHeaders,
      }
    );
  } catch (err) {
    console.error("[Server Image Search] Fatal error:", err);
    return new Response(
      JSON.stringify({ success: false, total: 0, results: [], error: String(err) }),
      {
        headers: corsHeaders,
        status: 500,
      }
    );
  }
}
