"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/storefront/CartProvider";

export default function AppProviders({ children }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
