"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/storefront/CartProvider";

const STORAGE_KEY = "robotiokitVerificationEmail";

function maskEmail(email) {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return email;
  }

  return `${name.slice(0, 1)}***@${domain}`;
}

export default function VerifyEmailForm({ initialEmail = "" }) {
  const router = useRouter();
  const { sessionId, refreshCart } = useCart();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      window.sessionStorage.setItem(STORAGE_KEY, initialEmail);
      window.localStorage.setItem(STORAGE_KEY, initialEmail);
      return;
    }

    const storedEmail =
      window.sessionStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(STORAGE_KEY) || "";

    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [initialEmail]);

  const helperText = email
    ? `We sent a verification code to ${maskEmail(email)}`
    : "Please register again or return to the registration page.";

  function updateOtp(event) {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  }

  async function submitJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Request failed.");
    }

    return result;
  }

  async function handleVerify(event) {
    event.preventDefault();

    if (!email) {
      toast.error("Please register again or return to the registration page.");
      return;
    }

    setIsVerifying(true);

    try {
      const result = await submitJson("/api/auth/verify-email", { email, otp, guestSessionId: sessionId });
      toast.success(result.message || "Email verified successfully.");
      setIsVerified(true);
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
      await refreshCart().catch(() => null);
      router.push("/");
      router.refresh();
    } catch (verifyError) {
      toast.error(verifyError instanceof Error ? verifyError.message : "Unable to verify email.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) {
      toast.error("Please register again or return to the registration page.");
      return;
    }

    setIsResending(true);

    try {
      const result = await submitJson("/api/auth/resend-otp", { email });
      toast.success(result.message || "A new verification code has been sent.");
      setOtp("");
      setIsVerified(Boolean(result.data?.alreadyVerified));
    } catch (resendError) {
      toast.error(resendError instanceof Error ? resendError.message : "Unable to resend verification code.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="w-full max-w-lg rounded-[28px] border border-slate-200/80 bg-white p-8 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
      <div className="text-center">
        <Link href="/" className="font-display text-4xl font-bold tracking-tight text-brand-blue">
          Robot<span className="text-brand-orange">Io</span>Kit
        </Link>
        <div className="mx-auto mt-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-mist text-2xl font-bold text-brand-blue">
          @
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-slate-900">
          Verify your email
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">{helperText}</p>
      </div>

      <form onSubmit={handleVerify} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Verification code</span>
          <input
            className="input-base text-center text-2xl font-semibold tracking-[0.35em]"
            value={otp}
            onChange={updateOtp}
            inputMode="numeric"
            placeholder="000000"
            type="text"
          />
        </label>

        {isVerified ? (
          <Link href="/login" className="button-blue w-full">
            Continue to Sign In
          </Link>
        ) : (
          <button type="submit" disabled={isVerifying || !email} className="button-blue w-full disabled:opacity-60">
            {isVerifying ? "Verifying..." : "Verify Email"}
          </button>
        )}
      </form>

      <div className="mt-5 flex flex-col items-center gap-3 text-center text-sm text-slate-500 sm:flex-row sm:justify-between sm:text-left">
        <span>Did not receive the code?</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="font-semibold text-brand-blue transition hover:text-[#163fe0] disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isResending ? "Sending..." : "Resend code"}
        </button>
      </div>
    </div>
  );
}
