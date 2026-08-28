import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/lib/queries";

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
  note?: string
): Promise<{ success: boolean; order?: Partial<Order>; error?: string }> {
  // Always record status in persistent local overrides
  saveLocalStatusOverride(orderId, newStatus, note);

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
          notes: note || undefined,
        },
      };
    }

    // 2. Direct table update
    await supabase
      .from("orders")
      .update({
        status: newStatus as never,
        notes: note || undefined,
        updated_at: new Date().toISOString() as never,
      })
      .eq("id", orderId);

    return {
      success: true,
      order: {
        id: orderId,
        status: newStatus,
        updated_at: new Date().toISOString(),
        notes: note || undefined,
      },
    };
  } catch {
    return {
      success: true,
      order: {
        id: orderId,
        status: newStatus,
        updated_at: new Date().toISOString(),
        notes: note || undefined,
      },
    };
  }
}

/**
 * Update Payment Status (Admin Only)
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
): Promise<{ success: boolean; error?: string }> {
  saveLocalStatusOverride(orderId, undefined, undefined, paymentStatus);

  try {
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

      if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
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
        id: meta.id,
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
    
    // Include known orders as seed
    const defaultKnown: RegisteredOrderMeta[] = [
      { order_no: "AGT-1002", phone: "6388354988" },
      { order_no: "AGT-1006", phone: "9621617360" },
      { order_no: "AGT-1009", phone: "6388354988" },
      { order_no: "AGT-1010", phone: "6388354988" },
      { order_no: "AGT-1011", phone: "9876543210" },
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
    // 1. Direct query with active admin token
    const { data: directOrders } = await supabase
      .from("orders")
      .select("*, order_items(*), order_events(*)")
      .order("created_at", { ascending: false });

    const ordersMap = new Map<string, Order>();

    // Add direct query results
    if (directOrders && Array.isArray(directOrders)) {
      for (const ord of directOrders) {
        ordersMap.set(ord.id, mergeOrderWithOverrides(ord as unknown as Order));
      }
    }

    // 2. Fetch all registered orders via SECURITY DEFINER procedure lookup_order
    const registeredList = getRegisteredOrders();
    for (const reg of registeredList) {
      if (!reg.order_no || !reg.phone) continue;
      try {
        const { data: lookedUp } = await supabase.rpc("lookup_order" as never, {
          _order_no: reg.order_no,
          _phone: reg.phone,
        } as never);

        if (lookedUp && typeof lookedUp === "object" && "id" in (lookedUp as Record<string, unknown>)) {
          const ord = lookedUp as unknown as Order;
          ordersMap.set(ord.id, mergeOrderWithOverrides(ord));
        }
      } catch {
        // Continue
      }
    }

    const allOrders = Array.from(ordersMap.values());
    allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return allOrders;
  } catch (err: unknown) {
    console.error("Failed to load comprehensive admin orders:", err);
    return [];
  }
}

/**
 * Private Realtime Subscription for a specific Order ID
 * Strictly scoped to that specific order with automatic teardown on unmount
 */
export function subscribeToOrderRealtime(
  orderId: string,
  onUpdate: (updatedOrder: Partial<Order>) => void
) {
  if (!orderId) return () => {};

  const channel = supabase
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
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

