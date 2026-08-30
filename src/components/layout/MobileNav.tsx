import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  Package,
  Heart,
  MessageCircle,
  PhoneCall,
  User,
  X,
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
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
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
    { to: "/", label: t.home, icon: Home },
    { to: "/shop", label: t.categories, icon: LayoutGrid },
    { to: "/account", label: accountLabel, icon: User },
    {
      to: "/wishlist",
      label: t.wishlist,
      icon: Heart,
      badge: wishlistItems.length > 0 ? wishlistItems.length : undefined,
    },
    { to: "/cart", label: t.cart, icon: ShoppingBag, badge: cartCount },
  ];

  return (
    <>
      {/* 1. Mobile Floating Quick Action Buttons */}
      <div className="fixed right-3 bottom-16 z-40 flex items-center gap-2 lg:hidden pointer-events-auto">
        {/* Call Support Button */}
        <button
          onClick={() => setOrderModalOpen(true)}
          aria-label="Order on Phone"
          className="flex items-center gap-1.5 rounded-full border border-[#E5E0D5] bg-white/95 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-[#0F4A38] shadow-md active:scale-95 transition-transform"
        >
          <PhoneCall className="size-3.5 text-[#0F4A38]" />
          <span>{lang === "hi" ? "फोन ऑर्डर" : "Call Order"}</span>
        </button>

        {/* WhatsApp Quick Order FAB */}
        <a
          href={waHref(
            storeWhatsApp,
            "Namaste Arun Gopal Traders, I want to send my grocery list for delivery.",
          )}
          target="_blank"
          rel="noreferrer"
          aria-label="Order on WhatsApp"
          className="flex items-center gap-1.5 rounded-full bg-[#145A45] text-white px-3.5 py-1.5 text-[11px] font-bold shadow-lg hover:bg-[#0A3628] active:scale-95 transition-all border border-white/20 backdrop-blur-xs"
        >
          <MessageCircle className="size-3.5 fill-white text-[#145A45]" />
          <span>{lang === "hi" ? "व्हाट्सएप लिस्ट" : "WhatsApp List"}</span>
        </a>
      </div>

      {/* 2. Mobile App Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed right-0 bottom-0 left-0 z-50 border-t border-[#E5E0D5] bg-white/95 backdrop-blur-lg lg:hidden pb-[calc(env(safe-area-inset-bottom)+0.25rem)] shadow-lg"
      >
        <div className="grid grid-cols-5 items-center justify-around h-14.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isCart = link.to === "/cart";
            const isActive =
              currentPath === link.to ||
              (link.to === "/account" && (currentPath === "/account" || currentPath === "/track"));

            const handleClick = (e: React.MouseEvent) => {
              if (isCart && currentPath === "/cart") {
                e.preventDefault();
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                } else {
                  void navigate({ to: "/" });
                }
              }
            };

            return (
              <Link
                key={link.label}
                to={link.to}
                search={link.search as never}
                onClick={handleClick}
                className={`relative flex flex-col items-center justify-center gap-1 h-full text-[10.5px] transition-all min-h-[48px] cursor-pointer ${
                  isActive
                    ? "text-[#0F4A38] font-bold"
                    : "text-[#5A655F] hover:text-[#16201A] font-medium"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`rounded-xl px-2.5 py-0.5 transition-all ${
                      isActive ? "bg-[#E6EFE8]" : "bg-transparent"
                    }`}
                  >
                    <Icon
                      className={`size-5.5 transition-transform ${
                        isActive
                          ? "text-[#0F4A38] stroke-[2.2] scale-105"
                          : "text-[#5A655F] stroke-[1.85]"
                      }`}
                    />
                  </div>
                  {link.badge && link.badge > 0 ? (
                    <span className="absolute -top-1 -right-1.5 grid size-4.5 place-items-center rounded-full bg-[#D97706] text-[9.5px] font-black text-white shadow-xs border-1.5 border-white">
                      {link.badge > 9 ? "9+" : link.badge}
                    </span>
                  ) : null}
                </div>
                <span className="truncate max-w-[62px] text-center leading-none">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <PhoneOrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
    </>
  );
}
