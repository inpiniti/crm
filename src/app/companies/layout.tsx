import { attempt } from "@/lib/attempt";
import { listCompanies } from "@/infrastructure/supabase/repositories/companies";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { CompanyListNav } from "@/components/features/CompanyListNav";
import { DetailTopBar } from "@/components/layout/DetailTopBar";

export const dynamic = "force-dynamic";

export default async function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const r = await attempt(() => listCompanies());
  if (!r.ok) {
    return (
      <div className="p-6">
        <SetupNotice error={r.error} />
      </div>
    );
  }

  const companies = r.value;

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden">
      {/* 2열: 회사 목록 탐색기 */}
      <CompanyListNav companies={companies} />

      {/* 3열: 선택된 회사 상세 (Editor View) */}
      <section className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-background">
        <DetailTopBar moduleName="회사" />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </section>
    </div>
  );
}
