import { attempt } from "@/lib/attempt";
import { listProjects } from "@/infrastructure/supabase/repositories/projects";
import { listCompanyOptions } from "@/infrastructure/supabase/repositories/companies";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { ProjectListNav } from "@/components/features/ProjectListNav";
import { DetailTopBar } from "@/components/layout/DetailTopBar";

export const dynamic = "force-dynamic";

export default async function PersonalProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const r = await attempt(async () => {
    const [projects, companies] = await Promise.all([
      listProjects({ includeArchived: true, scope: "personal" }),
      listCompanyOptions(),
    ]);
    return { projects, companies };
  });

  if (!r.ok) {
    return (
      <div className="p-6">
        <SetupNotice error={r.error} />
      </div>
    );
  }

  const { projects, companies } = r.value;

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden">
      <ProjectListNav projects={projects} companies={companies} basePath="/personal" title="개인 프로젝트" />
      <section className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-background">
        <DetailTopBar moduleName="개인 프로젝트" />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </section>
    </div>
  );
}
