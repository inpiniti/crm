import { DomainError } from "../shared/errors";
import type { Auditable, DateOnly, Id } from "../shared/types";

export const COMPANY_TYPES = ["employer", "client", "other"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const COMPANY_TYPE_LABEL: Record<CompanyType, string> = {
  employer: "재직",
  client: "거래처",
  other: "기타",
};

export interface Company extends Auditable {
  id: Id;
  name: string;
  type: CompanyType;
  joinedAt: DateOnly | null;
  leftAt: DateOnly | null;
  memo: string | null;
}

export interface CompanyInput {
  name: string;
  type: CompanyType;
  joinedAt: DateOnly | null;
  leftAt: DateOnly | null;
  memo: string | null;
}

export function validateCompanyInput(input: CompanyInput): CompanyInput {
  const name = input.name.trim();
  if (!name) throw new DomainError("company.name_required", "회사 이름을 적어 주세요.");
  if (input.joinedAt && input.leftAt && input.leftAt < input.joinedAt) {
    throw new DomainError("company.period_invalid", "퇴사일은 입사일보다 뒤여야 해요.");
  }
  return { ...input, name };
}

/** 현재 재직 중인지 */
export function isCurrentEmployer(c: Pick<Company, "type" | "leftAt">): boolean {
  return c.type === "employer" && c.leftAt === null;
}

/** 목록 정렬: 재직 중 → 과거 재직 → 거래처 → 기타 */
export function companySortKey(c: Pick<Company, "type" | "leftAt">): number {
  if (isCurrentEmployer(c)) return 0;
  if (c.type === "employer") return 1;
  if (c.type === "client") return 2;
  return 3;
}

/** 참조가 있으면 삭제 불가 */
export function assertCompanyDeletable(refs: { projectCount: number; personCount: number }) {
  if (refs.projectCount > 0 || refs.personCount > 0) {
    throw new DomainError(
      "company.has_refs",
      "프로젝트나 사람이 연결된 회사는 지울 수 없어요. 퇴사일을 적어 과거 회사로 정리해 주세요.",
    );
  }
}
