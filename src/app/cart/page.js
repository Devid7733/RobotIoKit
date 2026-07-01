import Link from "next/link";
import Breadcrumb from "@/components/common/Breadcrumb";
import StorefrontShell from "@/components/storefront/StorefrontShell";
import CartPageClient from "@/components/storefront/CartPageClient";

export default function CartPage() {
  return (
    <StorefrontShell>
      <div className="storefront-container page-section">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
        <CartPageClient />
      </div>
    </StorefrontShell>
  );
}
