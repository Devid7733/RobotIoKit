import StorefrontShell from "@/components/storefront/StorefrontShell";
import { ProductsPageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <StorefrontShell>
      <ProductsPageSkeleton />
    </StorefrontShell>
  );
}
