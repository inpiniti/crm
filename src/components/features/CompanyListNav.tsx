"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Chip } from "@/components/common/StatusBadge";
import { COMPANY_TYPE_LABEL, isCurrentEmployer } from "@/domain/companies/company";
import type { CompanyListItem } from "@/infrastructure/supabase/repositories/companies";
import { CompanyFormButton } from "@/components/features/EntityForms";
import { cn } from "@/lib/utils";

interface CompanyListNavProps {
  companies: CompanyListItem[];
}

function formatPeriod(joinedAt: string | null, leftAt: string | null): string {
  if (!joinedAt) return "";
  const start = joinedAt.length >= 10 ? joinedAt.slice(2).replace(/-/g, ".") : joinedAt;
  const end = leftAt ? (leftAt.length >= 10 ? leftAt.slice(2).replace(/-/g, ".") : leftAt) : "";
  return `${start} ~ ${end}`;
}

export function CompanyListNav({ companies }: CompanyListNavProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-card/40 select-none">
      {/* 2열 헤더: 회사 타이틀 & 추가 버튼 */}
      <div className="flex h-13 items-center justify-between border-b border-border px-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-foreground">회사</span>
          <span className="num rounded-full bg-muted px-1.5 py-0.2 text-[11px] font-semibold text-text-3">
            {companies.length}
          </span>
        </div>
        <CompanyFormButton />
      </div>

      {/* 2열 검색 필터 */}
      <div className="border-b border-border p-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-text-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="회사 검색..."
            className="h-8 w-full rounded-md bg-muted/60 pl-8 pr-2.5 text-[12.5px] placeholder:text-text-3 focus:bg-background focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </div>
      </div>

      {/* 2열 회사 리스트 (와이어프레임 스타일: 이름 + 기간) */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-text-3">
            {query ? "검색 결과가 없어요" : "등록된 회사가 없어요"}
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = pathname === `/companies/${c.id}`;
            const period = formatPeriod(c.joinedAt, c.leftAt);

            return (
              <Link
                key={c.id}
                href={`/companies/${c.id}`}
                className={cn(
                  "group block px-3.5 py-3 transition-colors",
                  isActive
                    ? "bg-blue-weak/60 text-blue font-semibold border-l-2 border-l-blue"
                    : "hover:bg-hover text-foreground border-l-2 border-l-transparent"
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className={cn("truncate text-[13.5px]", isActive ? "font-semibold text-blue" : "font-medium text-foreground")}>
                    {c.name}
                  </span>
                  {isCurrentEmployer(c) ? (
                    <Chip className="bg-blue-weak text-blue text-[10px] px-1 py-0 h-4 shrink-0">재직 중</Chip>
                  ) : (
                    <span className="text-[11px] text-text-3 shrink-0">
                      {COMPANY_TYPE_LABEL[c.type]}
                    </span>
                  )}
                </div>
                {period && (
                  <div className="num mt-1 text-[11.5px] text-text-3 font-normal">
                    {period}
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
