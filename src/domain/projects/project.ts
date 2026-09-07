import { DomainError } from "../shared/errors";
import type { Auditable, DateOnly, Id } from "../shared/types";

export const PROJECT_STATUSES = ["active", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project extends Auditable {
  id: Id;
  companyId: Id | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startedAt: DateOnly | null;
  endedAt: DateOnly | null;
}

export interface ProjectInput {
  companyId: Id | null;
  name: string;
  description: string | null;
  startedAt: DateOnly | null;
  endedAt: DateOnly | null;
}

export function validateProjectInput(input: ProjectInput): ProjectInput {
  const name = input.name.trim();
  if (!name) throw new DomainError("project.name_required", "프로젝트 이름을 적어 주세요.");
  if (input.startedAt && input.endedAt && input.endedAt < input.startedAt) {
    throw new DomainError("project.period_invalid", "종료일은 시작일보다 뒤여야 해요.");
  }
  return { ...input, name };
}

export function isPersonalProject(p: Pick<Project, "companyId">): boolean {
  return p.companyId === null;
}

/** archived 프로젝트에는 새 업무를 만들거나 옮겨 올 수 없다 */
export function assertProjectAcceptsTasks(p: Pick<Project, "status" | "name">) {
  if (p.status === "archived") {
    throw new DomainError(
      "project.archived",
      `'${p.name}'은(는) 종료된 프로젝트예요. 다시 진행 중으로 변경하면 업무를 넣을 수 있어요.`,
    );
  }
}

/** 업무가 있으면 삭제 불가 */
export function assertProjectDeletable(refs: { taskCount: number }) {
  if (refs.taskCount > 0) {
    throw new DomainError(
      "project.has_refs",
      "업무가 있는 프로젝트는 지울 수 없어요. 대신 종료 처리해 주세요.",
    );
  }
}
