import { describe, expect, it } from "vitest";
import { assertCompanyDeletable, companySortKey, validateCompanyInput } from "./companies/company";
import { assertPersonDeletable } from "./people/person";
import { assertProjectAcceptsTasks, assertProjectDeletable, validateProjectInput } from "./projects/project";

describe("참조가 있으면 삭제 불가", () => {
  it("company", () => {
    expect(() => assertCompanyDeletable({ projectCount: 1, personCount: 0 })).toThrow();
    expect(() => assertCompanyDeletable({ projectCount: 0, personCount: 0 })).not.toThrow();
  });
  it("project", () => {
    expect(() => assertProjectDeletable({ taskCount: 2 })).toThrow(/보관/);
  });
  it("person", () => {
    expect(() => assertPersonDeletable({ taskCount: 1 })).toThrow();
  });
});

describe("project", () => {
  it("archived 프로젝트는 업무를 받지 않는다", () => {
    expect(() => assertProjectAcceptsTasks({ status: "archived", name: "X" })).toThrow(/보관된/);
    expect(() => assertProjectAcceptsTasks({ status: "active", name: "X" })).not.toThrow();
  });
  it("기간 검증", () => {
    expect(() =>
      validateProjectInput({ companyId: null, name: "p", description: null, startedAt: "2026-02-01", endedAt: "2026-01-01" }),
    ).toThrow(/종료일/);
  });
});

describe("company", () => {
  it("정렬: 재직 중 → 과거 → 거래처 → 기타", () => {
    expect(companySortKey({ type: "employer", leftAt: null })).toBe(0);
    expect(companySortKey({ type: "employer", leftAt: "2020-01-01" })).toBe(1);
    expect(companySortKey({ type: "client", leftAt: null })).toBe(2);
    expect(companySortKey({ type: "other", leftAt: null })).toBe(3);
  });
  it("퇴사일 < 입사일 이면 에러", () => {
    expect(() => validateCompanyInput({ name: "c", type: "employer", joinedAt: "2026-01-01", leftAt: "2025-01-01", memo: null })).toThrow();
  });
});
