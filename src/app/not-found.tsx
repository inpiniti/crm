import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/common/Panel";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="찾는 페이지가 없어요"
      description="지워졌거나 주소가 잘못됐을 수 있어요"
      action={
        <Link href="/" className="text-[13px] text-blue hover:underline">
          홈으로 가기
        </Link>
      }
    />
  );
}
