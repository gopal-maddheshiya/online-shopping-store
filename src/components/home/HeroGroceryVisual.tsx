import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";

export function HeroGroceryVisual() {
  const { lang } = useLanguage();

  return (
    <div className="relative w-full max-w-lg lg:max-w-2xl mx-auto flex items-center justify-center select-none py-2 sm:py-4">
      {/* 1. Ambient Golden-Emerald Halo Lighting */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* Soft Golden Sunlight Bloom */}
        <div className="size-64 sm:size-80 lg:size-[440px] rounded-full bg-radial from-[#F59E0B]/16 via-[#145A45]/25 to-transparent blur-3xl opacity-75" />
        {/* Deep Emerald Core Accent */}
        <div className="size-48 sm:size-60 rounded-full bg-[#0D4333]/50 blur-2xl -mt-6" />
      </div>

      {/* 2. Soft Natural Grounding Shadow Podium (Physical Depth) */}
      <div className="pointer-events-none absolute bottom-1 sm:bottom-3 w-[85%] h-8 sm:h-12 rounded-[100%] bg-black/50 blur-2xl" />

      {/* 3. The 4-Staple Pure Grocery Art Composition */}
      <div className="relative z-10 w-full flex items-end justify-center px-1 sm:px-4 pt-2 pb-2">
        {/* ITEM 1: Fortune Kachi Ghani Mustard Oil (Left Supporting Pouch) */}
        <div className="relative z-20 w-24 sm:w-32 md:w-38 lg:w-44 -mr-6 sm:-mr-8 mb-2 sm:mb-4 animate-hero-float-3">
          <Link
            to="/shop"
            search={{ category: "oil-ghee" }}
            aria-label={lang === "hi" ? "फॉर्च्यून सरसों तेल" : "Fortune Mustard Oil"}
            className="group block filter drop-shadow-[0_18px_24px_rgba(0,0,0,0.65)] hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            <img
              src="/images/products/fortune-mustard-oil.svg"
              alt="Fortune Mustard Oil"
              loading="eager"
              draggable={false}
              className="w-full h-auto object-contain"
            />
          </Link>
        </div>

        {/* ITEM 2: Aashirvaad Chakki Atta (MAIN HERO PRODUCT - Foreground Centerpiece) */}
        <div className="relative z-30 w-42 sm:w-54 md:w-62 lg:w-70 -mr-4 sm:-mr-6 animate-hero-float-1">
          <Link
            to="/shop"
            search={{ category: "flour-atta" }}
            aria-label={lang === "hi" ? "आशीर्वाद चक्की आटा" : "Aashirvaad Chakki Atta"}
            className="group block filter drop-shadow-[0_26px_38px_rgba(0,0,0,0.75)] hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            <img
              src="/images/products/aashirvaad-atta.svg"
              alt="Aashirvaad Chakki Atta"
              loading="eager"
              draggable={false}
              className="w-full h-auto object-contain"
            />
          </Link>
        </div>

        {/* ITEM 3: India Gate Basmati Rice (Right Tall Supporting Royal Bag) */}
        <div className="relative z-15 w-36 sm:w-46 md:w-52 lg:w-60 -ml-2 sm:-ml-4 mb-1 sm:mb-2 animate-hero-float-2">
          <Link
            to="/shop"
            search={{ category: "rice-grains" }}
            aria-label={lang === "hi" ? "इंडिया गेट बासमती चावल" : "India Gate Basmati Rice"}
            className="group block filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.65)] hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            <img
              src="/images/products/india-gate-basmati-rice.svg"
              alt="India Gate Basmati Rice"
              loading="eager"
              draggable={false}
              className="w-full h-auto object-contain"
            />
          </Link>
        </div>

        {/* ITEM 4: Amul Pure Desi Ghee (Front Right Pure Cow Ghee Tin) */}
        <div className="relative z-35 w-22 sm:w-28 md:w-34 lg:w-40 -ml-8 sm:-ml-12 mb-0 sm:mb-1 animate-hero-float-1">
          <Link
            to="/shop"
            search={{ category: "oil-ghee" }}
            aria-label={lang === "hi" ? "अमूल शुद्ध देसी घी" : "Amul Pure Desi Ghee"}
            className="group block filter drop-shadow-[0_18px_25px_rgba(0,0,0,0.7)] hover:scale-108 transition-transform duration-300 cursor-pointer"
          >
            <img
              src="/images/products/amul-desi-ghee.svg"
              alt="Amul Pure Desi Ghee"
              loading="eager"
              draggable={false}
              className="w-full h-auto object-contain"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
