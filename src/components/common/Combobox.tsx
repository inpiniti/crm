"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboOption {
  id: number;
  label: string;
}

/**
 * 검색 가능한 단일 선택. name 이 있으면 hidden input 으로 form 에 값을 넘긴다.
 * nullLabel 이 있으면 "선택 안 함" 항목을 제공한다 (value === null).
 */
export function Combobox({
  name,
  options,
  value,
  onChange,
  nullLabel,
  placeholder = "검색",
  className,
  size = "default",
}: {
  name?: string;
  options: ComboOption[];
  value: number | null;
  onChange?: (v: number | null) => void;
  nullLabel?: string;
  placeholder?: string;
  className?: string;
  size?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<number | null>(value);
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setInternal(value);
  }
  const selected = options.find((o) => o.id === internal);
  const display = selected?.label ?? nullLabel ?? "선택";

  const pick = (id: number | null) => {
    setInternal(id);
    onChange?.(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name && <input type="hidden" name={name} value={internal ?? ""} />}
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size={size === "sm" ? "sm" : "default"}
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
          />
        }
      >
        <span className="truncate">{display}</span>
        <ChevronsUpDown className="size-3.5 opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-[240px] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>찾는 항목이 없어요</CommandEmpty>
            <CommandGroup>
              {nullLabel && (
                <CommandItem value={`__null__ ${nullLabel}`} onSelect={() => pick(null)}>
                  <Check className={cn("size-4", internal === null ? "opacity-100" : "opacity-0")} />
                  {nullLabel}
                </CommandItem>
              )}
              {options.map((o) => (
                <CommandItem key={o.id} value={`${o.id} ${o.label}`} onSelect={() => pick(o.id)}>
                  <Check className={cn("size-4", internal === o.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
