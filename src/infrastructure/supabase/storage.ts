import "server-only";
import type { FileStorage } from "@/application/ports";
import { DbError, supabase } from "./client";

const BUCKET = "attachments";

export const fileStorage: FileStorage = {
  async upload(path, data, contentType) {
    const { error } = await supabase()
      .storage.from(BUCKET)
      .upload(path, data, { contentType: contentType ?? "application/octet-stream", upsert: false });
    if (error) throw new DbError(`파일 업로드 실패: ${error.message}`, error);
  },
  async signedUrl(path, fileName) {
    const { data, error } = await supabase()
      .storage.from(BUCKET)
      .createSignedUrl(path, 60 * 10, { download: fileName });
    if (error || !data) throw new DbError(`다운로드 링크 생성 실패: ${error?.message}`, error);
    return data.signedUrl;
  },
  async remove(path) {
    const { error } = await supabase().storage.from(BUCKET).remove([path]);
    if (error) throw new DbError(`파일 삭제 실패: ${error.message}`, error);
  },
};
