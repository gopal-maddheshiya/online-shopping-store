import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home,
  LayoutGrid,
  User,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useState, useEffect, useRef } from "react";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { gsap } from "@/lib/gsap";

/* ═════════════════════════════════════════════════════════════════
   TAB ICON COMPONENT (CLEAN OFFICIAL LUCIDE ICONS + GSAP SPRING)
   ═════════════════════════════════════════════════════════════════ */

type TabName = "home" | "shop" | "account" | "cart";

function TabIcon({
  name,
  isActive,
  badge,
}: {
  name: TabName;
  isActive: boolean;
  badge?: number | undefined;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isActive && iconRef.current) {
      gsap.fromTo(
        iconRef.current,
        { scale: 0.86, y: 1 },
        { scale: 1, y: 0, duration: 0.22, ease: "power2.out", clearProps: "transform" }
      );
    }
  }, [isActive]);

  useEffect(() => {
    if (badge !== undefined && badge > 0 && badgeRef.current) {
      gsap.fromTo(
        badgeRef.current,
        { scale: 0.4 },
        { scale: 1, duration: 0.4, ease: "back.out(3)" }
      );
    }
  }, [badge]);

  const iconClass = `size-[24px] sm:size-[25px] transition-all duration-200 ${
    isActive
      ? "text-[#145A45] stroke-[2.35]"
      : "text-[#546059] stroke-[1.85]"
  }`;

  return (
    <div ref={iconRef} className="relative flex items-center justify-center">
      {name === "home" && <Home className={iconClass} />}
      {name === "shop" && <LayoutGrid className={iconClass} />}
      {name === "account" && <User className={iconClass} />}
      {name === "cart" && <ShoppingBag className={iconClass} />}

      {badge && badge > 0 ? (
        <span
          ref={badgeRef}
          className="absolute -top-1.5 -right-2 grid size-4 place-items-center rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] text-[8.5px] font-black text-white border-[1.5px] border-white shadow-[0_2px_4px_rgba(217,119,6,0.3)] pointer-events-none"
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   MOBILE BOTTOM NAVIGATION BAR
   ═════════════════════════════════════════════════════════════════ */

type NavItem = {
  key: TabName;
  to: string;
  search?: Record<string, unknown>;
  label: string;
  badge?: number | undefined;
};

export function MobileNav() {
  const { count: cartCount } = useCart();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const [hasLocalPhone, setHasLocalPhone] = useState(false);
  const { scrollTo } = useLenis();
  const navRef = useRef<HTMLElement>(null);

  // GSAP Smooth Entrance on mount
  useEffect(() => {
    if (navRef.current && typeof window !== "undefined") {
      gsap.fromTo(
        navRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasLocalPhone(Boolean(localStorage.getItem("agt.last_phone")));
    }
  }, []);

  // Don't show mobile bottom nav on admin workspace
  if (currentPath.startsWith("/admin")) {
    return null;
  }

  const isIdentified = Boolean(user || hasLocalPhone);
  const accountLabel = isIdentified
    ? lang === "hi"
      ? "मेरा खाता"
      : "My Account"
    : lang === "hi"
      ? "लॉगिन / ट्रैक"
      : "Login / Track";

  const links: NavItem[] = [
    { key: "home", to: "/", label: t.home },
    { key: "shop", to: "/shop", label: t.categories },
    { key: "account", to: "/account", label: accountLabel },
    { key: "cart", to: "/cart", label: t.cart, badge: cartCount },
  ];

  return (
    <nav
      ref={navRef}
      aria-label="Mobile Navigation"
      className="fixed right-0 bottom-0 left-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-[#E6E1D8] shadow-[0_-4px_24px_rgba(20,90,69,0.06),inset_0_1px_0_rgba(255,255,255,1)] lg:hidden pb-[env(safe-area-inset-bottom)] select-none"
    >
      <div className="grid grid-cols-4 items-center h-[3.75rem]">
        {links.map((link) => {
          const isCart = link.to === "/cart";
          const isActive =
            currentPath === link.to ||
            (link.to === "/account" &&
              (currentPath === "/account" || currentPath === "/track"));

          const handleClick = (e: React.MouseEvent) => {
            // 1. If currently on cart, clicking cart goes back
            if (isCart && currentPath === "/cart") {
              e.preventDefault();
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                void navigate({ to: "/" });
              }
              return;
            }

            // 2. Lenis Tap-to-Scroll-to-Top: If already on this route, butter-smooth scroll to top!
            if (currentPath === link.to) {
              e.preventDefault();
              scrollTo(0, { duration: 0.85 });
            }
          };

          return (
            <Link
              key={link.key}
              to={link.to}
              preload="render"
              search={link.search as never}
              onClick={handleClick}
              className="group relative flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-transform active:scale-92 bg-transparent select-none"
            >
              {/* Pure Floating Icon (Zero Background, Pixel-Perfect Lucide Geometry) */}
              <TabIcon
                name={link.key}
                isActive={isActive}
                badge={link.badge}
              />

              {/* Clean Typography — No Bottom Dot */}
              <span
                className={`max-w-[84px] sm:max-w-[96px] text-center leading-tight overflow-visible whitespace-nowrap text-[11.5px] sm:text-[12px] tracking-normal transition-colors duration-200 ${
                  isActive
                    ? "font-bold text-[#145A45]"
                    : "font-medium text-[#46544D] group-hover:text-[#16201A]"
                }`}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
