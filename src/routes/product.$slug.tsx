import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  Store,
  Check,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { getProductImage } from "@/lib/product-images";
import { productQuery, productsQuery, type Variant } from "@/lib/queries";
import { discountPercent, inr } from "@/lib/format";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Arun Gopal Traders` },
      {
        name: "description",
        content:
          "Product details, pack sizes, live price and stock at Arun Gopal Traders, Maharajganj.",
      },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — Arun Gopal Traders` },
      {
        property: "og:description",
        content: "Order this item for home delivery or store pickup in Maharajganj.",
      },
    ],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-sans text-2xl font-bold text-[#191C1B]">Product not found</h1>
      <p className="mt-1 text-xs text-[#676D68]">
        The requested item is no longer available in the catalogue.
      </p>
      <Button asChild className="mt-6 rounded-full bg-[#18483B] text-white">
        <Link to="/shop">Back to Shop Catalogue</Link>
      </Button>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { data: all } = useQuery(productsQuery());
  const { add } = useCart();
  const { lang, t, getProductName, getVariantLabel } = useLanguage();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <div className="container-page grid gap-8 py-10 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) throw notFound();

  const localizedName = getProductName(product.name, product.slug);

  const variants: Variant[] = (product.product_variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const off = variant ? discountPercent(Number(variant.mrp), Number(variant.price)) : 0;

  const related = (all ?? [])
    .filter((p) => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container-page py-6 sm:py-10 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-[#676D68]">
        <Link to="/" className="hover:text-[#18483B]">
          {t.home}
        </Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-[#18483B]">
          {t.allGroceries}
        </Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-[#191C1B]">{localizedName}</span>
      </nav>

      {/* Main Details Grid */}
      <div className="grid gap-8 md:grid-cols-2 items-start">
        {/* Left Image Gallery Container */}
        <div className="card-base relative flex aspect-square w-full max-w-[460px] mx-auto items-center justify-center overflow-hidden rounded-2xl bg-white border border-[#EFECE6] p-6 sm:p-10 shadow-xs">
          <img
            src={getProductImage(product)}
            alt={localizedName}
            className="size-full max-h-[380px] object-contain object-center transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Right Buy Box Content */}
        <div className="card-base p-6 sm:p-8 space-y-6">
          <div>
            {product.brand ? (
              <span className="text-xs font-bold uppercase tracking-wider text-[#676D68]">
                {product.brand}
              </span>
            ) : null}
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#191C1B] mt-1">
              {localizedName}
            </h1>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3 border-y border-[#EAE6DF] py-4">
            <span className="text-3xl font-extrabold text-[#191C1B]">
              {inr(variant?.price ?? 0)}
            </span>
            {off > 0 && variant?.mrp ? (
              <>
                <span className="text-base text-[#676D68] line-through">{inr(variant.mrp)}</span>
                <span className="rounded-full bg-[#EBF4F0] px-2.5 py-0.5 text-xs font-bold text-[#18483B]">
                  {off}% {t.off}
                </span>
              </>
            ) : null}
          </div>

          {/* Pack Size Selector */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#676D68]">
              {lang === "hi" ? "पैकेट साइज चुनें" : "Select Pack Size"}
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  disabled={v.stock <= 0}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all disabled:opacity-40 ${
                    v.id === variant?.id
                      ? "border-[#18483B] bg-[#18483B] text-white"
                      : "border-[#EAE6DF] bg-white text-[#191C1B] hover:border-[#18483B]"
                  }`}
                >
                  {getVariantLabel(v.label)} · {inr(v.price)}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Status Indicator */}
          <div className="text-xs">
            {variant && variant.stock > 0 ? (
              variant.stock <= variant.low_stock_threshold ? (
                <span className="font-semibold text-amber-700">
                  {lang === "hi"
                    ? `केवल ${variant.stock} पैकेट शेष`
                    : `Only ${variant.stock} left in stock`}
                </span>
              ) : (
                <span className="font-semibold text-[#18483B] flex items-center gap-1">
                  <Check className="size-3.5" />
                  {lang === "hi"
                    ? "महाराजगंज में डिलीवरी हेतु उपलब्ध"
                    : "In Stock for Maharajganj Delivery"}
                </span>
              )
            ) : (
              <span className="font-semibold text-red-600">{t.outOfStock}</span>
            )}
          </div>

          {/* Quantity Stepper, Add to Cart & Buy Now Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 items-center rounded-full border border-[#EAE6DF] bg-[#FAF8F5] px-2 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease"
                  className="flex size-8 items-center justify-center rounded-full text-[#676D68] hover:bg-white active:scale-95 transition-all"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-[#191C1B]">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase"
                  disabled={qty >= (variant?.stock ?? 1)}
                  onClick={() => setQty((q) => q + 1)}
                  className="flex size-8 items-center justify-center rounded-full text-[#676D68] hover:bg-white active:scale-95 transition-all disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <Button
                disabled={!variant || variant.stock <= 0}
                onClick={() => {
                  if (!variant) return;
                  for (let i = 0; i < qty; i++) {
                    add({
                      variantId: variant.id,
                      productId: product.id,
                      slug: product.slug,
                      name: localizedName,
                      variantLabel: getVariantLabel(variant.label),
                      price: Number(variant.price),
                      mrp: Number(variant.mrp),
                      imageUrl: getProductImage(product),
                      stock: variant.stock,
                    });
                  }
                  toast.success(`${qty}x ${localizedName} ${t.added.toLowerCase()}`);
                }}
                className="flex-1 h-11 rounded-full bg-[#18483B] px-6 text-xs font-bold text-white shadow-xs hover:bg-[#133A2F] active:scale-95 transition-all"
              >
                <ShoppingBag className="mr-2 size-4" /> {t.add}
              </Button>
            </div>

            {/* WhatsApp Quick Order & Direct Call Action */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://wa.me/919621617360?text=${encodeURIComponent(
                  `Namaste Arun Gopal Traders, I want to order ${qty}x ${localizedName} (${getVariantLabel(variant?.label ?? "")}) for home delivery in Maharajganj.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#20ba59] active:scale-95 transition-all"
              >
                <span>{lang === "hi" ? "व्हाट्सएप ऑर्डर" : "WhatsApp Order"}</span>
              </a>

              <a
                href="tel:+919621617360"
                className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#EAE6DF] bg-[#FAF8F5] px-4 text-xs font-bold text-[#18483B] hover:bg-[#EBF4F0] hover:border-[#18483B] active:scale-95 transition-all"
              >
                <span>{lang === "hi" ? "फोन पर पूछें" : "Call Store"}</span>
              </a>
            </div>
          </div>

          {/* Product Description & Quality Features */}
          <div className="border-t border-[#EAE6DF] pt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#191C1B]">
              {lang === "hi" ? "उत्पाद विवरण व शुद्धता" : "Product Details & Purity"}
            </h3>
            <p className="text-xs leading-relaxed text-[#676D68]">
              {product.description ||
                (lang === "hi"
                  ? "महाराजगंज के विश्वसनीय किराना स्टोर 'अरुण गोपाल ट्रेडर्स' द्वारा 100% शुद्ध, असली और स्वच्छ पैकिंग में उपलब्ध।"
                  : "100% authentic, hygienically packed, and carefully sourced by Arun Gopal Traders for doorstep delivery in Maharajganj.")}
            </p>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 border-t border-[#EAE6DF] pt-5 text-xs text-[#676D68]">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-[#18483B]" />
              <span>{t.freeDeliveryTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <Store className="size-4 text-[#18483B]" />
              <span>{t.storePickupTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#18483B]" />
              <span>{t.genuineBrandsTitle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Items Section */}
      {related.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[#EAE6DF]">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-xl font-bold text-[#191C1B]">
              {lang === "hi" ? "मिलते-जुलते किराना सामान" : "Similar Essentials"}
            </h2>
            <Link to="/shop" className="text-xs font-semibold text-[#18483B] hover:underline">
              {t.viewAll} →
            </Link>
          </div>
          <div className="grocery-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
