"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from "lucide-react";
import { createCompanyAction, deleteCompany, updateCompanyAction } from "@/app/actions/companies";
import { createPersonAction, deletePerson, updatePersonAction } from "@/app/actions/people";
import { createProjectAction, deleteProject, setProjectStatus, updateProjectAction } from "@/app/actions/projects";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/common/ActionForm";
import { Combobox, type ComboOption } from "@/components/common/Combobox";
import { Field, FormRow } from "@/components/common/Field";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { COMPANY_TYPES, COMPANY_TYPE_LABEL, type Company } from "@/domain/companies/company";
import type { Person } from "@/domain/people/person";
import type { Project } from "@/domain/projects/project";

function useOpenFromQuery() {
  const sp = useSearchParams();
  const router = useRouter();
  const fromQuery = sp.get("new") === "1";
  const [open, setOpen] = useState(fromQuery);
  useEffect(() => {
    if (fromQuery) router.replace(window.location.pathname);
  }, [fromQuery, router]);
  return [open, setOpen] as const;
}

function Trigger({ editing, label, onClick }: { editing: boolean; label: string; onClick: () => void }) {
  return editing ? (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Pencil />
      수정
    </Button>
  ) : (
    <Button size="sm" onClick={onClick}>
      <Plus />
      {label}
    </Button>
  );
}

function Footer({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <DialogFooter>
      <Button variant="ghost" type="button" onClick={onClose}>
        닫기
      </Button>
      <SubmitButton>{label}</SubmitButton>
    </DialogFooter>
  );
}

const deleteBtn = "text-text-3 hover:text-red";

// ---------- Company ----------

