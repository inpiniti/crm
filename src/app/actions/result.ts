import { DomainError } from "@/domain/shared/errors";
import { ZodError } from "zod";

export type ActionResult = { ok: true; id?: number; redirect?: string } | { ok: false; error: string };

/** 유스케이스 실행을 감싸 사용자용 에러 메시지로 바꾼다 */
export async function run(fn: () => Promise<ActionResult | void>): Promise<ActionResult> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (e) {
    if (e instanceof DomainError) return { ok: false, error: e.message };
    if (e instanceof ZodError) {
      const first = e.issues[0];
      return { ok: false, error: first?.message ?? "입력값을 확인해 주세요." };
    }
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    if (/SUPABASE_URL/.test(msg)) return { ok: false, error: msg };
    if (/duplicate key/.test(msg)) return { ok: false, error: "같은 이름이 이미 있어요." };
    if (/closed or deleted task/.test(msg)) return { ok: false, error: "끝난 업무에는 작업을 추가할 수 없어요." };
    return { ok: false, error: "잠시 저장이 어려워요. 조금 뒤에 다시 시도해 주세요." };
  }
}

// ---- FormData 파서 ----

export const str = (fd: FormData, k: string): string | null => {
  const v = fd.get(k);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
};
export const num = (fd: FormData, k: string): number | null => {
  const s = str(fd, k);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
export const int = (fd: FormData, k: string): number | null => {
  const n = num(fd, k);
  return n === null ? null : Math.trunc(n);
};
