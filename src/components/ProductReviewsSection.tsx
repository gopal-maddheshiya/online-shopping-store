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
        toast.success(lang === "hi" ? "समीक्षा को उपयोगी बताया!" : "Marked as helpful!");
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
        toast.error(res.error || "समीक्षा सबमिट नहीं हो सकी");
        return;
      }

      toast.success(
        lang === "hi"
          ? "आपकी समीक्षा सफलतापूर्वक दर्ज हो गई! धन्यवाद।"
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
    <section id="reviews-section" className="mt-12 pt-8 border-t border-[#E4DFD5] space-y-6 scroll-mt-24">
      {/* 1. Header with Title & Write Review Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#E6EFE8] text-[#145A45] border border-[#145A45]/20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <Sparkles className="size-4" />
            </span>
            <h2 className="font-sans text-xl sm:text-2xl font-black text-[#16201A]">
              {lang === "hi" ? "ग्राहकों की राय और रेटिंग" : "Customer Ratings & Reviews"}
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#5A655F]">
            {lang === "hi"
              ? "महराजगंज के स्थानीय परिवारों और नियमित ग्राहकों के असली अनुभव"
              : "Genuine verified feedback from local families and buyers in Maharajganj"}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] text-white text-xs font-bold shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-95 transition-all gap-2 cursor-pointer"
        >
          <MessageSquarePlus className="size-4" />
          <span>{lang === "hi" ? "समीक्षा लिखें" : "Write a Review"}</span>
        </Button>
      </div>

      {/* 2. Rating Breakdown & Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 sm:p-6 rounded-3xl border border-[#E4DFD5] bg-gradient-to-b from-[#FAF8F2] to-[#F5F2EA] shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)]">
        {/* Left Score Box */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-[#E4DFD5]">
          <div className="text-4xl sm:text-5xl font-black text-[#16201A] tracking-tight">
            {stats.count > 0 ? stats.average.toFixed(1) : "—"}
          </div>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`size-4.5 ${
                  stats.count > 0 && s <= Math.round(stats.average)
                    ? "fill-amber-500 text-amber-500"
                    : "fill-stone-200 text-stone-300"
                }`}
              />
            ))}
          </div>
          <div className="mt-2 text-xs font-semibold text-[#5A655F]">
            {stats.count > 0 ? (
              <span>
                {lang === "hi"
                  ? `${stats.count} ग्राहकों द्वारा सत्यापित`
                  : `Based on ${stats.count} verified ratings`}
              </span>
            ) : (
              <span>{lang === "hi" ? "अभी तक कोई समीक्षा नहीं" : "No reviews yet"}</span>
            )}
          </div>
        </div>

        {/* Right Distribution Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2 px-1 sm:px-4">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = stats.distribution[star];
            const pct = stats.count > 0 ? stats.percentages[star] : 0;

            return (
              <div key={star} className="flex items-center gap-2.5 text-xs">
                <span className="w-7 font-bold text-[#16201A] flex items-center gap-0.5 justify-end">
                  {star} <Star className="size-3 fill-amber-500 text-amber-500 inline" />
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-[#E4DFD5]/80 overflow-hidden shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#145A45] to-[#1B7A5D] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[11px] font-medium text-[#5A655F]">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Review List */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-[#5A655F]">
            {lang === "hi" ? "समीक्षाएं लोड हो रही हैं..." : "Loading reviews..."}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-3xl border border-dashed border-[#E4DFD5] bg-white space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="size-12 rounded-2xl bg-[#E6EFE8] text-[#145A45] flex items-center justify-center mx-auto border border-[#145A45]/20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <Star className="size-6 fill-[#145A45]" />
            </div>
            <h3 className="font-bold text-sm text-[#16201A]">
              {lang === "hi" ? "इस सामान की पहली समीक्षा लिखें!" : "Be the first to review this product!"}
            </h3>
            <p className="text-xs text-[#5A655F] max-w-sm mx-auto">
              {lang === "hi"
                ? "क्या आपने यह सामान खरीदा है? अपनी राय साझा करें और महराजगंज के अन्य ग्राहकों की मदद करें।"
                : "Have you purchased this item? Share your thoughts to help other shoppers in Maharajganj."}
            </p>
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="rounded-xl border border-[#145A45] text-[#145A45] hover:bg-[#E6EFE8] text-xs font-bold shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
            >
              {lang === "hi" ? "समीक्षा दर्ज करें" : "Write Review"}
            </Button>
          </div>
        ) : (
          reviews.map((rev) => {
            const isHelpful = helpfulSet.has(rev.id);
            const initial = rev.customer_name ? rev.customer_name.charAt(0).toUpperCase() : "A";

            return (
              <div
                key={rev.id}
                className="p-4 sm:p-5 rounded-3xl border border-[#E4DFD5] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)] space-y-2.5 transition-all hover:border-[#145A45]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
              >
                {/* Header: Avatar, Name, Verified Badge & Date */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-2xl bg-gradient-to-br from-[#145A45] via-[#104E3C] to-[#0A3628] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-[0_2px_4px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]">
                      {initial}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-[#16201A]">
                          {rev.customer_name}
                        </span>
                        {rev.is_verified && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/80 shadow-[0_1px_1px_rgba(0,0,0,0.02)]">
                            <CheckCircle2 className="size-2.5 text-emerald-600" />
                            <span>{lang === "hi" ? "सत्यापित खरीदार" : "Verified Buyer"}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#8C827A] mt-0.5">
                        {rev.locality && (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="size-2.5" />
                            <span>{rev.locality}</span>
                          </span>
                        )}
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Calendar className="size-2.5" />
                          <span>
                            {new Date(rev.created_at).toLocaleDateString(
                              lang === "hi" ? "hi-IN" : "en-IN",
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Star Rating Badge */}
                  <div className="flex items-center gap-0.5 bg-amber-50/80 border border-amber-200/80 px-2.5 py-0.5 rounded-xl shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <Star className="size-3 fill-amber-500 text-amber-500" />
                    <span className="text-xs font-black text-amber-900">{rev.rating}.0</span>
                  </div>
                </div>

                {/* Review Title & Body */}
                {rev.title && (
                  <h4 className="font-bold text-xs sm:text-sm text-[#16201A]">{rev.title}</h4>
                )}
                {rev.comment && (
                  <p className="text-xs sm:text-[13px] text-[#3A453F] leading-relaxed">
                    {rev.comment}
                  </p>
                )}

                {/* Footer: Helpful count button */}
                <div className="pt-1 flex items-center justify-between text-xs text-[#8C827A]">
                  <button
                    type="button"
                    onClick={() => handleToggleHelpful(rev.id)}
                    className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer border ${
                      isHelpful
                        ? "text-[#145A45] bg-[#E6EFE8] font-bold border-[#145A45]/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        : "border-transparent hover:text-[#16201A] hover:bg-[#FAF8F2] hover:border-[#E4DFD5]"
                    }`}
                  >
                    <ThumbsUp className={`size-3.5 ${isHelpful ? "fill-[#145A45]" : ""}`} />
                    <span>
                      {lang === "hi" ? "उपयोगी लगा" : "Helpful"} {isHelpful ? "(1)" : ""}
                    </span>
                  </button>
                  <span className="text-[10px] text-[#8C827A]">अरुण गोपाल ट्रेडर्स प्रमाणित</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. "Write a Review" Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl border border-[#E4DFD5] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <DialogHeader>
            <DialogTitle className="font-sans text-lg sm:text-xl font-black text-[#16201A]">
              {lang === "hi" ? "सामान की समीक्षा लिखें" : "Write a Review"}
            </DialogTitle>
            <p className="text-xs text-[#5A655F] mt-1">{localizedName}</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Star Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#16201A] block">
                {lang === "hi" ? "आपकी रेटिंग (स्टार चुनें)" : "Your Rating"}
              </label>
              <div className="flex items-center gap-2">
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
                        className={`size-7 sm:size-8 ${
                          active
                            ? "fill-amber-500 text-amber-500"
                            : "fill-stone-200 text-stone-300"
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="ml-2 text-xs font-bold text-[#145A45]">
                  {lang === "hi"
                    ? RATING_LABELS_HI[hoverRating || rating]
                    : RATING_LABELS_EN[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Customer Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#16201A] block">
                {lang === "hi" ? "आपका नाम *" : "Your Name *"}
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === "hi" ? "उदा. रमेश गुप्ता" : "e.g. Ramesh Gupta"}
                className="h-10 text-xs rounded-xl border-[#E4DFD5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus-visible:border-[#145A45]"
              />
            </div>

            {/* Locality / Area */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#16201A] block">
                {lang === "hi" ? "मोहल्ला / कस्बा (ऐच्छिक)" : "Locality / Town (Optional)"}
              </label>
              <Input
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder={
                  lang === "hi" ? "उदा. रामनगर, अड्डा बाजार रोड" : "e.g. Ramnagar, Adda Bazar"
                }
                className="h-10 text-xs rounded-xl border-[#E4DFD5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus-visible:border-[#145A45]"
              />
            </div>

            {/* Review Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#16201A] block">
                {lang === "hi" ? "शीर्षक (Title)" : "Review Title"}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  lang === "hi"
                    ? "उदा. बहुत शुद्ध और ताजा सामान"
                    : "e.g. Fresh quality and great packaging"
                }
                className="h-10 text-xs rounded-xl border-[#E4DFD5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus-visible:border-[#145A45]"
              />
            </div>

            {/* Review Comment */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#16201A] block">
                {lang === "hi" ? "आपकी विस्तृत राय" : "Detailed Review"}
              </label>
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  lang === "hi"
                    ? "सामान की गुणवत्ता, पैकिंग और डिलीवरी के बारे में अपने अनुभव लिखें..."
                    : "Write about product quality, taste, freshness or delivery speed..."
                }
                className="text-xs rounded-xl border-[#E4DFD5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus-visible:border-[#145A45]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-[#E4DFD5] text-xs font-medium hover:bg-[#FAF8F2] cursor-pointer"
              >
                {lang === "hi" ? "रद्द करें" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-gradient-to-r from-[#145A45] via-[#104E3C] to-[#0A3628] hover:from-[#0F4A38] hover:to-[#07271D] text-white text-xs font-bold shadow-[0_2px_8px_rgba(20,90,69,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] gap-2 cursor-pointer active:scale-95 transition-all"
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                <span>{lang === "hi" ? "समीक्षा सबमिट करें" : "Submit Review"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
