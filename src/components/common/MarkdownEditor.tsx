"use client";

import { useState, type ComponentProps } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";

export function MarkdownEditor({
  name,
  defaultValue = "",
  rows = 8,
  placeholder,
  className,
  ...rest
}: { name: string; defaultValue?: string; rows?: number } & ComponentProps<typeof Textarea>) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  return (
    <div className={cn("rounded-lg border border-input", className)}>
      <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-2 py-1 text-[12.5px] transition-colors",
              tab === t ? "bg-accent font-medium text-foreground" : "text-text-3 hover:text-foreground",
            )}
          >
            {t === "write" ? "쓰기" : "미리보기"}
          </button>
        ))}
        <span className="ml-auto pr-1 text-[11px] text-text-3">Markdown</span>
      </div>
      <Textarea
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={cn("rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent", tab === "preview" && "hidden")}
        {...rest}
      />
      {tab === "preview" && (
        <div className="min-h-[96px] px-3 py-2">
          {value.trim() ? <Markdown>{value}</Markdown> : <span className="text-[13px] text-text-3">아직 내용이 없어요</span>}
        </div>
      )}
    </div>
  );
}
