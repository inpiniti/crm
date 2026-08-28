"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileArchive, FileImage, FileSpreadsheet, FileText, Paperclip, Upload, X } from "lucide-react";
import { deleteAttachment, uploadAttachmentAction } from "@/app/actions/attachments";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/common/ActionForm";
import { formatBytes, type Attachment, type AttachmentOwnerType } from "@/domain/tasks/attachment";

function IconFor({ mime, name }: { mime: string | null; name: string }) {
  const cls = "size-3.5 shrink-0 text-text-3";
  if (mime?.startsWith("image/")) return <FileImage className={cls} />;
  if (/\.(xlsx?|csv)$/i.test(name)) return <FileSpreadsheet className={cls} />;
  if (/\.(zip|7z|rar)$/i.test(name)) return <FileArchive className={cls} />;
  if (mime === "application/pdf" || /\.(pdf|docx?|hwp|txt|md)$/i.test(name)) return <FileText className={cls} />;
  return <Paperclip className={cls} />;
}

export function AttachmentList({ taskId, attachments }: { taskId: number; attachments: Attachment[] }) {
  if (attachments.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {attachments.map((a) => (
        <li key={a.id} className="group/att flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted/40 pl-2.5 pr-1 text-[13px]">
          <a href={`/attachments/${a.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-blue">
            <IconFor mime={a.mimeType} name={a.fileName} />
            <span className="max-w-[220px] truncate">{a.fileName}</span>
            <span className="num text-[11.5px] text-text-3">{formatBytes(a.sizeBytes)}</span>
          </a>
          <ConfirmAction
            action={() => deleteAttachment(a.id, taskId)}
            title="첨부파일을 지울까요?"
            description={a.fileName}
            successMessage="첨부파일을 지웠어요"
            size="icon-xs"
            className="text-text-3 opacity-0 hover:text-red group-hover/att:opacity-100"
          >
            <X />
          </ConfirmAction>
        </li>
      ))}
    </ul>
  );
}

export function AttachmentUpload({ ownerType, ownerId, taskId, onDone }: { ownerType: AttachmentOwnerType; ownerId: number; taskId: number; onDone?: () => void }) {
  const router = useRouter();
  const [names, setNames] = useState<string[]>([]);
  return (
    <ActionForm
      action={uploadAttachmentAction}
      successMessage="파일을 올렸어요"
      resetOnSuccess
      onSuccess={() => {
        setNames([]);
        router.refresh();
        onDone?.();
      }}
      className="mt-2 flex items-center gap-2 text-[13px]"
    >
      <input type="hidden" name="ownerType" value={ownerType} />
      <input type="hidden" name="ownerId" value={ownerId} />
      <input type="hidden" name="taskId" value={taskId} />
      <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-text-2 transition-colors hover:border-blue hover:text-blue">
        <Upload className="size-3.5" />
        {names.length ? <span className="max-w-[320px] truncate">{names.join(", ")}</span> : "파일 고르기 (20MB 이하)"}
        <input type="file" name="files" multiple className="hidden" onChange={(e) => setNames([...(e.target.files ?? [])].map((f) => f.name))} />
      </label>
      {names.length > 0 && (
        <SubmitButton size="sm" variant="secondary">
          올리기
        </SubmitButton>
      )}
    </ActionForm>
  );
}
