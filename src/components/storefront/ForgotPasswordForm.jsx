"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const RESET_EMAIL_KEY = "robotiokitPasswordResetEmail";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to request password reset.");
      }

      const normalizedEmail = email.trim().toLowerCase();
      window.sessionStorage.setItem(RESET_EMAIL_KEY, normalizedEmail);
      window.localStorage.setItem(RESET_EMAIL_KEY, normalizedEmail);
      toast.success(result.message || "Reset code sent.");

      window.setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`);
      }, 700);
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Unable to request password reset.");
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
          Reset your password
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Enter your account email and we will send a secure reset code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span>
          <input
            className="input-base"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
          />
        </label>

        <button type="submit" disabled={isSubmitting} className="button-blue w-full disabled:opacity-60">
          {isSubmitting ? "Sending code..." : "Send Reset Code"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-brand-blue">
          Sign in
        </Link>
      </p>
    </div>
  );
}