export function CompanyFormButton({ company }: { company?: Company }) {
  const [open, setOpen] = useOpenFromQuery();
  const router = useRouter();
  const editing = !!company;
  return (
    <>
      <Trigger editing={editing} label="회사 추가" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editing ? "회사 수정" : "새 회사"}</DialogTitle>
          </DialogHeader>
          <ActionForm
            action={editing ? updateCompanyAction : createCompanyAction}
            successMessage={editing ? "저장했어요" : "회사를 만들었어요"}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="space-y-4"
          >
            {company && <input type="hidden" name="id" value={company.id} />}
            <FormRow>
              <Field label="회사 이름">
                <Input name="name" defaultValue={company?.name ?? ""} autoFocus required />
              </Field>
              <Field label="유형">
                <NativeSelect className="w-full" name="type" defaultValue={company?.type ?? "employer"}>
                  {COMPANY_TYPES.map((t) => (
                    <NativeSelectOption key={t} value={t}>
                      {COMPANY_TYPE_LABEL[t]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </FormRow>
            <FormRow>
              <Field label="입사일" hint="거래처면 비워 두세요">
                <Input type="date" name="joinedAt" defaultValue={company?.joinedAt ?? ""} />
              </Field>
              <Field label="퇴사일" hint="비우면 재직 중">
                <Input type="date" name="leftAt" defaultValue={company?.leftAt ?? ""} />
              </Field>
            </FormRow>
            <Field label="메모">
              <MarkdownEditor name="memo" defaultValue={company?.memo ?? ""} rows={4} />
            </Field>
            <Footer onClose={() => setOpen(false)} label={editing ? "저장하기" : "만들기"} />
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CompanyDeleteButton({ id }: { id: number }) {
  return (
    <ConfirmAction action={() => deleteCompany(id)} title="이 회사를 지울까요?" successMessage="회사를 지웠어요" size="icon-sm" className={deleteBtn}>
      <Trash2 />
    </ConfirmAction>
  );
}

// ---------- Project ----------

export function ProjectFormButton({ project, companies }: { project?: Project; companies: ComboOption[] }) {
  const [open, setOpen] = useOpenFromQuery();
  const router = useRouter();
  const editing = !!project;
  return (
    <>
      <Trigger editing={editing} label="프로젝트 추가" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editing ? "프로젝트 수정" : "새 프로젝트"}</DialogTitle>
          </DialogHeader>
          <ActionForm
            action={editing ? updateProjectAction : createProjectAction}
            successMessage={editing ? "저장했어요" : "프로젝트를 만들었어요"}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="space-y-4"
          >
            {project && <input type="hidden" name="id" value={project.id} />}
            <Field label="프로젝트 이름">
              <Input name="name" defaultValue={project?.name ?? ""} autoFocus required />
            </Field>
            <Field label="회사" hint="개인 프로젝트면 '개인'을 고르세요">
              <Combobox name="companyId" options={companies} value={project?.companyId ?? null} nullLabel="개인" />
            </Field>
            <FormRow>
              <Field label="시작일">
                <Input type="date" name="startedAt" defaultValue={project?.startedAt ?? ""} />
              </Field>
              <Field label="종료일">
                <Input type="date" name="endedAt" defaultValue={project?.endedAt ?? ""} />
              </Field>
            </FormRow>
            <Field label="설명">
              <MarkdownEditor name="description" defaultValue={project?.description ?? ""} rows={4} />
            </Field>
            <Footer onClose={() => setOpen(false)} label={editing ? "저장하기" : "만들기"} />
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ProjectStatusButtons({ project }: { project: Project }) {
  const router = useRouter();
  const archived = project.status === "archived";
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          const r = await setProjectStatus(project.id, archived ? "active" : "archived");
          if (r.ok) {
            toast.success(archived ? "보관을 해제했어요" : "보관했어요");
            router.refresh();
          } else toast.error(r.error);
        }}
      >
        {archived ? <ArchiveRestore /> : <Archive />}
        {archived ? "보관 해제" : "보관"}
      </Button>
      <ConfirmAction action={() => deleteProject(project.id)} title="이 프로젝트를 지울까요?" successMessage="프로젝트를 지웠어요" size="icon-sm" className={deleteBtn}>
        <Trash2 />
      </ConfirmAction>
    </>
  );
}

// ---------- Person ----------

export function PersonFormButton({ person, companies }: { person?: Person; companies: ComboOption[] }) {
  const [open, setOpen] = useOpenFromQuery();
  const router = useRouter();
  const editing = !!person;
  return (
    <>
      <Trigger editing={editing} label="사람 추가" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editing ? "사람 수정" : "새 사람"}</DialogTitle>
          </DialogHeader>
          <ActionForm
            action={editing ? updatePersonAction : createPersonAction}
            successMessage={editing ? "저장했어요" : "사람을 추가했어요"}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="space-y-4"
          >
            {person && <input type="hidden" name="id" value={person.id} />}
            <FormRow>
              <Field label="이름">
                <Input name="name" defaultValue={person?.name ?? ""} autoFocus required />
              </Field>
              <Field label="회사">
                <Combobox name="companyId" options={companies} value={person?.companyId ?? null} nullLabel="소속 없음" />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="부서">
                <Input name="department" defaultValue={person?.department ?? ""} />
              </Field>
              <Field label="직책">
                <Input name="title" defaultValue={person?.title ?? ""} />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="이메일">
                <Input type="email" name="email" defaultValue={person?.email ?? ""} />
              </Field>
              <Field label="전화">
                <Input name="phone" defaultValue={person?.phone ?? ""} />
              </Field>
            </FormRow>
            <Field label="메모" hint="성향, 주의할 점 등">
              <MarkdownEditor name="memo" defaultValue={person?.memo ?? ""} rows={4} />
            </Field>
            <Footer onClose={() => setOpen(false)} label={editing ? "저장하기" : "추가하기"} />
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PersonDeleteButton({ id }: { id: number }) {
  return (
    <ConfirmAction action={() => deletePerson(id)} title="이 사람을 지울까요?" successMessage="지웠어요" size="icon-sm" className={deleteBtn}>
      <Trash2 />
    </ConfirmAction>
  );
}
