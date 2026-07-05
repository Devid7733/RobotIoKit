"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/storefront/CartProvider";
import Icon from "@/components/common/Icon";
import AuthBrandPanel from "@/components/storefront/AuthBrandPanel";

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
  const [showPassword, setShowPassword] = useState(false);

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
      const message = submitError instanceof Error ? submitError.message : "Authentication failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel />
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="font-display text-3xl font-bold tracking-tight text-brand-blue">
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
            <div className="relative">
              <input
                className="input-base pr-11"
                name="password"
                value={form.password}
                onChange={updateField}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                minLength={isRegister ? 8 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} className="h-5 w-5" />
              </button>
            </div>

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
      </div>
    </div>
  );
}
