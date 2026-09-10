import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectFormButton, ProjectStatusButtons } from "@/components/features/EntityForms";
import { TaskTable } from "@/components/features/TaskTable";
import { Markdown } from "@/components/common/Markdown";
import { PageHeader, Panel, Section, Stat } from "@/components/common/Panel";
import { Chip } from "@/components/common/StatusBadge";
import { formatDuration } from "@/domain/tasks/work";
import { listCompanyOptions } from "@/infrastructure/supabase/repositories/companies";
import { getProjectDetail } from "@/infrastructure/supabase/repositories/projects";
import { listTasks } from "@/infrastructure/supabase/repositories/tasks";
import { DetailHeaderSetter } from "@/components/layout/DetailHeaderContext";

export default async function PersonalProjectDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ all?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const showAll = sp.all !== "0";
  const [project, tasks, companies] = await Promise.all([
    getProjectDetail(n, { scope: "personal" }),
    listTasks({ projectId: n, status: showAll ? "all" : "open" }),
    listCompanyOptions(),
  ]);
  if (!project) notFound();

  const periodStr = project.startedAt ? `${project.startedAt} ~ ${project.endedAt ?? ""}` : null;

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-7">
      <DetailHeaderSetter title={project.name} subtitle={project.companyName || "개인 프로젝트"} />
      <div className="flex items-start justify-between border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
            {project.status === "archived" ? (
              <Chip className="bg-muted text-text-3 font-semibold px-2 py-0.5 text-[12px]">종료</Chip>
            ) : (
              <Chip className="bg-green-weak text-green font-semibold px-2 py-0.5 text-[12px]">진행 중</Chip>
            )}
            {project.companyId ? (
              <Link
                href={`/companies/${project.companyId}`}
                className="rounded-md bg-muted px-2 py-0.5 text-[12px] font-medium text-text-2 hover:text-blue transition-colors"
              >
                {project.companyName}
              </Link>
            ) : (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[12px] font-medium text-text-3">개인</span>
            )}
          </div>
          {periodStr && <div className="num mt-1.5 text-[13px] text-text-3">{periodStr}</div>}
        </div>
        <div className="flex items-center gap-2">
          <Suspense>
            <ProjectFormButton project={project} companies={companies} />
            <ProjectStatusButtons project={project} />
          </Suspense>
        </div>
      </div>

      <Panel className="mb-6 grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-4">
        <Stat label="진행 중" value={project.openCount} suffix="건" tone={project.openCount ? "blue" : "muted"} />
        <Stat label="완료" value={project.doneCount} suffix="건" />
        <Stat label="전체" value={project.taskCount} suffix="건" />
        <Stat label="소요" value={project.totalMin ? formatDuration(project.totalMin) : "—"} tone={project.totalMin ? "default" : "muted"} />
      </Panel>
      {project.description && (
        <Panel className="mb-6 p-4">
          <Markdown>{project.description}</Markdown>
        </Panel>
      )}
      <Section
        title="업무"
        extra={
          <Link href={showAll ? `/personal/projects/${n}?all=0` : `/personal/projects/${n}`} className="text-[13px] text-text-3 hover:text-foreground">
            {showAll ? "진행 중만 보기" : "완료된 것도 보기"}
          </Link>
        }
      >
        <TaskTable
          tasks={tasks}
          hideProject
          basePath="/personal"
          empty={{ title: "이 프로젝트에 업무가 없어요", description: project.status === "archived" ? "종료된 프로젝트예요" : "n 키로 바로 추가할 수 있어요" }}
        />
      </Section>
    </div>
  );
}
