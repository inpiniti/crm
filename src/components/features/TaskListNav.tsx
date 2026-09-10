"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";
import { StatusDot } from "@/components/common/StatusBadge";
import { TaskFormButton } from "@/components/features/EntityForms";
import { isOverdue } from "@/domain/tasks/task";
import { TASK_STATUS_LABEL, type TaskStatus } from "@/domain/tasks/task-status";
import type { TaskListItem } from "@/infrastructure/supabase/repositories/tasks";
import { cn } from "@/lib/utils";

interface TaskListNavProps {
  tasks: TaskListItem[];
  basePath?: string;
  title?: string;
}

export function TaskListNav({ tasks, basePath = "", title = "업무" }: TaskListNavProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "doing" | "todo" | "done">("all");

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.projectName.toLowerCase().includes(q) ||
      (t.companyName && t.companyName.toLowerCase().includes(q)) ||
      (t.requesterName && t.requesterName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card/40 select-none">
      {/* 2열 헤더 */}
      <div className="flex h-13 items-center justify-between border-b border-border px-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-foreground">{title}</span>
          <span className="num rounded-full bg-muted px-1.5 py-0.2 text-[11px] font-semibold text-text-3">
            {filtered.length}
          </span>
        </div>
        <TaskFormButton />
      </div>

      {/* 2열 검색 필터 */}
      <div className="border-b border-border p-2 space-y-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-text-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="업무, 프로젝트 검색..."
            className="h-8 w-full rounded-md bg-muted/60 pl-8 pr-2.5 text-[12.5px] placeholder:text-text-3 focus:bg-background focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </div>

        {/* 간결한 상태 세그먼트 */}
        <div className="grid grid-cols-4 gap-1 rounded-md bg-muted/50 p-0.5 text-[11px] text-text-3">
          {(
            [
              { key: "all", label: "전체" },
              { key: "doing", label: "진행" },
              { key: "todo", label: "할일" },
              { key: "done", label: "완료" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "rounded py-1 font-medium transition-colors text-center",
                statusFilter === tab.key
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2열 리스트 */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-text-3">
            {query || statusFilter !== "all" ? "해당하는 업무가 없어요" : "등록된 업무가 없어요"}
          </div>
        ) : (
          filtered.map((t) => {
            const isActive = pathname === `${basePath}/tasks/${t.id}`;
            const overdue = isOverdue(t);

            return (
              <Link
                key={t.id}
                href={`${basePath}/tasks/${t.id}`}
                className={cn(
                  "group block px-3.5 py-2.5 transition-colors",
                  isActive
                    ? "bg-blue-weak/60 text-blue font-semibold border-l-2 border-l-blue"
                    : "hover:bg-hover text-foreground border-l-2 border-l-transparent"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-1 shrink-0">
                    <StatusDot status={t.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-[13px]", isActive ? "font-semibold text-blue" : "font-medium text-foreground")}>
                      {t.title}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[11.5px] text-text-3 font-normal">
                      <span className="truncate">
                        {t.companyName ? `${t.companyName} · ` : ""}{t.projectName}
                      </span>
                      {t.dueAt && (
                        <span className={cn("num shrink-0 ml-1.5", overdue ? "text-red font-medium" : "")}>
                          {t.dueAt.slice(5, 10)}
                        </span>
                      )}

                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
