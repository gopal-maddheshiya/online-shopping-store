import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n";
import type { Product } from "@/lib/queries";

interface AdminReviewItem {
  id: string;
  product_id: string;
  customer_name: string;
  customer_phone?: string | null;
  locality?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  product?: {
    id: string;
    name: string;
    name_hi?: string | null;
    slug: string;
    image_url?: string | null;
  } | null;
}

interface AdminReviewsProps {
  products: Product[];
}

export function AdminReviews({ products }: AdminReviewsProps) {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "hidden">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Map product dictionary by ID for quick lookup
  const productMap = new Map<string, Product>();
  for (const p of products) {
    productMap.set(p.id, p);
  }

  const {
    data: reviews = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-all-reviews"],
    queryFn: async (): Promise<AdminReviewItem[]> => {
      try {
        const { data, error } = await (supabase as any)
          .from("product_reviews")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Error fetching admin reviews:", error.message);
          return [];
        }

        return (data || []).map((r: any) => ({
          ...r,
          product: productMap.get(r.product_id) || null,
        }));
      } catch (e) {
        console.warn("Exception in admin reviews:", e);
        return [];
      }
    },
  });

  // Toggle approval status
  async function handleToggleApproval(review: AdminReviewItem) {
    const nextStatus = !review.is_approved;
    try {
      const { error } = await (supabase as any)
        .from("product_reviews")
        .update({ is_approved: nextStatus })
        .eq("id", review.id);

      if (error) throw error;

      toast.success(
        nextStatus
          ? "समीक्षा स्वीकृत कर दी गई है (Review Approved)"
          : "समीक्षा छिपा दी गई है (Review Hidden)"
      );

      await queryClient.invalidateQueries({ queryKey: ["admin-all-reviews"] });
      await queryClient.invalidateQueries({ queryKey: ["product-reviews", review.product_id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update review status");
    }
  }

  // Delete review
  async function handleDeleteReview(reviewId: string, productId: string) {
    if (!window.confirm("क्या आप वाकई इस समीक्षा को हटाना चाहते हैं? (Delete this review?)")) {
      return;
    }

    setDeletingId(reviewId);
    try {
      const { error } = await (supabase as any)
        .from("product_reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast.success("समीक्षा हटा दी गई (Review deleted)");
      await queryClient.invalidateQueries({ queryKey: ["admin-all-reviews"] });
      await queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  }

  // Filtered reviews
  const filtered = reviews.filter((r) => {
    if (filterStatus === "approved" && !r.is_approved) return false;
    if (filterStatus === "hidden" && r.is_approved) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const cName = (r.customer_name || "").toLowerCase();
    const loc = (r.locality || "").toLowerCase();
    const pName = (r.product?.name || "").toLowerCase();
    const comment = (r.comment || "").toLowerCase();
    return cName.includes(term) || loc.includes(term) || pName.includes(term) || comment.includes(term);
  });

  const totalReviews = reviews.length;
  const approvedCount = reviews.filter((r) => r.is_approved).length;
  const hiddenCount = reviews.filter((r) => !r.is_approved).length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(1)
      : "—";

  return (
    <div className="space-y-6">
      {/* Header with Title and Refresh Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-xl sm:text-2xl font-black text-[#16201A]">
            Customer Reviews Management (ग्राहक समीक्षाएं)
          </h2>
          <p className="text-xs text-[#5A655F] mt-1">
            ग्राहकों द्वारा दी गई समीक्षाओं को देखें, स्वीकृत करें या छिपाएं
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          variant="outline"
          className="rounded-xl border-[#EAE6DC] text-xs font-bold text-[#145A45] hover:bg-[#FAF8F2] gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh Reviews</span>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-[#EAE6DC] bg-white shadow-2xs">
          <p className="text-[11px] font-bold text-[#5A655F] uppercase">कुल समीक्षाएं (Total)</p>
          <p className="text-2xl font-black text-[#16201A] mt-1">{totalReviews}</p>
        </div>

        <div className="p-4 rounded-2xl border border-[#EAE6DC] bg-white shadow-2xs">
          <p className="text-[11px] font-bold text-[#5A655F] uppercase">औसत रेटिंग (Average)</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-black text-[#16201A]">{averageRating}</span>
            <Star className="size-5 fill-amber-500 text-amber-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[#EAE6DC] bg-white shadow-2xs">
          <p className="text-[11px] font-bold text-[#5A655F] uppercase">स्वीकृत (Approved)</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</p>
        </div>

        <div className="p-4 rounded-2xl border border-[#EAE6DC] bg-white shadow-2xs">
          <p className="text-[11px] font-bold text-[#5A655F] uppercase">छिपी हुई (Hidden)</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{hiddenCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EAE6DC]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8C827A]" />
          <Input
            placeholder="ग्राहक का नाम, कस्बा, या सामान खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl border-[#EAE6DC]"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F2] rounded-xl border border-[#EAE6DC] shrink-0">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "all"
                ? "bg-[#145A45] text-white shadow-xs"
                : "text-[#5A655F] hover:text-[#16201A]"
            }`}
          >
            सभी ({totalReviews})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("approved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "approved"
                ? "bg-[#145A45] text-white shadow-xs"
                : "text-[#5A655F] hover:text-[#16201A]"
            }`}
          >
            स्वीकृत ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("hidden")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === "hidden"
                ? "bg-[#145A45] text-white shadow-xs"
                : "text-[#5A655F] hover:text-[#16201A]"
            }`}
          >
            छिपी हुई ({hiddenCount})
          </button>
        </div>
      </div>

      {/* Review Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-xs text-[#5A655F]">
            समीक्षाएं लोड हो रही हैं...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-[#EAE6DC] space-y-2">
            <div className="size-12 rounded-full bg-[#E6EFE8] text-[#145A45] flex items-center justify-center mx-auto">
              <MessageSquare className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-[#16201A]">कोई समीक्षा नहीं मिली</h3>
            <p className="text-xs text-[#5A655F]">
              {reviews.length === 0
                ? "अभी तक किसी ग्राहक ने कोई समीक्षा नहीं दी है।"
                : "सर्च के अनुसार कोई समीक्षा नहीं मिली।"}
            </p>
          </div>
        ) : (
          filtered.map((rev) => (
            <div
              key={rev.id}
              className="p-4 sm:p-5 rounded-2xl border border-[#EAE6DC] bg-white shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Product & Customer Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#16201A]">
                      {rev.customer_name}
                    </span>
                    {rev.customer_phone && (
                      <span className="text-[11px] text-[#5A655F] bg-[#FAF8F2] px-2 py-0.5 rounded-md border border-[#EAE6DC]">
                        📞 {rev.customer_phone}
                      </span>
                    )}
                    {rev.locality && (
                      <span className="text-[11px] text-[#5A655F]">
                        📍 {rev.locality}
                      </span>
                    )}
                    <span className="text-[10px] text-[#8C827A]">
                      {new Date(rev.created_at).toLocaleDateString("hi-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Product Tag */}
                  <div className="text-xs font-semibold text-[#145A45] flex items-center gap-1">
                    <span>सामान:</span>
                    <span className="font-bold underline">
                      {rev.product?.name || `Product ID: ${rev.product_id}`}
                    </span>
                  </div>
                </div>

                {/* Star Rating Badge & Actions */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-3.5 ${
                          s <= rev.rating ? "fill-amber-500 text-amber-500" : "text-stone-300"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-black text-amber-900 ml-1">{rev.rating}.0</span>
                  </div>

                  {/* Toggle Approval Button */}
                  <Button
                    type="button"
                    onClick={() => handleToggleApproval(rev)}
                    variant="outline"
                    className={`h-8 px-2.5 text-xs font-bold rounded-lg border gap-1 cursor-pointer ${
                      rev.is_approved
                        ? "border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                        : "border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100"
                    }`}
                  >
                    {rev.is_approved ? (
                      <>
                        <Eye className="size-3.5" />
                        <span>स्वीकृत (Live)</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="size-3.5" />
                        <span>छिपा हुआ (Hidden)</span>
                      </>
                    )}
                  </Button>

                  {/* Delete Button */}
                  <Button
                    type="button"
                    disabled={deletingId === rev.id}
                    onClick={() => handleDeleteReview(rev.id, rev.product_id)}
                    variant="ghost"
                    className="h-8 size-8 p-0 text-[#8C827A] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Review Content */}
              {(rev.title || rev.comment) && (
                <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#EAE6DC]/70 space-y-1">
                  {rev.title && (
                    <p className="text-xs font-bold text-[#16201A]">{rev.title}</p>
                  )}
                  {rev.comment && (
                    <p className="text-xs text-[#3A453F] leading-relaxed">{rev.comment}</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
