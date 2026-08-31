import Link from "next/link";
import { Suspense } from "react";
import { Users } from "lucide-react";
import { PersonFormButton } from "@/components/features/EntityForms";
import { EmptyState, PageHeader, Panel } from "@/components/common/Panel";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { listCompanyOptions } from "@/infrastructure/supabase/repositories/companies";
import { listPeople } from "@/infrastructure/supabase/repositories/people";
import { attempt } from "@/lib/attempt";
import { relativeDay } from "@/lib/date";

export default async function PeoplePage() {
  const r = await attempt(() => Promise.all([listPeople(), listCompanyOptions()]));
  if (!r.ok) return <SetupNotice error={r.error} />;
  const [people, companies] = r.value;

  return (
    <>
      <PageHeader
        title="사람"
        description="누가 나에게 일을 시켰는지"
        actions={
          <Suspense>
            <PersonFormButton companies={companies} />
          </Suspense>
        }
      />
      {people.length === 0 ? (
        <EmptyState icon={Users} title="아직 등록된 사람이 없어요" description="업무를 요청한 사람을 추가하면, 그 사람이 시킨 일을 한눈에 볼 수 있어요" />
      ) : (
        <Panel className="divide-y divide-border">
          <div className="grid grid-cols-[100px_1fr_60px] px-4 text-[12px] text-text-3 sm:grid-cols-[150px_1fr_80px_80px_110px] lg:grid-cols-[150px_1fr_220px_130px_80px_80px_110px]">
            <div className="h-9 leading-9">이름</div>
            <div className="h-9 leading-9">회사 · 부서 · 직책</div>
            <div className="hidden h-9 leading-9 lg:block">이메일</div>
            <div className="hidden h-9 leading-9 lg:block">전화</div>
            <div className="h-9 text-right leading-9">진행 중</div>
            <div className="hidden h-9 text-right leading-9 sm:block">전체</div>
            <div className="hidden h-9 text-right leading-9 sm:block">마지막 요청</div>
          </div>
          {people.map((p) => (
            <Link key={p.id} href={`/people/${p.id}`} className="row-hover grid h-11 grid-cols-[100px_1fr_60px] items-center px-4 text-[13.5px] sm:grid-cols-[150px_1fr_80px_80px_110px] lg:grid-cols-[150px_1fr_220px_130px_80px_80px_110px]">
              <div className="truncate font-medium">{p.name}</div>
              <div className="truncate pr-3 text-text-2">{[p.companyName, p.department, p.title].filter(Boolean).join(" · ") || <span className="text-text-3">—</span>}</div>
              <div className="hidden truncate pr-3 text-[13px] text-text-2 lg:block">{p.email || <span className="text-text-3">—</span>}</div>
              <div className="num hidden truncate text-[13px] text-text-2 lg:block">{p.phone || <span className="text-text-3">—</span>}</div>
              <div className={`num text-right font-semibold ${p.openCount ? "text-blue" : "text-text-3"}`}>{p.openCount}</div>
              <div className="num hidden text-right text-text-2 sm:block">{p.taskCount}</div>
              <div className="num hidden text-right text-text-3 sm:block">{p.lastRequestedAt ? relativeDay(p.lastRequestedAt) : "—"}</div>
            </Link>
          ))}
        </Panel>
      )}
    </>
  );
}
