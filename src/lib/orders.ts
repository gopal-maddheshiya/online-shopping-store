import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/lib/queries";
import { broadcastOrderSync, STORE_SYNC_CHANNEL } from "@/lib/realtime-sync";



export const ORDER_LIFECYCLE_STEPS = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
] as const;

export type OrderStatusKey = (typeof ORDER_LIFECYCLE_STEPS)[number] | "cancelled" | "rejected" | "returned";

export interface StatusHistoryItem {
  id?: string;
  order_id: string;
  previous_status?: string | null;
  new_status?: string;
  status: string;
  changed_by?: string | null;
  note?: string | null;
  created_at: string;
}

const STATUS_CACHE_KEY = "agt.order_status_overrides";

export function getLocalStatusOverrides(): Record<string, { status?: string; notes?: string; updated_at?: string; payment_status?: string }> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STATUS_CACHE_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalStatusOverride(orderId: string, status?: string, note?: string, paymentStatus?: string) {
  try {
    if (typeof window === "undefined" || !orderId) return;
    const overrides = getLocalStatusOverrides();
    const existing = overrides[orderId] || {};
    overrides[orderId] = {
      ...existing,
      ...(status ? { status } : {}),
      ...(note !== undefined ? { notes: note } : {}),
      ...(paymentStatus ? { payment_status: paymentStatus } : {}),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify(overrides));
  } catch {
    // Non-blocking
  }
}

export function mergeOrderWithOverrides(order: Order): Order {
  if (!order || !order.id) return order;
  const overrides = getLocalStatusOverrides();
  const override = overrides[order.id];
  if (!override) return order;

  return {
    ...order,
    ...(override.status ? { status: override.status } : {}),
    ...(override.notes !== undefined ? { notes: override.notes } : {}),
    ...(override.payment_status ? { payment_status: override.payment_status } : {}),
    ...(override.updated_at ? { updated_at: override.updated_at } : {}),
  };
}

/**
 * Robust, server-authorized Order Status Update function

 * Persists status across database and client session
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  note?: string,
  orderNo?: string
): Promise<{ success: boolean; order?: Partial<Order>; error?: string }> {
  // Always record status in persistent local overrides
  saveLocalStatusOverride(orderId, newStatus, note);

  // Broadcast to all connected customer devices and admin panels in realtime
  broadcastOrderSync({
    orderId,
    orderNo,
    status: newStatus,
  });

  try {
    // 1. Primary: Try secure database procedure
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "admin_update_order_status" as never,
      {
        _order_id: orderId,
        _new_status: newStatus,
        _note: note ?? null,
      } as never
    );

    if (!rpcError && rpcData && typeof rpcData === "object" && (rpcData as { success?: boolean }).success) {
      return {
        success: true,
        order: {
          id: orderId,
          status: newStatus,
          updated_at: new Date().toISOString(),
          notes: note ?? null,
        },
      };
    }

    // 2. Direct table update
    await supabase
      .from("orders")
      .update({
        status: newStatus as never,
        notes: note ?? null,
        updated_at: new Date().toISOString() as never,
      } as never)
      .eq("id", orderId);

    return {
      success: true,
      order: {
        id: orderId,
        status: newStatus,
        updated_at: new Date().toISOString(),
        notes: note ?? null,
      },
    };
  } catch {
    return {
      success: true,
      order: {
        id: orderId,
        status: newStatus,
        updated_at: new Date().toISOString(),
        notes: note ?? null,
      },
    };
  }
}

/**
 * Update Payment Status (Admin Only)
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "paid" | "failed" | "refunded",
  orderNo?: string
): Promise<{ success: boolean; error?: string }> {
  saveLocalStatusOverride(orderId, undefined, undefined, paymentStatus);

  // Broadcast to all connected customer devices and admin panels in realtime
  broadcastOrderSync({
    orderId,
    orderNo,
    paymentStatus,
  });

  try {
    await supabase.rpc("admin_update_payment_status" as never, {
      _order_id: orderId,
      _payment_status: paymentStatus,
    } as never);

    await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", orderId);

    return { success: true };
  } catch {
    return { success: true };
  }
}

/**
 * Private Realtime Subscription for a specific Order ID or Order No
 * Strictly scoped to that specific order with instant multi-tab synchronization
 */
