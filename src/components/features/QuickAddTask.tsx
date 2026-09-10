"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createTaskAction } from "@/app/actions/tasks";
import { ActionForm, SubmitButton } from "@/components/common/ActionForm";
import { Combobox, type ComboOption } from "@/components/common/Combobox";
import { Field, FormRow } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

const LAST_PROJECT_KEY = "lastProjectId";

/** 전역 빠른 입력. `n` 키, 헤더 버튼(quick-add 이벤트). 제목만 넣으면 생성. */
export function QuickAddTask({ projects, people }: { projects: ComboOption[]; people: ComboOption[] }) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [goDetail, setGoDetail] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const personalRoute = pathname.startsWith("/personal/");
  const scopedProjects = personalRoute
    ? projects.filter((p) => (p as ComboOption & { companyId?: number | null }).companyId == null)
    : projects;

  const openModal = useCallback(() => {
    let last: number | null = null;
    try {
      const v = localStorage.getItem(LAST_PROJECT_KEY);
      if (v) last = Number(v);
    } catch {}
    setProjectId(last && scopedProjects.some((p) => p.id === last) ? last : (scopedProjects[0]?.id ?? null));
    setOpen(true);
  }, [scopedProjects]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "n") {
        e.preventDefault();
        openModal();
      } else if (e.key === "/") {
        e.preventDefault();
        router.push("/tasks?focus=1");
      }
    };
    const onEvent = () => openModal();
    document.addEventListener("keydown", onKey);
    window.addEventListener("quick-add", onEvent);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("quick-add", onEvent);
    };
  }, [openModal, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>새 업무</DialogTitle>
          <DialogDescription>
            {personalRoute ? "개인 프로젝트에 넣을 업무예요. 제목만 적어도 돼요." : "제목만 적어도 돼요. 나머지는 나중에 채울 수 있어요."}
          </DialogDescription>
        </DialogHeader>
        {scopedProjects.length === 0 ? (
          <div className="space-y-3">
            <p className="text-[13px] text-text-2">업무를 넣을 프로젝트가 아직 없어요. 프로젝트를 먼저 만들어 주세요.</p>
            <Button
              onClick={() => {
                setOpen(false);
                router.push(personalRoute ? "/personal/projects?new=1" : "/projects?new=1");
              }}
            >
              프로젝트 만들기
            </Button>
          </div>
        ) : (
          <ActionForm
            action={createTaskAction}
            successMessage="업무를 만들었어요"
            onSuccess={() => {
              try {
                if (projectId) localStorage.setItem(LAST_PROJECT_KEY, String(projectId));
              } catch {}
              setOpen(false);
              router.refresh();
            }}
            className="space-y-4"
          >
            <input type="hidden" name="goDetail" value={goDetail ? "1" : "0"} />
            <Field label="제목">
              <Input name="title" autoFocus placeholder="무엇을 해야 하나요?" required />
            </Field>
            <FormRow>
              <Field label="프로젝트">
                <Combobox name="projectId" options={scopedProjects} value={projectId} onChange={setProjectId} />
              </Field>
              <Field label="요청자">
                <Combobox name="requesterId" options={people} value={null} nullLabel="내가 직접" />
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="시작일">
                <Input type="date" name="startedAt" />
              </Field>
              <Field label="마감">
                <Input type="datetime-local" name="dueAt" />
              </Field>
              <Field label="우선순위">
                <NativeSelect className="w-full" name="priority" defaultValue="normal">
                  <NativeSelectOption value="low">낮음</NativeSelectOption>
                  <NativeSelectOption value="normal">보통</NativeSelectOption>
                  <NativeSelectOption value="high">높음</NativeSelectOption>
                </NativeSelect>
              </Field>
            </FormRow>
            <DialogFooter className="items-center sm:justify-between">
              <KbdGroup className="text-[12px] text-text-3">
                <Kbd>Ctrl</Kbd>
                <span>+</span>
                <Kbd>Enter</Kbd>
                <span className="ml-1">저장</span>
              </KbdGroup>
              <div className="flex gap-1.5">
                <SubmitButton variant="secondary" onClick={() => setGoDetail(true)}>
                  만들고 열기
                </SubmitButton>
                <SubmitButton onClick={() => setGoDetail(false)}>만들기</SubmitButton>
              </div>
            </DialogFooter>
          </ActionForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
