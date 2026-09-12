import { createServerFn } from "@tanstack/react-start";

/**
 * Server-Side Real Web Image Search for Grocery Products
 * Queries live web image search engines with smart query sanitization
 * to return 50-100 authentic packaging and product photographs.
 */

export interface ServerImageResult {
  id: string;
  url: string;
  title: string;
  source: string;
  thumbnail: string;
  width?: number | undefined;
  height?: number | undefined;
}

/**
 * Strips noise, stopwords, internal database labels (like 'Generic', 'Loose'),
 * and packaging units to produce clean, high-yield commercial search terms.
 */
export function sanitizeGroceryQuery(raw: string): { primary: string; secondary: string; cleanWord: string } {
  if (!raw) return { primary: "", secondary: "", cleanWord: "" };

  let q = raw.trim();

  // 1. Remove database noise words (case insensitive)
  q = q.replace(/\b(generic|local|unbranded|loose|unpolished|fresh|best|pure|original)\b/gi, " ");
  q = q.replace(/\b(लोकल|थोक|खुला|देसी|अनब्रांडेड)\b/gi, " ");

  // 2. Remove parenthesized/bracketed details: (dhan se bana hua), [1L Pouch], etc.
  q = q.replace(/\(.*?\)/g, " ");
  q = q.replace(/\[.*?\]/g, " ");

  // 3. Remove sizes and weights: 1kg, 500g, 1L, 5L, 250ml, 100gm, etc.
  q = q.replace(/\b\d+(\.\d+)?\s*(kg|gm|g|ltr|litre|l|ml|pcs|piece|pc|पैकेट|किलो|लीटर|ग्राम|बोरी)\b/gi, " ");

  // 4. Remove packaging container words
  q = q.replace(/\b(pouch|packet|bottle|can|box|carton|tin|bori|pack|jar)\b/gi, " ");

  // 5. Clean punctuation and excess whitespace
  q = q.replace(/[^\w\s\u0900-\u097F]/g, " ");
  q = q.replace(/\s+/g, " ").trim();

  // If cleaning stripped too much, fallback to original
  if (!q) q = raw.replace(/[^\w\s\u0900-\u097F]/g, " ").trim();

  // Identify specific commercial grocery keywords
  const lower = q.toLowerCase();
  let cleanWord = q;
  let secondary = `${q} grocery`;

  // Specific smart keyword extraction for common confusing combinations
  if (lower.includes("munakka")) {
    cleanWord = "Munakka";
    secondary = "Munakka dry fruit";
  } else if (lower.includes("chini") || lower.includes("sugar")) {
    cleanWord = "Sugar packet";
    secondary = "Chini packet";
  } else if (lower.includes("sarso") || lower.includes("mustard")) {
    cleanWord = q.includes("bail") || q.includes("kolhu") ? "Bail Kolhu Mustard Oil" : `${q} oil`;
    secondary = "Kacchi Ghani Mustard Oil";
  } else if (lower.includes("chura") || lower.includes("poha")) {
    cleanWord = "Poha Chura";
    secondary = "Poha packet";
  } else if (lower.includes("elaichi")) {
    cleanWord = lower.includes("badi") ? "Badi Elaichi" : "Choti Elaichi Green Cardamom";
    secondary = "Cardamom packet";
  } else if (lower.includes("kaju") || lower.includes("cashew")) {
    cleanWord = "Kaju Cashew";
    secondary = "Cashew nuts packet";
  } else if (lower.includes("badam") || lower.includes("almond")) {
    cleanWord = "Almonds Badam";
    secondary = "Badam packet";
  } else if (lower.includes("haldi") || lower.includes("turmeric")) {
    cleanWord = lower.includes("khad") ? "Whole Turmeric Finger Haldi" : "Turmeric Powder Haldi";
    secondary = "Haldi packet";
  } else if (lower.includes("dhaniya") || lower.includes("coriander")) {
    cleanWord = lower.includes("khad") ? "Whole Coriander Seeds Dhaniya" : "Coriander Powder Dhaniya";
    secondary = "Dhaniya packet";
  } else if (lower.includes("mirch") || lower.includes("marcha")) {
    cleanWord = lower.includes("khad") ? "Dry Red Chilli Khada Mircha" : "Red Chilli Powder Mircha";
    secondary = "Lal Mirch packet";
  } else if (lower.includes("jeera") || lower.includes("cumin")) {
    cleanWord = lower.includes("khad") ? "Whole Cumin Seeds Jeera" : "Cumin Powder Jeera";
    secondary = "Jeera packet";
  } else if (lower.includes("dal") || lower.includes("daal")) {
    cleanWord = `${q} packet`;
    secondary = q;
  }

  const primary = `${cleanWord} packet`.trim();

  return { primary, secondary, cleanWord };
}

