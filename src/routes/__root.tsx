import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { lazy, Suspense, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { FloatingCartBar } from "@/components/cart/FloatingCartBar";
import { Toaster } from "@/components/ui/sonner";
import { useRealtimeSync } from "@/lib/realtime-sync";
import { settingsQuery } from "@/lib/queries";
import { SITE_URL } from "@/lib/site-config";
import {
  getStoreSchema,
  getWebsiteSchema,
  getOrganizationSchema,
  LOCAL_GEO_META,
  PUBLIC_ROBOTS_META,
} from "@/lib/seo";

// Lazy-loaded modal to minimize initial bundle size and boost TTI
const GoogleAuthPromptModal = lazy(() =>
  import("@/components/GoogleAuthPromptModal").then((m) => ({ default: m.GoogleAuthPromptModal })),
);


function NotFoundComponent() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-[#FAF8F5] px-4 py-12">
      <div className="max-w-md rounded-3xl border border-[rgba(20,90,69,0.12)] bg-white p-8 text-center shadow-xs">
        <h1 className="font-display text-7xl font-black text-[#145A45]">404</h1>
        <h2 className="mt-3 text-xl font-bold text-[#16201A]">
          यह पेज उपलब्ध नहीं है • Page Not Found
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#546059]">
          क्षमा करें, आप जिस पेज को खोज रहे हैं वह हटा दिया गया है या लिंक गलत है।
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/shop"
            className="inline-flex items-center justify-center rounded-2xl border border-[#145A45]/25 bg-[#FAF8F2] px-5 py-2.5 text-xs font-bold text-[#145A45] hover:bg-[#E8F1EC] transition-all"
          >
            सभी सामान देखें
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] px-6 py-2.5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 transition-all"
          >
            मुख्य पृष्ठ (Home) पर जाएं
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error("Application root error boundary caught error:", error);

  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-[#FAF8F5] px-4 py-12">
      <div className="max-w-md rounded-3xl border border-[rgba(20,90,69,0.12)] bg-white p-8 text-center shadow-xs">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#16201A]">
          कुछ तकनीकी समस्या आई • Something went wrong
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#546059]">
          पेज लोड करने में समस्या हुई। कृपया दोबारा प्रयास करें या मुख्य स्टोर पर वापस जाएं।
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-xl border border-[#D5E0D5] bg-white px-4 py-2 text-xs font-bold text-[#16201A] shadow-xs hover:bg-[#F4F7F4] active:scale-95 transition-all cursor-pointer"
          >
            पुनः प्रयास करें (Try again)
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-[#145A45] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#104E3C] active:scale-95 transition-all"
          >
            स्टोर पर वापस जाएं
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  loader: async ({ context }) => {
    const settings = await context.queryClient.ensureQueryData(settingsQuery);
    return { settings };
  },
  head: ({ loaderData }) => {
    const s = loaderData?.settings;
    return {
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...PUBLIC_ROBOTS_META,
      ...LOCAL_GEO_META,
      {
        title: "अरुण गोपाल ट्रेडर्स — किराना एवं जनरल स्टोर | महाराजगंज",
      },
      {
        name: "description",
        content:
          "अरुण गोपाल ट्रेडर्स — हर दिन की जरूरत, अब आसान खरीदारी के साथ! आटा, चावल, दाल, तेल, मसाले और रोज़मर्रा का 100% शुद्ध सामान। रामनगर चौराहा, अड्डा बाजार रोड",
      },
      {
        property: "og:site_name",
        content: "अरुण गोपाल ट्रेडर्स — Arun Gopal Traders",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: SITE_URL,
      },
      {
        property: "og:title",
        content: "अरुण गोपाल ट्रेडर्स — किराना एवं जनरल स्टोर | महाराजगंज",
      },
      {
        property: "og:description",
        content:
          "हर दिन की जरूरत, अब आसान खरीदारी के साथ! ऑनलाइन सामान देखें, शुद्ध राशन व घरेलू उत्पाद ऑर्डर करें। रामनगर चौराहा, अड्डा बाजार रोड",
      },
      {
        property: "og:image",
        content: "https://rvpskkgrobztgcfznawl.supabase.co/storage/v1/object/public/product-images/og/agt-og-banner.jpg",
      },
      {
        property: "og:image:secure_url",
        content: "https://rvpskkgrobztgcfznawl.supabase.co/storage/v1/object/public/product-images/og/agt-og-banner.jpg",
      },
      {
        property: "og:image:type",
        content: "image/jpeg",
      },
      {
        property: "og:image:width",
        content: "1200",
      },
      {
        property: "og:image:height",
        content: "630",
      },
      {
        property: "og:image:alt",
        content: "अरुण गोपाल ट्रेडर्स — किराना एवं जनरल स्टोर, महाराजगंज",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:url",
        content: SITE_URL,
      },
      {
        name: "twitter:title",
        content: "अरुण गोपाल ट्रेडर्स — किराना एवं जनरल स्टोर | महाराजगंज",
      },
      {
        name: "twitter:description",
        content:
          "हर दिन की जरूरत, अब आसान खरीदारी के साथ! ऑनलाइन सामान देखें, शुद्ध राशन व घरेलू उत्पाद ऑर्डर करें। रामनगर चौराहा, अड्डा बाजार रोड",
      },
      {
        name: "twitter:image",
        content: "https://rvpskkgrobztgcfznawl.supabase.co/storage/v1/object/public/product-images/og/agt-og-banner.jpg",
      },
      {
        name: "theme-color",
        content: "#145A45",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: SITE_URL,
      },
      {
        rel: "alternate",
        hrefLang: "hi",
        href: SITE_URL,
      },
      {
        rel: "alternate",
        hrefLang: "en",
        href: SITE_URL,
      },
      {
        rel: "alternate",
        hrefLang: "x-default",
        href: SITE_URL,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/agt-favicon.svg",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon.png",
      },
      {
        rel: "alternate icon",
        href: "/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Poppins:wght@500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            getStoreSchema(s),
            getWebsiteSchema(),
            getOrganizationSchema(),
          ],
        }),
      },
    ],
  };
},
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  component: RootComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="hi">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const loaderData = Route.useLoaderData();
  if (loaderData?.settings && !queryClient.getQueryData(settingsQuery.queryKey)) {
    queryClient.setQueryData(settingsQuery.queryKey, loaderData.settings);
  }
  const isAdminRoute = useRouterState({ select: (s) => s.location.pathname.startsWith("/admin") });

  // Centralized real-time synchronization across all tabs and database updates
  useRealtimeSync(queryClient, { isAdmin: isAdminRoute, router });


  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <SmoothScrollProvider>
                  <div
                    className={
                      isAdminRoute
                        ? "min-h-screen flex flex-col bg-[#F8FAF9]"
                        : "flex min-h-screen flex-col"
                    }
                  >
                    {!isAdminRoute && <Header />}
                    <main className="flex-1">
                      <Outlet />
                    </main>
                    {!isAdminRoute && <Footer />}
                    {!isAdminRoute && <FloatingCartBar />}
                    {!isAdminRoute && <MobileNav />}
                  </div>
                  <Toaster position="top-center" duration={3500} richColors />
                  <Suspense fallback={null}>
                    <GoogleAuthPromptModal />
                  </Suspense>
                </SmoothScrollProvider>
              </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

