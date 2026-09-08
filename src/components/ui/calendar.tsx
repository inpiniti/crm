"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CalendarProps {
  className?: string;
  selected?: string | Date; // YYYY-MM-DD or Date
  onSelect?: (dateStr: string, date: Date) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  highlightedDates?: Set<string> | string[] | Record<string, number>;
  monthCounts?: Record<string, number>; // "YYYY-MM" -> count
  fromYear?: number;
  toYear?: number;
  defaultView?: "days" | "months";
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
];

function formatYearMonth(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function Calendar({
  className,
  selected,
  onSelect,
  month: controlledMonth,
  onMonthChange,
  highlightedDates,
  monthCounts = {},
  fromYear = 2020,
  toYear = 2030,
  defaultView = "days",
}: CalendarProps) {
  const selectedStr = typeof selected === "string" ? selected : selected ? toIsoDate(selected) : "";
  const [internalMonth, setInternalMonth] = React.useState<Date>(() => {
    if (controlledMonth) return controlledMonth;
    if (selectedStr) {
      const [y, m] = selectedStr.split("-").map(Number);
      if (y && m) return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const [viewMode, setViewMode] = React.useState<"days" | "months">(defaultView);

  const currentMonth = controlledMonth ?? internalMonth;
  const setMonth = (d: Date) => {
    setInternalMonth(d);
    onMonthChange?.(d);
  };

  const year = currentMonth.getFullYear();
  const monthIdx = currentMonth.getMonth();

  // First day of month and days count
  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIdx, 0).getDate();

  // Compute highlighted set
  const highlightSet = React.useMemo(() => {
    if (!highlightedDates) return new Set<string>();
    if (highlightedDates instanceof Set) return highlightedDates;
    if (Array.isArray(highlightedDates)) return new Set(highlightedDates);
    return new Set(Object.keys(highlightedDates));
  }, [highlightedDates]);

  const todayStr = toIsoDate(new Date());

  const handlePrev = () => {
    if (viewMode === "days") {
      setMonth(new Date(year, monthIdx - 1, 1));
    } else {
      setMonth(new Date(Math.max(fromYear, year - 1), monthIdx, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "days") {
      setMonth(new Date(year, monthIdx + 1, 1));
    } else {
      setMonth(new Date(Math.min(toYear, year + 1), monthIdx, 1));
    }
  };

  const handleSelectDay = (day: number) => {
    const d = new Date(year, monthIdx, day);
    const dateStr = toIsoDate(d);
    onSelect?.(dateStr, d);
  };

  const handleSelectPrevMonthDay = (day: number) => {
    const d = new Date(year, monthIdx - 1, day);
    const dateStr = toIsoDate(d);
    setMonth(new Date(year, monthIdx - 1, 1));
    onSelect?.(dateStr, d);
  };

  const handleSelectNextMonthDay = (day: number) => {
    const d = new Date(year, monthIdx + 1, day);
    const dateStr = toIsoDate(d);
    setMonth(new Date(year, monthIdx + 1, 1));
    onSelect?.(dateStr, d);
  };

  const handleMonthSelect = (mIdx: number) => {
    const newMonth = new Date(year, mIdx, 1);
    setMonth(newMonth);
    setViewMode("days"); // 선택 후 일별 뷰로 전환
  };

  // Build calendar matrix
  const calendarCells = [];

  // Trailing previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateStr = toIsoDate(new Date(year, monthIdx - 1, day));
    calendarCells.push({
      day,
      dateStr,
      isCurrentMonth: false,
      isPrev: true,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toIsoDate(new Date(year, monthIdx, d));
    calendarCells.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      isPrev: false,
    });
  }

  // Next month leading days to complete grid
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const dateStr = toIsoDate(new Date(year, monthIdx + 1, d));
    calendarCells.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      isPrev: false,
    });
  }

  return (
    <div
      data-slot="calendar"
      className={cn("w-full select-none p-3", className)}
    >
      {/* 달력 상단 네비게이션 */}
      <div className="flex items-center justify-between gap-1 pb-2">
        {/* 년/월 제목 (클릭 시 일별 <-> 월별 토글) */}
        <button
          type="button"
          onClick={() => setViewMode((m) => (m === "days" ? "months" : "days"))}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          title={viewMode === "days" ? "월 선택으로 전환" : "일 달력으로 전환"}
        >
          <span>{viewMode === "days" ? formatYearMonth(currentMonth) : `${year}년`}</span>
          <ChevronDown
            className={cn(
              "size-3 text-text-3 transition-transform duration-150",
              viewMode === "months" && "rotate-180 text-blue"
            )}
          />
        </button>

        {/* 우측: [일 | 월] 세그먼트 스위치 + 이전/다음 버튼 */}
        <div className="flex items-center gap-1.5">
          {/* 일별 / 월별 직접 전환 세그먼트 */}
          <div className="flex rounded-md bg-muted/70 p-0.5 text-[11px] font-medium text-text-3">
            <button
              type="button"
              onClick={() => setViewMode("days")}
              className={cn(
                "rounded px-1.5 py-0.5 transition-colors cursor-pointer",
                viewMode === "days"
                  ? "bg-background text-foreground font-semibold shadow-2xs"
                  : "hover:text-foreground"
              )}
            >
              일
            </button>
            <button
              type="button"
              onClick={() => setViewMode("months")}
              className={cn(
                "rounded px-1.5 py-0.5 transition-colors cursor-pointer",
                viewMode === "months"
                  ? "bg-background text-foreground font-semibold shadow-2xs"
                  : "hover:text-foreground"
              )}
            >
              월
            </button>
          </div>

          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrev}
              className="h-7 w-7 text-text-3 hover:text-foreground"
              aria-label={viewMode === "days" ? "이전 달" : "이전 해"}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNext}
              className="h-7 w-7 text-text-3 hover:text-foreground"
              aria-label={viewMode === "days" ? "다음 달" : "다음 해"}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 1. 월 선택 (Month Picker) 1월~12월 격자 뷰 (방법 2) */}
      {viewMode === "months" ? (
        <div className="pt-1.5 pb-0.5">
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((monthName, index) => {
              const isSelected = currentMonth.getMonth() === index;
              const isCurrentCalendarMonth =
                new Date().getFullYear() === year && new Date().getMonth() === index;
              const monthKey = `${year}-${String(index + 1).padStart(2, "0")}`;
              const workCount = monthCounts[monthKey] ?? 0;

              return (
                <button
                  key={monthName}
                  type="button"
                  onClick={() => handleMonthSelect(index)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-center transition-all cursor-pointer",
                    isSelected
                      ? "bg-blue text-white font-bold shadow-2xs"
                      : "hover:bg-muted text-foreground bg-muted/25",
                    isCurrentCalendarMonth && !isSelected && "ring-1 ring-blue/60 font-semibold"
                  )}
                >
                  <span className="text-[13px]">{monthName}</span>
                  {workCount > 0 ? (
                    <span
                      className={cn(
                        "num text-[10.5px] mt-0.5",
                        isSelected ? "text-white/90 font-medium" : "text-blue font-semibold"
                      )}
                    >
                      {workCount}건
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-[10px] mt-0.5",
                        isSelected ? "text-white/60" : "text-text-3/50"
                      )}
                    >
                      —
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. 일별 달력 뷰 (방법 1) */
        <>
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 text-center pb-1 text-[11px] font-medium text-text-3">
            {WEEKDAYS.map((w, idx) => (
              <div
                key={w}
                className={cn(
                  "py-1",
                  idx === 0 ? "text-red/80" : idx === 6 ? "text-blue/80" : ""
                )}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {calendarCells.map((cell, idx) => {
              const isSelected = selectedStr === cell.dateStr;
              const isToday = cell.dateStr === todayStr;
              const hasHighlight = highlightSet.has(cell.dateStr);
              const colIdx = idx % 7;

              return (
                <div key={cell.dateStr + idx} className="flex justify-center p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        handleSelectDay(cell.day);
                      } else if (cell.isPrev) {
                        handleSelectPrevMonthDay(cell.day);
                      } else {
                        handleSelectNextMonthDay(cell.day);
                      }
                    }}
                    className={cn(
                      "relative flex size-8 flex-col items-center justify-center rounded-lg text-[12px] transition-all cursor-pointer",
                      // 현재 달 / 이전 다음 달 색상
                      cell.isCurrentMonth
                        ? colIdx === 0
                          ? "text-red font-medium"
                          : colIdx === 6
                          ? "text-blue font-medium"
                          : "text-foreground font-normal"
                        : "text-text-3/40 hover:text-text-3",
                      // 선택 상태
                      isSelected
                        ? "!bg-blue !text-white !font-bold shadow-2xs z-10"
                        : "hover:bg-muted/70",
                      // 오늘 표시 (미선택 시)
                      isToday && !isSelected && "ring-1 ring-blue/60 font-bold !text-blue"
                    )}
                  >
                    <span>{cell.day}</span>

                    {/* 기록이 있는 날 점(dot) 표시 */}
                    {hasHighlight && (
                      <span
                        className={cn(
                          "absolute bottom-1 size-1 rounded-full",
                          isSelected ? "bg-white" : "bg-blue"
                        )}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
