import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Variant = {
  id: string;
  product_id: string;
  label: string;
  label_en?: string | null;
  label_hi?: string | null;
  mrp: number;
  price: number;
  stock: number;
  low_stock_threshold: number;
  sku: string | null;
  barcode: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ProductImageType = "front" | "back" | "detail" | "additional";

export type ProductImage = {
  url: string;
  type: ProductImageType;
  label?: string | undefined;
  sort_order?: number | undefined;
};

export type Product = {
  id: string;
  name: string;
  name_en?: string | null;
  name_hi?: string | null;
  slug: string;
  brand: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  description: string | null;
  description_en?: string | null;
  description_hi?: string | null;
  image_url: string | null;
  images?: (string | ProductImage)[];
  tags: string[];
  is_featured: boolean;
  is_popular: boolean;
  is_active: boolean;
  sold_count: number;
  created_at: string;
  updated_at?: string | null;
  product_variants: Variant[];
};


export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  name_en?: string | null;
  name_hi?: string | null;
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
  gstin?: string | null;
  legal_name?: string | null;
  state?: string | null;
  state_code?: string | null;
  tax_enabled?: boolean | null;
  default_tax_rate?: number | null;
  invoice_prefix?: string | null;
  invoice_footer_note?: string | null;
  terms_and_conditions?: string | null;
  upi_vpa?: string | null;
  upi_merchant_name?: string | null;
  upi_registered_phone?: string | null;
  bank_account_holder?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  qr_code_mode?: string | null;
  qr_custom_note?: string | null;
  enabled_payment_methods?: string[] | null;
  razorpay_key_id?: string | null;
  online_payment_enabled?: boolean | null;
  hero_image_url?: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  name: string;
  name_en?: string | null;
  name_hi?: string | null;
  variant_label: string | null;
  variant_label_en?: string | null;
  variant_label_hi?: string | null;
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
    state?: string;
    pincode?: string;
    instructions?: string;
  };
  payment_method: string;
  payment_status?: string | null;
  paid_at?: string | null;
  transaction_id?: string | null;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  amount_paid?: number | null;
  payment_attempts?: number | null;
  payment_error?: string | null;
  payment_metadata?: Record<string, unknown> | null;
  coupon_code: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  status: string;
  notes: string | null;
  invoice_no?: string | null;
  refund_amount?: number | null;
  refund_reason?: string | null;
  refunded_at?: string | null;
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

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 1,
  store_name: "Arun Gopal Traders",
  tagline:
    "Your Trusted Local Grocery Store in Maharajganj. Quality products, fair rates, and reliable doorstep delivery.",
  phone: "+91 6388354988",
  whatsapp: "916388354988",
  email: "gopalmaddheshiya138@gmail.com",
  address: "Ramnagar, Adda Bazar Road, Maharajganj, Uttar Pradesh",
  maps_link:
    "https://www.google.com/maps/search/?api=1&query=Ramnagar%20Adda%20Bazar%20Road%20Maharajganj%20Uttar%20Pradesh",
  announcement: "⚡ Fast 30-Min Delivery in Maharajganj • Free on ₹499+",
  hero_title: "100% Shuddh Kirana",
  hero_subtitle: "Fresh Atta, Basmati Rice, Mustard Oil & Ghee",
  delivery_fee: 30,
  free_delivery_threshold: 499,
  min_order_value: 100,
  payment_methods: ["cod", "upi"],
  business_hours: {
    mon: { open: "07:00", close: "21:00", closed: false },
    tue: { open: "07:00", close: "21:00", closed: false },
    wed: { open: "07:00", close: "21:00", closed: false },
    thu: { open: "07:00", close: "21:00", closed: false },
    fri: { open: "07:00", close: "21:00", closed: false },
    sat: { open: "07:00", close: "21:00", closed: false },
    sun: { open: "07:00", close: "21:00", closed: false },
  },
  social: {},
};

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 6000,
  fallback: T,
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]).catch(() => {
    clearTimeout(timer);
    return fallback;
  });
}

import { ADDITIONAL_CATEGORIES } from "./catalog-data";

export const settingsQuery = queryOptions({
  queryKey: ["store-settings"],
  queryFn: async (): Promise<StoreSettings> => {
    return withTimeout(
      (async () => {
        try {
          const { data, error } = await supabase
            .from("store_settings")
            .select("*")
            .eq("id", 1)
            .single();
          if (error || !data) return DEFAULT_STORE_SETTINGS;

          const raw = data as unknown as StoreSettings;
          const isOldPhone = !raw.phone || raw.phone.includes("9621617360");
          const isOldWhatsApp = !raw.whatsapp || raw.whatsapp.includes("9621617360");
          const isOldEmail = !raw.email || raw.email.includes("ashokmaddheshiya51");

          return {
            ...raw,
            phone: isOldPhone ? "+91 6388354988" : raw.phone,
            whatsapp: isOldWhatsApp ? "916388354988" : raw.whatsapp,
            email: isOldEmail ? "gopalmaddheshiya138@gmail.com" : raw.email,
          };
        } catch {
          return DEFAULT_STORE_SETTINGS;
        }
      })(),
      2500,
      DEFAULT_STORE_SETTINGS,
    );
  },
  staleTime: 1000 * 60 * 2, // 2 minutes (shorter so hero image updates appear quickly)
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    return withTimeout(
      (async () => {
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
      })(),
      2500,
      ADDITIONAL_CATEGORIES,
    );
  },
  staleTime: 1000 * 60 * 10, // 10 minutes
});

