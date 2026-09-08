import { attempt } from "@/lib/attempt";
import { listPeople } from "@/infrastructure/supabase/repositories/people";
import { listCompanyOptions } from "@/infrastructure/supabase/repositories/companies";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { PersonListNav } from "@/components/features/PersonListNav";
import { DetailTopBar } from "@/components/layout/DetailTopBar";

export const dynamic = "force-dynamic";

export default async function PeopleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const r = await attempt(async () => {
    const [people, companies] = await Promise.all([
      listPeople(),
      listCompanyOptions(),
    ]);
    return { people, companies };
  });

  if (!r.ok) {
    return (
      <div className="p-6">
        <SetupNotice error={r.error} />
      </div>
    );
  }

  const { people, companies } = r.value;

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden">
      {/* 2열: 사람 목록 탐색기 */}
      <PersonListNav people={people} companies={companies} />

      {/* 3열: 사람 상세 (Editor View) */}
      <section className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-background">
        <DetailTopBar moduleName="사람" />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </section>
    </div>
  );
}
