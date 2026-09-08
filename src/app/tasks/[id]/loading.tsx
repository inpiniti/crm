import { Skeleton } from "@/components/ui/skeleton";

export default function TaskDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-7 animate-in fade-in duration-100">
      {/* 경로 & 타이틀 */}
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-8 w-96 rounded-lg" />
      </div>

      {/* 메타 패널 */}
      <div className="rounded-xl border border-border/80 bg-card/40 p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 본문 / 작업 기록 */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-28 rounded" />
        <div className="rounded-xl border border-border/70 p-5 space-y-3 bg-card/30">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
      </div>
    </div>
  );
}
