import StorefrontShell from "@/components/storefront/StorefrontShell";
import { ProductDetailSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <StorefrontShell>
      <ProductDetailSkeleton />
    </StorefrontShell>
  );
}
