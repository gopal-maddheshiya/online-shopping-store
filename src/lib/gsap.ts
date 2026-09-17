import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

// Register GSAP plugins safely on client side
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Harmonize Lenis smooth scrolling with GSAP ScrollTrigger
 * This ensures scroll animations trigger at the exact calculated pixel position without jitter.
 */
export function setupLenisGSAP(lenis: Lenis) {
  if (typeof window === "undefined") return () => {};

  // 1. Update ScrollTrigger whenever Lenis scrolls
  const updateScrollTrigger = () => {
    ScrollTrigger.update();
  };
  lenis.on("scroll", updateScrollTrigger);

  // 2. Drive Lenis through GSAP's synchronized high-precision ticker
  const tickerHandler = (time: number) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(tickerHandler);
  gsap.ticker.lagSmoothing(0);

  return () => {
    lenis.off("scroll", updateScrollTrigger);
    gsap.ticker.remove(tickerHandler);
  };
}

export { gsap, ScrollTrigger };
