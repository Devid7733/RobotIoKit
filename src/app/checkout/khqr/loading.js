import StorefrontShell from "@/components/storefront/StorefrontShell";
import { KhqrPaymentPageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <StorefrontShell>
      <KhqrPaymentPageSkeleton />
    </StorefrontShell>
  );
}
