import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TaskFilters } from "@/components/features/TaskFilters";
import { TaskTable } from "@/components/features/TaskTable";
import { PageHeader } from "@/components/common/Panel";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { listPersonOptions } from "@/infrastructure/supabase/repositories/people";
import { listProjectOptions } from "@/infrastructure/supabase/repositories/projects";
import { listAllTags, listTasks, type TaskFilter } from "@/infrastructure/supabase/repositories/tasks";
import { attempt } from "@/lib/attempt";


export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const filter: TaskFilter = {
    status: (one("status") as TaskFilter["status"]) ?? "all",
    projectId: one("projectId") ? Number(one("projectId")) : undefined,
    requesterId: one("requesterId") ? Number(one("requesterId")) : undefined,
    q: one("q") || undefined,
    tag: one("tag") || undefined,
  };

  const hasSpecificFilter = !!(filter.q || filter.projectId || filter.requesterId || filter.tag || one("focus") === "1" || one("status"));

  const r = await attempt(() => Promise.all([listTasks(filter), listProjectOptions(), listPersonOptions(), listAllTags()]));
  if (!r.ok) return <SetupNotice error={r.error} />;
  const [tasks, projects, people, tags] = r.value;

  if (!hasSpecificFilter && tasks.length > 0) {
    redirect(`/tasks/${tasks[0].id}`);
  }

  const filtered = !!(filter.q || filter.projectId || filter.requesterId || filter.tag);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <PageHeader title="업무 검색 및 필터" description={<span className="num">{tasks.length}건</span>} />
      <Suspense>
        <TaskFilters projects={projects} people={people} tags={tags} autoFocusSearch={one("focus") === "1"} />
      </Suspense>
      <TaskTable tasks={tasks} empty={filtered ? { title: "조건에 맞는 업무가 없어요", description: "필터를 바꿔 보세요" } : undefined} />
    </div>
  );
}

