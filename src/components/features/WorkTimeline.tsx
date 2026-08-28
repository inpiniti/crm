"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Paperclip, Pencil, Trash2 } from "lucide-react";
import { addWorkAction, deleteWork, updateWorkAction } from "@/app/actions/work";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/common/ActionForm";
import { Field } from "@/components/common/Field";
import { Markdown } from "@/components/common/Markdown";
import { EmptyState, Panel } from "@/components/common/Panel";
import { Chip } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { isClosed, type TaskStatus } from "@/domain/tasks/task-status";
import { WORK_KINDS, WORK_KIND_LABEL, formatDuration } from "@/domain/tasks/work";
import type { WorkWithAttachments } from "@/infrastructure/supabase/repositories/tasks";
import { formatDateTime, nowDateTimeLocal, toDateTimeLocal } from "@/lib/date";
import { AttachmentList, AttachmentUpload } from "./Attachments";

export function WorkTimeline({ taskId, status, work }: { taskId: number; status: TaskStatus; work: WorkWithAttachments[] }) {
  const closed = isClosed(status);
  return (
    <div className="space-y-2.5">
      {!closed && <WorkForm taskId={taskId} />}
      {closed && work.length === 0 && <EmptyState icon={CheckCircle2} title="작업 기록 없이 끝난 업무예요" />}
      {work.length === 0 && !closed && <EmptyState icon={Clock} title="아직 한 일이 없어요" description="위에 오늘 한 일을 한 줄만 적어 보세요" />}
      {work.map((w) => (
        <WorkItem key={w.id} taskId={taskId} work={w} />
      ))}
    </div>
  );
}

function WorkFields({ defaults }: { defaults?: WorkWithAttachments }) {
  return (
    <>
      <Textarea name="body" defaultValue={defaults?.body ?? ""} placeholder="무엇을 했나요? (마크다운 가능)" rows={defaults ? 4 : 2} autoFocus={!!defaults} required />
      <div className="grid grid-cols-[1fr_110px_110px] gap-2">
        <Field label="작업 시각">
          <Input type="datetime-local" name="workedAt" defaultValue={defaults ? toDateTimeLocal(defaults.workedAt) : nowDateTimeLocal()} required />
        </Field>
        <Field label="소요(분)">
          <Input type="number" name="durationMin" min={0} step={5} defaultValue={defaults?.durationMin ?? ""} placeholder="90" />
        </Field>
        <Field label="유형">
          <NativeSelect className="w-full" name="kind" defaultValue={defaults?.kind ?? ""}>
            <NativeSelectOption value="">—</NativeSelectOption>
            {WORK_KINDS.map((k) => (
              <NativeSelectOption key={k} value={k}>
                {WORK_KIND_LABEL[k]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>
    </>
  );
}

function WorkForm({ taskId }: { taskId: number }) {
  const router = useRouter();
  return (
    <Panel className="border-blue/30 p-3.5">
      <ActionForm action={addWorkAction} successMessage="작업을 기록했어요" resetOnSuccess onSuccess={() => router.refresh()} className="space-y-2.5">
        <input type="hidden" name="taskId" value={taskId} />
        <WorkFields />
        <div className="flex items-center justify-between">
          <KbdGroup className="text-[12px] text-text-3">
            <Kbd>Ctrl</Kbd>
            <span>+</span>
            <Kbd>Enter</Kbd>
            <span className="ml-1">저장</span>
          </KbdGroup>
          <SubmitButton size="sm">기록하기</SubmitButton>
        </div>
      </ActionForm>
    </Panel>
  );
}

function WorkItem({ taskId, work }: { taskId: number; work: WorkWithAttachments }) {
  const [edit, setEdit] = useState(false);
  const [upload, setUpload] = useState(false);
  const router = useRouter();

  if (edit) {
    return (
      <Panel className="p-3.5">
        <ActionForm
          action={updateWorkAction}
          successMessage="저장했어요"
          onSuccess={() => {
            setEdit(false);
            router.refresh();
          }}
          className="space-y-2.5"
        >
          <input type="hidden" name="id" value={work.id} />
          <input type="hidden" name="taskId" value={taskId} />
          <WorkFields defaults={work} />
          <div className="flex justify-end gap-1.5">
            <Button variant="ghost" size="sm" type="button" onClick={() => setEdit(false)}>
              닫기
            </Button>
            <SubmitButton size="sm">저장하기</SubmitButton>
          </div>
        </ActionForm>
      </Panel>
    );
  }

  return (
    <Panel className="group p-3.5">
      <div className="mb-1.5 flex items-center gap-2 text-[12px] text-text-3">
        <span className="num font-medium text-text-2">{formatDateTime(work.workedAt)}</span>
        {work.durationMin ? <Chip className="bg-muted text-text-2">{formatDuration(work.durationMin)}</Chip> : null}
        {work.kind && <Chip className="bg-blue-weak text-blue">{WORK_KIND_LABEL[work.kind]}</Chip>}
        <span className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon-xs" onClick={() => setUpload((u) => !u)} aria-label="첨부">
            <Paperclip />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => setEdit(true)} aria-label="수정">
            <Pencil />
          </Button>
          <ConfirmAction action={() => deleteWork(work.id, taskId)} title="이 작업 기록을 지울까요?" successMessage="지웠어요" size="icon-xs" className="hover:text-red">
            <Trash2 />
          </ConfirmAction>
        </span>
      </div>
      <Markdown>{work.body}</Markdown>
      {(work.attachments.length > 0 || upload) && (
        <div className="mt-3 border-t border-border pt-3">
          <AttachmentList taskId={taskId} attachments={work.attachments} />
          {upload && <AttachmentUpload ownerType="work" ownerId={work.id} taskId={taskId} onDone={() => setUpload(false)} />}
        </div>
      )}
    </Panel>
  );
}
