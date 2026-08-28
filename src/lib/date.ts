export const TZ = "Asia/Seoul";

function parts(d: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  if (o.hour === "24") o.hour = "00";
  return o;
}

/** KST 기준 YYYY-MM-DD */
export function toDateKst(ts: string | Date | null | undefined): string {
  if (!ts) return "";
  const p = parts(new Date(ts));
  return `${p.year}-${p.month}-${p.day}`;
}

/** KST 기준 YYYY-MM-DD HH:mm */
export function formatDateTime(ts: string | Date | null | undefined): string {
  if (!ts) return "";
  const p = parts(new Date(ts));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** KST 기준 MM.DD */
export function formatShortDate(ts: string | Date | null | undefined): string {
  if (!ts) return "";
  const p = parts(new Date(ts));
  return `${p.month}.${p.day}`;
}

/** date 컬럼(YYYY-MM-DD) 표시 */
export function formatDateOnly(d: string | null | undefined): string {
  return d ?? "";
}

/** datetime-local input 값 (KST) */
export function toDateTimeLocal(ts: string | Date | null | undefined): string {
  if (!ts) return "";
  const p = parts(new Date(ts));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** datetime-local 값(KST 로 해석) → ISO */
export function fromDateTimeLocal(v: string | null | undefined): string | null {
  if (!v) return null;
  // v = YYYY-MM-DDTHH:mm  (KST 고정)
  return new Date(`${v}:00+09:00`).toISOString();
}

export function todayKst(): string {
  return toDateKst(new Date());
}

export function nowDateTimeLocal(): string {
  return toDateTimeLocal(new Date());
}

/** KST 하루 범위 [start, end) ISO */
export function dayRangeKst(date: string): { start: string; end: string } {
  const start = new Date(`${date}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return toDateKst(d);
}

/** 상대 표현: 오늘, 어제, n일 전 */
export function relativeDay(ts: string | null | undefined): string {
  if (!ts) return "";
  const today = todayKst();
  const d = toDateKst(ts);
  if (d === today) return "오늘";
  if (d === addDays(today, -1)) return "어제";
  const diff = Math.round((new Date(today).getTime() - new Date(d).getTime()) / 86400000);
  if (diff > 0 && diff < 30) return `${diff}일 전`;
  if (diff < 0 && diff > -30) return `${-diff}일 후`;
  return d;
}

export const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
export function weekdayKst(date: string): string {
  // 정오 KST = 03:00 UTC 같은 날 → UTC 요일이 KST 요일과 같다
  return WEEKDAY[new Date(`${date}T12:00:00+09:00`).getUTCDay()];
}
