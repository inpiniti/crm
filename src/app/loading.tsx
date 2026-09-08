import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden animate-in fade-in duration-150 select-none">
      {/* 2열: 탐색기 (Explorer) 스켈레톤 - 너비 320px 고정 */}
      <div className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card/40">
        {/* 2열 헤더 */}
        <div className="flex h-13 items-center justify-between border-b border-border px-3.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-3.5 w-6 rounded-full" />
          </div>
          <Skeleton className="h-7 w-18 rounded-md" />
        </div>

        {/* 2열 검색 및 필터 영역 */}
        <div className="border-b border-border p-2 space-y-2">
          <Skeleton className="h-8 w-full rounded-md" />
          <div className="grid grid-cols-4 gap-1 p-0.5">
            <Skeleton className="h-6 rounded" />
            <Skeleton className="h-6 rounded" />
            <Skeleton className="h-6 rounded" />
            <Skeleton className="h-6 rounded" />
          </div>
        </div>

        {/* 2열 리스트 아이템 스켈레톤 */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-3">
              <Skeleton className="size-2 rounded-full mt-1.5 shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <Skeleton
                  className="h-3.5 rounded"
                  style={{ width: `${55 + (i % 5) * 9}%` }}
                />
                <Skeleton className="h-2.5 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3열: 상세 (Editor / Detail View) 스켈레톤 */}
      <section className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-background">
        <div className="flex h-13 shrink-0 items-center justify-between border-b border-border bg-card/20 px-4 sm:px-6">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-7">
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-8 w-80 rounded-lg" />
          </div>

          {/* 메타 카드 스켈레톤 */}
          <div className="rounded-xl border border-border/80 bg-card/30 p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-12 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* 본문 에디터 스켈레톤 */}
          <div className="rounded-xl border border-border/70 p-6 space-y-4 bg-card/20">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <div className="pt-4">
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
