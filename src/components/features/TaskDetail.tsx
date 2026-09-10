"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { changeTaskStatus, deleteTask, updateTaskAction } from "@/app/actions/tasks";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/common/ActionForm";
import { Combobox, type ComboOption } from "@/components/common/Combobox";
import { Field, FormRow } from "@/components/common/Field";
import { Markdown } from "@/components/common/Markdown";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { Panel } from "@/components/common/Panel";
import { PriorityBadge, StatusDot, TagChip } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { TASK_PRIORITIES, TASK_PRIORITY_LABEL, isOverdue } from "@/domain/tasks/task";
import { TASK_STATUS_LABEL, isClosed, nextStatuses } from "@/domain/tasks/task-status";
import { formatDuration } from "@/domain/tasks/work";
import type { TaskDetail as TaskDetailModel } from "@/infrastructure/supabase/repositories/tasks";
import { formatDateTime, relativeDay, toDateTimeLocal } from "@/lib/date";
import { cn } from "@/lib/utils";

export function TaskHeader({
  task,
  projects,
  people,
  basePath = "",
}: {
  task: TaskDetailModel;
  projects: ComboOption[];
  people: ComboOption[];
  basePath?: string;
}) {
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  const overdue = isOverdue(task);

  const onStatus = async (s: string) => {
    const r = await changeTaskStatus(task.id, s);
    if (r.ok) {
      toast.success(`${TASK_STATUS_LABEL[s as keyof typeof TASK_STATUS_LABEL]}(으)로 바꿨어요`);
      router.refresh();
    } else toast.error(r.error);
  };

  return (
    <>
      <div className="mb-6">
        <div className="mb-1.5 text-[13px] text-text-3">
          <Link href={`${basePath}/tasks`} className="hover:text-foreground">
            업무
          </Link>
          <span className="mx-1.5">/</span>
          <Link href={`${basePath}/projects/${task.projectId}`} className="hover:text-foreground">
            {task.companyName ? `${task.companyName} · ` : ""}
            {task.projectName}
          </Link>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight">
            {task.title}
            {(task.priority !== "normal" || task.tags.length > 0) && (
              <span className="ml-2 inline-flex gap-1 align-middle">
                <PriorityBadge priority={task.priority} />
                {task.tags.map((t) => (
                  <TagChip key={t}>{t}</TagChip>
                ))}
              </span>
            )}
          </h1>
          <div className="flex shrink-0 items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <StatusDot status={task.status} />
                {TASK_STATUS_LABEL[task.status]}
                <ChevronDown className="text-text-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {nextStatuses(task.status).map((s) => (
                  <DropdownMenuItem key={s} onClick={() => onStatus(s)}>
                    <StatusDot status={s} />
                    {TASK_STATUS_LABEL[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => setEdit(true)}>
              <Pencil />
              수정
            </Button>
            <ConfirmAction
              action={() => deleteTask(task.id)}
              title="이 업무를 지울까요?"
              description="작업 기록과 첨부파일도 함께 지워져요."
              successMessage="업무를 지웠어요"
              className="text-text-3 hover:text-red"
            >
              <Trash2 />
            </ConfirmAction>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-[auto_1fr_auto_1fr]">
          <dt className="text-text-3">요청자</dt>
          <dd>
            {task.requesterId ? (
              <Link href={`/people/${task.requesterId}`} className="hover:text-blue">
                {task.requesterName}
              </Link>
            ) : (
              <span className="text-text-2">본인</span>
            )}
            {task.source && <span className="ml-1 text-text-3">· {task.source}</span>}
          </dd>
          <dt className="text-text-3">요청일</dt>
          <dd className="num text-text-2">{task.requestedAt ?? "—"}</dd>
          <dt className="text-text-3">시작일</dt>
          <dd className="num text-text-2">{task.startedAt ?? "—"}</dd>
          <dt className="text-text-3">마감</dt>
          <dd className={cn("num", overdue ? "font-semibold text-red" : "text-text-2")}>
            {task.dueAt ? `${formatDateTime(task.dueAt)} · ${relativeDay(task.dueAt)}` : "—"}
          </dd>
          <dt className="text-text-3">{isClosed(task.status) ? "종료" : "작업"}</dt>
          <dd className="num text-text-2">
            {isClosed(task.status) && task.completedAt ? `${formatDateTime(task.completedAt)} · ` : ""}
            {task.work.length}건{task.totalMin ? ` · ${formatDuration(task.totalMin)}` : ""}
          </dd>
        </dl>
      </div>

      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>업무 수정</DialogTitle>
          </DialogHeader>
          <ActionForm
            action={updateTaskAction}
            successMessage="저장했어요"
            onSuccess={() => {
              setEdit(false);
              router.refresh();
            }}
            className="space-y-4"
          >
            <input type="hidden" name="id" value={task.id} />
            <Field label="제목">
              <Input name="title" defaultValue={task.title} required autoFocus />
            </Field>
            <FormRow>
              <Field label="프로젝트" hint={task.projectStatus === "archived" ? "종료된 프로젝트예요. 다른 곳으로 옮길 수 있어요." : undefined}>
                <Combobox
                  name="projectId"
                  options={projects.some((p) => p.id === task.projectId) ? projects : [{ id: task.projectId, label: task.projectName }, ...projects]}
                  value={task.projectId}
                />
              </Field>
              <Field label="요청자">
                <Combobox name="requesterId" options={people} value={task.requesterId} nullLabel="내가 직접" />
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="요청일">
                <Input type="date" name="requestedAt" defaultValue={task.requestedAt ?? ""} />
              </Field>
              <Field label="시작일">
                <Input type="date" name="startedAt" defaultValue={task.startedAt ?? ""} />
              </Field>
              <Field label="마감">
                <Input type="datetime-local" name="dueAt" defaultValue={toDateTimeLocal(task.dueAt)} />
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="우선순위">
                <NativeSelect className="w-full" name="priority" defaultValue={task.priority}>
                  {TASK_PRIORITIES.map((p) => (
                    <NativeSelectOption key={p} value={p}>
                      {TASK_PRIORITY_LABEL[p]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="요청 경로" hint="구두, 메신저, 메일, 회의 …">
                <Input name="source" defaultValue={task.source ?? ""} />
              </Field>
              <Field label="태그" hint="쉼표 또는 공백으로 구분">
                <Input name="tags" defaultValue={task.tags.join(", ")} />
              </Field>
            </FormRow>
            <Field label="내용">
              <MarkdownEditor name="body" defaultValue={task.body ?? ""} placeholder="요청 내용, 배경, 메모" />
            </Field>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setEdit(false)}>
                닫기
              </Button>
              <SubmitButton>저장하기</SubmitButton>
            </DialogFooter>
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TaskBody({ body }: { body: string | null }) {
  return (
    <Panel className="p-4">
      {body?.trim() ? <Markdown>{body}</Markdown> : <span className="text-[13px] text-text-3">아직 내용이 없어요. 수정에서 요청 배경이나 메모를 적어 두세요.</span>}
    </Panel>
  );
}
