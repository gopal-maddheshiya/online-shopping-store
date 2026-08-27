import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  Package,
  Sparkles,
  MessageCircle,
  PhoneCall,
  User,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
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
  const { lang, t } = useLanguage();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Don't show mobile bottom nav on admin workspace
  if (currentPath.startsWith("/admin")) {
    return null;
  }

  const storeWhatsApp = "919621617360";

  const links: NavItem[] = [
    { to: "/", label: lang === "hi" ? "होम" : "Home", icon: Home },
    { to: "/shop", label: lang === "hi" ? "कैटेगरी" : "Categories", icon: LayoutGrid },
    {
      to: "/shop",
      search: { sort: "discount" },
      label: lang === "hi" ? "ऑफ़र्स" : "Offers",
      icon: Sparkles,
    },
    { to: "/track", label: lang === "hi" ? "ऑर्डर्स" : "Orders", icon: Package },
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
          className="flex items-center gap-1.5 rounded-full border border-[#EAE6DF] bg-white/95 backdrop-blur-md px-3 py-2 text-[11px] font-bold text-[#18483B] shadow-lg active:scale-95 transition-transform"
        >
          <PhoneCall className="size-3.5 text-[#18483B]" />
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
          className="flex items-center gap-1.5 rounded-full bg-[#25D366] text-white px-3.5 py-2 text-[11px] font-extrabold shadow-xl hover:bg-[#20ba59] active:scale-95 transition-all border border-white/30 backdrop-blur-xs"
        >
          <MessageCircle className="size-4 fill-white text-[#25D366]" />
          <span>{lang === "hi" ? "व्हाट्सएप लिस्ट" : "WhatsApp List"}</span>
        </a>
      </div>

      {/* 2. Zepto / Blinkit-style App Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed right-0 bottom-0 left-0 z-50 border-t border-[#EAE6DF] bg-white/95 backdrop-blur-lg lg:hidden pb-[calc(env(safe-area-inset-bottom)+0.25rem)] shadow-lg"
      >
        <div className="grid grid-cols-5 items-center justify-around h-14">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              currentPath === link.to &&
              (!link.search ||
                JSON.stringify(routerState.location.search) === JSON.stringify(link.search));

            return (
              <Link
                key={link.label}
                to={link.to}
                search={link.search as never}
                className={`relative flex flex-col items-center justify-center gap-0.5 h-full text-[10px] transition-all min-h-[44px] ${
                  isActive
                    ? "text-[#18483B] font-extrabold"
                    : "text-[#676D68] hover:text-[#191C1B] font-medium"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`rounded-full p-1 transition-all ${
                      isActive ? "bg-[#EBF4F0]" : "bg-transparent"
                    }`}
                  >
                    <Icon className={`size-5 ${isActive ? "text-[#18483B]" : "text-[#676D68]"}`} />
                  </div>
                  {link.badge && link.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 grid size-4 place-items-center rounded-full bg-[#D97706] text-[9px] font-black text-white shadow-2xs">
                      {link.badge > 9 ? "9+" : link.badge}
                    </span>
                  ) : null}
                </div>
                <span className="tracking-tight">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <PhoneOrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
    </>
  );
}
