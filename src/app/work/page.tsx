import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Markdown } from "@/components/common/Markdown";
import { EmptyState, Panel } from "@/components/common/Panel";
import { Chip, StatusDot } from "@/components/common/StatusBadge";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { WorkDateNav } from "@/components/features/WorkDateNav";
import { DetailTopBar } from "@/components/layout/DetailTopBar";
import { DetailHeaderSetter } from "@/components/layout/DetailHeaderContext";
import { TASK_STATUS_LABEL } from "@/domain/tasks/task-status";
import { WORK_KIND_LABEL, formatDuration } from "@/domain/tasks/work";
import { listWorkByDate, listWorkDates, listTaskOptions, type WorkTimelineItem } from "@/infrastructure/supabase/repositories/tasks";
import { attempt } from "@/lib/attempt";
import { formatDateTime, todayKst, weekdayKst } from "@/lib/date";

export default async function WorkPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.date) ? sp.date[0] : sp.date;
  const requested = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
  const today = todayKst();

  // 날짜 제한 없이 모든 작업일 조회 & 작업 추가용 업무 옵션 조회
  const [rd, ro] = await Promise.all([
    attempt(() => listWorkDates()),
    attempt(() => listTaskOptions()),
  ]);
  if (!rd.ok) return <SetupNotice error={rd.error} />;
  const dates = rd.value; // 최신순
  const taskOptions = ro.ok ? ro.value : [];
  const date = requested ?? dates[0]?.date ?? today;

  const r = await attempt(() => listWorkByDate(date));
  if (!r.ok) return <SetupNotice error={r.error} />;
  const items = r.value;
  const totalMin = items.reduce((s, w) => s + (w.durationMin ?? 0), 0);

  // 이전/다음 작업일
  const prevDate = dates.find((d) => d.date < date)?.date;
  const newer = dates.filter((d) => d.date > date);
  const nextDate = newer.at(-1)?.date;

  const groups = new Map<string, WorkTimelineItem[]>();
  for (const w of items) {
    const key = w.companyName ? `${w.companyName} · ${w.projectName}` : `개인 · ${w.projectName}`;
    groups.set(key, [...(groups.get(key) ?? []), w]);
  }

  const navBtn = "inline-flex size-7 items-center justify-center rounded-md text-text-3 transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden">
      <DetailHeaderSetter title={`${date} (${weekdayKst(date)})`} subtitle={items.length > 0 ? `${items.length}건 기록` : "기록 없음"} />
      {/* 2열: 작업한 날짜 탐색기 및 달력 */}
      <WorkDateNav dates={dates} currentDate={date} today={today} taskOptions={taskOptions} />

      {/* 3열: 해당 날짜 작업 타임라인 */}
      <section className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-background">
        <DetailTopBar moduleName="작업" subtitle={date} />
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-7">
          {/* 상단 날짜 및 요약 바 */}
          <div className="flex items-center justify-between border-b border-border/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {prevDate ? (
                  <Link href={`/work?date=${prevDate}`} className={navBtn} aria-label="이전 작업일">
                    <ChevronLeft className="size-4" />
                  </Link>
                ) : (
                  <span className="inline-flex size-7 items-center justify-center rounded-md text-text-3 opacity-25" aria-hidden>
                    <ChevronLeft className="size-4" />
                  </span>
                )}
                {nextDate ? (
                  <Link href={`/work?date=${nextDate}`} className={navBtn} aria-label="다음 작업일">
                    <ChevronRight className="size-4" />
                  </Link>
                ) : (
                  <span className="inline-flex size-7 items-center justify-center rounded-md text-text-3 opacity-25" aria-hidden>
                    <ChevronRight className="size-4" />
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="num text-2xl font-bold tracking-tight text-foreground">
                    {date} <span className="font-semibold text-lg text-text-2">{weekdayKst(date)}요일</span>
                  </h1>
                  {date === today && (
                    <span className="rounded-md bg-blue-weak px-2 py-0.5 text-[12px] font-semibold text-blue">
                      오늘
                    </span>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="num mt-1 text-[13px] text-text-3">
                    총 {items.length}건{totalMin > 0 ? ` · ${formatDuration(totalMin)}` : ""}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 작업 목록 */}
          {items.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="이 날은 기록된 작업이 없어요"
              description="업무 상세에서 한 일을 적으면 여기에 모여요"
            />
          ) : (
            <div className="space-y-6">
              {[...groups.entries()].map(([name, list]) => (
                <section key={name} className="space-y-2.5">
                  <h2 className="text-[13.5px] font-bold text-foreground px-1">{name}</h2>
                  <Panel className="divide-y divide-border overflow-hidden">
                    {list.map((w) => (
                      <div key={w.id} className="p-4 space-y-2 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-2.5 text-[12px] text-text-3">
                          <span className="num font-semibold text-text-2">{formatDateTime(w.workedAt).slice(11)}</span>
                          <Link href={`/tasks/${w.taskId}`} className="font-medium text-foreground hover:text-blue hover:underline transition-colors">
                            {w.taskTitle}
                          </Link>
                          <span className="inline-flex items-center gap-1">
                            <StatusDot status={w.taskStatus} />
                            <span>{TASK_STATUS_LABEL[w.taskStatus]}</span>
                          </span>
                          {w.kind && <Chip className="bg-blue-weak text-blue text-[11px]">{WORK_KIND_LABEL[w.kind]}</Chip>}
                          {w.durationMin ? <span className="num ml-auto font-medium text-text-2">{formatDuration(w.durationMin)}</span> : null}
                        </div>
                        <Markdown className="text-[13px] leading-relaxed text-foreground/90 pl-0.5">{w.body}</Markdown>
                      </div>
                    ))}
                  </Panel>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  </div>
);
}

