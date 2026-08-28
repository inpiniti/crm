import { Unplug } from "lucide-react";
import { Panel } from "@/components/common/Panel";

/** Supabase 연결이 안 됐을 때 (env 누락, 마이그레이션 미적용) 안내 */
export function SetupNotice({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : String(error);
  const envMissing = /SUPABASE_URL/.test(msg);
  const tableMissing = /relation .* does not exist|Could not find the table|schema cache/.test(msg);
  return (
    <Panel className="mx-auto mt-10 max-w-[640px] p-6">
      <Unplug className="mb-3 size-6 text-text-3" strokeWidth={1.5} />
      <h1 className="mb-2 text-[17px] font-bold">아직 데이터베이스와 연결되지 않았어요</h1>
      {envMissing ? (
        <p className="text-[13px] text-text-2">
          <code className="rounded bg-muted px-1">.env.local</code> 에 <code className="rounded bg-muted px-1">SUPABASE_URL</code> 과{" "}
          <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code> 를 채운 뒤 개발 서버를 다시 켜 주세요.
        </p>
      ) : tableMissing ? (
        <p className="text-[13px] text-text-2">
          테이블이 아직 없어요. Supabase SQL Editor 에서 <code className="rounded bg-muted px-1">supabase/schema.sql</code> 을 실행해 주세요.
        </p>
      ) : (
        <p className="text-[13px] text-text-2">연결 중 문제가 생겼어요. 아래 메시지를 확인해 주세요.</p>
      )}
      <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-[12px] text-text-2">{msg}</pre>
    </Panel>
  );
}
