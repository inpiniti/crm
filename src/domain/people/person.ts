import { DomainError } from "../shared/errors";
import type { Auditable, Id } from "../shared/types";

export interface Person extends Auditable {
  id: Id;
  companyId: Id | null;
  name: string;
  department: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  memo: string | null;
}

export interface PersonInput {
  companyId: Id | null;
  name: string;
  department: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  memo: string | null;
}

export function validatePersonInput(input: PersonInput): PersonInput {
  const name = input.name.trim();
  if (!name) throw new DomainError("person.name_required", "이름을 적어 주세요.");
  return { ...input, name };
}

/** 요청한 업무가 있으면 삭제 불가 */
export function assertPersonDeletable(refs: { taskCount: number }) {
  if (refs.taskCount > 0) {
    throw new DomainError(
      "person.has_refs",
      "요청한 업무가 있는 사람은 지울 수 없어요. 더 이상 관계없다면 메모에 적어 두세요.",
    );
  }
}

/** 표시용: 이름 (회사 · 직책) */
export function personLabel(p: { name: string; title?: string | null; companyName?: string | null }): string {
  const extra = [p.companyName, p.title].filter(Boolean).join(" · ");
  return extra ? `${p.name} (${extra})` : p.name;
}
