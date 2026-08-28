import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, isClosed, nextStatuses } from "./task-status";

describe("task-status", () => {
  it("done/canceled 는 종료 상태", () => {
    expect(isClosed("done")).toBe(true);
    expect(isClosed("canceled")).toBe(true);
    expect(isClosed("doing")).toBe(false);
  });

  it("허용된 전이", () => {
    expect(canTransition("todo", "doing")).toBe(true);
    expect(canTransition("doing", "done")).toBe(true);
    expect(canTransition("hold", "doing")).toBe(true);
    expect(canTransition("done", "doing")).toBe(true); // 되살리기
  });

  it("같은 상태로는 항상 가능", () => {
    expect(canTransition("hold", "hold")).toBe(true);
  });

  it("허용되지 않은 전이는 에러", () => {
    expect(canTransition("hold", "done")).toBe(false);
    expect(() => assertTransition("hold", "done")).toThrow(/바꿀 수 없어요/);
    expect(canTransition("canceled", "done")).toBe(false);
  });

  it("nextStatuses 는 자기 자신을 포함하지 않는다", () => {
    for (const s of ["todo", "doing", "hold", "done", "canceled"] as const) {
      expect(nextStatuses(s)).not.toContain(s);
    }
  });
});
