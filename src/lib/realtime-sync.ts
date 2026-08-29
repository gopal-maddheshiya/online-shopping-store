import { useEffect, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const STORE_SYNC_CHANNEL = "store-realtime-sync";

export type ProductSyncPayload = {
  productId?: string | undefined;
  slug?: string | undefined;
  action?: ("create" | "update" | "delete" | "status" | "image") | undefined;
  updatedAt?: string | undefined;
};

export type OrderSyncPayload = {
  orderId?: string | undefined;
  orderNo?: string | undefined;
  status?: string | undefined;
  paymentStatus?: string | undefined;
  updatedAt?: string | undefined;
};

export type NewOrderPayload = {
  orderId: string;
  orderNo: string;
  total: number;
  customerName?: string | undefined;
  createdAt: string;
};

export type SettingsSyncPayload = {
  updatedAt?: string | undefined;
};


// =========================================================================
// DIAGNOSTIC LOGGING (Development & Live Verification)
// =========================================================================

const IS_LOGGING_ENABLED = true; // Temporary diagnostic logging for real-time verification

function logRealtime(tag: string, ...args: unknown[]) {
  if (IS_LOGGING_ENABLED) {
    console.log(`[REALTIME] ${tag}`, ...args);
  }
}

function logRealtimeEvent(eventType: string, target: string, recordId?: string, payload?: Record<string, unknown>) {
  if (IS_LOGGING_ENABLED) {
    console.log(
      `[REALTIME EVENT] ${eventType} | Target: ${target}${recordId ? ` | ID: ${recordId}` : ""}`,
      payload || {}
    );
  }
}

function logRealtimeInvalidate(queryKey: unknown) {
  if (IS_LOGGING_ENABLED) {
    console.log(`[REALTIME INVALIDATE]`, queryKey);
  }
}

// =========================================================================
// BROADCAST TRANSMITTERS
// =========================================================================

function getBroadcastChannel() {
  const existing = supabase.getChannels().find((c) => c.topic === `realtime:${STORE_SYNC_CHANNEL}`);
  if (existing && existing.state === "joined") {
    return existing;
  }
  const ch = supabase.channel(STORE_SYNC_CHANNEL, {
    config: { broadcast: { self: true } },
  });
  ch.subscribe();
  return ch;
}

/**
 * Broadcast product modification signal across all connected browsers
 */
export function broadcastProductSync(payload: ProductSyncPayload = {}) {
  try {
    const channel = getBroadcastChannel();
    logRealtimeEvent("BROADCAST_SEND", "PRODUCT_SYNC", payload.productId || payload.slug, { action: payload.action, slug: payload.slug });
    void channel.send({
      type: "broadcast",
      event: "PRODUCT_SYNC",
      payload: {
        ...payload,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn("[REALTIME] Failed to broadcast product sync event:", err);
  }
}

/**
 * Broadcast order status modification signal across all connected browsers
 */
export function broadcastOrderSync(payload: OrderSyncPayload) {
  try {
    const channel = getBroadcastChannel();
    logRealtimeEvent("BROADCAST_SEND", "ORDER_SYNC", payload.orderId || payload.orderNo, { status: payload.status, paymentStatus: payload.paymentStatus });
    void channel.send({
      type: "broadcast",
      event: "ORDER_SYNC",
      payload: {
        ...payload,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn("[REALTIME] Failed to broadcast order sync event:", err);
  }
}

/**
 * Broadcast new order placement signal across all connected browsers
 */
export function broadcastNewOrder(payload: NewOrderPayload) {
  try {
    const channel = getBroadcastChannel();
    logRealtimeEvent("BROADCAST_SEND", "NEW_ORDER_SYNC", payload.orderId || payload.orderNo, { total: payload.total });
    void channel.send({
      type: "broadcast",
      event: "NEW_ORDER_SYNC",
      payload: {
        ...payload,
        createdAt: payload.createdAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn("[REALTIME] Failed to broadcast new order event:", err);
  }
}

/**
 * Broadcast store settings update signal across all connected browsers
 */
export function broadcastSettingsSync(payload: SettingsSyncPayload = {}) {
  try {
    const channel = getBroadcastChannel();
    logRealtimeEvent("BROADCAST_SEND", "SETTINGS_SYNC", undefined, {});
    void channel.send({
      type: "broadcast",
      event: "SETTINGS_SYNC",
      payload: {
        ...payload,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn("[REALTIME] Failed to broadcast settings sync event:", err);
  }
}

// =========================================================================
// REALTIME LISTENER & QUERY INVALIDATION HOOK
// =========================================================================

interface RealtimeSyncOptions {
  isAdmin?: boolean;
  onNewOrderNotification?: (order: NewOrderPayload) => void;
  router?: { invalidate: () => Promise<void> | void };
}

export function useRealtimeSync(queryClient: QueryClient, options: RealtimeSyncOptions = {}) {
  const debounceTimers = useRef<Record<string, number>>({});
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let isMounted = true;

    // Debounced invalidator to batch multi-row updates and prevent duplicate network queries
    const debouncedInvalidate = (keyPrefix: string, queryKeys: unknown[][], delay = 40) => {
      if (debounceTimers.current[keyPrefix]) {
        window.clearTimeout(debounceTimers.current[keyPrefix]);
      }
      debounceTimers.current[keyPrefix] = window.setTimeout(() => {
        if (!isMounted) return;
        queryKeys.forEach((key) => {
          logRealtimeInvalidate(key);
          void queryClient
            .invalidateQueries({
              queryKey: key,
              refetchType: "all",
            })
            .then(() => queryClient.refetchQueries({ queryKey: key, type: "all" }))
            .then(() => {
              if (IS_LOGGING_ENABLED) {
                console.log(`[REALTIME REFETCH]`, key, "success", new Date().toISOString());
              }
            })
            .catch((err: unknown) => {
              if (IS_LOGGING_ENABLED) {
                console.warn(`[REALTIME REFETCH]`, key, "error", err, new Date().toISOString());
              }
            });
        });

        // Also invalidate active TanStack Router loaders if router instance is provided
        try {
          void optionsRef.current.router?.invalidate();
        } catch {
          // Non-blocking
        }

        delete debounceTimers.current[keyPrefix];
      }, delay);
    };


    const invalidateProductQueries = (slug?: string) => {
      const keys: unknown[][] = [
        ["products"],
        ["featured-products"],
        ["categories"],
      ];
      if (slug) {
        keys.push(["product", slug]);
      }
      keys.push(["product"]);
      debouncedInvalidate("products", keys, 40);
    };

    const invalidateOrderQueries = () => {
      debouncedInvalidate(
        "orders",
        [
          ["admin-orders"],
          ["customer-orders"],
          ["track-order"],
        ],
        40,
      );
    };

    const invalidateCategoryQueries = () => {
      debouncedInvalidate("categories", [["categories"], ["products"]], 40);
    };

    const invalidateSettingsQueries = () => {
      debouncedInvalidate("settings", [["store-settings"]], 40);
    };

    // Connect to the shared store realtime synchronization channel
    logRealtime("connecting");
    const channel = supabase.channel(STORE_SYNC_CHANNEL, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      // 1. BROADCAST LISTENERS (Instant 0ms multi-tab sync)
      .on("broadcast", { event: "PRODUCT_SYNC" }, (event) => {
        const payload = (event["payload"] as ProductSyncPayload) || {};
        logRealtimeEvent("BROADCAST_RECV", "PRODUCT_SYNC", payload.productId || payload.slug, { action: payload.action, slug: payload.slug });
        invalidateProductQueries(payload.slug);
      })
      .on("broadcast", { event: "ORDER_SYNC" }, (event) => {
        const payload = (event["payload"] as OrderSyncPayload) || {};
        logRealtimeEvent("BROADCAST_RECV", "ORDER_SYNC", payload.orderId || payload.orderNo, { status: payload.status, paymentStatus: payload.paymentStatus });
        invalidateOrderQueries();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("agt:order-sync", { detail: payload }));
        }
      })
      .on("broadcast", { event: "NEW_ORDER_SYNC" }, (event) => {
        const payload = (event["payload"] as NewOrderPayload) || {};
        logRealtimeEvent("BROADCAST_RECV", "NEW_ORDER_SYNC", payload.orderId || payload.orderNo, { total: payload.total });
        invalidateOrderQueries();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("agt:order-sync", { detail: payload }));
        }
        if (optionsRef.current.isAdmin) {
          if (optionsRef.current.onNewOrderNotification) {
            optionsRef.current.onNewOrderNotification(payload);
          } else {
            toast.success(`🛒 नया ऑर्डर प्राप्त हुआ! (#${payload.orderNo || "AGT"})`, {
              description: payload.total ? `कुल राशि: ₹${payload.total}` : undefined,
              duration: 5000,
            });
          }
        }
      })
      .on("broadcast", { event: "SETTINGS_SYNC" }, () => {
        logRealtimeEvent("BROADCAST_RECV", "SETTINGS_SYNC");
        invalidateSettingsQueries();
      })

      // 2. POSTGRES WAL CHANGES (Authoritative database updates)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          const newRow = payload.new as { id?: string; slug?: string } | undefined;
          const oldRow = payload.old as { id?: string; slug?: string } | undefined;
          const slug = newRow?.slug || oldRow?.slug;
          const id = newRow?.id || oldRow?.id;
          logRealtimeEvent(`POSTGRES_${payload.eventType}`, "products", id, { slug });
          invalidateProductQueries(slug);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_variants" },
        (payload) => {
          const newRow = payload.new as { id?: string } | undefined;
          logRealtimeEvent(`POSTGRES_${payload.eventType}`, "product_variants", newRow?.id);
          invalidateProductQueries();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        (payload) => {
          const newRow = payload.new as { id?: string } | undefined;
          logRealtimeEvent(`POSTGRES_${payload.eventType}`, "categories", newRow?.id);
          invalidateCategoryQueries();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const newRow = payload.new as { id?: string; order_no?: string; status?: string; payment_status?: string } | undefined;
          const id = newRow?.id;
          logRealtimeEvent(`POSTGRES_${payload.eventType}`, "orders", id, { status: newRow?.status });
          invalidateOrderQueries();
          if (typeof window !== "undefined" && newRow) {
            window.dispatchEvent(
              new CustomEvent("agt:order-sync", {
                detail: {
                  orderId: newRow.id,
                  orderNo: newRow.order_no,
                  status: newRow.status,
                  paymentStatus: newRow.payment_status,
                },
              }),
            );
          }
          if (payload.eventType === "INSERT" && optionsRef.current.isAdmin) {
            const orderNo = newRow?.order_no || "AGT";
            toast.success(`🛒 नया ऑर्डर प्राप्त हुआ! (#${orderNo})`, { duration: 5000 });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_events" },
        (payload) => {
          const newRow = payload.new as { id?: string; order_id?: string; status?: string } | undefined;
          logRealtimeEvent(`POSTGRES_${payload.eventType}`, "order_events", newRow?.id, { status: newRow?.status });
          invalidateOrderQueries();
          if (typeof window !== "undefined" && newRow?.order_id) {
            window.dispatchEvent(
              new CustomEvent("agt:order-sync", {
                detail: {
                  orderId: newRow.order_id,
                  status: newRow.status,
                },
              }),
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_settings" },
        () => {
          logRealtimeEvent("POSTGRES_CHANGE", "store_settings");
          invalidateSettingsQueries();
        }
      )
      .subscribe((status, err) => {

        logRealtime(status, err ? `Error: ${err.message || JSON.stringify(err)}` : "");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`[REALTIME] Channel status: ${status}. Attempting reconnection...`);
          setTimeout(() => {
            if (isMounted) {
              void channel.subscribe();
            }
          }, 3000);
        }
      });

    return () => {
      isMounted = false;
      logRealtime("CLOSED");

      // Clean up debounce timers
      Object.values(debounceTimers.current).forEach((t) => window.clearTimeout(t));
      debounceTimers.current = {};

      // Remove channel cleanly
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
