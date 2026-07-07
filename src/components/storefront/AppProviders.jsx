"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/storefront/CartProvider";
import Icon from "@/components/common/Icon";

export default function AppProviders({ children }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_20px_45px_rgba(15,23,42,0.06)]",
            title: "text-sm font-semibold text-slate-900",
            description: "text-sm text-slate-500",
            icon: "shrink-0",
            actionButton: "button-blue !h-auto !px-3 !py-1.5 !text-xs",
            cancelButton: "!h-auto !bg-transparent !px-2 !py-1 !text-xs !text-slate-400",
            closeButton: "!border-slate-200 !bg-white !text-slate-400"
          }
        }}
        icons={{
          success: <Icon name="checkCircle" className="h-5 w-5 text-emerald-500" />,
          error: <Icon name="xCircle" className="h-5 w-5 text-rose-500" />
        }}
      />
    </SessionProvider>
  );
}