/**
 * Core search implementation querying DuckDuckGo and fallback engines
 */
export async function executeServerImageSearch(rawQuery: string): Promise<ServerImageResult[]> {
  const cleanQ = rawQuery.trim();
  if (!cleanQ) return [];

  const { primary, secondary, cleanWord } = sanitizeGroceryQuery(cleanQ);
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

  async function fetchDDGForTerm(term: string) {
    if (!term || results.length >= 60) return;
    try {
      const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(term)}&iax=images&ia=images`;
      const tokenRes = await fetch(tokenUrl, {
        headers: {
          ...browserHeaders,
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
        },
      });

      if (!tokenRes.ok) return;

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

      if (!vqd) return;

      const imgUrl = `https://duckduckgo.com/i.js?l=in-en&o=json&q=${encodeURIComponent(term)}&vqd=${vqd}&f=,,,`;
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

      if (!imgRes.ok) return;

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
              title: it.title ? String(it.title).replace(/<[^>]+>/g, "").trim() : cleanWord,
              source: domain,
              thumbnail: it.thumbnail || rawImg,
              width: typeof it.width === "number" ? it.width : undefined,
              height: typeof it.height === "number" ? it.height : undefined,
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[Server Image Search] DDG error for "${term}":`, err);
    }
  }

  // 1. First Pass: Search with the sanitized primary term (e.g. 'Munakka packet')
  await fetchDDGForTerm(primary);

  // 2. Second Pass: If results are under 30, search with clean base word (e.g. 'Munakka')
  if (results.length < 30 && cleanWord !== primary) {
    await fetchDDGForTerm(cleanWord);
  }

  // 3. Third Pass: If still under 30, search with secondary keyword
  if (results.length < 30 && secondary !== cleanWord && secondary !== primary) {
    await fetchDDGForTerm(secondary);
  }

  // 4. Fallback: Wikimedia Commons with clean keyword if still < 20
  if (results.length < 20) {
    try {
      const wikiTerms = encodeURIComponent(cleanWord);
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
            !seenUrls.has(imgUrl)
          ) {
            seenUrls.add(imgUrl);
            results.push({
              id: `wiki-${page.pageid || pageId}`,
              url: imgUrl,
              title: page.title
                ? page.title.replace(/^File:/i, "").replace(/\.[^/.]+$/, "")
                : cleanWord,
              source: "Wikimedia",
              thumbnail: imgUrl,
            });
          }
        }
      }
    } catch {
      // non-blocking
    }
  }

  return results;
}

/**
 * Official TanStack Start Server Function (RPC).
 * Can be called seamlessly from the client without worrying about API routes or CORS.
 */
export const searchImagesServerFn = createServerFn({ method: "GET" })
  .validator((d: string) => String(d || ""))
  .handler(async ({ data: rawQuery }) => {
    return await executeServerImageSearch(rawQuery);
  });

/**
 * Standard HTTP REST Route Handler for /api/search/images?q=...
 */
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
      return new Response(JSON.stringify({ success: true, total: 0, results: [] }), {
        headers: corsHeaders,
      });
    }

    const results = await executeServerImageSearch(query);

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
