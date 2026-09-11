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
      {/* Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed right-0 bottom-0 left-0 z-50 bg-white/96 backdrop-blur-xl border-t border-[#E0DACF] shadow-[0_-4px_20px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] lg:hidden pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 items-end h-[3.75rem]">
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
                className="relative flex flex-col items-center justify-center gap-[3px] py-1.5 cursor-pointer active:opacity-70 transition-opacity"
              >
                {/* Icon with active pill */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`rounded-full px-3 py-[3px] transition-all duration-200 ${
                      isActive ? "bg-[#E6EFE8] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" : "bg-transparent"
                    }`}
                  >
                    <Icon
                      className={`size-[21px] transition-colors duration-200 ${
                        isActive
                          ? "text-[#145A45] stroke-[2.2]"
                          : "text-[#9CA3A0] stroke-[1.8]"
                      }`}
                    />
                  </div>
                  {link.badge && link.badge > 0 ? (
                    <span className="absolute -top-1 -right-0.5 grid size-4 place-items-center rounded-full bg-gradient-to-r from-[#D97706] to-[#B45309] text-[8.5px] font-black text-white border-[1.5px] border-white shadow-[0_2px_4px_rgba(217,119,6,0.3)]">
                      {link.badge > 9 ? "9+" : link.badge}
                    </span>
                  ) : null}
                </div>

                {/* Label — matra-safe */}
                <span
                  className={`max-w-[70px] text-center leading-snug overflow-visible whitespace-nowrap pb-0.5 text-[10px] transition-colors duration-200 ${
                    isActive
                      ? "font-bold text-[#145A45]"
                      : "font-medium text-[#9CA3A0]"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
