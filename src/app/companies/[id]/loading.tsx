import { Skeleton } from "@/components/ui/skeleton";

export default function CompanyDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-7 animate-in fade-in duration-100">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-8 w-72 rounded-lg" />
      </div>
      <div className="rounded-xl border border-border/80 bg-card/40 p-5 space-y-4">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>
    </div>
  );
}
