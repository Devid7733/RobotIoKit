import StorefrontShell from "@/components/storefront/StorefrontShell";
import { SearchPageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <StorefrontShell>
      <SearchPageSkeleton />
    </StorefrontShell>
  );
}
