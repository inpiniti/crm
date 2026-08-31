import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TaskTable } from "@/components/features/TaskTable";
import { Markdown } from "@/components/common/Markdown";
import { PageHeader, Panel, Section, Stat } from "@/components/common/Panel";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { formatDuration } from "@/domain/tasks/work";
import { listTasks, listWorkByDate, listWorkDates } from "@/infrastructure/supabase/repositories/tasks";
import { attempt } from "@/lib/attempt";
import { formatDateTime, todayKst, weekdayKst } from "@/lib/date";

export default async function DashboardPage() {
  const today = todayKst();

  const r = await attempt(async () => {
    const [overdue, doing, todo, workDates] = await Promise.all([
      listTasks({ overdue: true }),
      listTasks({ status: "doing" }),
      listTasks({ status: "todo", limit: 10 }),
      listWorkDates(90),
    ]);
    // 오늘 작업이 없으면 가장 최근 작업한 날의 기록을 보여준다
    const lastWorkDate = workDates[0]?.date ?? null;
    const recentWork = lastWorkDate ? await listWorkByDate(lastWorkDate) : [];
    return { overdue, doing, todo, lastWorkDate, recentWork };
  });
  if (!r.ok) return <SetupNotice error={r.error} />;
  const { overdue, doing, todo, lastWorkDate, recentWork } = r.value;
  const doingRest = doing.filter((t) => !overdue.some((o) => o.id === t.id));
  const recentMin = recentWork.reduce((s, w) => s + (w.durationMin ?? 0), 0);
  const workLabel = lastWorkDate === today ? "오늘 한 일" : "최근 한 일";

  return (
    <>
      <PageHeader title={`${today} ${weekdayKst(today)}요일`} description="오늘 챙길 것부터" />

      <Panel className="mb-8 grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-3">
        <Stat label="지연" value={overdue.length} suffix="건" tone={overdue.length ? "red" : "muted"} />
        <Stat label="진행 중" value={doing.length} suffix="건" />
        <Stat label={workLabel} value={recentMin ? formatDuration(recentMin) : recentWork.length} suffix={recentMin ? undefined : "건"} />
      </Panel>

      <div className="space-y-8">
        {overdue.length > 0 && (
          <Section title={<span className="text-red">지연된 업무</span>}>
            <TaskTable tasks={overdue} />
          </Section>
        )}
        <Section title="진행 중" extra={<MoreLink href="/tasks?status=doing" />}>
          <TaskTable tasks={doingRest} empty={{ title: "진행 중인 업무가 없어요", description: "할 일에서 하나 골라 진행 중으로 바꿔 보세요" }} />
        </Section>
        <Section title="할 일" extra={<MoreLink href="/tasks?status=todo" />}>
          <TaskTable tasks={todo} empty={{ title: "쌓인 할 일이 없어요" }} />
        </Section>
        {recentWork.length > 0 && lastWorkDate && (
          <Section
            title={
              <>
                {workLabel}
                <span className="num ml-1.5 text-[13px] font-medium text-text-3">
                  {lastWorkDate} {weekdayKst(lastWorkDate)}요일
                </span>
              </>
            }
            extra={<MoreLink href={`/work?date=${lastWorkDate}`} label="타임라인에서 보기" />}
          >
            <Panel className="divide-y divide-border">
              {recentWork.map((w) => (
                <div key={w.id} className="px-4 py-3">
                  <div className="mb-1 flex items-center gap-2 text-[12px] text-text-3">
                    <span className="num text-text-2">{formatDateTime(w.workedAt).slice(11)}</span>
                    <Link href={`/tasks/${w.taskId}`} className="font-medium text-foreground hover:text-blue">
                      {w.taskTitle}
                    </Link>
                    <span>{w.projectName}</span>
                    {w.durationMin ? <span className="num ml-auto">{formatDuration(w.durationMin)}</span> : null}
                  </div>
                  <Markdown className="text-[13px]">{w.body}</Markdown>
                </div>
              ))}
            </Panel>
          </Section>
        )}
      </div>
    </>
  );
}

function MoreLink({ href, label = "전체 보기" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-[13px] text-text-3 hover:text-foreground">
      {label}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}
