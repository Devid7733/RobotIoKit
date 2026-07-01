"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "robotiokit-cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    async function loadCart() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to load cart.");
        }

        setItems(result.data.items || []);
        setSessionId(result.data.sessionId || "");

        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const localItems = JSON.parse(raw);
          if (Array.isArray(localItems) && localItems.length > 0 && (result.data.items || []).length === 0) {
            for (const item of localItems) {
              await fetch("/api/cart", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  productId: item.productId || (item.type === "product" ? item.id : null),
                  robotKitId: item.robotKitId || (item.type === "robotKit" ? item.id : null),
                  quantity: item.qty || 1
                })
              });
            }

            const synced = await fetch("/api/cart", { cache: "no-store" });
            const syncedResult = await synced.json();
            if (synced.ok && syncedResult.ok) {
              setItems(syncedResult.data.items || []);
              setSessionId(syncedResult.data.sessionId || "");
            }
          }

          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        setItems([]);
      } finally {
        setIsReady(true);
      }
    }

    loadCart();
  }, []);

  async function refreshCart() {
    const response = await fetch("/api/cart", { cache: "no-store" });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to refresh cart.");
    }

    setItems(result.data.items || []);
    setSessionId(result.data.sessionId || "");
  }

  async function addItem(item, quantity = 1) {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        productId: item.productId || (item.type === "product" ? item.id : null),
        robotKitId: item.robotKitId || (item.type === "robotKit" ? item.id : null),
        quantity
      })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to add item.");
    }

    setItems(result.data.items || []);
    setSessionId(result.data.sessionId || "");
  }

  async function updateQuantity(cartItemId, qty) {
    const response = await fetch("/api/cart", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cartItemId,
        quantity: qty
      })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to update cart item.");
    }

    setItems(result.data.items || []);
    setSessionId(result.data.sessionId || "");
  }

  async function removeItem(cartItemId) {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cartItemId
      })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to remove cart item.");
    }

    setItems(result.data.items || []);
    setSessionId(result.data.sessionId || "");
  }

  async function clearCart() {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to clear cart.");
    }

    setItems(result.data.items || []);
    setSessionId(result.data.sessionId || "");
  }

  const value = useMemo(() => {
    const itemCount = items.reduce((total, item) => total + item.qty, 0);
    const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);

    return {
      items,
      isReady,
      sessionId,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart
    };
  }, [items, isReady, sessionId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}
