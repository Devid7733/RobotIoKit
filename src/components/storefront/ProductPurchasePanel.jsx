"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/storefront/CartProvider";

export default function ProductPurchasePanel({ product }) {
  const { addItem } = useCart();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isBuying, setIsBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const cartItem = {
    id: product.id,
    type: "product",
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category
  };

  async function buyNow() {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    setIsBuying(true);
    try {
      await addItem(cartItem, quantity);
      toast.success("Added to cart.");
      router.push("/cart");
    } catch (addError) {
      toast.error(addError instanceof Error ? addError.message : "Unable to add item.");
    } finally {
      setIsBuying(false);
    }
  }

  function updateQuantity(nextValue) {
    setQuantity(Math.max(1, nextValue));
  }

  return (
    <div className="mt-8">
      <div className="text-sm font-semibold text-slate-700">Quantity:</div>
      <div className="mt-3 flex items-center gap-4">
        <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => updateQuantity(quantity - 1)}
            className="h-9 w-10 text-lg text-slate-600 transition hover:bg-slate-50"
          >
            -
          </button>
          <div className="flex h-9 min-w-12 items-center justify-center border-x border-slate-200 px-3 text-sm font-semibold text-slate-900">
            {quantity}
          </div>
          <button
            type="button"
            onClick={() => updateQuantity(quantity + 1)}
            className="h-9 w-10 text-lg text-slate-600 transition hover:bg-slate-50"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={buyNow}
        disabled={isBuying}
        className="button-primary mt-6 flex w-full items-center justify-center px-8 py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isBuying ? "Adding..." : `Add to Cart - $${(product.price * quantity).toFixed(2)}`}
      </button>
    </div>
  );
}
