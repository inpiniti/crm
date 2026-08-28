import { DomainError } from "../shared/errors";

export const TASK_STATUSES = ["todo", "doing", "hold", "done", "canceled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "할 일",
  doing: "진행 중",
  hold: "보류",
  done: "완료",
  canceled: "취소",
};

export const OPEN_STATUSES: readonly TaskStatus[] = ["todo", "doing", "hold"];
export const CLOSED_STATUSES: readonly TaskStatus[] = ["done", "canceled"];

/** 허용 전이 표 */
const TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  todo: ["doing", "hold", "canceled", "done"],
  doing: ["done", "hold", "todo", "canceled"],
  hold: ["todo", "doing", "canceled"],
  done: ["doing", "todo"], // 되살리기
  canceled: ["todo"], // 되살리기
};

export function isClosed(status: TaskStatus): boolean {
  return CLOSED_STATUSES.includes(status);
}

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: TaskStatus, to: TaskStatus) {
  if (!canTransition(from, to)) {
    throw new DomainError(
      "task.invalid_transition",
      `'${TASK_STATUS_LABEL[from]}'에서 '${TASK_STATUS_LABEL[to]}'(으)로는 바꿀 수 없어요.`,
    );
  }
}

export function nextStatuses(from: TaskStatus): readonly TaskStatus[] {
  return TRANSITIONS[from];
}
