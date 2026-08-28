import { DomainError } from "../shared/errors";
import type { Auditable, Id, Timestamp } from "../shared/types";

export const WORK_KINDS = ["dev", "meeting", "call", "doc", "etc"] as const;
export type WorkKind = (typeof WORK_KINDS)[number];
export const WORK_KIND_LABEL: Record<WorkKind, string> = {
  dev: "개발",
  meeting: "회의",
  call: "통화",
  doc: "문서",
  etc: "기타",
};

export interface Work extends Auditable {
  id: Id;
  taskId: Id;
  body: string;
  workedAt: Timestamp;
  durationMin: number | null;
  kind: WorkKind | null;
}

export interface WorkInput {
  body: string;
  workedAt: Timestamp;
  durationMin: number | null;
  kind: WorkKind | null;
}

export function validateWorkInput(input: WorkInput): WorkInput {
  const body = input.body.trim();
  if (!body) throw new DomainError("work.body_required", "무엇을 했는지 적어 주세요.");
  if (input.durationMin !== null && (!Number.isInteger(input.durationMin) || input.durationMin < 0)) {
    throw new DomainError("work.duration_invalid", "소요 시간은 0 이상의 분 단위로 적어 주세요.");
  }
  if (Number.isNaN(new Date(input.workedAt).getTime())) {
    throw new DomainError("work.worked_at_invalid", "작업 시각이 올바르지 않아요.");
  }
  return { ...input, body };
}

export function formatDuration(min: number | null | undefined): string {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  return `${m}분`;
}
