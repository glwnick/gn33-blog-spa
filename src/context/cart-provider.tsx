import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLineItem } from '@/schemas/cart';
import { cartSchema } from '@/schemas/cart';
import { roundToCents } from '@/lib/formatting';

const CART_STORAGE_KEY = 'gn33-shop-cart';

type CartContextValue = {
  items: Array<CartLineItem>;
  itemCount: number;
  subtotal: number;
  addItem: (item: CartLineItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
};

const initialState: CartContextValue = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  addItem: () => null,
  updateQuantity: () => null,
  removeItem: () => null,
  clearCart: () => null,
};

const CartContext = createContext<CartContextValue>(initialState);

// Same two-step guard as `theme-provider.tsx`'s `readStoredTheme`, for the same two reasons: under
// plain Node `localStorage` is undeclared, and under Vite's dev SSR it exists but `.getItem` isn't
// a real function. Both would otherwise throw during the server render of this provider, which -
// like `ThemeProvider` - mounts unconditionally in `router.tsx`'s `Wrap`, including under subtrees
// that are themselves `ssr: false`.
function readStoredCart(): Array<CartLineItem> {
  if (
    typeof localStorage === 'undefined' ||
    typeof localStorage.getItem !== 'function'
  ) {
    return [];
  }
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return cartSchema.parse(JSON.parse(raw)).items;
  } catch {
    // A payload left over from an earlier, incompatible shape of this schema is worth discarding
    // rather than crashing the whole storefront on it.
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Seeded empty rather than from `readStoredCart()` directly: this provider mounts unconditionally
  // in the root layout, which does render server-side, so its very first client render (the one React
  // hydrates against) has to produce the same output the server did. `TopNav`'s cart badge renders a
  // whole extra element once `itemCount` is nonzero, and appearing/disappearing elements shift the
  // position-based ids every `useId()` call downstream encodes - the exact bug `client.tsx` was just
  // fixed for. Loading the real cart in an effect below keeps every render before that effect
  // identical between server and client, at the cost of the badge popping in a tick after hydration.
  const [items, setItems] = useState<Array<CartLineItem>>([]);

  useEffect(() => {
    setItems(readStoredCart());
  }, []);

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items } satisfies { items: Array<CartLineItem> }),
    );
  }, [items]);

  const addItem = (input: CartLineItem) => {
    setItems((prev) => {
      const existing = prev.find((line) => line.variantId === input.variantId);
      if (!existing) {
        return [...prev, input];
      }
      // A one-of-a-kind line can never grow past 1 - re-adding it just re-confirms the existing line.
      const quantity = input.oneOfAKind ? 1 : existing.quantity + input.quantity;
      return prev.map((line) =>
        line.variantId === input.variantId ? { ...line, quantity } : line,
      );
    });
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    setItems((prev) =>
      quantity < 1
        ? prev.filter((line) => line.variantId !== variantId)
        : prev.map((line) =>
            line.variantId === variantId
              ? { ...line, quantity: line.oneOfAKind ? 1 : quantity }
              : line,
          ),
    );
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((line) => line.variantId !== variantId));
  };

  const clearCart = () => setItems([]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = roundToCents(
      items.reduce((sum, line) => sum + roundToCents(line.unitPrice * line.quantity), 0),
    );
    return { items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
