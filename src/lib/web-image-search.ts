/**
 * Client & Server-Integrated Web Product Image Search
 * Returns 50-80+ authentic product packaging photographs from the live web.
 */

export interface WebImageResult {
  id: string;
  url: string;
  title: string;
  source: string;
  thumbnail: string;
  width?: number;
  height?: number;
}

/**
 * Searches real product photographs from the live web.
 * Queries `/api/search/images?q=...` for 50-80+ live e-commerce images (Amazon, Flipkart, BigBasket, Blinkit, etc.)
 * with client-side fallback if server is offline.
 */
export async function searchWebProductImages(query: string): Promise<WebImageResult[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const results: WebImageResult[] = [];
  const seenUrls = new Set<string>();

  // 1. Primary Priority: Live Web Search via Server API (/api/search/images)
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
                id: item.id || `web-${results.length}`,
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
  } catch (err) {
    console.warn("[Web Image Search] Server API fetch failed, falling back to direct web:", err);
  }

  // If server returned 15 or more results, we are good!
  if (results.length >= 15) {
    return results;
  }

  // 2. Direct Browser Fallback: Wikimedia Commons Photo Archive (50 images)
  try {
    const wikiTerms = encodeURIComponent(cleanQ);
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
              : cleanQ,
            source: "Wikimedia",
            thumbnail: imgUrl,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[Web Image Search] Direct Wikimedia fallback error:", err);
  }

  // 3. Direct Wikipedia Page Images Fallback
  if (results.length < 10) {
    try {
      const wpUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQ)}&gsrlimit=30&prop=pageimages&pithumbsize=800&format=json&origin=*`;
      const wpRes = await fetch(wpUrl);
      if (wpRes.ok) {
        const wpData = (await wpRes.json()) as any;
        const pages = wpData?.query?.pages || {};
        for (const pageId of Object.keys(pages)) {
          const page = pages[pageId];
          const imgUrl = page?.thumbnail?.source;
          if (
            imgUrl &&
            typeof imgUrl === "string" &&
            imgUrl.startsWith("http") &&
            !/\.(pdf|svg)(\?|$)/i.test(imgUrl) &&
            !seenUrls.has(imgUrl)
          ) {
            seenUrls.add(imgUrl);
            results.push({
              id: `wp-${page.pageid || pageId}`,
              url: imgUrl,
              title: page.title || cleanQ,
              source: "Wikipedia",
              thumbnail: imgUrl,
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return results;
}
