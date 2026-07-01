"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const EXPIRED_MESSAGE = "Payment expired. Please place your order again.";

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function KhqrPaymentActions({
  orderId,
  orderNumber = "",
  paymentExpiresAt = null,
  paymentStatus = "UNPAID"
}) {
  const router = useRouter();
  const hasExpiredRequestRun = useRef(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [remainingMs, setRemainingMs] = useState(() =>
    paymentExpiresAt ? new Date(paymentExpiresAt).getTime() - Date.now() : 0
  );
  const canExpire = paymentStatus === "UNPAID";
  const isExpired = paymentStatus === "EXPIRED" || (canExpire && paymentExpiresAt && remainingMs <= 0);
  const countdownLabel = useMemo(() => formatTime(remainingMs), [remainingMs]);
  const isCheckDisabled = paymentStatus !== "UNPAID" || isChecking || isExpired;

  useEffect(() => {
    if (!paymentExpiresAt || !canExpire) {
      return undefined;
    }

    function updateRemaining() {
      setRemainingMs(new Date(paymentExpiresAt).getTime() - Date.now());
    }

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);

    return () => window.clearInterval(intervalId);
  }, [canExpire, paymentExpiresAt]);

  useEffect(() => {
    if (!paymentExpiresAt || !canExpire || remainingMs > 0 || hasExpiredRequestRun.current) {
      return;
    }

    hasExpiredRequestRun.current = true;

    async function expirePayment() {
      await fetch(`/api/orders/${orderId}/khqr-payment/expire`, {
        method: "POST"
      }).catch(() => null);
      router.push(`/?message=${encodeURIComponent(EXPIRED_MESSAGE)}`);
      router.refresh();
    }

    expirePayment();
  }, [canExpire, orderId, paymentExpiresAt, remainingMs, router]);

  useEffect(() => {
    if (!canExpire || isExpired || isChecking) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      checkPayment({ silent: true });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [canExpire, isChecking, isExpired]);

  async function checkPayment({ silent = false } = {}) {
    if (isExpired) {
      router.push(`/?message=${encodeURIComponent(EXPIRED_MESSAGE)}`);
      return;
    }

    try {
      setIsChecking(true);
      if (!silent) {
        setError("");
        setNotice("");
      }

      const response = await fetch(`/api/orders/${orderId}/khqr-payment`, {
        method: "PATCH"
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        if (response.status === 410) {
          router.push(`/?message=${encodeURIComponent(EXPIRED_MESSAGE)}`);
          return;
        }

        if (response.status === 402) {
          if (!silent) {
            setNotice(result.message || "Payment has not been received yet.");
          }
          return;
        }

        throw new Error(result.message || "Unable to verify payment.");
      }

      const publicNumber = encodeURIComponent(orderNumber || orderId);
      router.push(`/checkout/success?orderId=${orderId}&orderNumber=${publicNumber}`);
      router.refresh();
    } catch (checkError) {
      if (!silent) {
        setError(checkError instanceof Error ? checkError.message : "Unable to verify payment.");
      }
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {paymentExpiresAt && canExpire ? (
        <div className={`rounded-2xl px-4 py-3 text-center ${isExpired ? "bg-rose-50 text-rose-700" : "bg-slate-900 text-white"}`}>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-75">Payment expires in</div>
          <div className="mt-1 font-display text-3xl font-semibold tracking-tight">{countdownLabel}</div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={checkPayment}
        disabled={isCheckDisabled}
        className="button-success py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExpired
          ? "Payment Expired"
          : paymentStatus === "FAILED"
            ? "Payment Failed"
            : paymentStatus === "PAID"
              ? "Paid"
              : isChecking
                ? "Checking Bakong..."
                : "Check Payment"}
      </button>
      {notice ? <p className="text-center text-sm text-slate-500">{notice}</p> : null}
      {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}
      <Link href="/orders" className="text-center text-sm font-semibold text-brand-blue">
        Check payment later from My Orders
      </Link>
    </div>
  );
}
