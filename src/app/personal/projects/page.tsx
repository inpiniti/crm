import { redirect } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/common/Panel";
import { ProjectFormButton } from "@/components/features/EntityForms";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { listCompanyOptions } from "@/infrastructure/supabase/repositories/companies";
import { listProjects } from "@/infrastructure/supabase/repositories/projects";
import { attempt } from "@/lib/attempt";

export default async function PersonalProjectsPage() {
  const r = await attempt(async () => {
    const [projects, companies] = await Promise.all([
      listProjects({ includeArchived: true, scope: "personal" }),
      listCompanyOptions(),
    ]);
    return { projects, companies };
  });

  if (!r.ok) return <SetupNotice error={r.error} />;
  const { projects, companies } = r.value;

  if (projects.length > 0) {
    redirect(`/personal/projects/${projects[0].id}`);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <EmptyState
        icon={FolderKanban}
        title="아직 개인 프로젝트가 없어요"
        description="회사 프로젝트와 분리해서 쓰고 싶은 일감을 여기로 모아 보세요"
      />
      <div className="mt-4">
        <ProjectFormButton companies={companies} />
      </div>
    </div>
  );
}
