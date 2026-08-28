import Link from "next/link";
import { ListTodo } from "lucide-react";
import { EmptyState } from "@/components/common/Panel";
import { PriorityBadge, StatusDot, TagChip } from "@/components/common/StatusBadge";
import { isOverdue } from "@/domain/tasks/task";
import { TASK_STATUS_LABEL } from "@/domain/tasks/task-status";
import type { TaskListItem } from "@/infrastructure/supabase/repositories/tasks";
import { formatShortDate, relativeDay, toDateKst, todayKst } from "@/lib/date";
import { cn } from "@/lib/utils";

export function TaskTable({
  tasks,
  hideProject,
  hideRequester,
  empty,
}: {
  tasks: TaskListItem[];
  hideProject?: boolean;
  hideRequester?: boolean;
  empty?: { title: string; description?: string };
}) {
  if (tasks.length === 0) {
    return <EmptyState icon={ListTodo} title={empty?.title ?? "아직 업무가 없어요"} description={empty?.description ?? "n 키를 누르면 바로 추가할 수 있어요"} />;
  }
  const today = todayKst();
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-border text-left text-[12px] text-text-3">
            <th className="h-9 px-4 font-medium">상태</th>
            <th className="h-9 px-2 font-medium">제목</th>
            {!hideProject && <th className="h-9 px-2 font-medium">프로젝트</th>}
            {!hideRequester && <th className="h-9 px-2 font-medium">요청자</th>}
            <th className="h-9 px-2 text-right font-medium">마감</th>
            <th className="h-9 px-4 text-right font-medium">최근 작업</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const overdue = isOverdue(t);
            const dueToday = t.dueAt && toDateKst(t.dueAt) === today;
            return (
              <tr key={t.id} className="row-hover border-b border-border last:border-0">
                <td className="h-11 whitespace-nowrap px-4">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-2">
                    <StatusDot status={t.status} />
                    {TASK_STATUS_LABEL[t.status]}
                  </span>
                </td>
                <td className="h-11 px-2">
                  <Link href={`/tasks/${t.id}`} className="font-medium text-foreground hover:text-blue">
                    {t.title}
                  </Link>
                  {(t.priority !== "normal" || t.tags.length > 0) && (
                    <span className="ml-1.5 inline-flex gap-1 align-middle">
                      <PriorityBadge priority={t.priority} />
                      {t.tags.map((tag) => (
                        <TagChip key={tag}>{tag}</TagChip>
                      ))}
                    </span>
                  )}
                </td>
                {!hideProject && (
                  <td className="h-11 px-2 text-text-2">
                    <Link href={`/projects/${t.projectId}`} className="hover:text-blue">
                      {t.companyName ? <span className="text-text-3">{t.companyName} · </span> : null}
                      {t.projectName}
                    </Link>
                  </td>
                )}
                {!hideRequester && (
                  <td className="h-11 px-2 text-text-2">
                    {t.requesterId ? (
                      <Link href={`/people/${t.requesterId}`} className="hover:text-blue">
                        {t.requesterName}
                      </Link>
                    ) : (
                      <span className="text-text-3">본인</span>
                    )}
                  </td>
                )}
                <td className={cn("num h-11 whitespace-nowrap px-2 text-right", overdue ? "font-semibold text-red" : dueToday ? "font-semibold text-blue" : "text-text-2")}>
                  {t.dueAt ? (overdue ? `${formatShortDate(t.dueAt)} 지남` : relativeDay(t.dueAt)) : <span className="text-text-3">—</span>}
                </td>
                <td className="num h-11 whitespace-nowrap px-4 text-right text-text-3">{t.lastWorkedAt ? relativeDay(t.lastWorkedAt) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
