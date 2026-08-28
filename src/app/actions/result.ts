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
    if (/Body exceeded|body size|PayloadTooLarge/i.test(msg)) return { ok: false, error: "파일이 너무 커서 보낼 수 없어요. 20MB 이하로 올려 주세요." };
    if (/Bucket not found/i.test(msg)) return { ok: false, error: "Storage 버킷 'attachments' 가 없어요. supabase/schema.sql 의 마지막 부분을 실행해 주세요." };
    if (/파일 업로드 실패|다운로드 링크|파일 삭제 실패/.test(msg)) return { ok: false, error: msg };
    // 원인을 알 수 있게 메시지를 함께 보여준다 (개인용 로컬 앱이라 노출해도 무방)
    return { ok: false, error: `저장하지 못했어요: ${msg}` };
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
