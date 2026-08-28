import { DomainError } from "../shared/errors";
import type { Id, Timestamp } from "../shared/types";

export const ATTACHMENT_OWNER_TYPES = ["task", "work"] as const;
export type AttachmentOwnerType = (typeof ATTACHMENT_OWNER_TYPES)[number];

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20MB

export interface Attachment {
  id: Id;
  ownerType: AttachmentOwnerType;
  ownerId: Id;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
}

export function assertAttachmentSize(sizeBytes: number) {
  if (sizeBytes > MAX_ATTACHMENT_BYTES) {
    throw new DomainError("attachment.too_large", "파일은 20MB까지 올릴 수 있어요. 큰 파일은 링크로 남겨 주세요.");
  }
  if (sizeBytes === 0) {
    throw new DomainError("attachment.empty", "빈 파일은 올릴 수 없어요.");
  }
}

export function formatBytes(n: number | null | undefined): string {
  if (!n) return "";
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}
