"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function InStockFilter({ active }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (e.target.checked) {
      nextParams.set("inStock", "true");
    } else {
      nextParams.delete("inStock");
    }

    startTransition(() => {
      router.replace(
        nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname,
        { scroll: false }
      );
    });
  }

  return (
    <label className={`mt-8 flex cursor-pointer items-center gap-3 text-sm font-medium ${isPending ? "text-slate-400" : "text-slate-700"}`}>
      <input
        type="checkbox"
        checked={active}
        onChange={handleChange}
        disabled={isPending}
        className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
      />
      In Stock Only
    </label>
  );
}
