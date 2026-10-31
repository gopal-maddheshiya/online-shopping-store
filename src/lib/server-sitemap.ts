/**
 * Dynamic XML Sitemap Generator for Arun Gopal Traders
 * Intercepted at `/sitemap.xml` by the server entry (`src/server.ts`).
 * Fetches all live products and categories from Supabase with smart 1-hour in-memory caching.
 */

import { supabase } from "../integrations/supabase/client";
import { SITE_URL } from "./site-config";

let cachedSitemapXml: string | null = null;
let lastCacheTime = 0;
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function formatDate(isoString?: string | null): string {
  const fallback = new Date().toISOString().split("T")[0] ?? "2026-10-31";
  if (!isoString) return fallback;
  try {
    return new Date(isoString).toISOString().split("T")[0] ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateDynamicSitemapXml(): Promise<string> {
  const now = Date.now();
  if (cachedSitemapXml && now - lastCacheTime < CACHE_DURATION_MS) {
    return cachedSitemapXml;
  }

  const today = formatDate();

  // Core Static URLs
  const coreUrls = [
    { loc: `${SITE_URL}/`, priority: "1.0", changefreq: "daily", lastmod: today },
    { loc: `${SITE_URL}/shop`, priority: "0.9", changefreq: "daily", lastmod: today },
    { loc: `${SITE_URL}/contact`, priority: "0.8", changefreq: "weekly", lastmod: today },
    { loc: `${SITE_URL}/track`, priority: "0.8", changefreq: "daily", lastmod: today },
  ];

  // Fetch Categories from Supabase
  let categoryUrls: Array<{ loc: string; priority: string; changefreq: string; lastmod: string }> = [];
  try {
    const { data: categories } = await supabase
      .from("categories")
      .select("slug")
      .eq("is_active", true);

    if (categories && categories.length > 0) {
      categoryUrls = categories.map((cat) => ({
        loc: `${SITE_URL}/shop?category=${encodeURIComponent(cat.slug)}`,
        priority: "0.8",
        changefreq: "daily",
        lastmod: today,
      }));
    }
  } catch (err) {
    console.warn("[Sitemap] Failed to fetch dynamic categories from Supabase:", err);
  }

  // Fetch Products from Supabase
  let productUrls: Array<{ loc: string; priority: string; changefreq: string; lastmod: string }> = [];
  try {
    const { data: products } = await supabase
      .from("products")
      .select("slug, created_at, updated_at")
      .eq("is_active", true);

    if (products && products.length > 0) {
      productUrls = products.map((p) => ({
        loc: `${SITE_URL}/product/${encodeURIComponent(p.slug)}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: formatDate(p.updated_at || p.created_at),
      }));
    }
  } catch (err) {
    console.warn("[Sitemap] Failed to fetch dynamic products from Supabase:", err);
  }

  const allUrls = [...coreUrls, ...categoryUrls, ...productUrls];

  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const item of allUrls) {
    xmlLines.push("  <url>");
    xmlLines.push(`    <loc>${escapeXml(item.loc)}</loc>`);
    xmlLines.push(`    <lastmod>${item.lastmod}</lastmod>`);
    xmlLines.push(`    <changefreq>${item.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${item.priority}</priority>`);
    xmlLines.push("  </url>");
  }

  xmlLines.push("</urlset>");

  cachedSitemapXml = xmlLines.join("\n");
  lastCacheTime = now;
  return cachedSitemapXml;
}

export async function handleSitemapRoute(): Promise<Response> {
  try {
    const xml = await generateDynamicSitemapXml();
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("[Sitemap] Critical error generating dynamic sitemap:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
}

