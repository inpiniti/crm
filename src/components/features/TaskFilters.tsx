"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Combobox, type ComboOption } from "@/components/common/Combobox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { TASK_STATUSES, TASK_STATUS_LABEL } from "@/domain/tasks/task-status";

export function TaskFilters({
  projects,
  people,
  tags,
  autoFocusSearch,
}: {
  projects: ComboOption[];
  people: ComboOption[];
  tags: string[];
  autoFocusSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusSearch) searchRef.current?.focus();
  }, [autoFocusSearch]);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    next.delete("focus");
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  };

  useEffect(() => {
    const cur = sp.get("q") ?? "";
    if (q === cur) return;
    const t = setTimeout(() => set({ q }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const num = (k: string) => {
    const v = sp.get(k);
    return v ? Number(v) : null;
  };

  return (
    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr]">
      <div className="relative col-span-2 md:col-span-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-3" />
        <Input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목·내용 검색" className="pl-8" />
      </div>
      <NativeSelect className="w-full" value={sp.get("status") ?? "all"} onChange={(e) => set({ status: e.target.value })}>
        <NativeSelectOption value="all">전체</NativeSelectOption>
        <NativeSelectOption value="open">진행 중인 것만</NativeSelectOption>
        {TASK_STATUSES.map((s) => (
          <NativeSelectOption key={s} value={s}>
            {TASK_STATUS_LABEL[s]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Combobox options={projects} value={num("projectId")} nullLabel="모든 프로젝트" onChange={(v) => set({ projectId: v ? String(v) : null })} />
      <Combobox options={people} value={num("requesterId")} nullLabel="모든 요청자" onChange={(v) => set({ requesterId: v ? String(v) : null })} />
      <NativeSelect className="w-full" value={sp.get("tag") ?? ""} onChange={(e) => set({ tag: e.target.value })}>
        <NativeSelectOption value="">모든 태그</NativeSelectOption>
        {tags.map((t) => (
          <NativeSelectOption key={t} value={t}>
            #{t}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
