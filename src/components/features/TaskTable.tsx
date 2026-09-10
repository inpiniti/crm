import Link from "next/link";
import { ListTodo } from "lucide-react";
import { EmptyState } from "@/components/common/Panel";
import { PriorityBadge, StatusDot, TagChip } from "@/components/common/StatusBadge";
import { TASK_STATUS_LABEL } from "@/domain/tasks/task-status";
import type { TaskListItem } from "@/infrastructure/supabase/repositories/tasks";
import { relativeDay } from "@/lib/date";

export function TaskTable({
  tasks,
  hideProject,
  hideRequester,
  empty,
  basePath = "",
  compact = false,
}: {
  tasks: TaskListItem[];
  hideProject?: boolean;
  hideRequester?: boolean;
  empty?: { title: string; description?: string };
  basePath?: string;
  compact?: boolean;
}) {
  if (tasks.length === 0) {
    return <EmptyState icon={ListTodo} title={empty?.title ?? "아직 업무가 없어요"} description={empty?.description ?? "n 키를 누르면 바로 추가할 수 있어요"} />;
  }

  if (compact) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          {tasks.map((t) => (
            <Link key={t.id} href={`${basePath}/tasks/${t.id}`} className="block px-4 py-3 hover:bg-hover transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <StatusDot status={t.status} />
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">{t.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-border text-left text-[12px] text-text-3">
            <th className="h-9 px-3 font-medium sm:px-4">상태</th>
            <th className="h-9 px-2 font-medium">제목</th>
            {!hideProject && <th className="hidden h-9 px-2 font-medium md:table-cell">프로젝트</th>}
            {!hideRequester && <th className="hidden h-9 px-2 font-medium md:table-cell">요청자</th>}
            <th className="h-9 px-4 text-right font-medium">최근 작업</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            return (
              <tr key={t.id} className="row-hover border-b border-border last:border-0">
                <td className="h-11 whitespace-nowrap px-3 sm:px-4">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-2">
                    <StatusDot status={t.status} />
                    {TASK_STATUS_LABEL[t.status]}
                  </span>
                </td>
                <td className="h-11 px-2">
                  <Link href={`${basePath}/tasks/${t.id}`} className="font-medium text-foreground hover:text-blue">
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
                  <td className="hidden h-11 px-2 text-text-2 md:table-cell">
                    <Link href={`${basePath}/projects/${t.projectId}`} className="hover:text-blue">
                      {t.companyName ? <span className="text-text-3">{t.companyName} · </span> : null}
                      {t.projectName}
                    </Link>
                  </td>
                )}
                {!hideRequester && (
                  <td className="hidden h-11 px-2 text-text-2 md:table-cell">
                    {t.requesterId ? (
                      <Link href={`/people/${t.requesterId}`} className="hover:text-blue">
                        {t.requesterName}
                      </Link>
                    ) : (
                      <span className="text-text-3">본인</span>
                    )}
                  </td>
                )}
                <td className="num h-11 whitespace-nowrap px-4 text-right text-text-3">{t.lastWorkedAt ? relativeDay(t.lastWorkedAt) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
