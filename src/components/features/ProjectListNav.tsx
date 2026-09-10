"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";
import { Chip } from "@/components/common/StatusBadge";
import type { ProjectListItem } from "@/infrastructure/supabase/repositories/projects";
import { ProjectFormButton } from "@/components/features/EntityForms";
import type { Option } from "@/infrastructure/supabase/repositories/companies";
import { cn } from "@/lib/utils";

interface ProjectListNavProps {
  projects: ProjectListItem[];
  companies: Option[];
  basePath?: string;
  title?: string;
}

function formatPeriod(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt) return "";
  const start = startedAt.length >= 10 ? startedAt.slice(2).replace(/-/g, ".") : startedAt;
  const end = endedAt ? (endedAt.length >= 10 ? endedAt.slice(2).replace(/-/g, ".") : endedAt) : "";
  return `${start} ~ ${end}`;
}

export function ProjectListNav({ projects, companies, basePath = "", title = "프로젝트" }: ProjectListNavProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      (p.companyName && p.companyName.toLowerCase().includes(query.trim().toLowerCase()))
  );

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-card/40 select-none">
      {/* 2열 헤더 */}
      <div className="flex h-13 items-center justify-between border-b border-border px-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-foreground">{title}</span>
          <span className="num rounded-full bg-muted px-1.5 py-0.2 text-[11px] font-semibold text-text-3">
            {projects.length}
          </span>
        </div>
        <ProjectFormButton companies={companies} />
      </div>

      {/* 2열 검색 필터 */}
      <div className="border-b border-border p-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-text-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="프로젝트, 회사명 검색..."
            className="h-8 w-full rounded-md bg-muted/60 pl-8 pr-2.5 text-[12.5px] placeholder:text-text-3 focus:bg-background focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </div>
      </div>

      {/* 2열 리스트 */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-text-3">
            {query ? "검색 결과가 없어요" : "등록된 프로젝트가 없어요"}
          </div>
        ) : (
          filtered.map((p) => {
            const isActive = pathname === `${basePath}/projects/${p.id}`;
            const period = formatPeriod(p.startedAt, p.endedAt);

            return (
              <Link
                key={p.id}
                href={`${basePath}/projects/${p.id}`}
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
                  {p.status === "archived" ? (
                    <Chip className="bg-muted text-text-3 text-[10px] px-1 py-0 h-4 shrink-0">종료</Chip>
                  ) : p.openCount > 0 ? (
                    <span className="num text-[11px] font-semibold text-blue shrink-0">
                      {p.openCount}건
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[11.5px] text-text-3 font-normal">
                  <span className="truncate">{p.companyName ?? "개인"}</span>
                  <span className="flex shrink-0 items-center gap-1.5 ml-1.5">
                    {isActive && <span className="size-1.5 rounded-full bg-blue" aria-hidden />}
                    {period && <span className="num">{period}</span>}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
