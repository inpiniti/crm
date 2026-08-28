"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as uc from "@/application/tasks";
import { deps } from "@/infrastructure/container";
import { TASK_PRIORITIES, parseTagString } from "@/domain/tasks/task";
import { TASK_STATUSES } from "@/domain/tasks/task-status";
import { fromDateTimeLocal, todayKst } from "@/lib/date";
import { int, run, str, type ActionResult } from "./result";

const TaskForm = z.object({
  projectId: z.number({ message: "프로젝트를 골라 주세요." }).int(),
  requesterId: z.number().int().nullable(),
  title: z.string(),
  body: z.string().nullable(),
  priority: z.enum(TASK_PRIORITIES),
  requestedAt: z.string().nullable(),
  dueAt: z.string().nullable(),
  source: z.string().nullable(),
  tags: z.array(z.string()),
});

function parseTaskForm(fd: FormData) {
  return TaskForm.parse({
    projectId: int(fd, "projectId"),
    requesterId: int(fd, "requesterId"),
    title: str(fd, "title") ?? "",
    body: str(fd, "body"),
    priority: str(fd, "priority") ?? "normal",
    requestedAt: str(fd, "requestedAt") ?? todayKst(),
    dueAt: fromDateTimeLocal(str(fd, "dueAt")),
    source: str(fd, "source"),
    tags: parseTagString(str(fd, "tags") ?? ""),
  });
}

function revalidateTask(id?: number) {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/work");
  revalidatePath("/projects");
  revalidatePath("/people");
  if (id) revalidatePath(`/tasks/${id}`);
}

export async function createTaskAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const task = await uc.createTask(deps, parseTaskForm(fd));
    revalidateTask();
    const goDetail = str(fd, "goDetail") === "1";
    return { ok: true, id: task.id, redirect: goDetail ? `/tasks/${task.id}` : undefined };
  });
}

export async function updateTaskAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const id = int(fd, "id");
    if (!id) throw new Error("id");
    await uc.updateTask(deps, id, parseTaskForm(fd));
    revalidateTask(id);
  });
}

export async function changeTaskStatus(id: number, status: string): Promise<ActionResult> {
  return run(async () => {
    const s = z.enum(TASK_STATUSES).parse(status);
    await uc.changeTaskStatus(deps, id, s);
    revalidateTask(id);
  });
}

export async function moveTask(id: number, projectId: number): Promise<ActionResult> {
  return run(async () => {
    await uc.moveTask(deps, id, projectId);
    revalidateTask(id);
  });
}

export async function deleteTask(id: number): Promise<ActionResult> {
  return run(async () => {
    await uc.deleteTask(deps, id);
    revalidateTask(id);
    return { ok: true, redirect: "/tasks" };
  });
}
