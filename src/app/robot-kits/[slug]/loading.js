import StorefrontShell from "@/components/storefront/StorefrontShell";
import { RobotKitDetailSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <StorefrontShell>
      <RobotKitDetailSkeleton />
    </StorefrontShell>
  );
}
