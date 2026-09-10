"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Clock,
  FolderKanban,
  ListTodo,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/companies", label: "회사", icon: Building2 },
  { href: "/people", label: "사람", icon: Users },
  { href: "/projects", label: "프로젝트", icon: FolderKanban },
  { href: "/tasks", label: "업무", icon: ListTodo },
  { href: "/work", label: "작업", icon: Clock },
  { href: "/personal/projects", label: "개인 프로젝트", icon: FolderKanban },
  { href: "/personal/tasks", label: "개인 업무", icon: ListTodo },
  { href: "/personal/work", label: "개인 작업", icon: Clock },
] as const;

export function ActivityBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="flex h-full w-44 shrink-0 flex-col border-r border-border bg-card/60 select-none">
      {/* 1열 상단: CRM 브랜드 & 검색 버튼 */}
      <div className="flex h-13 items-center justify-between border-b border-border px-3.5">
        <Link
          href="/"
          className="text-[15px] font-bold tracking-tight text-foreground hover:text-blue transition-colors"
        >
          CRM
        </Link>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/tasks?focus=1")}
                className="h-7 px-2 text-[12px] font-medium text-text-2 gap-1 border-border/80 hover:bg-hover"
              />
            }
          >
            <Search className="size-3 text-text-3" />
            <span>검색</span>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span>업무 검색</span>
            <Kbd className="ml-1 text-[10px]">/</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* 1열 메뉴 목록 (회사, 사람, 프로젝트, 업무, 작업) */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2 text-[13.5px] transition-all",
                active
                  ? "bg-blue-weak text-blue font-semibold shadow-xs"
                  : "text-text-2 hover:bg-hover hover:text-foreground font-normal"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "size-4 transition-colors",
                    active ? "text-blue" : "text-text-3 group-hover:text-text-2"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {active && (
                <div className="size-1.5 rounded-full bg-blue animate-in fade-in" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 1열 하단: 새 업무 퀵 버튼 */}
      <div className="border-t border-border p-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("quick-add"))}
                className="flex w-full items-center justify-between rounded-lg border border-dashed border-border/80 px-2.5 py-1.5 text-[12.5px] text-text-2 transition-colors hover:border-blue/50 hover:bg-blue-weak/40 hover:text-blue"
              />
            }
          >
            <span className="flex items-center gap-1.5">
              <Plus className="size-3.5" />
              <span>새 업무</span>
            </span>
            <Kbd className="text-[10px] bg-muted/60">n</Kbd>
          </TooltipTrigger>
          <TooltipContent side="right">어느 화면에서든 n</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
