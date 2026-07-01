import StorefrontShell from "@/components/storefront/StorefrontShell";
import { AccountPageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <StorefrontShell>
      <AccountPageSkeleton />
    </StorefrontShell>
  );
}
