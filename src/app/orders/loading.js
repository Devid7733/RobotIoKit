import StorefrontShell from "@/components/storefront/StorefrontShell";
import { OrdersPageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <StorefrontShell>
      <OrdersPageSkeleton />
    </StorefrontShell>
  );
}
