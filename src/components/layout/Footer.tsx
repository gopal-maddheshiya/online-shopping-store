import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
} from "lucide-react";
import { settingsQuery } from "@/lib/queries";
import { telHref, waHref } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

const DAYS: [string, string, string][] = [
  ["mon", "Monday", "सोमवार"],
  ["tue", "Tuesday", "मंगलवार"],
  ["wed", "Wednesday", "बुधवार"],
  ["thu", "Thursday", "गुरुवार"],
  ["fri", "Friday", "शुक्रवार"],
  ["sat", "Saturday", "शनिवार"],
  ["sun", "Sunday", "रविवार"],
];

export function Footer() {
  const { data: s } = useQuery(settingsQuery);
  const { t, lang } = useLanguage();
  const { count: cartCount } = useCart();
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const isCheckoutRoute = currentPath === "/checkout";
  const hideFloatingWhatsapp = isCheckoutRoute;
  const timingsRef = useRef<HTMLDivElement | null>(null);
  const [isTimingsVisible, setIsTimingsVisible] = useState(false);

  useEffect(() => {
    if (hideFloatingWhatsapp || typeof IntersectionObserver === "undefined") {
      setIsTimingsVisible(false);
      return;
    }
    const el = timingsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setIsTimingsVisible(Boolean(entries[0]?.isIntersecting));
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hideFloatingWhatsapp]);

  const phone = s?.phone ?? "+91 6388354988";
  const cleanPhone = phone.replace(/\s+/g, "");
  const whatsapp = s?.whatsapp ?? "916388354988";
  const email = s?.email ?? "gopalmaddheshiya138@gmail.com";
  const address = s?.address ?? "Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh";
  const isDeliveryEnabled = Boolean(s?.delivery_enabled);

  return (
    <footer className="mt-8 border-t border-[#164E3D] bg-gradient-to-b from-[#0B3A2C] via-[#082C21] to-[#041B14] text-white relative overflow-hidden select-none">
      {/* 1. Top Value Proposition Bar */}
      <div className="border-b border-white/[0.08] bg-black/20 py-6 sm:py-7">
        <div className="container-page grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {/* Card 1: Fast Delivery / Store Pickup */}
          <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xs hover:bg-white/[0.08] hover:border-emerald-400/40 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.15)] group">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1E6B53] to-[#124B38] border border-emerald-400/30 text-[#F5D061] shadow-[0_2px_8px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform">
              {isDeliveryEnabled ? <Truck className="size-4" /> : <Store className="size-4" />}
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-white tracking-normal">
                {isDeliveryEnabled
                  ? (lang === "hi" ? "तेज़ लोकल डिलीवरी" : "Fast Local Delivery")
                  : (lang === "hi" ? "दुकान से पिकअप" : "Store Pickup")}
              </p>
              <p className="text-[11px] text-emerald-100/75">
                {isDeliveryEnabled
                  ? (lang === "hi" ? `₹${s?.free_delivery_threshold ?? 499}+ पर फ्री` : `Free above ₹${s?.free_delivery_threshold ?? 499}`)
                  : (lang === "hi" ? "ऑनलाइन बुक करें, दुकान से लें" : "Order online, collect at store")}
              </p>
            </div>
          </div>

          {/* Card 2: 100% Genuine Items */}
          <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xs hover:bg-white/[0.08] hover:border-emerald-400/40 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.15)] group">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1E6B53] to-[#124B38] border border-emerald-400/30 text-[#F5D061] shadow-[0_2px_8px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-white tracking-normal">
                {lang === "hi" ? "100% शुद्ध व ताजा" : "100% Genuine Items"}
              </p>
              <p className="text-[11px] text-emerald-100/75">
                {lang === "hi" ? "असली ब्रांडेड किराना" : "Original branded staples"}
              </p>
            </div>
          </div>

          {/* Card 3: Phone & WhatsApp Support */}
          <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xs hover:bg-white/[0.08] hover:border-emerald-400/40 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.15)] group">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1E6B53] to-[#124B38] border border-emerald-400/30 text-[#F5D061] shadow-[0_2px_8px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform">
              <Phone className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-white tracking-normal">
                {lang === "hi" ? "फ़ोन व व्हाट्सएप ऑर्डर" : "Phone & WhatsApp"}
              </p>
              <p className="text-[11px] text-emerald-100/75">
                {lang === "hi" ? "कॉल करके आसानी से मंगाएं" : "Easy ordering on call"}
              </p>
            </div>
          </div>

          {/* Card 4: Store Pickup / Easy Exchange */}
          <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xs hover:bg-white/[0.08] hover:border-emerald-400/40 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.15)] group">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1E6B53] to-[#124B38] border border-emerald-400/30 text-[#F5D061] shadow-[0_2px_8px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform">
              <RotateCcw className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm text-white tracking-normal">
                {isDeliveryEnabled
                  ? t.storePickupTitle
                  : (lang === "hi" ? "आसान रिप्लेसमेंट" : "Easy Exchange")}
              </p>
              <p className="text-[11px] text-emerald-100/75">
                {lang === "hi" ? "रामनगर दुकान काउंटर" : "Ramnagar shop counter"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Links */}
      <div className="container-page grid gap-8 py-10 md:grid-cols-4">
        {/* Brand & Tagline */}
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 font-brand-hindi text-xl font-bold tracking-tight text-white group"
          >
            <div className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#1E6B53] to-[#145A45] border border-emerald-400/30 shadow-xs text-[#F5D061] group-hover:scale-105 transition-transform">
              <Store className="size-4" />
            </div>
            <span className="group-hover:text-emerald-200 transition-colors">{t.storeName}</span>
          </Link>
          <p className="text-xs leading-relaxed text-emerald-100/80">
            {lang === "hi"
              ? "महाराजगंज में आपकी अपनी विश्वसनीय किराना दुकान। शुद्ध सामान, सही दाम और भरोसेमंद होम डिलीवरी।"
              : (s?.tagline ??
                "Your Trusted Local Grocery Store in Maharajganj. Fresh staples, honest rates, and reliable doorstep delivery.")}
          </p>
          <div className="space-y-2 text-xs text-emerald-100/85 pt-2">
            <a
              href={
                s?.maps_link ??
                "https://www.google.com/maps/search/?api=1&query=Ramnagar%20Adda%20Bazar%20Road%20Maharajganj%20Uttar%20Pradesh"
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 hover:text-white transition-colors"
            >
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#34D399]" />
              <span>{lang === "hi" ? t.storeAddress : (s?.address ?? t.storeAddress)}</span>
            </a>
            <a
              href={telHref(cleanPhone)}
              className="flex items-center gap-2 font-semibold text-white hover:text-emerald-300 transition-colors"
            >
              <Phone className="size-3.5 text-[#34D399]" /> {phone}
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Mail className="size-3.5 text-[#34D399]" /> {email}
            </a>
          </div>
        </div>

        {/* Quick Categories */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5D061]">
            {lang === "hi" ? "किराना श्रेणियां" : "Shop Categories"}
          </h4>
          <ul className="mt-3.5 space-y-2.5 text-xs text-emerald-100/75">
            <li>
              <Link to="/shop" search={{ category: "atta-flour" }} className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                {lang === "hi" ? "आटा, मैदा व बेसन" : "Atta & Flours"}
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                search={{ category: "rice" }}
                className="hover:text-white hover:translate-x-0.5 inline-block transition-all"
              >
                {lang === "hi" ? "बासमती चावल व अनाज" : "Basmati Rice & Grains"}
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "pulses-dal" }} className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                {lang === "hi" ? "दालें व दलहन" : "Pulses & Dal"}
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "oil-ghee" }} className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                {lang === "hi" ? "सरसों तेल व शुद्ध घी" : "Mustard Oil & Ghee"}
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                search={{ category: "spices-masala" }}
                className="hover:text-white hover:translate-x-0.5 inline-block transition-all"
              >
                {lang === "hi" ? "खड़े व पिसे मसाले" : "Spices & Whole Masalas"}
              </Link>
            </li>
            <li>
              <Link to="/shop" className="text-[#F5D061] hover:text-white font-bold hover:translate-x-0.5 inline-block transition-all">
                {lang === "hi" ? "पूरा किराना कैटलॉग देखें →" : "View All Groceries →"}
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5D061]">
            {lang === "hi" ? "ग्राहक सेवा" : "Customer Care"}
          </h4>
          <ul className="mt-3.5 space-y-2.5 text-xs text-emerald-100/75">
            <li>
              <Link to="/track" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                {lang === "hi" ? "ऑर्डर ट्रैक करें" : "Track Order Status"}
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                {lang === "hi" ? "मेरा खाता व पिछले ऑर्डर" : "My Account & Orders"}
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                {lang === "hi" ? "सहायता व संपर्क" : "Help & Support"}
              </Link>
            </li>
          </ul>
        </div>

        {/* Store Timings */}
        <div ref={timingsRef}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5D061]">
            {lang === "hi" ? "दुकान का समय" : "Store Timings"}
          </h4>
          <div className="mt-3.5 space-y-1.5 text-xs">
            {DAYS.map(([key, labelEn, labelHi]) => {
              const h = s?.business_hours?.[key] ?? {
                open: "07:00",
                close: "21:00",
                closed: false,
              };
              return (
                <div key={key} className="flex justify-between text-emerald-100/70 py-0.5 border-b border-white/[0.04]">
                  <span>{lang === "hi" ? labelHi : labelEn}:</span>
                  <span className="font-semibold text-white">
                    {h.closed ? (lang === "hi" ? "बंद" : "Closed") : `${h.open} - ${h.close}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Bottom Copyright Bar */}
      <div className={`border-t border-white/[0.08] py-4 bg-[#03140F] ${isCheckoutRoute ? "pb-6" : "pb-[calc(4.75rem+env(safe-area-inset-bottom))]"} lg:pb-4`}>
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-emerald-200/60 sm:flex-row">
          <p>© {new Date().getFullYear()} <span className="text-emerald-100 font-semibold">{t.storeName}</span>. {t.storeAddressShort.replace(/\.+$/, "")}.</p>
          <p className="flex items-center gap-1.5 font-medium text-emerald-300">
            <span>{lang === "hi" ? "आपकी अपनी लोकल किराना दुकान • 100% शुद्धता" : "Your Trusted Local Kirana Store • 100% Purity"}</span>
          </p>
        </div>
      </div>

      {/* Desktop Floating WhatsApp Quick Order Button (hidden on /checkout & gracefully tucks away when Footer Store Timings are visible) */}
      {!hideFloatingWhatsapp && (
        <div
          className={`fixed right-8 z-40 hidden lg:flex transition-all duration-300 ${
            cartCount > 0 && currentPath !== "/cart" && !currentPath.startsWith("/product/")
              ? "lg:bottom-36"
              : "lg:bottom-6"
          } ${isTimingsVisible ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100 translate-y-0"}`}
        >
        <a
          href={waHref(
            whatsapp,
            lang === "hi"
              ? "नमस्ते अरुण गोपाल ट्रेडर्स, मुझे किराने का सामान ऑर्डर करना है।"
              : "Namaste! I want to order grocery items from Arun Gopal Traders."
          )}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#1EBD5A] hover:to-[#0F7569] px-4.5 py-2.5 text-xs font-bold text-white shadow-[0_6px_20px_rgba(37,211,102,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 border border-[#3FE07C] transition-all"
          aria-label={lang === "hi" ? "व्हाट्सएप पर ऑर्डर करें" : "Order on WhatsApp"}
        >
          <MessageCircle className="size-4.5 fill-white text-[#128C7E]" />
          <span>{lang === "hi" ? "व्हाट्सएप ऑर्डर" : "WhatsApp Quick Order"}</span>
        </a>
        </div>
      )}
    </footer>
  );
}
