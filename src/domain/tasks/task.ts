import { DomainError } from "../shared/errors";
import type { Auditable, DateOnly, Id, Timestamp } from "../shared/types";
import { isClosed, type TaskStatus } from "./task-status";

export const TASK_PRIORITIES = ["low", "normal", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "낮음",
  normal: "보통",
  high: "높음",
};

export interface Task extends Auditable {
  id: Id;
  projectId: Id;
  requesterId: Id | null; // null = 본인
  title: string;
  body: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  requestedAt: DateOnly | null;
  startedAt: DateOnly | null;
  dueAt: Timestamp | null;
  completedAt: Timestamp | null;
  statusChangedAt: Timestamp | null;
  source: string | null;
  tags: string[];
}

export interface TaskInput {
  projectId: Id;
  requesterId: Id | null;
  title: string;
  body: string | null;
  priority: TaskPriority;
  requestedAt: DateOnly | null;
  startedAt: DateOnly | null;
  dueAt: Timestamp | null;
  source: string | null;
  tags: string[];
}

export function validateTaskInput(input: TaskInput): TaskInput {
  const title = input.title.trim();
  if (!title) throw new DomainError("task.title_required", "업무 제목을 적어 주세요.");
  const tags = normalizeTags(input.tags);
  return { ...input, title, tags };
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  for (const raw of tags) {
    const t = raw.trim().replace(/^#/, "");
    if (t) seen.add(t);
  }
  return [...seen];
}

export function parseTagString(s: string): string[] {
  return normalizeTags(s.split(/[,\s]+/));
}

/** 종료 상태에는 작업을 추가할 수 없다 */
export function assertTaskAcceptsWork(task: Pick<Task, "status">) {
  if (isClosed(task.status)) {
    throw new DomainError(
      "task.closed",
      "끝난 업무에는 작업을 추가할 수 없어요. 상태를 '진행 중'으로 되돌리면 추가할 수 있어요.",
    );
  }
}

export function isOverdue(task: Pick<Task, "dueAt" | "status">, now: Date = new Date()): boolean {
  if (!task.dueAt || isClosed(task.status)) return false;
  return new Date(task.dueAt).getTime() < now.getTime();
}
