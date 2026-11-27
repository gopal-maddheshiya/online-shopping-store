import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { Product, Variant } from "@/lib/queries";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  name_en?: string | null;
  name_hi?: string | null;
  variantLabel: string;
  variantLabel_en?: string | null;
  variantLabel_hi?: string | null;
  price: number;
  mrp: number;
  imageUrl: string | null;
  qty: number;
  stock: number;
};

type CartContextValue = {
  items: CartItem[];
  savedItems: CartItem[];
  count: number;
  subtotal: number;
  savings: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  addMultiple: (itemsToAdd: Array<{ item: Omit<CartItem, "qty">; qty?: number }>) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  saveForLater: (variantId: string) => void;
  moveToCart: (variantId: string) => void;
  removeSaved: (variantId: string) => void;
  clear: () => void;
  syncWithCatalog: (products: Product[]) => void;
  hydrated: boolean;
};

export type CartActions = {
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  addMultiple: (itemsToAdd: Array<{ item: Omit<CartItem, "qty">; qty?: number }>) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  saveForLater: (variantId: string) => void;
  moveToCart: (variantId: string) => void;
  removeSaved: (variantId: string) => void;
  clear: () => void;
  syncWithCatalog: (products: Product[]) => void;
};

const STORAGE_KEY = "agt.cart.v1";
const SAVED_KEY = "agt.saved.v1";

const CartContext = createContext<CartContextValue | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);

// -------------------------------------------------------------
// Fine-grained External Store for 60-120fps Variant Quantity Subscriptions
// Prevents 100+ ProductCards from re-rendering on a single tap
// -------------------------------------------------------------
type QtyListener = () => void;
const qtyListeners = new Set<QtyListener>();
let currentQtyMap = new Map<string, number>();

function notifyQtySubscribers(newItems: CartItem[]) {
  const nextMap = new Map<string, number>();
  for (const item of newItems) {
    nextMap.set(item.variantId, item.qty);
  }
  currentQtyMap = nextMap;
  qtyListeners.forEach((l) => l());
}

function subscribeCartQty(listener: QtyListener) {
  qtyListeners.add(listener);
  return () => {
    qtyListeners.delete(listener);
  };
}

const getServerSnapshot = () => 0;

/**
 * Fine-grained hook subscribing ONLY to a single variant's quantity.
 * Zero re-renders when other products in the store are added or removed!
 */
export function useCartItemQty(variantId: string | undefined): number {
  return useSyncExternalStore(
    subscribeCartQty,
    () => (variantId ? currentQtyMap.get(variantId) ?? 0 : 0),
    getServerSnapshot
  );
}

