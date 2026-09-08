import { attempt } from "@/lib/attempt";
import { listTasks } from "@/infrastructure/supabase/repositories/tasks";
import { SetupNotice } from "@/components/layout/SetupNotice";
import { TaskListNav } from "@/components/features/TaskListNav";
import { DetailTopBar } from "@/components/layout/DetailTopBar";

export const dynamic = "force-dynamic";

export default async function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const r = await attempt(() => listTasks({ status: "all" }));

  if (!r.ok) {
    return (
      <div className="p-6">
        <SetupNotice error={r.error} />
      </div>
    );
  }

  const tasks = r.value;

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden">
      {/* 2열: 업무 목록 탐색기 */}
      <TaskListNav tasks={tasks} />

      {/* 3열: 업무 상세 (Editor View) */}
      <section className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-background">
        <DetailTopBar moduleName="업무" />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </section>
    </div>
  );
}
