import { NotFoundError } from "@/domain/shared/errors";
import type { Id } from "@/domain/shared/types";
import { assertAttachmentSize, type AttachmentOwnerType } from "@/domain/tasks/attachment";
import type { Deps } from "./ports";

export interface UploadFile {
  name: string;
  type: string | null;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

async function assertOwnerExists(deps: Deps, ownerType: AttachmentOwnerType, ownerId: Id) {
  const owner = ownerType === "task" ? await deps.tasks.findById(ownerId) : await deps.work.findById(ownerId);
  if (!owner) throw new NotFoundError(ownerType === "task" ? "업무" : "작업");
}

function safeFileName(name: string): string {
  // Supabase Storage key 는 ASCII 만 허용 (한글 등 non-ASCII 는 "Invalid key" 오류).
  // 원본 이름은 DB 에 따로 보관하고, 다운로드 시 signed URL 의 download 옵션으로 복원.
  const ext = name.match(/\.([A-Za-z0-9]{1,10})$/)?.[1]?.toLowerCase();
  const base = name
    .replace(/\.[^.]*$/, "")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}

export async function uploadAttachment(deps: Deps, ownerType: AttachmentOwnerType, ownerId: Id, file: UploadFile) {
  assertAttachmentSize(file.size);
  await assertOwnerExists(deps, ownerType, ownerId);
  const storagePath = `${ownerType}/${ownerId}/${deps.newId()}_${safeFileName(file.name)}`;
  await deps.storage.upload(storagePath, await file.arrayBuffer(), file.type);
  return deps.attachments.insert({
    ownerType,
    ownerId,
    fileName: file.name,
    storagePath,
    mimeType: file.type,
    sizeBytes: file.size,
  });
}

export async function getAttachmentUrl(deps: Deps, id: Id) {
  const a = await deps.attachments.findById(id);
  if (!a) throw new NotFoundError("첨부파일");
  return deps.storage.signedUrl(a.storagePath, a.fileName);
}

export async function deleteAttachment(deps: Deps, id: Id) {
  const a = await deps.attachments.findById(id);
  if (!a) throw new NotFoundError("첨부파일");
  // 정책: soft delete 만. Storage 파일은 남긴다.
  await deps.attachments.softDelete(id);
}
