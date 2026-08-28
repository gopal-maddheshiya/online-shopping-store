import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function HeroGroceryVisual() {
  const { lang } = useLanguage();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10; // max ±5px
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto flex items-center justify-center select-none py-4 sm:py-6"
    >
      {/* 1. Ambient Glow Backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-60 sm:size-72 lg:size-96 rounded-full bg-gradient-to-tr from-[#E3B341]/20 via-[#E6EFE8]/15 to-transparent blur-3xl opacity-85" />
        <div className="size-44 sm:size-56 rounded-full bg-[#145A45]/50 blur-2xl -mt-6" />
      </div>

      {/* 2. Soft Reflective Grounding Base/Shadow */}
      <div className="pointer-events-none absolute bottom-3 sm:bottom-6 w-4/5 h-10 rounded-[100%] bg-black/45 blur-2xl" />

      {/* 3. The 4-Staple Layered Grocery Composition */}
      <div
        className="relative z-10 w-full flex items-end justify-center px-2 pt-4 pb-2 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
        }}
      >
        {/* ITEM 1: Aashirvaad Chakki Atta (Main Large Hero Centerpiece) */}
        <div className="relative z-20 w-36 sm:w-44 md:w-48 lg:w-52 -mr-6 sm:-mr-8 animate-hero-float-1">
          <Link
            to="/shop"
            search={{ category: "flour-atta" }}
            aria-label="Aashirvaad Chakki Atta"
            className="group relative block"
          >
            {/* Hover Tooltip */}
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/85 px-2.5 py-1 text-[10px] font-bold text-white shadow-xl pointer-events-none backdrop-blur-md flex items-center gap-1 z-40">
              <span>{lang === "hi" ? "आशीर्वाद आटा • 5kg" : "Aashirvaad Atta • 5kg"}</span>
              <ArrowUpRight className="size-3 text-[#E3B341]" />
            </span>

            <div className="filter drop-shadow-[0_20px_28px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-300">
              <img
                src="/images/products/aashirvaad-atta.jpg"
                alt="Aashirvaad Chakki Atta"
                loading="eager"
                draggable={false}
                className="w-full h-auto object-contain rounded-2xl"
              />
            </div>
          </Link>
        </div>

        {/* ITEM 2: India Gate Basmati Rice (Right Tall Supporting Anchor) */}
        <div className="relative z-15 w-32 sm:w-40 md:w-44 lg:w-48 -ml-2 sm:-ml-4 animate-hero-float-2">
          <Link
            to="/shop"
            search={{ category: "rice-grains" }}
            aria-label="India Gate Basmati Rice"
            className="group relative block"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/85 px-2.5 py-1 text-[10px] font-bold text-white shadow-xl pointer-events-none backdrop-blur-md flex items-center gap-1 z-40">
              <span>{lang === "hi" ? "बासमती चावल • 5kg" : "Basmati Rice • 5kg"}</span>
              <ArrowUpRight className="size-3 text-[#E3B341]" />
            </span>

            <div className="filter drop-shadow-[0_18px_25px_rgba(0,0,0,0.55)] group-hover:scale-105 transition-transform duration-300">
              <img
                src="/images/products/india-gate-basmati-rice.jpg"
                alt="India Gate Basmati Rice"
                loading="eager"
                draggable={false}
                className="w-full h-auto object-contain rounded-2xl"
              />
            </div>
          </Link>
        </div>

        {/* ITEM 3: Fortune Mustard Oil (Center Golden Accent Pouch) */}
        <div className="relative z-25 w-24 sm:w-30 md:w-34 lg:w-36 -ml-10 sm:-ml-14 mb-1 animate-hero-float-3">
          <Link
            to="/shop"
            search={{ category: "oil-ghee" }}
            aria-label="Fortune Mustard Oil"
            className="group relative block"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/85 px-2.5 py-1 text-[10px] font-bold text-white shadow-xl pointer-events-none backdrop-blur-md flex items-center gap-1 z-40">
              <span>{lang === "hi" ? "सरसों तेल • 1L" : "Mustard Oil • 1L"}</span>
              <ArrowUpRight className="size-3 text-[#E3B341]" />
            </span>

            <div className="filter drop-shadow-[0_16px_22px_rgba(0,0,0,0.55)] group-hover:scale-108 transition-transform duration-300">
              <img
                src="/images/products/fortune-mustard-oil.jpg"
                alt="Fortune Mustard Oil"
                loading="eager"
                draggable={false}
                className="w-full h-auto object-contain rounded-2xl"
              />
            </div>
          </Link>
        </div>

        {/* ITEM 4: Amul Pure Desi Ghee (Front Right Prestige Tin) */}
        <div className="relative z-30 w-22 sm:w-28 md:w-32 lg:w-34 -ml-4 sm:-ml-6 -mb-1 animate-hero-float-1">
          <Link
            to="/shop"
            search={{ category: "oil-ghee" }}
            aria-label="Amul Pure Desi Ghee"
            className="group relative block"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/85 px-2.5 py-1 text-[10px] font-bold text-white shadow-xl pointer-events-none backdrop-blur-md flex items-center gap-1 z-40">
              <span>{lang === "hi" ? "अमूल शुद्ध घी • 1L" : "Amul Pure Ghee • 1L"}</span>
              <ArrowUpRight className="size-3 text-[#E3B341]" />
            </span>

            <div className="filter drop-shadow-[0_16px_24px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-300">
              <img
                src="/images/products/amul-desi-ghee.jpg"
                alt="Amul Pure Desi Ghee"
                loading="eager"
                draggable={false}
                className="w-full h-auto object-contain rounded-2xl"
              />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
