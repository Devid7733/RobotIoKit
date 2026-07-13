"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/storefront/CartProvider";
import QuantityStepper from "@/components/storefront/QuantityStepper";

export default function RobotKitPurchasePanel({ kit }) {
  const { addItem } = useCart();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isBuying, setIsBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const stockQuantity = Number(kit.stockQuantity || 0);

  const cartItem = {
    id: kit.id,
    type: "robotKit",
    robotKitId: kit.id,
    slug: kit.slug,
    name: kit.name,
    price: kit.price,
    image: kit.image,
    category: "Robot Kits"
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

  return (
    <div className="mt-8">
      <div className="text-sm font-semibold text-slate-700">Quantity:</div>
      <div className="mt-3 flex items-center gap-4">
        <QuantityStepper quantity={quantity} onChange={setQuantity} max={stockQuantity} />
      </div>

      <button
        type="button"
        onClick={buyNow}
        disabled={isBuying || stockQuantity <= 0}
        className="button-primary mt-6 flex w-full items-center justify-center px-8 py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
      >
        {stockQuantity <= 0
          ? "Out of Stock"
          : isBuying
            ? "Adding..."
            : `Add to Cart - $${(kit.price * quantity).toFixed(2)}`}
      </button>
    </div>
  );
}