export function productsQuery(opts: { activeOnly?: boolean } = {}) {
  return queryOptions({
    queryKey: ["products", opts.activeOnly !== false],
    queryFn: async (): Promise<Product[]> => {
      return withTimeout(
        (async () => {
          try {
            let q = supabase
              .from("products")
              .select(PRODUCT_SELECT)
              .order("created_at", { ascending: false });
            if (opts.activeOnly !== false) q = q.eq("is_active", true);
            const { data, error } = await q;
            if (error) throw error;
            return (data ?? []) as unknown as Product[];
          } catch {
            return [];
          }
        })(),
        10000,
        [],
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function featuredProductsQuery(limit: number = 12) {
  return queryOptions({
    queryKey: ["featured-products", limit],
    queryFn: async (): Promise<Product[]> => {
      return withTimeout(
        (async () => {
          try {
            const { data, error } = await supabase
              .from("products")
              .select(PRODUCT_SELECT)
              .eq("is_active", true)
              .order("is_featured", { ascending: false, nullsFirst: false })
              .order("sold_count", { ascending: false, nullsFirst: false })
              .order("created_at", { ascending: false })
              .limit(limit);

            if (error) throw error;
            return (data ?? []) as unknown as Product[];
          } catch {
            return [];
          }
        })(),
        10000,
        [],
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function productQuery(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      return withTimeout(
        (async () => {
          try {
            const { data, error } = await supabase
              .from("products")
              .select(PRODUCT_SELECT)
              .eq("slug", slug)
              .maybeSingle();
            if (!error && data) return data as unknown as Product;
          } catch {
            // Database error
          }
          return null;
        })(),
        10000,
        null,
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
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

import { fetchCustomerOrderList, fetchAllAdminOrders } from "./orders";

// Customer Orders query by user_id or phone
export function customerOrdersQuery(userId?: string | null, phone?: string | null) {
  return queryOptions({
    queryKey: ["customer-orders", userId, phone],
    queryFn: async (): Promise<Order[]> => {
      return fetchCustomerOrderList(phone, userId);
    },
    enabled: Boolean(userId || phone),
  });
}

// Admin Orders query with instant invalidation
export const adminOrdersQuery = queryOptions({
  queryKey: ["admin-orders"],
  queryFn: async (): Promise<Order[]> => {
    return fetchAllAdminOrders();
  },
  staleTime: 10_000,
});

export type CustomerAddress = {
  id: string;
  user_id: string;
  label?: string | null;
  name: string;
  phone: string;
  house: string | null;
  area: string | null;
  landmark: string | null;
  city: string;
  pincode: string | null;
  is_default: boolean;
  created_at: string;
};

// Customer saved addresses query
export function userAddressesQuery(userId?: string | null) {
  return queryOptions({
    queryKey: ["user-addresses", userId],
    queryFn: async (): Promise<CustomerAddress[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("Could not load user addresses:", error);
        return [];
      }
      return (data ?? []) as unknown as CustomerAddress[];
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

// Fetch or generate invoice for an order
export function invoiceByOrderIdQuery(orderId?: string | null) {
  return queryOptions({
    queryKey: ["order-invoice", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      // 1. Try to fetch from invoices table
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }

      // 2. If not yet generated, invoke idempotent generate_invoice_for_order RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "generate_invoice_for_order",
        { p_order_id: orderId }
      );

      if (rpcError) {
        console.warn("Could not auto-generate invoice:", rpcError.message);
        return null;
      }

      return rpcData;
    },
    enabled: Boolean(orderId),
    staleTime: 30_000,
  });
}

// Lookup verified invoice by order_no and customer phone (Guest + Customer)
export function lookupInvoiceQuery(orderNo?: string | null, phone?: string | null) {
  return queryOptions({
    queryKey: ["lookup-invoice", orderNo, phone],
    queryFn: async () => {
      if (!orderNo || !phone) return null;
      const { data, error } = await supabase.rpc("lookup_order_invoice", {
        p_order_no: orderNo.trim(),
        p_phone: phone.trim(),
      });
      if (error) {
        console.warn("Lookup invoice error:", error.message);
        return null;
      }
      return data;
    },
    enabled: Boolean(orderNo && phone),
    staleTime: 30_000,
  });
}




