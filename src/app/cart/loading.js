import StorefrontShell from "@/components/storefront/StorefrontShell";
import { CartPageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <StorefrontShell>
      <CartPageSkeleton />
    </StorefrontShell>
  );
}
