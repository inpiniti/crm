import { describe, expect, it } from "vitest";
import { addDays, dayRangeKst, formatDateTime, fromDateTimeLocal, toDateKst, toDateTimeLocal, weekdayKst } from "./date";

describe("date (KST)", () => {
  it("UTC 자정 직전은 KST 로 다음 날", () => {
    expect(toDateKst("2026-08-26T15:30:00Z")).toBe("2026-08-27");
    expect(formatDateTime("2026-08-26T15:30:00Z")).toBe("2026-08-27 00:30");
  });
  it("datetime-local 왕복", () => {
    const iso = fromDateTimeLocal("2026-08-27T09:05")!;
    expect(toDateTimeLocal(iso)).toBe("2026-08-27T09:05");
  });
  it("하루 범위", () => {
    const r = dayRangeKst("2026-08-27");
    expect(r.start).toBe("2026-08-26T15:00:00.000Z");
    expect(r.end).toBe("2026-08-27T15:00:00.000Z");
  });
  it("addDays / weekday", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(weekdayKst("2026-08-27")).toBe("목");
  });
});
