import { notFound } from "next/navigation";
import { AttachmentList, AttachmentUpload } from "@/components/features/Attachments";
import { TaskBody, TaskHeader } from "@/components/features/TaskDetail";
import { WorkTimeline } from "@/components/features/WorkTimeline";
import { Panel, Section } from "@/components/common/Panel";
import { listPersonOptions } from "@/infrastructure/supabase/repositories/people";
import { listProjectOptions } from "@/infrastructure/supabase/repositories/projects";
import { getTaskDetail } from "@/infrastructure/supabase/repositories/tasks";
import { DetailHeaderSetter } from "@/components/layout/DetailHeaderContext";

export default async function PersonalTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const [task, projects, people] = await Promise.all([
    getTaskDetail(n, "personal"),
    listProjectOptions({ scope: "personal" }),
    listPersonOptions(),
  ]);
  if (!task) notFound();

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8 space-y-7">
      <DetailHeaderSetter title={task.title} subtitle={task.projectName} />
      <TaskHeader task={task} projects={projects} people={people} basePath="/personal" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Section title="작업 기록">
          <WorkTimeline taskId={task.id} status={task.status} work={task.work} />
        </Section>
        <div className="space-y-6">
          <Section title="내용">
            <TaskBody body={task.body} />
          </Section>
          <Section title="첨부파일">
            <Panel className="p-4">
              <AttachmentList taskId={task.id} attachments={task.attachments} />
              {task.attachments.length === 0 && <div className="text-[13px] text-text-3">요구사항 문서나 캡처를 붙여 두세요</div>}
              <AttachmentUpload ownerType="task" ownerId={task.id} taskId={task.id} />
            </Panel>
          </Section>
        </div>
      </div>
    </div>
  );
}
