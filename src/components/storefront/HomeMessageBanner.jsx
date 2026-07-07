"use client";

import { useSearchParams } from "next/navigation";

export default function HomeMessageBanner() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "";

  if (!message) {
    return null;
  }

  return (
    <div className="bg-rose-50">
      <div className="storefront-container py-3">
        <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700">
          {message}
        </div>
      </div>
    </div>
  );
}
