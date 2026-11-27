import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { inr } from "@/lib/format";
import { useEffect, useState } from "react";

export function FloatingCartBar() {
  const { count: cartCount, subtotal, savings } = useCart();
  const { lang } = useLanguage();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const [pulse, setPulse] = useState(false);

  // Trigger subtle tactile pulse animation when cart total changes
  useEffect(() => {
    if (cartCount > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 400);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cartCount, subtotal]);

  // Hide on admin routes, or inside product/cart/checkout funnels that already render dedicated bottom CTA bars
  if (
    cartCount <= 0 ||
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/product/") ||
    currentPath === "/cart" ||
    currentPath === "/checkout"
  ) {
    return null;
  }

  const isHindi = lang === "hi";

  return (
    <div
      aria-label="Floating Cart Strip"
      className="fixed z-45 transition-all duration-300 ease-out bottom-[calc(3.75rem+env(safe-area-inset-bottom)+10px)] inset-x-3 sm:inset-x-6 lg:inset-x-auto lg:right-8 lg:bottom-7 lg:max-w-md lg:w-full select-none"
    >
      <Link
        to="/cart"
        preload="intent"
        className={`group flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#0C3D2E] via-[#145A45] to-[#0A3326] text-white shadow-[0_8px_24px_rgba(12,61,46,0.38),0_2px_6px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.22)] border border-emerald-400/35 hover:border-emerald-300/50 hover:shadow-[0_10px_28px_rgba(12,61,46,0.5)] active:scale-[0.98] transition-all cursor-pointer backdrop-blur-md ${
          pulse ? "scale-[1.02] ring-2 ring-emerald-400/50" : ""
        }`}
      >
        {/* Left Side: Cart Icon + Quantity + Subtotal + Savings */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative grid size-10 place-items-center rounded-xl bg-white/12 border border-white/20 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
            <ShoppingBag className="size-5 text-amber-300" strokeWidth={2.2} />
            <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] text-[10px] font-black text-white border-[1.5px] border-white shadow-[0_2px_4px_rgba(217,119,6,0.4)]">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          </div>

          <div className="flex flex-col min-w-0 text-left">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-sans text-sm sm:text-base font-black text-white tracking-tight">
                {inr(subtotal)}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-200/90 truncate">
                • {cartCount} {isHindi ? "सामान" : cartCount === 1 ? "item" : "items"}
              </span>
            </div>

            {savings > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-300 mt-1">
                <Sparkles className="size-2.5 shrink-0" />
                <span>{isHindi ? `बचत ${inr(savings)}` : `Save ${inr(savings)}`}</span>
              </span>
            ) : (
              <span className="text-[10px] font-medium text-emerald-200/75 mt-0.5 truncate">
                {isHindi ? "ऑर्डर करने के लिए तैयार" : "Ready to checkout"}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Button Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white text-[#0A3326] font-extrabold text-xs sm:text-sm shadow-[0_2px_6px_rgba(0,0,0,0.15)] group-hover:bg-[#FAF8F5] transition-all shrink-0">
          <span>{isHindi ? "थैला देखें" : "View Cart"}</span>
          <ArrowRight className="size-3.5 sm:size-4 text-[#145A45] group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
        </div>
      </Link>
    </div>
  );
}
