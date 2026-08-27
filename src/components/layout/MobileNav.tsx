import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  Package,
  Heart,
  MessageCircle,
  PhoneCall,
  User,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { PhoneOrderModal } from "@/components/PhoneOrderModal";
import { waHref } from "@/lib/format";

type NavItem = {
  to: string;
  search?: Record<string, unknown>;
  label: string;
  icon: typeof Home;
  badge?: number | undefined;
};

export function MobileNav() {
  const { count: cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [hasLocalPhone, setHasLocalPhone] = useState(false);

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
    ? (lang === "hi" ? "मेरा खाता" : "My Account")
    : (lang === "hi" ? "लॉगिन / ट्रैक" : "Login / Track");

  const storeWhatsApp = "916388354988";

  const links: NavItem[] = [
    { to: "/", label: lang === "hi" ? "होम" : "Home", icon: Home },
    { to: "/shop", label: lang === "hi" ? "कैटेगरी" : "Categories", icon: LayoutGrid },
    { to: "/account", label: accountLabel, icon: User },
    {
      to: "/wishlist",
      label: lang === "hi" ? "पसंद" : "Wishlist",
      icon: Heart,
      badge: wishlistItems.length > 0 ? wishlistItems.length : undefined,
    },
    { to: "/cart", label: lang === "hi" ? "कार्ट" : "Cart", icon: ShoppingBag, badge: cartCount },
  ];

  return (
    <>
      {/* 1. Mobile Floating Quick Action Buttons (Above Bottom Bar) */}
      <div className="fixed right-3 bottom-16 z-40 flex items-center gap-2 lg:hidden pointer-events-auto">
        {/* Call Support Button */}
        <button
          onClick={() => setOrderModalOpen(true)}
          aria-label="Order on Phone"
          className="flex items-center gap-1.5 rounded-full border border-[#E8E4DA] bg-[#FFFFFF]/95 backdrop-blur-md px-3 py-2 text-[11px] font-bold text-[#145A45] shadow-lg active:scale-95 transition-transform"
        >
          <PhoneCall className="size-3.5 text-[#145A45]" />
          <span>{lang === "hi" ? "फोन ऑर्डर" : "Call Order"}</span>
        </button>

        {/* WhatsApp Quick Order Floating Action Button (FAB) */}
        <a
          href={waHref(
            storeWhatsApp,
            "Namaste Arun Gopal Traders, I want to send my grocery list for delivery.",
          )}
          target="_blank"
          rel="noreferrer"
          aria-label="Order on WhatsApp"
          className="flex items-center gap-1.5 rounded-full bg-[#145A45] text-white px-3.5 py-2 text-[11px] font-extrabold shadow-xl hover:bg-[#0E4333] active:scale-95 transition-all border border-white/20 backdrop-blur-xs"
        >
          <MessageCircle className="size-4 fill-white text-[#145A45]" />
          <span>{lang === "hi" ? "व्हाट्सएप लिस्ट" : "WhatsApp List"}</span>
        </a>
      </div>

      {/* 2. Mobile App Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed right-0 bottom-0 left-0 z-50 border-t border-[#E8E4DA] bg-white/95 backdrop-blur-lg lg:hidden pb-[calc(env(safe-area-inset-bottom)+0.25rem)] shadow-lg"
      >
        <div className="grid grid-cols-5 items-center justify-around h-14">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              (currentPath === link.to ||
                (link.to === "/account" && (currentPath === "/account" || currentPath === "/track"))) &&
              (!link.search ||
                JSON.stringify(routerState.location.search) === JSON.stringify(link.search));

            return (
              <Link
                key={link.label}
                to={link.to}
                search={link.search as never}
                className={`relative flex flex-col items-center justify-center gap-0.5 h-full text-[10px] transition-all min-h-[44px] ${
                  isActive
                    ? "text-[#145A45] font-extrabold"
                    : "text-[#6B746F] hover:text-[#1F2924] font-medium"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`rounded-full p-1 transition-all ${
                      isActive ? "bg-[#DCEBDD]" : "bg-transparent"
                    }`}
                  >
                    <Icon className={`size-5 ${isActive ? "text-[#145A45]" : "text-[#6B746F]"}`} />
                  </div>
                  {link.badge && link.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 grid size-4 place-items-center rounded-full bg-[#E3B341] text-[9px] font-black text-[#1F2924] shadow-2xs">
                      {link.badge > 9 ? "9+" : link.badge}
                    </span>
                  ) : null}
                </div>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <PhoneOrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
    </>
  );
}
