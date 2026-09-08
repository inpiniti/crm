import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/common/Panel";
import { CompanyFormButton } from "@/components/features/EntityForms";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { listCompanies } from "@/infrastructure/supabase/repositories/companies";
import { attempt } from "@/lib/attempt";

export default async function CompaniesPage() {
  const r = await attempt(() => listCompanies());
  if (!r.ok) return <SetupNotice error={r.error} />;
  const companies = r.value;

  if (companies.length > 0) {
    redirect(`/companies/${companies[0].id}`);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <EmptyState
        icon={Building2}
        title="아직 회사가 없어요"
        description="좌측 상단의 + 버튼 또는 아래 버튼으로 회사를 추가해 보세요"
      />
      <div className="mt-4">
        <CompanyFormButton />
      </div>
    </div>
  );
}
