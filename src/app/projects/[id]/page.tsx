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

export default async function ProjectDetailPage({ params, searchParams }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const showAll = sp.all === "1";
  const [project, tasks, companies] = await Promise.all([
    getProjectDetail(n),
    listTasks({ projectId: n, status: showAll ? "all" : "open" }),
    listCompanyOptions(),
  ]);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        back={
          <>
            <Link href="/projects" className="hover:text-foreground">
              프로젝트
            </Link>
            <span className="mx-1.5">/</span>
            {project.companyId ? (
              <Link href={`/companies/${project.companyId}`} className="hover:text-foreground">
                {project.companyName}
              </Link>
            ) : (
              "개인"
            )}
          </>
        }
        title={
          <span className="inline-flex items-center gap-2">
            {project.name}
            {project.status === "archived" && <Chip className="bg-muted text-text-3">보관</Chip>}
          </span>
        }
        description={project.startedAt ? <span className="num">{project.startedAt} ~ {project.endedAt ?? ""}</span> : undefined}
        actions={
          <Suspense>
            <ProjectFormButton project={project} companies={companies} />
            <ProjectStatusButtons project={project} />
          </Suspense>
        }
      />
      <Panel className="mb-6 grid grid-cols-4 gap-4 px-5 py-4">
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
          <Link href={showAll ? `/projects/${n}` : `/projects/${n}?all=1`} className="text-[13px] text-text-3 hover:text-foreground">
            {showAll ? "진행 중만 보기" : "완료된 것도 보기"}
          </Link>
        }
      >
        <TaskTable
          tasks={tasks}
          hideProject
          empty={{ title: "이 프로젝트에 업무가 없어요", description: project.status === "archived" ? "보관된 프로젝트예요" : "n 키로 바로 추가할 수 있어요" }}
        />
      </Section>
    </>
  );
}
