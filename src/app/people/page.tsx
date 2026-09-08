import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { PersonFormButton } from "@/components/features/EntityForms";
import { EmptyState } from "@/components/common/Panel";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { listCompanyOptions } from "@/infrastructure/supabase/repositories/companies";
import { listPeople } from "@/infrastructure/supabase/repositories/people";
import { attempt } from "@/lib/attempt";

export default async function PeoplePage() {
  const r = await attempt(async () => {
    const [people, companies] = await Promise.all([listPeople(), listCompanyOptions()]);
    return { people, companies };
  });
  if (!r.ok) return <SetupNotice error={r.error} />;
  const { people, companies } = r.value;

  if (people.length > 0) {
    redirect(`/people/${people[0].id}`);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <EmptyState
        icon={Users}
        title="아직 등록된 사람이 없어요"
        description="함께 일하는 동료나 요청자를 등록해 보세요"
      />
      <div className="mt-4">
        <PersonFormButton companies={companies} />
      </div>
    </div>
  );
}


