"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/common/Icon";

export default function ProductSearchFilter({ initialValue }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue || "");

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    const id = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (value.trim()) nextParams.set("search", value.trim());
      else nextParams.delete("search");
      nextParams.delete("page");

      router.replace(
        nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname,
        { scroll: false }
      );
    }, 350);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, pathname, router]);

  return (
    <div className="relative mt-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products..."
        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
      />
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon name="search" className="h-5 w-5" />
      </span>
    </div>
  );
}
