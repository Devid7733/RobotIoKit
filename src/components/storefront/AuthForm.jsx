"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import { useCart } from "@/components/storefront/CartProvider";

function sanitizeCallbackUrl(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "";
  }
  return value;
}

export default function AuthForm({ mode, callbackUrl = "" }) {
  const router = useRouter();
  const { sessionId } = useCart();
  const isRegister = mode === "register";
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            password: form.password
          })
        });

        const registerResult = await registerResponse.json();
        if (!registerResponse.ok || !registerResult.ok) {
          throw new Error(registerResult.message || "Unable to create account.");
        }

        const verificationEmail = registerResult.data?.email || form.email;
        window.sessionStorage.setItem("robotiokitVerificationEmail", verificationEmail);
        window.localStorage.setItem("robotiokitVerificationEmail", verificationEmail);
        router.push(`/verify-email?email=${encodeURIComponent(verificationEmail)}`);
        router.refresh();
        return;
      }

      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        guestSessionId: sessionId,
        redirect: false
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      const session = await getSession();
      const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);
      const nextPath = session?.user?.role === "ADMIN" ? "/admin" : safeCallbackUrl || "/";

      router.push(nextPath);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
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
          {isRegister ? "Create your account" : "Sign in to your account"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          {isRegister
            ? "Register with your basic details. You can finish your profile later."
            : "Access your cart, orders, and checkout flow."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {isRegister ? (
          <input
            className="input-base"
            name="fullName"
            value={form.fullName}
            onChange={updateField}
            placeholder="Full name"
            type="text"
          />
        ) : null}

        <input
          className="input-base"
          name="email"
          value={form.email}
          onChange={updateField}
          placeholder="Email address"
          type="email"
        />
        <input
          className="input-base"
          name="password"
          value={form.password}
          onChange={updateField}
          placeholder="Password"
          type="password"
          minLength={isRegister ? 8 : undefined}
        />

        {isRegister ? (
          <>
            <p className="text-xs leading-5 text-slate-400">
              Password must be at least 8 characters and include one uppercase letter and one number.
            </p>
            <p className="text-sm leading-6 text-slate-500">
              Phone, province, city, and address can be added from your account after email verification.
            </p>
          </>
        ) : (
          <div className="text-right text-sm">
            <Link href="/forgot-password" className="font-medium text-brand-blue">
              Forgot password?
            </Link>
          </div>
        )}

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <button type="submit" disabled={isSubmitting} className="button-blue w-full">
          {isSubmitting
            ? isRegister
              ? "Creating account..."
              : "Signing in..."
            : isRegister
              ? "Create Account"
              : "Sign In"}
        </button>
      </form>

      {!isRegister && error.toLowerCase().includes("verify") ? (
        <p className="mt-4 text-center text-sm text-slate-500">
          Need a new code?{" "}
          <Link href={`/verify-email?email=${encodeURIComponent(form.email)}`} className="font-semibold text-brand-blue">
            Verify email
          </Link>
        </p>
      ) : null}

      <p className="mt-6 text-center text-sm text-slate-500">
        {isRegister ? "Already have an account?" : "New to RobotIoKit?"}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-brand-blue">
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
