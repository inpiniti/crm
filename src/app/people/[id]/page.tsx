import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PersonDeleteButton, PersonFormButton } from "@/components/features/EntityForms";
import { TaskTable } from "@/components/features/TaskTable";
import { Markdown } from "@/components/common/Markdown";
import { PageHeader, Panel, Section, Stat } from "@/components/common/Panel";
import { listCompanyOptions } from "@/infrastructure/supabase/repositories/companies";
import { getPersonDetail } from "@/infrastructure/supabase/repositories/people";
import { listTasks } from "@/infrastructure/supabase/repositories/tasks";

export default async function PersonDetailPage({ params, searchParams }: PageProps<"/people/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const showAll = sp.all !== "0";
  const [person, tasks, companies] = await Promise.all([
    getPersonDetail(n),
    listTasks({ requesterId: n, status: showAll ? "all" : "open" }),
    listCompanyOptions(),
  ]);
  if (!person) notFound();

  return (
    <>
      <PageHeader
        back={
          <>
            <Link href="/people" className="hover:text-foreground">
              사람
            </Link>
            {person.companyId && (
              <>
                <span className="mx-1.5">/</span>
                <Link href={`/companies/${person.companyId}`} className="hover:text-foreground">
                  {person.companyName}
                </Link>
              </>
            )}
          </>
        }
        title={person.name}
        description={
          <>
            {[person.department, person.title].filter(Boolean).join(" · ")}
            {(person.email || person.phone) && (
              <span className="ml-2 text-text-3">
                {person.email && (
                  <a href={`mailto:${person.email}`} className="hover:text-foreground">
                    {person.email}
                  </a>
                )}
                {person.email && person.phone && " · "}
                {person.phone}
              </span>
            )}
          </>
        }
        actions={
          <Suspense>
            <PersonFormButton person={person} companies={companies} />
            <PersonDeleteButton id={person.id} />
          </Suspense>
        }
      />
      <Panel className="mb-6 grid grid-cols-3 gap-4 px-5 py-4">
        <Stat label="진행 중" value={person.openCount} suffix="건" tone={person.openCount ? "blue" : "muted"} />
        <Stat label="전체 요청" value={person.taskCount} suffix="건" />
        <Stat label="마지막 요청" value={person.lastRequestedAt ?? "—"} tone={person.lastRequestedAt ? "default" : "muted"} />
      </Panel>
      {person.memo && (
        <Panel className="mb-6 p-4">
          <Markdown>{person.memo}</Markdown>
        </Panel>
      )}
      <Section
        title="요청한 업무"
        extra={
          <Link href={showAll ? `/people/${n}?all=0` : `/people/${n}`} className="text-[13px] text-text-3 hover:text-foreground">
            {showAll ? "진행 중만 보기" : "완료된 것도 보기"}
          </Link>
        }
      >
        <TaskTable tasks={tasks} hideRequester empty={{ title: "이 사람이 요청한 업무가 없어요", description: "업무를 만들 때 요청자로 고르면 여기에 쌓여요" }} />
      </Section>
    </>
  );
}
