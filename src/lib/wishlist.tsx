import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Product } from "./queries";
import { toast } from "sonner";

type WishlistContextValue = {
  items: Product[];
  ids: Set<string>;
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  count: number;
  clear: () => void;
};

const STORAGE_KEY = "agt.wishlist.v1";

const WishlistContext = createContext<WishlistContextValue | null>(null);

function read(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const toggle = useCallback((product: Product) => {
    setItems((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      const isHi = typeof window !== "undefined" && localStorage.getItem("agt.lang") !== "en";
      const displayName = (isHi && product.name_hi) ? product.name_hi : (product.name || product.name_en || "सामान");
      if (exists) {
        toast.info(isHi ? `पसंदीदा सूची से हटाया: ${displayName}` : `Removed ${displayName} from wishlist`);
        return prev.filter((p) => p.id !== product.id);
      } else {
        toast.success(isHi ? `पसंदीदा सूची में सहेजा गया: ${displayName}` : `Saved ${displayName} to wishlist`);
        return [...prev, product];
      }
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const ids = useMemo(() => new Set(items.map((p) => p.id)), [items]);
  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      ids,
      toggle,
      remove,
      has,
      count: items.length,
      clear,
    }),
    [items, ids, toggle, remove, has, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
