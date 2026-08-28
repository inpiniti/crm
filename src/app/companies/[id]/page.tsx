import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FolderKanban, Users } from "lucide-react";
import { CompanyDeleteButton, CompanyFormButton } from "@/components/features/EntityForms";
import { Markdown } from "@/components/common/Markdown";
import { EmptyState, PageHeader, Panel, Section } from "@/components/common/Panel";
import { Chip } from "@/components/common/StatusBadge";
import { COMPANY_TYPE_LABEL, isCurrentEmployer } from "@/domain/companies/company";
import { deps } from "@/infrastructure/container";
import { listPeople } from "@/infrastructure/supabase/repositories/people";
import { listProjects } from "@/infrastructure/supabase/repositories/projects";

export default async function CompanyDetailPage({ params }: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const [company, projects, people] = await Promise.all([
    deps.companies.findById(n),
    listProjects({ companyId: n, includeArchived: true }),
    listPeople({ companyId: n }),
  ]);
  if (!company) notFound();

  return (
    <>
      <PageHeader
        back={
          <Link href="/companies" className="hover:text-foreground">
            회사
          </Link>
        }
        title={
          <span className="inline-flex items-center gap-2">
            {company.name}
            {isCurrentEmployer(company) ? <Chip className="bg-blue-weak text-blue">재직 중</Chip> : <Chip className="bg-muted text-text-3">{COMPANY_TYPE_LABEL[company.type]}</Chip>}
          </span>
        }
        description={company.joinedAt ? <span className="num">{company.joinedAt} ~ {company.leftAt ?? "현재"}</span> : undefined}
        actions={
          <Suspense>
            <CompanyFormButton company={company} />
            <CompanyDeleteButton id={company.id} />
          </Suspense>
        }
      />
      {company.memo && (
        <Panel className="mb-6 p-4">
          <Markdown>{company.memo}</Markdown>
        </Panel>
      )}
      <div className="grid grid-cols-2 gap-6">
        <Section title="프로젝트">
          {projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="프로젝트가 없어요" />
          ) : (
            <Panel className="divide-y divide-border">
              {projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="row-hover flex h-11 items-center justify-between px-4 text-[13.5px]">
                  <span className="flex items-center gap-2 font-medium">
                    {p.name}
                    {p.status === "archived" && <Chip className="bg-muted text-text-3">보관</Chip>}
                  </span>
                  <span className="num text-[13px] text-text-3">
                    <b className={p.openCount ? "text-blue" : ""}>{p.openCount}</b> / {p.taskCount}
                  </span>
                </Link>
              ))}
            </Panel>
          )}
        </Section>
        <Section title="사람">
          {people.length === 0 ? (
            <EmptyState icon={Users} title="등록된 사람이 없어요" />
          ) : (
            <Panel className="divide-y divide-border">
              {people.map((p) => (
                <Link key={p.id} href={`/people/${p.id}`} className="row-hover flex h-11 items-center justify-between px-4 text-[13.5px]">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-[12.5px] text-text-3">{[p.department, p.title].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="num text-[13px] text-text-3">
                    <b className={p.openCount ? "text-blue" : ""}>{p.openCount}</b> / {p.taskCount}
                  </span>
                </Link>
              ))}
            </Panel>
          )}
        </Section>
      </div>
    </>
  );
}
