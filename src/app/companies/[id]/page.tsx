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
import { DetailHeaderSetter } from "@/components/layout/DetailHeaderContext";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const [company, projects, people] = await Promise.all([
    deps.companies.findById(n),
    listProjects({ companyId: n, includeArchived: true }),
    listPeople({ companyId: n }),
  ]);
  if (!company) notFound();

  const periodStr = company.joinedAt
    ? `${company.joinedAt.length >= 10 ? company.joinedAt.slice(2).replace(/-/g, ".") : company.joinedAt} ~ ${
        company.leftAt ? (company.leftAt.length >= 10 ? company.leftAt.slice(2).replace(/-/g, ".") : company.leftAt) : "현재"
      }`
    : null;

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-7">
      <DetailHeaderSetter title={company.name} subtitle={COMPANY_TYPE_LABEL[company.type]} />
      {/* 3열 상단 헤더 바 (IDE 상단 헤더 느낌) */}
      <div className="flex items-start justify-between border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{company.name}</h1>
            {isCurrentEmployer(company) ? (
              <Chip className="bg-blue-weak text-blue font-semibold px-2 py-0.5 text-[12px]">재직 중</Chip>
            ) : (
              <Chip className="bg-muted text-text-3 px-2 py-0.5 text-[12px]">{COMPANY_TYPE_LABEL[company.type]}</Chip>
            )}
          </div>
          {periodStr && <div className="num mt-1.5 text-[13px] text-text-3">{periodStr}</div>}
        </div>
        <div className="flex items-center gap-2">
          <Suspense>
            <CompanyFormButton company={company} />
            <CompanyDeleteButton id={company.id} />
          </Suspense>
        </div>
      </div>

      {/* 1. 기업요약 섹션 (와이어프레임 중간) */}
      <section className="space-y-2">
        <h2 className="text-[13px] font-bold text-text-3 tracking-wider">기업요약</h2>
        {company.memo ? (
          <Panel className="p-5 bg-card border-border shadow-2xs">
            <Markdown>{company.memo}</Markdown>
          </Panel>
        ) : (
          <Panel className="p-5 bg-card/40 border-dashed border-border text-center text-text-3 text-[13px]">
            작성된 기업 요약 메모가 없어요. 상단의 [수정] 버튼을 눌러 기업 개요를 작성해 보세요.
          </Panel>
        )}
      </section>

      {/* 2. 프로젝트 섹션 (와이어프레임 하단: 프로젝트명 + 기간) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-text-3 tracking-wider">
            프로젝트 <span className="num font-semibold text-blue ml-1">{projects.length}</span>
          </h2>
        </div>
        {projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="등록된 프로젝트가 없어요" />
        ) : (
          <Panel className="divide-y divide-border bg-card shadow-2xs">
            {projects.map((p) => {
              const projectPeriod = p.startedAt
                ? `${p.startedAt.length >= 10 ? p.startedAt.slice(2).replace(/-/g, ".") : p.startedAt} ~ ${
                    p.endedAt ? (p.endedAt.length >= 10 ? p.endedAt.slice(2).replace(/-/g, ".") : p.endedAt) : "현재"
                  }`
                : "—";

              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="row-hover flex h-12 items-center justify-between px-5 text-[13.5px] transition-colors"
                >
                  <div className="flex items-center gap-2 font-medium min-w-0">
                    <span className="truncate text-foreground hover:text-blue">{p.name}</span>
                    {p.status === "archived" && <Chip className="bg-muted text-text-3 text-[11px]">종료</Chip>}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="num text-[12.5px] text-text-3 font-normal">{projectPeriod}</span>
                    <span className="num text-[12px] text-text-3 hidden sm:inline">
                      <b className={p.openCount ? "text-blue" : ""}>{p.openCount}</b> / {p.taskCount}
                    </span>
                  </div>
                </Link>
              );
            })}
          </Panel>
        )}
      </section>

      {/* 3. 사람 섹션 */}
      {people.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[13px] font-bold text-text-3 tracking-wider">
            사람 <span className="num font-semibold text-blue ml-1">{people.length}</span>
          </h2>
          <Panel className="divide-y divide-border bg-card shadow-2xs">
            {people.map((p) => (
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                className="row-hover flex h-12 items-center justify-between px-5 text-[13.5px] transition-colors"
              >
                <div className="min-w-0 truncate">
                  <span className="font-medium text-foreground">{p.name}</span>
                  <span className="ml-2.5 text-[12.5px] text-text-3">
                    {[p.department, p.title].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <span className="num text-[12.5px] text-text-3">
                  <b className={p.openCount ? "text-blue" : ""}>{p.openCount}</b> / {p.taskCount}
                </span>
              </Link>
            ))}
          </Panel>
        </section>
      )}
    </div>
  );
}

