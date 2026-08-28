"use client";

import { TriangleAlert } from "lucide-react";
import { Panel } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Panel className="mx-auto mt-10 max-w-[640px] p-6">
      <TriangleAlert className="mb-3 size-6 text-text-3" strokeWidth={1.5} />
      <h1 className="mb-2 text-[17px] font-bold">화면을 그리다 문제가 생겼어요</h1>
      <p className="text-[13px] text-text-2">잠시 뒤 다시 시도해 주세요. 계속 그러면 터미널 로그를 확인해 주세요.</p>
      {error.message && <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-[12px] text-text-2">{error.message}</pre>}
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={reset}>
          다시 시도
        </Button>
      </div>
    </Panel>
  );
}
