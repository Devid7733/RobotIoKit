import StorefrontShell from "@/components/storefront/StorefrontShell";
import { CheckoutPageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <StorefrontShell>
      <CheckoutPageSkeleton />
    </StorefrontShell>
  );
}
