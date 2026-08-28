import type { ReactNode } from "react";
import { TASK_STATUS_LABEL, type TaskStatus } from "@/domain/tasks/task-status";
import { TASK_PRIORITY_LABEL, type TaskPriority } from "@/domain/tasks/task";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: "bg-muted text-text-2",
  doing: "bg-blue-weak text-blue",
  hold: "bg-orange-weak text-orange",
  done: "bg-green-weak text-green",
  canceled: "bg-muted text-text-3 line-through",
};

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-[22px] shrink-0 items-center rounded-md px-1.5 text-[12px] font-medium leading-none", className)}>{children}</span>;
}

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return <Chip className={cn(STATUS_STYLE[status], className)}>{TASK_STATUS_LABEL[status]}</Chip>;
}

export function StatusDot({ status }: { status: TaskStatus }) {
  const c = { todo: "bg-text-3", doing: "bg-blue", hold: "bg-orange", done: "bg-green", canceled: "bg-text-3" }[status];
  return <span className={cn("inline-block size-2 rounded-full", c)} />;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === "normal") return null;
  return <Chip className={priority === "high" ? "bg-red-weak text-red" : "bg-muted text-text-3"}>{TASK_PRIORITY_LABEL[priority]}</Chip>;
}

export function TagChip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11.5px] text-text-2">#{children}</span>;
}
