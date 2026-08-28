"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as uc from "@/application/attachments";
import { deps } from "@/infrastructure/container";
import { ATTACHMENT_OWNER_TYPES } from "@/domain/tasks/attachment";
import { int, run, str, type ActionResult } from "./result";

export async function uploadAttachmentAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ownerType = z.enum(ATTACHMENT_OWNER_TYPES).parse(str(fd, "ownerType"));
    const ownerId = int(fd, "ownerId");
    const taskId = int(fd, "taskId");
    if (!ownerId || !taskId) throw new Error("owner");
    const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return { ok: false, error: "올릴 파일을 골라 주세요." };
    for (const f of files) {
      await uc.uploadAttachment(deps, ownerType, ownerId, {
        name: f.name,
        type: f.type || null,
        size: f.size,
        arrayBuffer: () => f.arrayBuffer(),
      });
    }
    revalidatePath(`/tasks/${taskId}`);
  });
}

export async function deleteAttachment(id: number, taskId: number): Promise<ActionResult> {
  return run(async () => {
    await uc.deleteAttachment(deps, id);
    revalidatePath(`/tasks/${taskId}`);
  });
}
