/**
 * Genuine Web Product Image Search
 * Queries live internet image search engines & open web databases to fetch real product photos.
 * NEVER returns local directory files.
 */

export interface WebImageResult {
  id: string;
  url: string;
  title: string;
  source: string;
  thumbnail: string;
}

/**
 * Searches real product photographs from the web.
 * 1. Queries backend server route `/api/search/images?q=...` (live web image index)
 * 2. Fallbacks to CORS-enabled Wikimedia Commons & Wikipedia photo archives.
 */
export async function searchWebProductImages(query: string): Promise<WebImageResult[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const results: WebImageResult[] = [];
  const seenUrls = new Set<string>();

  // 1. First Priority: Live Web Search via Server API (/api/search/images)
  try {
    const res = await fetch(`/api/search/images?q=${encodeURIComponent(cleanQ)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.results) && data.results.length > 0) {
        for (const item of data.results) {
          if (item.url && typeof item.url === "string" && item.url.startsWith("http")) {
            // Avoid duplicate URLs
            if (!seenUrls.has(item.url)) {
              seenUrls.add(item.url);
              results.push({
                id: item.id || `web-${results.length}`,
                url: item.url,
                title: item.title || cleanQ,
                source: item.source || "Web Search",
                thumbnail: item.thumbnail || item.url,
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Web Image Search] Server API attempt failed, falling back to direct web:", err);
  }

  // If server search returned sufficient web results, return immediately
  if (results.length >= 4) {
    return results;
  }

  // 2. Direct Web Search via Wikimedia Commons Generator API (CORS enabled & free)
  try {
    const wikiTerms = encodeURIComponent(cleanQ);
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${wikiTerms}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*`;

    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const pages = wikiData?.query?.pages || {};

      for (const pageId of Object.keys(pages)) {
        const page = pages[pageId];
        const info = page?.imageinfo?.[0];
        const imgUrl = info?.thumburl || info?.url;

        // Strictly reject PDFs, SVGs, and audio/video files
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
            title: page.title ? page.title.replace(/^File:/i, "").replace(/\.[^/.]+$/, "") : cleanQ,
            source: "Wikimedia Web",
            thumbnail: imgUrl,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[Web Image Search] Wikimedia fetch error:", err);
  }

  // 3. Fallback to Wikipedia Page Images if still few results
  if (results.length < 3) {
    try {
      const wpUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQ)}&gsrlimit=6&prop=pageimages&pithumbsize=600&format=json&origin=*`;
      const wpRes = await fetch(wpUrl);
      if (wpRes.ok) {
        const wpData = await wpRes.json();
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
              source: "Wikipedia Web",
              thumbnail: imgUrl,
            });
          }
        }
      }
    } catch {
      // Non-blocking
    }
  }

  return results;
}