function read(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(read(STORAGE_KEY));
    setSavedItems(read(SAVED_KEY));
    setHydrated(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const next = read(STORAGE_KEY);
        setItems(next);
        notifyQtySubscribers(next);
      } else if (e.key === SAVED_KEY) {
        setSavedItems(read(SAVED_KEY));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    notifyQtySubscribers(items);
  }, [items, hydrated]);

  useEffect(() => {
    if (hydrated) {
      notifyQtySubscribers(items);
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(savedItems));
  }, [savedItems, hydrated]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    if (item.stock <= 0) return;
    const requested = Math.max(1, qty);
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId
            ? { ...i, ...item, qty: Math.min(i.qty + requested, item.stock) }
            : i,
        );
      }
      return [...prev, { ...item, qty: Math.min(requested, item.stock) }];
    });
  }, []);

  const addMultiple = useCallback(
    (itemsToAdd: Array<{ item: Omit<CartItem, "qty">; qty?: number }>) => {
      setItems((prev) => {
        const next = [...prev];
        for (const { item, qty = 1 } of itemsToAdd) {
          if (item.stock <= 0) continue;
          const requested = Math.max(1, qty);
          const existingIdx = next.findIndex((i) => i.variantId === item.variantId);
          const current = existingIdx >= 0 ? next[existingIdx] : undefined;
          if (current && existingIdx >= 0) {
            const updatedQty = Math.min(current.qty + requested, item.stock);
            next[existingIdx] = { ...current, ...item, qty: updatedQty };
          } else {
            next.push({ ...item, qty: Math.min(requested, item.stock) });
          }
        }
        return next;
      });
    },
    [],
  );

  const setQty = useCallback((variantId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.flatMap((i) => {
            if (i.variantId !== variantId) return [i];
            if (i.stock <= 0) return [];
            return [{ ...i, qty: Math.min(qty, i.stock) }];
          }),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const saveForLater = useCallback(
    (variantId: string) => {
      const target = items.find((i) => i.variantId === variantId);
      if (!target) return;
      setItems((prev) => prev.filter((i) => i.variantId !== variantId));
      setSavedItems((s) => (s.some((x) => x.variantId === variantId) ? s : [...s, target]));
    },
    [items],
  );

  const moveToCart = useCallback(
    (variantId: string) => {
      const target = savedItems.find((i) => i.variantId === variantId);
      if (!target) return;
      setSavedItems((prev) => prev.filter((i) => i.variantId !== variantId));
      if (target.stock > 0) {
        setItems((c) => {
          const existing = c.find((x) => x.variantId === variantId);
          if (existing) {
            return c.map((x) =>
              x.variantId === variantId
                ? { ...x, qty: Math.min(x.qty + target.qty, Math.max(1, target.stock)) }
                : x,
            );
          }
          return [...c, { ...target, qty: Math.min(Math.max(1, target.qty), target.stock) }];
        });
      }
    },
    [savedItems],
  );

  const removeSaved = useCallback((variantId: string) => {
    setSavedItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const syncWithCatalog = useCallback((products: Product[]) => {
    if (!products || products.length === 0) return;

    const variantMap = new Map<string, { product: Product; variant: Variant }>();
    for (const product of products) {
      for (const variant of product.product_variants ?? []) {
        variantMap.set(variant.id, { product, variant });
      }
    }
    if (variantMap.size === 0) return;

    const reconcile = (list: CartItem[], clampQty: boolean): CartItem[] => {
      let changed = false;
      const next = list.map((item) => {
        const match = variantMap.get(item.variantId);
        if (!match) return item;
        const { product, variant } = match;
        const nextStock =
          product.is_active === false || variant.is_active === false
            ? 0
            : Math.max(0, Number(variant.stock ?? 0));
        const nextPrice = Number(variant.price);
        const nextMrp = Number(variant.mrp || variant.price);
        const nextQty = clampQty && nextStock > 0 ? Math.min(item.qty, nextStock) : item.qty;
        const nextNameEn = product.name_en || product.name;
        const nextNameHi = product.name_hi ?? null;
        const nextVariantEn = variant.label_en || variant.label;
        const nextVariantHi = variant.label_hi ?? null;
        const nextImage = product.image_url ?? item.imageUrl;

        if (
          item.stock !== nextStock ||
          item.price !== nextPrice ||
          item.mrp !== nextMrp ||
          item.qty !== nextQty ||
          item.name_en !== nextNameEn ||
          item.name_hi !== nextNameHi ||
          item.variantLabel_en !== nextVariantEn ||
          item.variantLabel_hi !== nextVariantHi ||
          item.imageUrl !== nextImage
        ) {
          changed = true;
          return {
            ...item,
            name_en: nextNameEn,
            name_hi: nextNameHi,
            variantLabel_en: nextVariantEn,
            variantLabel_hi: nextVariantHi,
            price: nextPrice,
            mrp: nextMrp,
            stock: nextStock,
            qty: nextQty,
            imageUrl: nextImage,
          };
        }
        return item;
      });
      return changed ? next : list;
    };

    setItems((prev) => reconcile(prev, true));
    setSavedItems((prev) => reconcile(prev, false));
  }, []);

  const actionsValue = useMemo<CartActions>(() => ({
    add,
    addMultiple,
    setQty,
    remove,
    saveForLater,
    moveToCart,
    removeSaved,
    clear,
    syncWithCatalog,
  }), [
    add,
    addMultiple,
    setQty,
    remove,
    saveForLater,
    moveToCart,
    removeSaved,
    clear,
    syncWithCatalog,
  ]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const savings = items.reduce((sum, i) => sum + Math.max(i.mrp - i.price, 0) * i.qty, 0);
    return {
      items,
      savedItems,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal,
      savings,
      add,
      addMultiple,
      setQty,
      remove,
      saveForLater,
      moveToCart,
      removeSaved,
      clear,
      syncWithCatalog,
      hydrated,
    };
  }, [
    items,
    savedItems,
    add,
    addMultiple,
    setQty,
    remove,
    saveForLater,
    moveToCart,
    removeSaved,
    clear,
    syncWithCatalog,
    hydrated,
  ]);

  return (
    <CartActionsContext.Provider value={actionsValue}>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

/**
 * Stable cart actions hook (add, setQty, remove, etc.).
 * Its returned functions never change, causing ZERO re-renders in consumers.
 */
export function useCartActions(): CartActions {
  const ctx = useContext(CartActionsContext);
  if (!ctx) throw new Error("useCartActions must be used inside CartProvider");
  return ctx;
}
