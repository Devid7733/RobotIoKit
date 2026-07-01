"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const RESET_EMAIL_KEY = "robotiokitPasswordResetEmail";

function maskEmail(email) {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return email;
  }

  return `${name.slice(0, 1)}***@${domain}`;
}

export default function ResetPasswordForm({ initialEmail = "" }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      window.sessionStorage.setItem(RESET_EMAIL_KEY, initialEmail);
      window.localStorage.setItem(RESET_EMAIL_KEY, initialEmail);
      return;
    }

    const storedEmail =
      window.sessionStorage.getItem(RESET_EMAIL_KEY) || window.localStorage.getItem(RESET_EMAIL_KEY) || "";

    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [initialEmail]);

  function updateOtp(event) {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Please request a new password reset code.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to reset password.");
      }

      window.sessionStorage.removeItem(RESET_EMAIL_KEY);
      window.localStorage.removeItem(RESET_EMAIL_KEY);
      setMessage("Password reset successfully. Redirecting to sign in...");

      window.setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-8 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
      <div className="text-center">
        <Link href="/" className="font-display text-4xl font-bold tracking-tight text-brand-blue">
          Robot<span className="text-brand-orange">Io</span>Kit
        </Link>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-slate-900">
          Create a new password
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          {email ? `Enter the reset code sent to ${maskEmail(email)}.` : "Please request a new password reset code."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Reset code</span>
          <input
            className="input-base text-center text-2xl font-semibold tracking-[0.35em]"
            value={otp}
            onChange={updateOtp}
            inputMode="numeric"
            placeholder="000000"
            type="text"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">New password</span>
          <input
            className="input-base"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</span>
          <input
            className="input-base"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter new password"
            type="password"
          />
        </label>

        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <button type="submit" disabled={isSubmitting || !email} className="button-blue w-full disabled:opacity-60">
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Need another code?{" "}
        <Link href="/forgot-password" className="font-semibold text-brand-blue">
          Request reset
        </Link>
      </p>
    </div>
  );
}
