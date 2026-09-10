"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Clock } from "lucide-react";
import { MonthPicker } from "@/components/ui/month-picker";
import { WorkFormButton } from "@/components/features/EntityForms";
import { weekdayKst } from "@/lib/date";
import { cn } from "@/lib/utils";

interface WorkDateNavProps {
  dates: { date: string; count: number }[];
  currentDate: string;
  today: string;
  taskOptions?: { id: number; label: string }[];
  basePath?: string;
  title?: string;
}

export function WorkDateNav({ dates, currentDate, today, taskOptions = [], basePath = "", title = "작업 일지" }: WorkDateNavProps) {
  const router = useRouter();

  // Parse current date to set month picker
  const initialMonth = useMemo(() => {
    if (currentDate) {
      const [y, m] = currentDate.split("-").map(Number);
      if (y && m) return new Date(y, m - 1, 1);
    }
    return new Date();
  }, [currentDate]);

  const [calendarMonth, setCalendarMonth] = useState<Date>(initialMonth);

  // Filter list by selected month option (기본: 이번 달만 보기)
  const currentMonthPrefix = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = String(calendarMonth.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [calendarMonth]);

  const [filterByMonth, setFilterByMonth] = useState(true);

  const displayedDates = useMemo(() => {
    if (!filterByMonth) return dates;
    return dates.filter((d) => d.date.startsWith(currentMonthPrefix));
  }, [dates, filterByMonth, currentMonthPrefix]);

  const totalWorksInList = useMemo(() => {
    return displayedDates.reduce((acc, cur) => acc + cur.count, 0);
  }, [displayedDates]);

  const handleMonthChange = (newMonth: Date) => {
    setCalendarMonth(newMonth);
    setFilterByMonth(true);

    // 해당 월에 작업 기록이 있다면 그 달의 가장 최근 작업일로 자동 이동
    const y = newMonth.getFullYear();
    const m = String(newMonth.getMonth() + 1).padStart(2, "0");
    const prefix = `${y}-${m}`;
    const targetDate = dates.find((d) => d.date.startsWith(prefix));
    if (targetDate) {
      router.push(`${basePath}/work?date=${targetDate.date}`);
    }
  };

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card/40 select-none">
      {/* 2열 헤더 */}
      <div className="flex h-13 items-center justify-between border-b border-border px-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-foreground">{title}</span>
          <span className="num rounded-full bg-muted px-1.5 py-0.2 text-[11px] font-semibold text-text-3">
            {dates.length}일
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {currentDate !== today && (
            <Link
              href={`${basePath}/work`}
              className="rounded px-2 py-0.5 text-[11.5px] font-medium text-blue hover:bg-blue-weak transition-colors"
            >
              오늘로
            </Link>
          )}
          <WorkFormButton taskOptions={taskOptions} defaultDate={currentDate} />
        </div>
      </div>

      {/* 상단 Month Picker (방법 2) & 월별 필터 토글 */}
      <div className="flex items-center justify-between border-b border-border p-2 bg-background/50">
        <MonthPicker
          value={calendarMonth}
          onChange={handleMonthChange}
        />
        <button
          type="button"
          onClick={() => setFilterByMonth((prev) => !prev)}
          className={cn(
            "rounded px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer",
            filterByMonth
              ? "bg-muted text-foreground font-semibold"
              : "text-text-3 hover:text-foreground hover:bg-muted"
          )}
        >
          {filterByMonth ? "전체 보기" : "이번 달만"}
        </button>
      </div>

      {/* 목록 요약 바 */}
      <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-1.5 text-[11px] text-text-3 bg-muted/15">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3 text-text-3" />
          <span>
            {filterByMonth ? `${currentMonthPrefix} 작업 기록` : "전체 누적 작업 기록"}
          </span>
        </div>
        <span className="num font-medium text-text-2">
          {displayedDates.length}일 · {totalWorksInList}건
        </span>
      </div>

      {/* 2열 작업 날짜 목록 */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {displayedDates.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-text-3 space-y-2">
            <div>{filterByMonth ? "해당 월에 기록된 작업이 없어요" : "아직 기록이 없어요"}</div>
            {filterByMonth && (
              <button
                type="button"
                onClick={() => setFilterByMonth(false)}
                className="text-[12px] text-blue font-medium hover:underline cursor-pointer"
              >
                전체 기록 보기
              </button>
            )}
          </div>
        ) : (
          displayedDates.map((d) => {
            const isActive = d.date === currentDate;
            const isToday = d.date === today;

            return (
              <Link
                key={d.date}
                href={`${basePath}/work?date=${d.date}`}
                className={cn(
                  "group flex items-center justify-between px-3.5 py-2.5 transition-colors",
                  isActive
                    ? "bg-blue-weak/60 text-blue font-semibold border-l-2 border-l-blue"
                    : "hover:bg-hover text-foreground border-l-2 border-l-transparent"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="num text-[13px]">
                    {d.date.slice(5).replace("-", ".")} ({weekdayKst(d.date)})
                  </span>
                  {isToday && (
                    <span className="rounded bg-blue-weak px-1.5 py-0.2 text-[10px] font-bold text-blue">
                      오늘
                    </span>
                  )}
                </div>
                <span className="num rounded-full bg-muted px-1.5 py-0.2 text-[11px] font-medium text-text-3">
                  {d.count}건
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
