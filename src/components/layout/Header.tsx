"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Building2, Clock, FolderKanban, LayoutDashboard, ListTodo, Moon, Plus, Search, Sun, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "홈", icon: LayoutDashboard },
  { href: "/tasks", label: "업무", icon: ListTodo },
  { href: "/work", label: "작업", icon: Clock },
  { href: "/projects", label: "프로젝트", icon: FolderKanban },
  { href: "/people", label: "사람", icon: Users },
  { href: "/companies", label: "회사", icon: Building2 },
] as const;

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-6 px-6">
        <Link href="/" className="text-[15px] font-bold tracking-tight">
          업무 기록
        </Link>
        <nav className="flex items-center gap-0.5">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-lg px-3 text-[14px] transition-colors",
                  active ? "bg-accent font-semibold text-foreground" : "text-text-2 hover:bg-hover hover:text-foreground",
                )}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="sm" onClick={() => router.push("/tasks?focus=1")} />}>
              <Search />
              검색
              <Kbd>/</Kbd>
            </TooltipTrigger>
            <TooltipContent>업무 검색</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="sm" onClick={() => window.dispatchEvent(new CustomEvent("quick-add"))} />}
            >
              <Plus />
              새 업무
              <Kbd>n</Kbd>
            </TooltipTrigger>
            <TooltipContent>어느 화면에서든 n</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon-sm" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="테마 전환">
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
          </Button>
        </div>
      </div>
    </header>
  );
}
