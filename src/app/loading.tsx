import { SkeletonRows } from "@/components/common/Panel";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-2 h-7 w-48" />
      <Skeleton className="mb-6 h-4 w-72" />
      <SkeletonRows n={6} />
    </div>
  );
}
