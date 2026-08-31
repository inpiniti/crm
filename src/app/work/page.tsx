import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Markdown } from "@/components/common/Markdown";
import { EmptyState, PageHeader, Panel } from "@/components/common/Panel";
import { Chip, StatusDot } from "@/components/common/StatusBadge";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { TASK_STATUS_LABEL } from "@/domain/tasks/task-status";
import { WORK_KIND_LABEL, formatDuration } from "@/domain/tasks/work";
import { listWorkByDate, listWorkDates, type WorkTimelineItem } from "@/infrastructure/supabase/repositories/tasks";
import { attempt } from "@/lib/attempt";
import { addDays, formatDateTime, todayKst, weekdayKst } from "@/lib/date";
import { cn } from "@/lib/utils";

export default async function WorkPage({ searchParams }: PageProps<"/work">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.date) ? sp.date[0] : sp.date;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayKst();
  const today = todayKst();

  const r = await attempt(() => Promise.all([listWorkByDate(date), listWorkDates(90)]));
  if (!r.ok) return <SetupNotice error={r.error} />;
  const [items, dates] = r.value;
  const totalMin = items.reduce((s, w) => s + (w.durationMin ?? 0), 0);

  const groups = new Map<string, WorkTimelineItem[]>();
  for (const w of items) {
    const key = w.companyName ? `${w.companyName} · ${w.projectName}` : `개인 · ${w.projectName}`;
    groups.set(key, [...(groups.get(key) ?? []), w]);
  }

  const navBtn = "inline-flex size-7 items-center justify-center rounded-md text-text-3 transition-colors hover:bg-accent hover:text-foreground";

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Link href={`/work?date=${addDays(date, -1)}`} className={navBtn} aria-label="전날">
              <ChevronLeft className="size-4" />
            </Link>
            <span className="num">
              {date} {weekdayKst(date)}요일
            </span>
            <Link href={`/work?date=${addDays(date, 1)}`} className={navBtn} aria-label="다음날">
              <ChevronRight className="size-4" />
            </Link>
            {date === today && <span className="text-[13px] font-medium text-blue">오늘</span>}
          </span>
        }
        description={items.length ? <span className="num">{items.length}건{totalMin ? ` · ${formatDuration(totalMin)}` : ""}</span> : undefined}
        actions={
          date !== today && (
            <Link href="/work" className="text-[13px] text-text-2 hover:text-foreground">
              오늘로
            </Link>
          )
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_200px]">
        <div className="space-y-6">
          {items.length === 0 && <EmptyState icon={Clock} title="이 날은 기록된 작업이 없어요" description="업무 상세에서 한 일을 적으면 여기에 모여요" />}
          {[...groups.entries()].map(([name, list]) => (
            <section key={name}>
              <h2 className="mb-2 text-[14px] font-bold">{name}</h2>
              <Panel className="divide-y divide-border">
                {list.map((w) => (
                  <div key={w.id} className="px-4 py-3">
                    <div className="mb-1 flex items-center gap-2 text-[12px] text-text-3">
                      <span className="num font-medium text-text-2">{formatDateTime(w.workedAt).slice(11)}</span>
                      <Link href={`/tasks/${w.taskId}`} className="font-medium text-foreground hover:text-blue">
                        {w.taskTitle}
                      </Link>
                      <span className="inline-flex items-center gap-1">
                        <StatusDot status={w.taskStatus} />
                        {TASK_STATUS_LABEL[w.taskStatus]}
                      </span>
                      {w.kind && <Chip className="bg-blue-weak text-blue">{WORK_KIND_LABEL[w.kind]}</Chip>}
                      {w.durationMin ? <span className="num ml-auto">{formatDuration(w.durationMin)}</span> : null}
                    </div>
                    <Markdown className="text-[13px]">{w.body}</Markdown>
                  </div>
                ))}
              </Panel>
            </section>
          ))}
        </div>
        <aside>
          <div className="mb-2 text-[12px] font-medium text-text-3">최근 작업한 날</div>
          <div className="flex flex-col gap-0.5">
            {dates.length === 0 && <div className="text-[13px] text-text-3">아직 없어요</div>}
            {dates.map((d) => (
              <Link
                key={d.date}
                href={`/work?date=${d.date}`}
                className={cn(
                  "num flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  d.date === date ? "bg-accent font-semibold text-foreground" : "text-text-2 hover:bg-hover",
                )}
              >
                <span>
                  {d.date.slice(5)} {weekdayKst(d.date)}
                </span>
                <span className="text-[12px] text-text-3">{d.count}</span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
