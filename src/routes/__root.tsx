import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-[#145A45]">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-[#145A45] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0E4333] shadow-sm"
          >
            Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Application root error boundary caught error:", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Unable to load this section. Please try again or return to homepage.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-[#145A45] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0E4333]"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Go to home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Arun Gopal Traders | Online Grocery Store",
      },
      {
        name: "description",
        content:
          "Arun Gopal Traders — your trusted local grocery store in Ramnagar, Adda Bazar Road, Maharajganj. Shop groceries online or order by phone.",
      },
      {
        property: "og:site_name",
        content: "Arun Gopal Traders",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:title",
        content: "Arun Gopal Traders | Online Grocery Store",
      },
      {
        property: "og:description",
        content:
          "Arun Gopal Traders — your trusted local grocery store in Ramnagar, Adda Bazar Road, Maharajganj. Shop groceries online or order by phone.",
      },
      {
        property: "og:image",
        content: "/agt-og-image.png",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "Arun Gopal Traders | Online Grocery Store",
      },
      {
        name: "twitter:description",
        content:
          "Arun Gopal Traders — your trusted local grocery store in Ramnagar, Adda Bazar Road, Maharajganj. Shop groceries online or order by phone.",
      },
      {
        name: "theme-color",
        content: "#145A45",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/agt-favicon.svg",
      },
      {
        rel: "alternate icon",
        href: "/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        href: "/agt-icon.png",
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
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  component: RootComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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
  const { queryClient } = Route.useRouteContext();
  const routerState = useRouterState();
  const isAdminRoute = routerState.location.pathname.startsWith("/admin");

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <div
                  className={
                    isAdminRoute
                      ? "min-h-screen flex flex-col bg-[#FAF8F2]"
                      : "flex min-h-screen flex-col pb-16 lg:pb-0"
                  }
                >
                  {!isAdminRoute && <Header />}
                  <main className="flex-1">
                    <Outlet />
                  </main>
                  {!isAdminRoute && <Footer />}
                  {!isAdminRoute && <MobileNav />}
                </div>
                <Toaster position="top-center" richColors />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}
