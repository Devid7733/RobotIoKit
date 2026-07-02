"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/storefront/CartProvider";

export default function AddToCartButton({
  item,
  quantity = 1,
  className = "button-primary px-4 py-2.5 text-xs",
  disabled = false,
  disabledLabel = "Out of Stock"
}) {
  const { addItem } = useCart();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [added, setAdded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (disabled || status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    setIsSubmitting(true);
    try {
      setError("");
      await addItem(item, quantity);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1200);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Unable to add item.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-stretch gap-1">
      <button type="button" onClick={handleAdd} disabled={disabled || isSubmitting} className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}>
        {disabled ? disabledLabel : isSubmitting ? "Adding..." : added ? "Added" : "Add to Cart"}
      </button>
      {error ? <span className="text-xs font-medium text-red-500">{error}</span> : null}
    </span>
  );
}
