import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string;
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
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  saveForLater: (variantId: string) => void;
  moveToCart: (variantId: string) => void;
  removeSaved: (variantId: string) => void;
  clear: () => void;
  hydrated: boolean;
};

const STORAGE_KEY = "agt.cart.v1";
const SAVED_KEY = "agt.saved.v1";

const CartContext = createContext<CartContextValue | null>(null);

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
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(savedItems));
  }, [savedItems, hydrated]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId
            ? { ...i, ...item, qty: Math.min(i.qty + qty, Math.max(item.stock, 1)) }
            : i,
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.map((i) => (i.variantId === variantId ? { ...i, qty } : i)),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const saveForLater = useCallback((variantId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.variantId === variantId);
      if (item) setSavedItems((s) => (s.some((x) => x.variantId === variantId) ? s : [...s, item]));
      return prev.filter((i) => i.variantId !== variantId);
    });
  }, []);

  const moveToCart = useCallback((variantId: string) => {
    setSavedItems((prev) => {
      const item = prev.find((i) => i.variantId === variantId);
      if (item) setItems((c) => (c.some((x) => x.variantId === variantId) ? c : [...c, item]));
      return prev.filter((i) => i.variantId !== variantId);
    });
  }, []);

  const removeSaved = useCallback((variantId: string) => {
    setSavedItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

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
      setQty,
      remove,
      saveForLater,
      moveToCart,
      removeSaved,
      clear,
      hydrated,
    };
  }, [
    items,
    savedItems,
    add,
    setQty,
    remove,
    saveForLater,
    moveToCart,
    removeSaved,
    clear,
    hydrated,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
