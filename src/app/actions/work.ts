"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as uc from "@/application/tasks";
import { deps } from "@/infrastructure/container";
import { WORK_KINDS } from "@/domain/tasks/work";
import { fromDateTimeLocal } from "@/lib/date";
import { int, run, str, type ActionResult } from "./result";

const WorkForm = z.object({
  body: z.string(),
  workedAt: z.string({ message: "작업 시각을 적어 주세요." }),
  durationMin: z.number().int().nullable(),
  kind: z.enum(WORK_KINDS).nullable(),
});

function parseWorkForm(fd: FormData) {
  return WorkForm.parse({
    body: str(fd, "body") ?? "",
    workedAt: fromDateTimeLocal(str(fd, "workedAt")) ?? new Date().toISOString(),
    durationMin: int(fd, "durationMin"),
    kind: str(fd, "kind"),
  });
}

function revalidate(taskId: number) {
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  revalidatePath("/work");
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function addWorkAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const taskId = int(fd, "taskId");
    if (!taskId) throw new Error("taskId");
    const w = await uc.addWork(deps, taskId, parseWorkForm(fd));
    revalidate(taskId);
    return { ok: true, id: w.id };
  });
}

export async function updateWorkAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const id = int(fd, "id");
    const taskId = int(fd, "taskId");
    if (!id || !taskId) throw new Error("id");
    await uc.updateWork(deps, id, parseWorkForm(fd));
    revalidate(taskId);
  });
}

export async function deleteWork(id: number, taskId: number): Promise<ActionResult> {
  return run(async () => {
    await uc.deleteWork(deps, id);
    revalidate(taskId);
  });
}
