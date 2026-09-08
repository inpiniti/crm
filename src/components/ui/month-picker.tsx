"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface MonthPickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentYear, setCurrentYear] = React.useState(
    value ? value.getFullYear() : new Date().getFullYear()
  );

  React.useEffect(() => {
    if (value) {
      setCurrentYear(value.getFullYear());
    }
  }, [value]);

  const months = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    if (onChange) onChange(newDate);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "w-[150px] justify-between text-left font-medium text-[12.5px] border-border bg-background hover:bg-muted",
              !value && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <span>{value ? `${value.getFullYear()}년 ${value.getMonth() + 1}월` : "월 선택"}</span>
        <ChevronDown className="size-3.5 opacity-60 ml-auto" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3 bg-popover border border-border shadow-lg rounded-xl">
        {/* 년도 조절 네비게이션 */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCurrentYear((prev) => prev - 1)}
            className="h-7 w-7 text-text-3 hover:text-foreground cursor-pointer"
            aria-label="이전 해"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-[13px] font-bold text-foreground">{currentYear}년</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCurrentYear((prev) => prev + 1)}
            className="h-7 w-7 text-text-3 hover:text-foreground cursor-pointer"
            aria-label="다음 해"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* 1월 ~ 12월 그리드 */}
        <div className="grid grid-cols-3 gap-1.5">
          {months.map((month, index) => {
            const isSelected = value
              ? value.getFullYear() === currentYear && value.getMonth() === index
              : false;

            return (
              <Button
                key={month}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 w-full text-[12px] font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "bg-blue text-white hover:bg-blue/90 font-bold"
                    : "hover:bg-muted text-foreground"
                )}
                onClick={() => handleMonthSelect(index)}
              >
                {month}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
