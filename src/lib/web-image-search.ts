import { searchImagesServerFn, sanitizeGroceryQuery, type ServerImageResult } from "./server-image-search";

/**
 * Client & Server-Integrated Web Product Image Search
 * Returns 50-100 authentic product packaging photographs from the live web.
 */

export interface WebImageResult {
  id: string;
  url: string;
  title: string;
  source: string;
  thumbnail: string;
  width?: number | undefined;
  height?: number | undefined;
}

/**
 * Searches real product photographs from the live web.
 * 1. Executes TanStack Start RPC `searchImagesServerFn`
 * 2. Fallbacks to REST API `/api/search/images?q=...`
 * 3. Fallbacks to client-side direct sanitized Wikimedia/Wikipedia search
 */
export async function searchWebProductImages(query: string): Promise<WebImageResult[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const results: WebImageResult[] = [];
  const seenUrls = new Set<string>();

  // 1. Primary Priority: Official TanStack Start Server RPC Function
  try {
    const serverResults = (await searchImagesServerFn({ data: cleanQ })) as ServerImageResult[];
    if (Array.isArray(serverResults) && serverResults.length > 0) {
      for (const item of serverResults) {
        if (item.url && typeof item.url === "string" && item.url.startsWith("http")) {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            results.push({
              id: item.id || `rpc-${results.length}`,
              url: item.url,
              title: item.title || cleanQ,
              source: item.source || "Web",
              thumbnail: item.thumbnail || item.url,
              width: item.width,
              height: item.height,
            });
          }
        }
      }
    }
  } catch (rpcErr) {
    console.warn("[Web Image Search] Server RPC attempt failed, trying REST API:", rpcErr);
  }

  // If RPC returned good results (15+), return immediately!
  if (results.length >= 15) {
    return results;
  }

  // 2. Secondary Priority: REST API route /api/search/images
  try {
    const res = await fetch(`/api/search/images?q=${encodeURIComponent(cleanQ)}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = (await res.json()) as { success?: boolean; results?: any[] };
      if (Array.isArray(data?.results) && data.results.length > 0) {
        for (const item of data.results) {
          if (item.url && typeof item.url === "string" && item.url.startsWith("http")) {
            if (!seenUrls.has(item.url)) {
              seenUrls.add(item.url);
              results.push({
                id: item.id || `rest-${results.length}`,
                url: item.url,
                title: item.title || cleanQ,
                source: item.source || "Web",
                thumbnail: item.thumbnail || item.url,
                width: item.width,
                height: item.height,
              });
            }
          }
        }
      }
    }
  } catch (restErr) {
    console.warn("[Web Image Search] REST API attempt failed:", restErr);
  }

  if (results.length >= 15) {
    return results;
  }

  // 3. Client Fallback: Direct Sanitized Wikimedia Commons search
  const { cleanWord, secondary } = sanitizeGroceryQuery(cleanQ);
  const termsToTry = [cleanWord, secondary].filter(Boolean);

  for (const term of termsToTry) {
    if (results.length >= 30) break;
    try {
      const wikiTerms = encodeURIComponent(term);
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
