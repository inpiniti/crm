"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDetailHeader } from "./DetailHeaderContext";

interface DetailTopBarProps {
  moduleName?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function DetailTopBar({ moduleName, subtitle, children }: DetailTopBarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  let headerState: { title?: string; subtitle?: string; badge?: string } = {};
  let isAiOpen = true;
  let toggleAi = () => {};

  try {
    const ctx = useDetailHeader();
    headerState = ctx.header;
    isAiOpen = ctx.isAiOpen;
    toggleAi = ctx.toggleAi;
  } catch {
    // DetailHeaderProvider 바깥인 경우 폴백
  }

  // 기본 모듈명
  const defaultModule = moduleName ?? (
    pathname.startsWith("/tasks") ? "업무" :
    pathname.startsWith("/companies") ? "회사" :
    pathname.startsWith("/people") ? "사람" :
    pathname.startsWith("/projects") ? "프로젝트" :
    pathname.startsWith("/work") ? "작업" :
    "CRM"
  );

  // 동적 타이틀이 있으면 [모듈명] > [실제 엔티티 명] 형식으로 표현
  const activeTitle = headerState.title;
  const activeSubtitle = headerState.subtitle ?? subtitle;

  return (
    <header className="flex h-13 shrink-0 items-center justify-between border-b border-border bg-card/20 px-4 sm:px-6 select-none">
      {/* 상단바 좌측: 브레드크럼 / 상세 컨텍스트 */}
      <div className="flex items-center gap-2 text-[12.5px] min-w-0">
        <span className="text-text-3 font-medium shrink-0">{defaultModule}</span>
        
        {activeTitle ? (
          <>
            <ChevronRight className="size-3.5 text-text-3/60 shrink-0" />
            <span className="truncate text-foreground font-semibold text-[13.5px]">
              {activeTitle}
            </span>
          </>
        ) : null}

        {activeSubtitle ? (
          <>
            <ChevronRight className="size-3.5 text-text-3/60 shrink-0" />
            <span className="truncate text-text-2 font-medium">{activeSubtitle}</span>
          </>
        ) : null}

        {headerState.badge && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-text-2">
            {headerState.badge}
          </span>
        )}

        {children}
      </div>

      {/* 상단바 우측: AI 어시스턴트 토글 & 라이트/다크모드 스위치 */}
      <div className="flex items-center gap-1.5">
        <Button
          variant={isAiOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={toggleAi}
          className={`h-8 gap-1.5 px-2.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
            isAiOpen ? "bg-blue/10 text-blue hover:bg-blue/15" : "text-text-3 hover:text-foreground hover:bg-muted"
          }`}
          title={isAiOpen ? "AI 질문창 접기" : "AI 질문창 열기"}
        >
          <Sparkles className="size-3.5 text-blue" />
          <span className="hidden sm:inline">AI Agent</span>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="size-8 rounded-lg text-text-3 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="테마 전환"
          title={resolvedTheme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
          <Sun className="size-4 hidden dark:block text-amber-500" />
          <Moon className="size-4 dark:hidden text-text-2" />
        </Button>
      </div>
    </header>
  );
}
