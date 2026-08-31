import Link from "next/link";
import { Suspense } from "react";
import { Building2 } from "lucide-react";
import { CompanyFormButton } from "@/components/features/EntityForms";
import { EmptyState, PageHeader, Panel } from "@/components/common/Panel";
import { Chip } from "@/components/common/StatusBadge";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { COMPANY_TYPE_LABEL, isCurrentEmployer } from "@/domain/companies/company";
import { listCompanies } from "@/infrastructure/supabase/repositories/companies";
import { attempt } from "@/lib/attempt";

export default async function CompaniesPage() {
  const r = await attempt(() => listCompanies());
  if (!r.ok) return <SetupNotice error={r.error} />;
  const companies = r.value;

  return (
    <>
      <PageHeader
        title="회사"
        description="다녔던 회사와 거래처"
        actions={
          <Suspense>
            <CompanyFormButton />
          </Suspense>
        }
      />
      {companies.length === 0 ? (
        <EmptyState icon={Building2} title="아직 회사가 없어요" description="지금 다니는 회사부터 하나 추가해 보세요" />
      ) : (
        <Panel className="divide-y divide-border">
          <div className="grid grid-cols-[1fr_80px] px-4 text-[12px] text-text-3 sm:grid-cols-[1fr_200px_100px_100px]">
            <div className="h-9 leading-9">회사</div>
            <div className="hidden h-9 leading-9 sm:block">기간</div>
            <div className="h-9 text-right leading-9">프로젝트</div>
            <div className="hidden h-9 text-right leading-9 sm:block">사람</div>
          </div>
          {companies.map((c) => (
            <Link key={c.id} href={`/companies/${c.id}`} className="row-hover grid h-11 grid-cols-[1fr_80px] items-center px-4 text-[13.5px] sm:grid-cols-[1fr_200px_100px_100px]">
              <div className="flex min-w-0 items-center gap-2 font-medium">
                <span className="truncate">{c.name}</span>
                {isCurrentEmployer(c) ? <Chip className="bg-blue-weak text-blue">재직 중</Chip> : <Chip className="bg-muted text-text-3">{COMPANY_TYPE_LABEL[c.type]}</Chip>}
              </div>
              <div className="num hidden text-text-3 sm:block">{c.joinedAt ? `${c.joinedAt} ~ ${c.leftAt ?? "현재"}` : "—"}</div>
              <div className="num text-right text-text-2">{c.projectCount}</div>
              <div className="num hidden text-right text-text-2 sm:block">{c.personCount}</div>
            </Link>
          ))}
        </Panel>
      )}
    </>
  );
}
