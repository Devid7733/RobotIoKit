"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function PriceRangeFilter({ catalogMax, activeMin, activeMax }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [minVal, setMinVal] = useState(activeMin ?? "");
  const [maxVal, setMaxVal] = useState(activeMax ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const min = Number(minVal);
      const max = Number(maxVal);
      const nextParams = new URLSearchParams(searchParams.toString());

      if (min > 0) {
        nextParams.set("minPrice", String(min));
      } else {
        nextParams.delete("minPrice");
      }

      if (max > 0 && max < catalogMax) {
        nextParams.set("maxPrice", String(max));
      } else {
        nextParams.delete("maxPrice");
      }

      startTransition(() => {
        router.replace(
          nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname,
          { scroll: false }
        );
      });
    }, 180);

    return () => clearTimeout(timeoutId);
  }, [minVal, maxVal, catalogMax, pathname, router, searchParams]);

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            $
          </span>
          <input
            type="number"
            min={0}
            value={minVal}
            onChange={(e) => setMinVal(e.target.value)}
            placeholder="Min"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-6 pr-2 text-sm text-slate-700 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            aria-label="Minimum price"
          />
        </div>
        <span className="text-slate-400">—</span>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            $
          </span>
          <input
            type="number"
            min={0}
            value={maxVal}
            onChange={(e) => setMaxVal(e.target.value)}
            placeholder={String(catalogMax)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-6 pr-2 text-sm text-slate-700 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            aria-label="Maximum price"
          />
        </div>
      </div>
      {isPending ? (
        <p className="mt-2 text-xs text-slate-400">Updating price filter...</p>
      ) : null}
    </div>
  );
}
