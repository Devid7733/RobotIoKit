"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export default function SearchFilters({ categories, activeCategory, activeInStock, activeMinPrice, activeMaxPrice }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [minVal, setMinVal] = useState(activeMinPrice ?? "");
  const [maxVal, setMaxVal] = useState(activeMaxPrice ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMinVal(activeMinPrice ?? "");
    setMaxVal(activeMaxPrice ?? "");
  }, [activeMinPrice, activeMaxPrice]);

  function pushParams(updates) {
    const nextParams = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value || value === 0) {
        nextParams.set(key, String(value));
      } else {
        nextParams.delete(key);
      }
    }
    startTransition(() => {
      router.replace(
        nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname,
        { scroll: false }
      );
    });
  }

  useEffect(() => {
    const id = setTimeout(() => {
      const min = Number(minVal);
      const max = Number(maxVal);
      const nextParams = new URLSearchParams(searchParams.toString());

      if (min > 0) nextParams.set("minPrice", String(min));
      else nextParams.delete("minPrice");

      if (max > 0) nextParams.set("maxPrice", String(max));
      else nextParams.delete("maxPrice");

      startTransition(() => {
        router.replace(
          nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname,
          { scroll: false }
        );
      });
    }, 250);

    return () => clearTimeout(id);
  }, [minVal, maxVal, pathname, router, searchParams]);

  const hasFilters = activeCategory || activeInStock || activeMinPrice || activeMaxPrice;

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Filters</h3>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setMinVal("");
              setMaxVal("");
              pushParams({ category: "", inStock: "", minPrice: "", maxPrice: "" });
            }}
            className="text-xs font-semibold text-brand-blue hover:text-brand-blue/80"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Category</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => pushParams({ category: "" })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                !activeCategory
                  ? "bg-brand-blue text-white"
                  : "border border-slate-200 text-slate-600 hover:border-brand-blue/30 hover:text-brand-blue"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => pushParams({ category: cat.slug })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeCategory === cat.slug
                    ? "bg-brand-blue text-white"
                    : "border border-slate-200 text-slate-600 hover:border-brand-blue/30 hover:text-brand-blue"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <label className={`flex cursor-pointer items-center gap-2 text-sm font-medium ${isPending ? "text-slate-400" : "text-slate-700"}`}>
          <input
            type="checkbox"
            checked={activeInStock}
            onChange={(e) => pushParams({ inStock: e.target.checked ? "true" : "" })}
            disabled={isPending}
            className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
          />
          In Stock Only
        </label>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Price Range</div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
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
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
            <input
              type="number"
              min={0}
              value={maxVal}
              onChange={(e) => setMaxVal(e.target.value)}
              placeholder="Max"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-6 pr-2 text-sm text-slate-700 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
