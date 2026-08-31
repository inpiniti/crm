import Link from "next/link";
import { Suspense } from "react";
import { FolderKanban } from "lucide-react";
import { ProjectFormButton } from "@/components/features/EntityForms";
import { EmptyState, PageHeader, Panel } from "@/components/common/Panel";
import { Chip } from "@/components/common/StatusBadge";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { formatDuration } from "@/domain/tasks/work";
import { listCompanyOptions } from "@/infrastructure/supabase/repositories/companies";
import { listProjects } from "@/infrastructure/supabase/repositories/projects";
import { attempt } from "@/lib/attempt";

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const sp = await searchParams;
  const showArchived = sp.archived === "1";
  const r = await attempt(() => Promise.all([listProjects({ includeArchived: showArchived }), listCompanyOptions()]));
  if (!r.ok) return <SetupNotice error={r.error} />;
  const [projects, companies] = r.value;

  return (
    <>
      <PageHeader
        title="프로젝트"
        description={
          <Link href={showArchived ? "/projects" : "/projects?archived=1"} className="hover:text-foreground">
            {showArchived ? "보관된 것 숨기기" : "보관된 것도 보기"}
          </Link>
        }
        actions={
          <Suspense>
            <ProjectFormButton companies={companies} />
          </Suspense>
        }
      />
      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="아직 프로젝트가 없어요" description="회사 프로젝트든 개인 프로젝트든, 업무를 담을 그릇을 하나 만들어 보세요" />
      ) : (
        <Panel className="divide-y divide-border">
          <div className="grid grid-cols-[1fr_170px_70px_70px_70px_100px] px-4 text-[12px] text-text-3">
            <div className="h-9 leading-9">프로젝트</div>
            <div className="h-9 leading-9">기간</div>
            <div className="h-9 text-right leading-9">진행 중</div>
            <div className="h-9 text-right leading-9">완료</div>
            <div className="h-9 text-right leading-9">전체</div>
            <div className="h-9 text-right leading-9">소요</div>
          </div>
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="row-hover grid grid-cols-[1fr_170px_70px_70px_70px_100px] items-center px-4 py-2.5 text-[13.5px]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  <span className="truncate">{p.name}</span>
                  {p.status === "archived" && <Chip className="bg-muted text-text-3">보관</Chip>}
                </div>
                <div className="text-[12px] text-text-3">{p.companyName ?? "개인"}</div>
              </div>
              <div className="num text-[12.5px] text-text-3">{p.startedAt ? `${p.startedAt} ~ ${p.endedAt ?? ""}` : "—"}</div>
              <div className={`num text-right font-semibold ${p.openCount ? "text-blue" : "text-text-3"}`}>{p.openCount}</div>
              <div className="num text-right text-text-2">{p.doneCount}</div>
              <div className="num text-right text-text-2">{p.taskCount}</div>
              <div className="num text-right text-text-3">{p.totalMin > 0 ? formatDuration(p.totalMin) : "—"}</div>
            </Link>
          ))}
        </Panel>
      )}
    </>
  );
}