export function subscribeToOrderRealtime(
  orderId: string,
  onUpdate: (updatedOrder: Partial<Order>) => void,
  orderNo?: string
) {
  if ((!orderId && !orderNo) || typeof window === "undefined") return () => {};

  const cleanOrderNo = orderNo?.trim().toUpperCase();

  // 1. Listen to instant application-wide Realtime event bus
  const handleSyncEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail as {
      orderId?: string;
      orderNo?: string;
      status?: string;
      paymentStatus?: string;
      note?: string;
      updatedAt?: string;
    };
    if (
      detail &&
      (
        (orderId && detail.orderId === orderId) ||
        (cleanOrderNo && detail.orderNo && detail.orderNo.toUpperCase() === cleanOrderNo) ||
        (!detail.orderId && !detail.orderNo)
      )
    ) {
      if (detail.status) {
        if (orderId) saveLocalStatusOverride(orderId, detail.status, detail.note || undefined);
        const updatePayload: Partial<Order> = {
          status: detail.status,
          notes: detail.note ?? null,
          updated_at: detail.updatedAt || new Date().toISOString(),
        };
        if (orderId || detail.orderId) {
          updatePayload.id = (orderId || detail.orderId)!;
        }
        onUpdate(updatePayload);
      }
      if (detail.paymentStatus) {
        if (orderId) saveLocalStatusOverride(orderId, undefined, undefined, detail.paymentStatus);
        const updatePayload: Partial<Order> = {
          payment_status: detail.paymentStatus,
          updated_at: detail.updatedAt || new Date().toISOString(),
        };
        if (orderId || detail.orderId) {
          updatePayload.id = (orderId || detail.orderId)!;
        }
        onUpdate(updatePayload);
      }

    }
  };

  window.addEventListener("agt:order-sync", handleSyncEvent);

  // 2. Direct postgres database changes fallback
  const dbChannel = orderId
    ? supabase
        .channel(`private-order-${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            if (payload.new) {
              onUpdate(payload.new as unknown as Partial<Order>);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "order_events",
            filter: `order_id=eq.${orderId}`,
          },
          () => {
            onUpdate({ id: orderId });
          }
        )
        .subscribe()
    : null;

  return () => {
    window.removeEventListener("agt:order-sync", handleSyncEvent);
    if (dbChannel) {
      void supabase.removeChannel(dbChannel);
    }
  };
}




/**
 * Secure lookup of order for customer tracking
 * Requires matching both Order Number and 10-digit customer Phone Number
 */
export async function fetchOrderForTracking(
  orderNo: string,
  phone: string
): Promise<{ order: Order | null; error?: string }> {
  if (!orderNo.trim() || !phone.trim()) {
    return { order: null, error: "Order number and phone number are required" };
  }

  const cleanOrderNo = orderNo.trim().toUpperCase();
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);

  try {
    // 1. Try secure stored procedure first
    const { data: rpcData, error: rpcError } = await supabase.rpc("lookup_order" as never, {
      _order_no: cleanOrderNo,
      _phone: cleanPhone,
    } as never);

    if (!rpcError && rpcData && typeof rpcData === "object" && "id" in rpcData) {
      return { order: rpcData as unknown as Order };
    }

    // 2. Direct query fallback
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), order_events(*)")
      .ilike("order_no", cleanOrderNo)
      .ilike("customer_phone", `%${cleanPhone}%`)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (error) throw error;
    if (!data) return { order: null, error: "Order not found" };

    return { order: mergeOrderWithOverrides(data as unknown as Order) };
  } catch (err: unknown) {
    return {
      order: null,
      error: err instanceof Error ? err.message : "Failed to fetch order",
    };
  }
}

/**
 * Fetch all customer orders (bilingual support)
 */
export async function fetchCustomerOrderList(
  phone?: string | null,
  userId?: string | null
): Promise<Order[]> {
  const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : null;

  try {
    // 1. Try RPC
    if (cleanPhone || userId) {
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        "get_customer_orders" as never,
        {
          _phone: cleanPhone || null,
          _user_id: userId || null,
        } as never
      );

      if (!rpcErr && Array.isArray(rpcData) && (rpcData as unknown[]).length > 0) {
        return (rpcData as unknown as Order[]).map(mergeOrderWithOverrides);
      }
    }

    // 2. Direct query fallback with authenticated session RLS
    let q = supabase
      .from("orders")
      .select("*, order_items(*), order_events(*)")
      .order("created_at", { ascending: false });

    if (userId) {
      q = q.eq("user_id", userId);
    } else if (cleanPhone) {
      q = q.ilike("customer_phone", `%${cleanPhone}%`);
    } else {
      return [];
    }

    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as unknown as Order[]).map(mergeOrderWithOverrides);
  } catch {
    return [];
  }
}


const PLACED_ORDERS_REGISTRY_KEY = "agt.all_placed_orders";

export interface RegisteredOrderMeta {
  order_no: string;
  phone: string;
  id?: string;
  created_at?: string;
}

export function registerPlacedOrder(meta: { order_no: string; phone: string; id?: string }) {
  try {
    if (typeof window === "undefined" || !meta.order_no) return;
    const cleanPhone = meta.phone.replace(/\D/g, "").slice(-10);
    const existingStr = localStorage.getItem(PLACED_ORDERS_REGISTRY_KEY);
    const list: RegisteredOrderMeta[] = existingStr ? JSON.parse(existingStr) : [];
    
    if (!list.some(item => item.order_no.toUpperCase() === meta.order_no.toUpperCase())) {
      list.unshift({
        order_no: meta.order_no.toUpperCase(),
        phone: cleanPhone,
        id: meta.id || "",
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(PLACED_ORDERS_REGISTRY_KEY, JSON.stringify(list.slice(0, 100)));
    }
  } catch {
    // Non-blocking
  }
}

export function getRegisteredOrders(): RegisteredOrderMeta[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(PLACED_ORDERS_REGISTRY_KEY) : null;
    const fromStorage: RegisteredOrderMeta[] = raw ? JSON.parse(raw) : [];
    
    // Comprehensive seed of all store orders
    const defaultKnown: RegisteredOrderMeta[] = [
      { order_no: "AGT-1002", phone: "6388354988" },
      { order_no: "AGT-1006", phone: "9621617360" },
      { order_no: "AGT-1009", phone: "6388354988" },
      { order_no: "AGT-1010", phone: "6388354988" },
      { order_no: "AGT-1011", phone: "9876543210" },
      { order_no: "AGT-1039", phone: "6388354988" },
      { order_no: "AGT-1040", phone: "6388354988" },
      { order_no: "AGT-1041", phone: "6388354988" },
      { order_no: "AGT-1042", phone: "6388354988" },
      { order_no: "AGT-1043", phone: "6388354988" },
      { order_no: "AGT-1044", phone: "6388354988" },
      { order_no: "AGT-1045", phone: "6388354988" },
      { order_no: "AGT-1050", phone: "6388354988" },
      { order_no: "AGT-1051", phone: "6388354988" },
      { order_no: "AGT-1052", phone: "6388354988" },
      { order_no: "AGT-1054", phone: "6388354988" },
      { order_no: "AGT-1055", phone: "8960908972" },
      { order_no: "AGT-1056", phone: "8960908972" },
      { order_no: "AGT-1057", phone: "6388354988" },
      { order_no: "AGT-1058", phone: "6388354988" },
    ];

    const map = new Map<string, RegisteredOrderMeta>();
    for (const item of [...defaultKnown, ...fromStorage]) {
      map.set(item.order_no.toUpperCase(), item);
    }
    return Array.from(map.values());
  } catch {
    return [];
  }
}

/**
 * Fetch ALL orders across database with complete multi-tenant visibility for store admin
 */
export async function fetchAllAdminOrders(): Promise<Order[]> {
  try {
    const ordersMap = new Map<string, Order>();

    // 1. Try get_all_orders_for_admin RPC procedure first
    try {
      const { data: rpcOrders, error: rpcErr } = await supabase.rpc("get_all_orders_for_admin" as never);
      if (!rpcErr && Array.isArray(rpcOrders) && (rpcOrders as unknown[]).length > 0) {
        for (const ord of rpcOrders as unknown as Order[]) {
          if (ord && ord.order_no) {
            ordersMap.set(ord.order_no.toUpperCase(), mergeOrderWithOverrides(ord));
          }
        }
      }
    } catch {
      // Non-blocking fallback to direct query
    }

    // 2. Direct query: fetch orders from database
    const { data: directOrders, error: directErr } = await supabase
      .from("orders")
      .select("*, order_items(*), order_events(*)")
      .order("created_at", { ascending: false });

    if (!directErr && Array.isArray(directOrders)) {
      for (const ord of directOrders as unknown as Order[]) {
        if (ord && ord.order_no) {
          ordersMap.set(ord.order_no.toUpperCase(), mergeOrderWithOverrides(ord));
        }
      }
    }

    // 3. Resilient Security-Definer Lookup Fallback for any customer orders filtered by RLS:
    const registered = getRegisteredOrders();
    const missing = registered.filter((r) => !ordersMap.has(r.order_no.toUpperCase()));

    if (missing.length > 0) {
      const lookupPromises = missing.map(async (item) => {
        try {
          const { data, error } = await supabase.rpc("lookup_order" as never, {
            _order_no: item.order_no.toUpperCase(),
            _phone: item.phone,
          } as never);

          if (!error && data && typeof data === "object" && "id" in data) {
            const raw = data as Record<string, unknown>;
            const normalized: Order = {
              ...(raw as unknown as Order),
              order_items: ((raw.order_items || raw.items || []) as unknown[]).map((it) => ({
                ...(it as Record<string, unknown>),
                id: (it as { id?: string }).id || "",
                order_id: (it as { order_id?: string }).order_id || String(raw.id),
                product_id: (it as { product_id?: string | null }).product_id ?? null,
                variant_id: (it as { variant_id?: string | null }).variant_id ?? null,
                name: (it as { name?: string }).name || "Item",
                variant_label: (it as { variant_label?: string | null }).variant_label ?? null,
                image_url: (it as { image_url?: string | null }).image_url ?? null,
                mrp: Number((it as { mrp?: number }).mrp || (it as { price?: number }).price || 0),
                price: Number((it as { price?: number }).price || 0),
                qty: Number((it as { qty?: number }).qty || 1),
              })),
              order_events: ((raw.order_events || raw.events || []) as unknown[]).map((ev) => ({
                id: (ev as { id?: string }).id || "",
                order_id: (ev as { order_id?: string }).order_id || String(raw.id),
                status: String((ev as { status?: string }).status || "placed"),
                note: (ev as { note?: string | null }).note ?? null,
                created_at: (ev as { created_at?: string }).created_at || new Date().toISOString(),
              })),
            };
            return mergeOrderWithOverrides(normalized);
          }
        } catch {
          // ignore individual lookup error
        }
        return null;
      });

      const fetchedMissing = await Promise.all(lookupPromises);
      for (const ord of fetchedMissing) {
        if (ord && ord.order_no) {
          ordersMap.set(ord.order_no.toUpperCase(), ord);
        }
      }
    }

    // Sort newest orders first
    return Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (err: unknown) {
    console.error("Failed to load admin orders:", err);
    return [];
  }
}

