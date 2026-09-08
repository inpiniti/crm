"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";
import type { PersonListItem } from "@/infrastructure/supabase/repositories/people";
import { PersonFormButton } from "@/components/features/EntityForms";
import type { Option } from "@/infrastructure/supabase/repositories/companies";
import { cn } from "@/lib/utils";

interface PersonListNavProps {
  people: PersonListItem[];
  companies: Option[];
}

export function PersonListNav({ people, companies }: PersonListNavProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const filtered = people.filter(
    (p) =>
      p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      (p.companyName && p.companyName.toLowerCase().includes(query.trim().toLowerCase())) ||
      (p.department && p.department.toLowerCase().includes(query.trim().toLowerCase()))
  );

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-card/40 select-none">
      {/* 2열 헤더 */}
      <div className="flex h-13 items-center justify-between border-b border-border px-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-foreground">사람</span>
          <span className="num rounded-full bg-muted px-1.5 py-0.2 text-[11px] font-semibold text-text-3">
            {people.length}
          </span>
        </div>
        <PersonFormButton companies={companies} />
      </div>

      {/* 2열 검색 필터 */}
      <div className="border-b border-border p-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-text-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="사람 이름, 회사, 부서..."
            className="h-8 w-full rounded-md bg-muted/60 pl-8 pr-2.5 text-[12.5px] placeholder:text-text-3 focus:bg-background focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </div>
      </div>

      {/* 2열 리스트 */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-text-3">
            {query ? "검색 결과가 없어요" : "등록된 사람이 없어요"}
          </div>
        ) : (
          filtered.map((p) => {
            const isActive = pathname === `/people/${p.id}`;
            const sub = [p.companyName, p.department, p.title].filter(Boolean).join(" · ");

            return (
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                className={cn(
                  "group block px-3.5 py-2.5 transition-colors",
                  isActive
                    ? "bg-blue-weak/60 text-blue font-semibold border-l-2 border-l-blue"
                    : "hover:bg-hover text-foreground border-l-2 border-l-transparent"
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className={cn("truncate text-[13.5px]", isActive ? "font-semibold text-blue" : "font-medium text-foreground")}>
                    {p.name}
                  </span>
                  {p.openCount > 0 && (
                    <span className="num text-[11px] font-semibold text-blue shrink-0">
                      {p.openCount}건
                    </span>
                  )}
                </div>
                {sub && (
                  <div className="mt-0.5 truncate text-[11.5px] text-text-3 font-normal">
                    {sub}
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
