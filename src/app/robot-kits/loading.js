import StorefrontShell from "@/components/storefront/StorefrontShell";
import { RobotKitsPageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <StorefrontShell>
      <RobotKitsPageSkeleton />
    </StorefrontShell>
  );
}
