import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquarePlus,
  Sparkles,
  MapPin,
  Calendar,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";
import type { Product } from "@/lib/queries";
import {
  productReviewsQuery,
  computeReviewStats,
  submitProductReview,
  type ProductReview,
} from "@/lib/reviews";

interface ProductReviewsSectionProps {
  product: Product;
  localizedName: string;
}

const RATING_LABELS_HI: Record<number, string> = {
  5: "उत्कृष्ट (100% शुद्ध व ताजा)",
  4: "बहुत बढ़िया",
  3: "अच्छा / ठीक",
  2: "औसत",
  1: "असंतोषजनक",
};

const RATING_LABELS_EN: Record<number, string> = {
  5: "Excellent (100% Fresh & Authentic)",
  4: "Very Good",
  3: "Good / Satisfied",
  2: "Average",
  1: "Poor",
};

export function ProductReviewsSection({ product, localizedName }: ProductReviewsSectionProps) {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery(productReviewsQuery(product.id));
  const stats = computeReviewStats(reviews);

  // Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [locality, setLocality] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpfulSet, setHelpfulSet] = useState<Set<string>>(new Set());

  const handleToggleHelpful = (reviewId: string) => {
    setHelpfulSet((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
        toast.success(lang === "hi" ? "धन्यवाद! राय को उपयोगी बताया।" : "Marked as helpful!");
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(lang === "hi" ? "कृपया अपना नाम लिखें" : "Please enter your name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitProductReview({
        productId: product.id,
        name: name.trim(),
        locality: locality.trim() || (lang === "hi" ? "महराजगंज" : "Maharajganj"),
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || (lang === "hi" ? "दर्ज नहीं हो सका, कृपया पुनः प्रयास करें" : "Could not submit review"));
        return;
      }

      toast.success(
        lang === "hi"
          ? "आपकी राय व रेटिंग दर्ज हो गई! बहुत-बहुत धन्यवाद।"
          : "Review submitted successfully! Thank you."
      );
      setIsModalOpen(false);
      setName("");
      setLocality("");
      setTitle("");
      setComment("");
      setRating(5);

      // Invalidate queries so review immediately shows
      await queryClient.invalidateQueries({ queryKey: ["product-reviews", product.id] });
    } catch (err) {
      toast.error("An error occurred while submitting review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reviews-section" className="mt-8 pt-6 border-t border-[#E5E7EB] space-y-4 scroll-mt-24">
      {/* 1. Header with Title & Write Review Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-lg sm:text-xl font-bold text-[#111827]">
              {lang === "hi" ? "ग्राहकों की राय व रेटिंग" : "Customer Ratings & Reviews"}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-[#6B7280]">
            {lang === "hi"
              ? "महराजगंज के स्थानीय परिवारों और ग्राहकों के असली अनुभव"
              : "Genuine verified feedback from local families in Maharajganj"}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#145A45] to-[#0F4A38] hover:from-[#0F4A38] hover:to-[#0A3628] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all gap-1.5 cursor-pointer"
        >
          <MessageSquarePlus className="size-3.5" />
          <span>{lang === "hi" ? "रेटिंग / राय दें" : "Rate & Review"}</span>
        </Button>
      </div>

      {/* 2. Rating Breakdown & Score Card (Compact & Clean) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl border border-[#E5E7EB] bg-white shadow-2xs">
        {/* Left Score Box */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-2 border-b md:border-b-0 md:border-r border-[#E5E7EB]">
          <div className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">
            {stats.count > 0 ? stats.average.toFixed(1) : "—"}
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`size-4 ${
                  stats.count > 0 && s <= Math.round(stats.average)
                    ? "fill-amber-500 text-amber-500"
                    : "fill-stone-200 text-stone-300"
                }`}
              />
            ))}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#6B7280]">
            {stats.count > 0 ? (
              <span>
                {lang === "hi"
                  ? `${stats.count} ग्राहकों द्वारा सत्यापित रेटिंग`
                  : `Based on ${stats.count} verified ratings`}
              </span>
            ) : (
              <span>{lang === "hi" ? "अभी तक किसी ने राय नहीं दी है" : "No reviews yet"}</span>
            )}
          </div>
        </div>

        {/* Right Distribution Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-1.5 px-1 sm:px-3">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = stats.distribution[star];
            const pct = stats.count > 0 ? stats.percentages[star] : 0;

            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-6 font-bold text-[#111827] flex items-center gap-0.5 justify-end text-[11px]">
                  {star} <Star className="size-2.5 fill-amber-500 text-amber-500 inline" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#059669] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[10.5px] font-medium text-[#6B7280]">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Review List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="text-center py-6 text-xs text-[#6B7280]">
            {lang === "hi" ? "ग्राहकों की राय लोड हो रही है..." : "Loading reviews..."}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] space-y-2">
            <Star className="size-6 fill-amber-400 text-amber-400 mx-auto" />
            <h3 className="font-bold text-xs sm:text-sm text-[#111827]">
              {lang === "hi" ? "इस सामान की पहली राय दें!" : "Be the first to review this product!"}
            </h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              {lang === "hi"
                ? "क्या आपने यह सामान खरीदा है? अपनी राय साझा करें और अन्य ग्राहकों की मदद करें।"
                : "Have you purchased this item? Share your thoughts to help other shoppers."}
            </p>
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="h-8 rounded-lg border border-[#065F46] text-[#065F46] hover:bg-emerald-50 text-xs font-bold cursor-pointer mt-1"
            >
              {lang === "hi" ? "अपनी राय दें" : "Write Review"}
            </Button>
          </div>
        ) : (
          reviews.map((rev) => {
            const isHelpful = helpfulSet.has(rev.id);
            const initial = rev.customer_name ? rev.customer_name.charAt(0).toUpperCase() : "A";

            return (
              <div
                key={rev.id}
                className="p-3 sm:p-3.5 rounded-xl border border-[#E5E7EB] bg-white shadow-2xs space-y-2 transition-all hover:border-[#145A45]/30"
              >
                {/* Header: Avatar, Name, Verified Badge & Date */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-[#065F46] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {initial}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-[#111827]">
                          {rev.customer_name}
                        </span>
                        {rev.is_verified && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9.5px] font-bold text-emerald-800 border border-emerald-200/80">
                            <CheckCircle2 className="size-2 text-emerald-600" />
                            <span>{lang === "hi" ? "सत्यापित ग्राहक" : "Verified Buyer"}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10.5px] text-[#6B7280]">
                        {rev.locality && (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="size-2.5" />
                            <span>{rev.locality}</span>
                          </span>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(rev.created_at).toLocaleDateString(
                            lang === "hi" ? "hi-IN" : "en-IN",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Star Rating Badge */}
                  <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg shrink-0">
                    <Star className="size-2.5 fill-amber-500 text-amber-500" />
                    <span className="text-[11px] font-black text-amber-900">{rev.rating}.0</span>
                  </div>
                </div>

                {/* Review Title & Body */}
                {rev.title && (
                  <h4 className="font-bold text-xs text-[#111827]">{rev.title}</h4>
                )}
                {rev.comment && (
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    {rev.comment}
                  </p>
                )}

                {/* Footer: Helpful count button */}
                <div className="pt-0.5 flex items-center justify-between text-xs text-[#9CA3AF]">
                  <button
                    type="button"
                    onClick={() => handleToggleHelpful(rev.id)}
                    className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-lg text-[10.5px] font-medium transition-colors cursor-pointer border ${
                      isHelpful
                        ? "text-[#065F46] bg-[#ECFDF5] font-bold border-emerald-200"
                        : "border-[#E5E7EB] hover:text-[#111827] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <ThumbsUp className={`size-3 ${isHelpful ? "fill-[#065F46]" : ""}`} />
                    <span>
                      {lang === "hi" ? "मददगार लगा" : "Helpful"} {isHelpful ? "(1)" : ""}
                    </span>
                  </button>
                  <span className="text-[9.5px] text-[#9CA3AF]">अरुण गोपाल ट्रेडर्स प्रमाणित</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. "Write a Review" Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-5 rounded-2xl border border-[#E5E7EB] shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-sans text-base sm:text-lg font-bold text-[#111827]">
              {lang === "hi" ? "रेटिंग व अपनी राय दें" : "Write a Review"}
            </DialogTitle>
            <p className="text-xs text-[#6B7280] mt-0.5">{localizedName}</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 mt-1">
            {/* Star Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#374151] block">
                {lang === "hi" ? "रेटिंग चुनें (स्टार दें)" : "Your Rating"}
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => {
                  const active = (hoverRating || rating) >= s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                      aria-label={`${s} star`}
                    >
                      <Star
                        className={`size-6 sm:size-7 ${
                          active
                            ? "fill-amber-500 text-amber-500"
                            : "fill-stone-200 text-stone-300"
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="ml-1.5 text-xs font-bold text-[#065F46]">
                  {lang === "hi"
                    ? RATING_LABELS_HI[hoverRating || rating]
                    : RATING_LABELS_EN[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Customer Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#374151] block">
                {lang === "hi" ? "आपका नाम *" : "Your Name *"}
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === "hi" ? "उदा. रमेश कुमार" : "e.g. Ramesh Kumar"}
                className="h-9 text-xs rounded-lg border-[#E5E7EB] focus-visible:border-[#065F46]"
              />
            </div>

            {/* Locality / Area */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#374151] block">
                {lang === "hi" ? "इलाका / मोहल्ला (ऐच्छिक)" : "Locality (Optional)"}
              </label>
              <Input
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder={
                  lang === "hi" ? "उदा. रामनगर चौराहा, महराजगंज" : "e.g. Ramnagar, Maharajganj"
                }
                className="h-9 text-xs rounded-lg border-[#E5E7EB] focus-visible:border-[#065F46]"
              />
            </div>

            {/* Review Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#374151] block">
                {lang === "hi" ? "एक लाइन में बताएं (Title)" : "Review Title"}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  lang === "hi"
                    ? "उदा. बहुत शुद्ध और अच्छा सामान"
                    : "e.g. Fresh quality and great packaging"
                }
                className="h-9 text-xs rounded-lg border-[#E5E7EB] focus-visible:border-[#065F46]"
              />
            </div>

            {/* Review Comment */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#374151] block">
                {lang === "hi" ? "कैसा लगा यह सामान? (गुणवत्ता, स्वाद आदि)" : "Your Experience"}
              </label>
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  lang === "hi"
                    ? "सामान की गुणवत्ता, पैकिंग और अनुभव के बारे में लिखें..."
                    : "Write about product quality, freshness or packaging..."
                }
                className="text-xs rounded-lg border-[#E5E7EB] focus-visible:border-[#065F46]"
              />
            </div>

            <div className="pt-1 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-8.5 rounded-lg border border-[#E5E7EB] text-xs font-medium hover:bg-[#F9FAFB] cursor-pointer"
              >
                {lang === "hi" ? "रद्द करें" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-8.5 rounded-lg bg-[#145A45] hover:bg-[#0F4A38] text-white text-xs font-bold gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                {isSubmitting && <Loader2 className="size-3 animate-spin" />}
                <span>{lang === "hi" ? "अपनी राय सबमिट करें" : "Submit Review"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
