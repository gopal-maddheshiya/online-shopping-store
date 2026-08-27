import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { getProductImage } from "@/lib/product-images";
import { toast } from "sonner";
import { cheapestVariant } from "@/lib/queries";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist — Arun Gopal Traders" },
      {
        name: "description",
        content:
          "View your saved grocery favorites and add them to your basket at Arun Gopal Traders.",
      },
      { property: "og:title", content: "My Wishlist — Arun Gopal Traders" },
      {
        property: "og:description",
        content: "Review items, quantities and totals before placing your order.",
      },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { items, clear } = useWishlist();
  const { add } = useCart();
  const { lang, t, getProductName, getVariantLabel } = useLanguage();

  function handleMoveAllToCart() {
    if (items.length === 0) return;
    let addedCount = 0;
    items.forEach((p) => {
      const v = cheapestVariant(p);
      if (v && v.stock > 0) {
        add({
          variantId: v.id,
          productId: p.id,
          slug: p.slug,
          name: getProductName(p.name, p.slug),
          variantLabel: getVariantLabel(v.label),
          price: Number(v.price),
          mrp: Number(v.mrp),
          imageUrl: getProductImage(p),
          stock: v.stock,
        });
        addedCount++;
      }
    });
    toast.success(
      lang === "hi"
        ? `सभी ${addedCount} सामान कार्ट में जोड़े गए!`
        : `Moved ${addedCount} items to your shopping cart!`,
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-red-50 text-red-600">
          <Heart className="size-10" />
        </div>
        <h1 className="mt-4 font-sans text-2xl font-bold tracking-tight text-[#191C1B] sm:text-3xl">
          {lang === "hi" ? "आपकी पसंदीदा सूची खाली है" : "Your Wishlist is Empty"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-[#676D68]">
          {lang === "hi"
            ? "सामानों पर दिल (Heart) के आइकन पर क्लिक करके अपने पसंदीदा सामान यहां सहेजें।"
            : "Save your favorite groceries, spices, and daily essentials by clicking the heart icon on any product."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            className="rounded-full bg-[#18483B] px-8 text-xs font-bold text-white shadow-xs"
          >
            <Link to="/shop">
              {lang === "hi" ? "किराना सामान देखें →" : "Browse Store Catalogue →"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#191C1B]">
            {lang === "hi" ? "मेरी पसंदीदा सूची" : "My Wishlist"}
          </h1>
          <p className="mt-1 text-xs text-[#676D68]">
            {items.length} {lang === "hi" ? "सहेजे गए सामान" : "saved items"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleMoveAllToCart}
            className="rounded-full bg-[#18483B] gap-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#133A2F]"
          >
            <ShoppingBag className="size-4" />{" "}
            {lang === "hi" ? "सभी को कार्ट में जोड़ें" : "Move All to Cart"}
          </Button>
          <Button
            onClick={clear}
            variant="outline"
            size="icon"
            className="rounded-full border-[#EAE6DF]"
            aria-label="Clear wishlist"
          >
            <Trash2 className="size-4 text-[#676D68] hover:text-red-600" />
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
