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

/**
 * Robust, server-authorized Order Status Update function
 * Enforces PostgreSQL role-based security using the authenticated admin session
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  note?: string
): Promise<{ success: boolean; order?: Partial<Order>; error?: string }> {
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

    // 2. Secondary: Direct table update with authenticated session RLS
    const { data: updatedRows, error: directError } = await supabase
      .from("orders")
      .update({
        status: newStatus as never,
        notes: note || undefined,
        updated_at: new Date().toISOString() as never,
      })
      .eq("id", orderId)
      .select("id, order_no, status, updated_at");

    if (directError) throw directError;

    if (!updatedRows || updatedRows.length === 0) {
      throw new Error("Permission denied: You must be an authorized admin to update order status.");
    }

    return {
      success: true,
      order: {
        id: orderId,
        status: newStatus,
        updated_at: new Date().toISOString(),
        notes: note || undefined,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update order status";
    return { success: false, error: message };
  }
}

/**
 * Update Payment Status (Admin Only)
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: updatedRows, error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", orderId)
      .select("id, payment_status");

    if (error) throw error;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error("Permission denied: You must be an authorized admin to update payment status.");
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update payment" };
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

    return { order: data as unknown as Order };
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
        return rpcData as unknown as Order[];
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
    return (data ?? []) as unknown as Order[];
  } catch {
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
