import { describe, expect, it } from "vitest";
import { assertTaskAcceptsWork, isOverdue, normalizeTags, parseTagString, validateTaskInput } from "./task";

const base = {
  projectId: 1,
  requesterId: null,
  title: "  제목  ",
  body: null,
  priority: "normal" as const,
  requestedAt: null,
  startedAt: null,
  dueAt: null,
  source: null,
  tags: [],
};

describe("task", () => {
  it("제목은 trim 되고 비어 있으면 에러", () => {
    expect(validateTaskInput(base).title).toBe("제목");
    expect(() => validateTaskInput({ ...base, title: "   " })).toThrow(/제목/);
  });

  it("태그 정규화: 공백/중복/# 제거", () => {
    expect(normalizeTags([" a ", "#b", "a", ""])).toEqual(["a", "b"]);
    expect(parseTagString("a, b  c,#d")).toEqual(["a", "b", "c", "d"]);
  });

  it("종료 상태에는 작업 추가 불가", () => {
    expect(() => assertTaskAcceptsWork({ status: "done" })).toThrow(/끝난 업무/);
    expect(() => assertTaskAcceptsWork({ status: "doing" })).not.toThrow();
  });

  it("지연 판정: 마감 지났고 열려 있을 때만", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + 100000).toISOString();
    expect(isOverdue({ dueAt: past, status: "todo" })).toBe(true);
    expect(isOverdue({ dueAt: past, status: "done" })).toBe(false);
    expect(isOverdue({ dueAt: future, status: "todo" })).toBe(false);
    expect(isOverdue({ dueAt: null, status: "todo" })).toBe(false);
  });
});
