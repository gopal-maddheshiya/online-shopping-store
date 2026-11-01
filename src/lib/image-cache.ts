/**
 * Universal In-Memory & Browser Image Cache Registry
 * Arun Gopal Traders — High-Performance Zero-Shimmer Image Engine
 *
 * Keeps track of images loaded during the active session.
 * Eliminates repetitive shimmer flashes on route transitions and card re-renders.
 */

// In-memory set of image URLs successfully decoded in this browser session
export const globalLoadedImages = new Set<string>();

/**
 * Checks whether the given image URL has already been loaded or is instant (data URI / blob).
 */
export function isImageLoaded(src?: string | null): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return true;
  if (typeof window === "undefined") return false;
  return globalLoadedImages.has(trimmed);
}

/**
 * Marks an image URL as cached and loaded in this session.
 */
export function markImageLoaded(src?: string | null): void {
  if (!src) return;
  const trimmed = src.trim();
  if (trimmed && !trimmed.startsWith("data:") && !trimmed.startsWith("blob:")) {
    globalLoadedImages.add(trimmed);
  }
}

