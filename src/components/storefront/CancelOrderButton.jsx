"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Icon from "@/components/common/Icon";

export default function CancelOrderButton({ orderId, compact = false }) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  async function cancelOrder() {
    if (isCancelling) {
      return;
    }

    const confirmed = window.confirm("Cancel this pending order?");

    if (!confirmed) {
      return;
    }

    try {
      setIsCancelling(true);

      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to cancel order.");
      }

      toast.success("Order cancelled.");
      router.refresh();
    } catch (cancelError) {
      toast.error(cancelError instanceof Error ? cancelError.message : "Unable to cancel order.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <button
        type="button"
        onClick={cancelOrder}
        disabled={isCancelling}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-center text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 ${
          compact ? "w-full" : ""
        }`}
      >
        <Icon name="xCircle" className="h-4 w-4" />
        {isCancelling ? "Cancelling..." : "Cancel Order"}
      </button>
    </div>
  );
}
