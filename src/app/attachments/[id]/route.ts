import { NextResponse } from "next/server";
import { getAttachmentUrl } from "@/application/attachments";
import { deps } from "@/infrastructure/container";

/** 첨부파일 다운로드: signed URL 로 리다이렉트 */
export async function GET(_req: Request, ctx: RouteContext<"/attachments/[id]">) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n)) return new NextResponse("잘못된 요청이에요.", { status: 400 });
  try {
    const url = await getAttachmentUrl(deps, n);
    return NextResponse.redirect(url);
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "파일을 찾을 수 없어요.", { status: 404 });
  }
}
