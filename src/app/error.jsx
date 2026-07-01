"use client";

import Link from "next/link";
import StorefrontShell from "@/components/storefront/StorefrontShell";

export default function GlobalError({ reset }) {
  return (
    <StorefrontShell>
      <div className="storefront-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <div className="text-7xl font-bold text-slate-200">500</div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-slate-500">An unexpected error occurred. Try again or go back to the store.</p>
        <div className="mt-8 flex gap-3">
          <button onClick={reset} className="button-primary px-6 py-3">Try Again</button>
          <Link href="/" className="button-blue px-6 py-3">Go Home</Link>
        </div>
      </div>
    </StorefrontShell>
  );
}
