import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Variant = {
  id: string;
  product_id: string;
  label: string;
  mrp: number;
  price: number;
  stock: number;
  low_stock_threshold: number;
  sku: string | null;
  barcode: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  description: string | null;
  image_url: string | null;
  images?: string[];
  tags: string[];
  is_featured: boolean;
  is_popular: boolean;
  is_active: boolean;
  sold_count: number;
  created_at: string;
  product_variants: Variant[];
};

export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type StoreSettings = {
  id: number;
  store_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  maps_link: string;
  announcement: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  delivery_fee: number;
  free_delivery_threshold: number;
  min_order_value: number;
  payment_methods: string[];
  business_hours: Record<string, { open: string; close: string; closed: boolean }>;
  social: Record<string, string>;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  name: string;
  variant_label: string | null;
  image_url: string | null;
  mrp: number;
  price: number;
  qty: number;
};

export type OrderEvent = {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  order_no: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  order_type: "delivery" | "pickup";
  address: {
    house?: string;
    area?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
    instructions?: string;
  };
  payment_method: string;
  coupon_code: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  order_events?: OrderEvent[];
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  value: number;
  min_order: number;
  max_discount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
};

export type HelpRequest = {
  id: string;
  name: string;
  phone: string;
  order_no: string | null;
  problem_type: string;
  message: string | null;
  status: string;
  created_at: string;
};

const PRODUCT_SELECT = "*, product_variants(*)";

export const settingsQuery = queryOptions({
  queryKey: ["store-settings"],
  queryFn: async (): Promise<StoreSettings> => {
    const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
    if (error) throw error;
    return data as unknown as StoreSettings;
  },
  staleTime: 60_000,
});

import { ADDITIONAL_CATEGORIES, ADDITIONAL_PRODUCTS } from "./catalog-data";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      const remote = (data ?? []) as Category[];
      const existingSlugs = new Set(remote.map((c) => c.slug));
      const merged = [...remote];
      for (const cat of ADDITIONAL_CATEGORIES) {
        if (!existingSlugs.has(cat.slug)) {
          merged.push(cat);
          existingSlugs.add(cat.slug);
        }
      }
      return merged;
    } catch {
      return ADDITIONAL_CATEGORIES;
    }
  },
  staleTime: 60_000,
});

export function productsQuery(opts: { activeOnly?: boolean } = {}) {
  return queryOptions({
    queryKey: ["products", opts.activeOnly !== false],
    queryFn: async (): Promise<Product[]> => {
      try {
        let q = supabase
          .from("products")
          .select(PRODUCT_SELECT)
          .order("created_at", { ascending: false });
        if (opts.activeOnly !== false) q = q.eq("is_active", true);
        const { data, error } = await q;
        if (error) throw error;
        const remote = (data ?? []) as unknown as Product[];
        const existingSlugs = new Set(remote.map((p) => p.slug));
        const merged = [...remote];
        for (const p of ADDITIONAL_PRODUCTS) {
          if (!existingSlugs.has(p.slug)) {
            if (opts.activeOnly === false || p.is_active) {
              merged.push(p);
              existingSlugs.add(p.slug);
            }
          }
        }
        return merged;
      } catch {
        return opts.activeOnly === false
          ? ADDITIONAL_PRODUCTS
          : ADDITIONAL_PRODUCTS.filter((p) => p.is_active);
      }
    },
    staleTime: 30_000,
  });
}

export function productQuery(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(PRODUCT_SELECT)
          .eq("slug", slug)
          .maybeSingle();
        if (!error && data) return data as unknown as Product;
      } catch {
        // Fall back to additional products
      }
      return ADDITIONAL_PRODUCTS.find((p) => p.slug === slug) ?? null;
    },
  });
}

export function cheapestVariant(product: Product): Variant | undefined {
  const active = (product.product_variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  return active[0];
}

export function totalStock(product: Product): number {
  return (product.product_variants ?? []).reduce((s, v) => s + v.stock, 0);
}

export const couponsQuery = queryOptions({
  queryKey: ["coupons"],
  queryFn: async (): Promise<Coupon[]> => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Coupon[];
  },
});

export function isOpenNow(settings: StoreSettings | undefined): { open: boolean; text: string } {
  if (!settings) return { open: false, text: "" };
  const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const now = new Date();
  const today = settings.business_hours?.[keys[now.getDay()] ?? "mon"];
  if (!today || today.closed) return { open: false, text: "Closed today" };
  const toMins = (t: string) => {
    const [h, m] = (t || "00:00").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const curMins = now.getHours() * 60 + now.getMinutes();
  const openMins = toMins(today.open);
  const closeMins = toMins(today.close);
  const open = curMins >= openMins && curMins <= closeMins;
  return {
    open,
    text: open ? `Open today until ${today.close}` : `Closed • Opens at ${today.open}`,
  };
}

// Customer Orders query by user_id or phone
export function customerOrdersQuery(userId?: string | null, phone?: string | null) {
  return queryOptions({
    queryKey: ["customer-orders", userId, phone],
    queryFn: async (): Promise<Order[]> => {
      let q = supabase
        .from("orders")
        .select("*, order_items(*), order_events(*)")
        .order("created_at", { ascending: false });

      if (userId) {
        q = q.eq("user_id", userId);
      } else if (phone) {
        const clean = phone.replace(/\D/g, "").slice(-10);
        q = q.ilike("customer_phone", `%${clean}%`);
      } else {
        return [];
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
    enabled: Boolean(userId || phone),
  });
}
