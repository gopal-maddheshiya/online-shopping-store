import { useEffect, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const STORE_SYNC_CHANNEL = "store-realtime-sync";

export type ProductSyncPayload = {
  productId?: string;
  slug?: string;
  action?: "create" | "update" | "delete" | "status" | "image";
  updatedAt?: string;
};

export type OrderSyncPayload = {
  orderId?: string;
  orderNo?: string;
  status?: string;
  paymentStatus?: string;
  updatedAt?: string;
};

export type NewOrderPayload = {
  orderId: string;
  orderNo: string;
  total: number;
  customerName?: string;
  createdAt: string;
};

export type SettingsSyncPayload = {
  updatedAt?: string;
};

// =========================================================================
// BROADCAST TRANSMITTERS
// =========================================================================

let broadcastChannelRef: ReturnType<typeof supabase.channel> | null = null;

function getBroadcastChannel() {
  if (!broadcastChannelRef) {
    broadcastChannelRef = supabase.channel(STORE_SYNC_CHANNEL);
    broadcastChannelRef.subscribe();
  }
  return broadcastChannelRef;
}

/**
 * Broadcast product modification signal across all connected browsers
 */
export function broadcastProductSync(payload: ProductSyncPayload = {}) {
  try {
    const channel = getBroadcastChannel();
    void channel.send({
      type: "broadcast",
      event: "PRODUCT_SYNC",
      payload: {
        ...payload,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn("Failed to broadcast product sync event:", err);
  }
}

/**
 * Broadcast order status modification signal across all connected browsers
 */
export function broadcastOrderSync(payload: OrderSyncPayload) {
  try {
    const channel = getBroadcastChannel();
    void channel.send({
      type: "broadcast",
      event: "ORDER_SYNC",
      payload: {
        ...payload,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn("Failed to broadcast order sync event:", err);
  }
}

/**
 * Broadcast new order placement signal across all connected browsers
 */
export function broadcastNewOrder(payload: NewOrderPayload) {
  try {
    const channel = getBroadcastChannel();
    void channel.send({
      type: "broadcast",
      event: "NEW_ORDER_SYNC",
      payload: {
        ...payload,
        createdAt: payload.createdAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn("Failed to broadcast new order event:", err);
  }
}

/**
 * Broadcast store settings update signal across all connected browsers
 */
export function broadcastSettingsSync(payload: SettingsSyncPayload = {}) {
  try {
    const channel = getBroadcastChannel();
    void channel.send({
      type: "broadcast",
      event: "SETTINGS_SYNC",
      payload: {
        ...payload,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    console.warn("Failed to broadcast settings sync event:", err);
  }
}

// =========================================================================
// REALTIME LISTENER & QUERY INVALIDATION HOOK
// =========================================================================

interface RealtimeSyncOptions {
  isAdmin?: boolean;
  onNewOrderNotification?: (order: NewOrderPayload) => void;
}

export function useRealtimeSync(queryClient: QueryClient, options: RealtimeSyncOptions = {}) {
  const debounceTimers = useRef<Record<string, number>>({});
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Helper to debounce query invalidations to prevent flood on batch mutations
    const debouncedInvalidate = (keyPrefix: string, queryKeys: unknown[][], delay = 60) => {
      if (debounceTimers.current[keyPrefix]) {
        window.clearTimeout(debounceTimers.current[keyPrefix]);
      }
      debounceTimers.current[keyPrefix] = window.setTimeout(() => {
        queryKeys.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
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
      } else {
        keys.push(["product"]);
      }
      debouncedInvalidate("products", keys, 50);
    };

    const invalidateOrderQueries = () => {
      debouncedInvalidate("orders", [
        ["admin-orders"],
        ["customer-orders"],
      ], 50);
    };

    const invalidateSettingsQueries = () => {
      debouncedInvalidate("settings", [["store-settings"]], 50);
    };

    // Connect to the shared store realtime synchronization channel
    const channel = supabase.channel(STORE_SYNC_CHANNEL, {
      config: {
        broadcast: { self: true },
      },
    });


    channel
      // 1. BROADCAST LISTENERS (Instant 0ms multi-tab sync)
      .on("broadcast", { event: "PRODUCT_SYNC" }, (event) => {
        const payload = (event["payload"] as ProductSyncPayload) || {};
        invalidateProductQueries(payload.slug);
      })
      .on("broadcast", { event: "ORDER_SYNC" }, () => {
        invalidateOrderQueries();
      })
      .on("broadcast", { event: "NEW_ORDER_SYNC" }, (event) => {
        const payload = (event["payload"] as NewOrderPayload) || {};
        invalidateOrderQueries();
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
        invalidateSettingsQueries();
      })

      // 2. POSTGRES WAL CHANGES (Catches direct Supabase / SQL updates)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          const slug = (payload.new as { slug?: string })?.slug || (payload.old as { slug?: string })?.slug;
          invalidateProductQueries(slug);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_variants" },
        () => {
          invalidateProductQueries();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          debouncedInvalidate("categories", [["categories"], ["products"]], 50);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          invalidateOrderQueries();
          if (payload.eventType === "INSERT" && optionsRef.current.isAdmin) {
            const orderNo = (payload.new as { order_no?: string })?.order_no || "AGT";
            toast.success(`🛒 नया ऑर्डर प्राप्त हुआ! (#${orderNo})`, { duration: 5000 });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_events" },
        () => {
          invalidateOrderQueries();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_settings" },
        () => {
          invalidateSettingsQueries();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`[RealtimeSync] Channel ${channelId} status: ${status}. Attempting reconnection...`);
          // Re-subscribe if connection drops
          setTimeout(() => {
            void channel.subscribe();
          }, 3000);
        }
      });

    return () => {
      // Clean up debounces
      Object.values(debounceTimers.current).forEach((t) => window.clearTimeout(t));
      debounceTimers.current = {};

      // Remove channel cleanly
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
