import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { setupLenisGSAP, ScrollTrigger } from "@/lib/gsap";
import { useRouterState } from "@tanstack/react-router";

interface LenisContextValue {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, options?: Parameters<Lenis["scrollTo"]>[1]) => void;
}

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  scrollTo: () => {},
});

export const useLenis = () => useContext(LenisContext);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    // 1. Initialize Lenis instance
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth exponential ease-out
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 1.25,
      wheelMultiplier: 1.0,
      infinite: false,
      autoRaf: false, // Driven synchronously via GSAP ticker
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // 2. Harmonize with GSAP Ticker & ScrollTrigger
    const cleanupGSAP = setupLenisGSAP(lenis);

    // 3. Modal / Dialog Scroll-Lock Safeguard
    // When Radix UI or Vaul locks body scroll, pause Lenis to prevent scroll trapping
    const checkScrollLock = () => {
      const isLocked =
        document.body.style.overflow === "hidden" ||
        document.body.hasAttribute("data-scroll-locked") ||
        document.documentElement.classList.contains("overflow-hidden");

      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    const mutationObserver = new MutationObserver(checkScrollLock);
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "data-scroll-locked", "class"],
    });

    return () => {
      mutationObserver.disconnect();
      cleanupGSAP();
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, []);

  // Reset scroll position on route transitions
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
      // Refresh ScrollTrigger calculations after DOM settle
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 60);
    }
  }, [pathname]);

  const scrollTo = (target: string | number | HTMLElement, options?: Parameters<Lenis["scrollTo"]>[1]) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options);
    } else if (typeof window !== "undefined") {
      if (typeof target === "number") {
        window.scrollTo({ top: target, behavior: "smooth" });
      } else if (typeof target === "string") {
        const el = document.querySelector(target);
        el?.scrollIntoView({ behavior: "smooth" });
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <LenisContext.Provider value={{ lenis: lenisInstance, scrollTo }}>
      {children}
    </LenisContext.Provider>
  );
}
