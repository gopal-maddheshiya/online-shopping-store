import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Truck, Tag, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";

export function GoogleAuthPromptModal() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [dismissedForThisNav, setDismissedForThisNav] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  // Track initial load so popup doesn't fire on homepage first visit
  const isInitialLoad = useRef(true);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Skip if logged in, loading, or admin route
    if (authLoading || user || isAdmin) {
      setIsOpen(false);
      return;
    }

    // On first mount (initial page load), just record pathname, don't show popup
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      prevPathname.current = pathname;
      return;
    }

    // Only trigger when pathname actually changes (user navigated somewhere)
    if (pathname === prevPathname.current) {
      return;
    }

    // Pathname changed — this is a real navigation
    prevPathname.current = pathname;
    setDismissedForThisNav(false); // Reset dismiss for new navigation

    // Show popup after a brief delay so the new page renders first
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [pathname, user, authLoading, isAdmin]);

  function handleDismiss() {
    setIsOpen(false);
    setDismissedForThisNav(true);
  }

  async function handleGoogleLogin() {
    setIsSigningIn(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(
          lang === "hi"
            ? "Google लॉगिन में समस्या आई, कृपया पुनः प्रयास करें"
            : "Google login failed, please try again"
        );
        setIsSigningIn(false);
      }
    } catch {
      toast.error(
        lang === "hi"
          ? "Google लॉगिन में समस्या आई"
          : "An error occurred during Google sign-in"
      );
      setIsSigningIn(false);
    }
  }

  if (!isOpen || user || isAdmin || dismissedForThisNav) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E8E4DA] text-center animate-in zoom-in-95 duration-300 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Background Radial Glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 size-48 rounded-full bg-gradient-to-b from-[#145A45]/15 to-transparent blur-2xl" />

        {/* Brand Logo */}
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-white shadow-md ring-4 ring-[#E6EFE8] overflow-hidden">
          <img
            src="/agt-favicon.png"
            alt="Arun Gopal Traders"
            className="size-14 object-contain"
          />
        </div>

        {/* Headings */}
        <h2 className="font-sans text-xl sm:text-2xl font-black text-[#16201A] tracking-tight leading-snug">
          {lang === "hi"
            ? "अरुण गोपाल ट्रेडर्स में स्वागत है!"
            : "Welcome to Arun Gopal Traders!"}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#5A655F] leading-relaxed">
          {lang === "hi"
            ? "1-Click Google Login करें और तेज़ डिलीवरी, स्पेशल डिस्काउंट्स व आसान ऑर्डर ट्रैकिंग का लाभ पाएं।"
            : "Sign in with Google in 1-click for instant fast delivery, special discounts & live order tracking."}
        </p>

        {/* Perks / Benefits Pill Strip */}
        <div className="my-5 grid grid-cols-3 gap-2 text-left">
          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA]/60">
            <Truck className="size-4 text-[#145A45] mb-1" />
            <span className="text-[10px] sm:text-[11px] font-bold text-[#16201A] leading-tight">
              {lang === "hi" ? "30-मिनट डिलीवरी" : "30-Min Fast"}
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA]/60">
            <Tag className="size-4 text-[#D97706] mb-1" />
            <span className="text-[10px] sm:text-[11px] font-bold text-[#16201A] leading-tight">
              {lang === "hi" ? "बेस्ट ऑफर्स" : "Best Offers"}
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#FAF8F2] border border-[#E8E4DA]/60">
            <ShieldCheck className="size-4 text-[#15803D] mb-1" />
            <span className="text-[10px] sm:text-[11px] font-bold text-[#16201A] leading-tight">
              {lang === "hi" ? "100% शुद्ध" : "100% Pure"}
            </span>
          </div>
        </div>

        {/* Official Google 1-Click Button */}
        <button
          type="button"
          disabled={isSigningIn}
          onClick={handleGoogleLogin}
          className="group relative flex h-12 sm:h-13 w-full items-center justify-center gap-3 rounded-2xl border border-[#E8E4DA] bg-white px-4 text-sm font-bold text-[#16201A] shadow-md hover:shadow-lg hover:border-[#145A45]/40 hover:bg-[#FAF8F2] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
        >
          {/* Official 4-Color Google SVG */}
          <svg className="size-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>
            {isSigningIn
              ? (lang === "hi" ? "कनेक्ट हो रहा है..." : "Connecting...")
              : (lang === "hi" ? "Google के साथ जारी रखें" : "Continue with Google")}
          </span>
        </button>

        {/* Dismiss / Continue as Guest */}
        <div className="mt-3.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-semibold text-[#5A655F] hover:text-[#16201A] transition-colors cursor-pointer"
          >
            {lang === "hi" ? "बाद में करें (Continue as Guest)" : "Later (Continue as Guest)"}
          </button>
        </div>

        {/* Security & Trust Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-[#8C827A]">
          <Lock className="size-3 text-[#15803D]" />
          <span>{lang === "hi" ? "100% सुरक्षित • आपके डेटा की पूरी सुरक्षा" : "100% Safe & Secure Login"}</span>
        </div>
      </div>
    </div>
  );
}
