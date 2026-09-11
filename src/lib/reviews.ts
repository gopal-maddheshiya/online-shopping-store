import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductReview {
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
}

export interface ReviewStats {
  average: number;
  count: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  percentages: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export function computeReviewStats(reviews: ProductReview[]): ReviewStats {
  if (!reviews || reviews.length === 0) {
    return {
      average: 5.0,
      count: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalScore = 0;

  for (const rev of reviews) {
    const r = Math.min(5, Math.max(1, Math.round(rev.rating || 5))) as 1 | 2 | 3 | 4 | 5;
    distribution[r] = (distribution[r] || 0) + 1;
    totalScore += rev.rating;
  }

  const count = reviews.length;
  const average = Number((totalScore / count).toFixed(1));

  const percentages = {
    5: Math.round((distribution[5] / count) * 100),
    4: Math.round((distribution[4] / count) * 100),
    3: Math.round((distribution[3] / count) * 100),
    2: Math.round((distribution[2] / count) * 100),
    1: Math.round((distribution[1] / count) * 100),
  };

  return {
    average,
    count,
    distribution,
    percentages,
  };
}

export const productReviewsQuery = (productId?: string | null) =>
  queryOptions({
    queryKey: ["product-reviews", productId],
    queryFn: async (): Promise<ProductReview[]> => {
      if (!productId) return [];

      try {
        const { data, error } = await (supabase as any)
          .from("product_reviews")
          .select("*")
          .eq("product_id", productId)
          .eq("is_approved", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Could not fetch product reviews from database:", error.message);
          return [];
        }

        return (data as ProductReview[]) || [];
      } catch (e) {
        console.warn("Reviews fetch exception:", e);
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

export interface SubmitReviewInput {
  productId: string;
  name: string;
  phone?: string | null | undefined;
  locality?: string | null | undefined;
  rating: number;
  title?: string | null | undefined;
  comment?: string | null | undefined;
}

export async function submitProductReview(input: SubmitReviewInput): Promise<{ success: boolean; error?: string | undefined }> {
  try {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      return { success: false, error: "कृपया अपना नाम लिखें" };
    }

    const { error } = await (supabase as any).from("product_reviews").insert({
      product_id: input.productId,
      customer_name: trimmedName,
      customer_phone: input.phone ? input.phone.trim() : null,
      locality: input.locality ? input.locality.trim() : "महराजगंज",
      rating: Math.min(5, Math.max(1, input.rating)),
      title: input.title ? input.title.trim() : null,
      comment: input.comment ? input.comment.trim() : null,
      is_verified: true,
      is_approved: true,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to submit review" };
  }
}
