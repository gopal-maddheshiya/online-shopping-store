import type { Product, ProductImage, ProductImageType } from "./queries";

/**
 * Universal Crisp SVG Placeholder for Grocery Products
 * Self-contained Data-URI: 0 network requests, 0 404 errors, renders flawlessly anywhere.
 */
export const DEFAULT_PRODUCT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23FAF8F5'/%3E%3Cpath d='M60 75 L140 75 L132 155 L68 155 Z' fill='%23EAE5D9' stroke='%23145A45' stroke-width='4' stroke-linejoin='round'/%3E%3Cpath d='M82 75 C82 50 118 50 118 75' fill='none' stroke='%23145A45' stroke-width='4' stroke-linecap='round'/%3E%3Ccircle cx='100' cy='112' r='14' fill='%23145A45' fill-opacity='0.15'/%3E%3Cpath d='M94 112 L106 112 M100 106 L100 118' stroke='%23145A45' stroke-width='3' stroke-linecap='round'/%3E%3Ctext x='100' y='178' text-anchor='middle' font-family='system-ui,-apple-system,sans-serif' font-size='12' font-weight='600' fill='%235A655F'%3Eकिराना सामान%3C/text%3E%3C/svg%3E";

/**
 * Helper to append cache-busting version query parameter to dynamic image URLs.
 */
export function withImageVersion(url: string, updatedAt?: string | null): string {
  if (!url || !updatedAt) return url;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  try {
    const timestamp = new Date(updatedAt).getTime();
    if (isNaN(timestamp)) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${timestamp}`;
  } catch {
    return url;
  }
}

/**
 * Database-driven category thumbnail.
 * Returns the admin-uploaded category image or the clean store icon fallback.
 */
export function getCategoryThumbnail(category: {
  slug?: string;
  name?: string;
  image_url?: string | null;
  icon?: string | null;
}): string {
  const url = (category.image_url ?? "").trim();
  if (url.length > 0 && !url.includes("/images/packaged.jpg")) {
    return url;
  }
  return "/agt-icon.png";
}

/**
 * Returns the verified product packaging image.
 * Uses explicit custom image_url (Uploaded Base64, Storage URL, External Web URL).
 * Falls back to clean SVG data placeholder if not set.
 */
export function getProductImage(product?: {
  slug?: string | null;
  name?: string | null;
  image_url?: string | null;
  category_id?: string | null;
  updated_at?: string | null;
}): string {
  if (!product) return DEFAULT_PRODUCT_PLACEHOLDER;

  // 1. Check if product has an explicit image_url
  if (
    product.image_url &&
    typeof product.image_url === "string" &&
    product.image_url.trim().length > 0 &&
    !product.image_url.includes("/images/packaged.jpg")
  ) {
    const cleanUrl = product.image_url.trim();
    if (
      cleanUrl.startsWith("data:image/") ||
      cleanUrl.startsWith("http://") ||
      cleanUrl.startsWith("https://") ||
      cleanUrl.startsWith("blob:") ||
      cleanUrl.startsWith("/")
    ) {
      return withImageVersion(cleanUrl, product.updated_at);
    }
  }

  return DEFAULT_PRODUCT_PLACEHOLDER;
}

/**
 * Returns a list of all images available for a product.
 */
export function getProductImages(product?: {
  slug?: string | null;
  name?: string | null;
  image_url?: string | null;
  category_id?: string | null;
  updated_at?: string | null;
  product_images?: ProductImage[];
}): ProductImage[] {
  if (!product) return [];

  const primaryUrl = getProductImage(product);

  // 1. Check if product has database images in `product_images`
  if (product.product_images && product.product_images.length > 0) {
    return [...product.product_images].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
  }

  // 2. Fallback to primary image
  return [
    {
      url: primaryUrl,
      type: "front",
      label: "Front View",
      sort_order: 0,
    },
  ];
}

/**
 * Returns localized label for each image type (Front, Back, Detail, Additional).
 */
export function getImageTypeLabel(type: ProductImageType, lang: string = "en"): string {
  if (lang === "hi") {
    switch (type) {
      case "front":
        return "सामने का दृश्य";
      case "back":
        return "पीछे / पोषण विवरण";
      case "detail":
        return "बारीक दृश्य / सील";
      case "additional":
        return "अतिरिक्त तस्वीर";
      default:
        return "तस्वीर";
    }
  }

  switch (type) {
    case "front":
      return "Front View";
    case "back":
      return "Back & Nutrition";
    case "detail":
      return "Detail / Label";
    case "additional":
      return "Additional";
    default:
      return "Photo";
  }
}

/**
 * Returns a guaranteed raster image (JPG/PNG) suitable for WhatsApp, Facebook,
 * Twitter, and other OpenGraph link scrapers that do NOT render SVG graphics.
 */
export function getOpenGraphProductImage(product?: {
  slug?: string | null;
  name?: string | null;
  image_url?: string | null;
  category_id?: string | null;
}): string {
  if (!product) return "/agt-og-image.jpg";

  // If product has custom uploaded or web image that is NOT an SVG and not a raw base64 data URI
  if (
    product.image_url &&
    !product.image_url.toLowerCase().endsWith(".svg") &&
    !product.image_url.startsWith("data:") &&
    !product.image_url.includes("/images/packaged.jpg")
  ) {
    return product.image_url;
  }

  return "/agt-og-image.jpg";
}
