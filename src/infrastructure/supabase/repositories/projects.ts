import "server-only";
import type { ProjectRepository } from "@/application/ports";
import type { Project, ProjectInput } from "@/domain/projects/project";
import type { Id } from "@/domain/shared/types";
import { supabase, unwrap } from "../client";
import { fromProjectInput, toProject, type ProjectRow } from "../rows";
import type { Option } from "./companies";

const T = "projects";

export type ProjectScope = "all" | "company" | "personal";

async function listProjectIdsByScope(scope: ProjectScope = "company"): Promise<number[] | null> {
  if (scope === "all") return null;
  const rows = unwrap(
    await supabase()
      .from(T)
      .select("id")
      .is("deleted_at", null)
      .is("company_id", scope === "personal" ? null : undefined)
      .not("company_id", "is", scope === "personal" ? undefined : null)
      .returns<{ id: number }[]>(),
  );
  return rows.map((row) => row.id);
}

export const projectRepository: ProjectRepository = {
  async findById(id) {
    const row = unwrap(
      await supabase().from(T).select("*").eq("id", id).is("deleted_at", null).maybeSingle<ProjectRow>(),
    );
    return row ? toProject(row) : null;
  },
  async insert(input: ProjectInput) {
    const row = unwrap(await supabase().from(T).insert(fromProjectInput(input)).select("*").single<ProjectRow>());
    return toProject(row);
  },
  async update(id: Id, input: ProjectInput) {
    const row = unwrap(
      await supabase().from(T).update(fromProjectInput(input)).eq("id", id).select("*").single<ProjectRow>(),
    );
    return toProject(row);
  },
  async setStatus(id, status) {
    unwrap(await supabase().from(T).update({ status }).eq("id", id));
  },
  async softDelete(id) {
    unwrap(await supabase().from(T).update({ deleted_at: new Date().toISOString() }).eq("id", id));
  },
  async countTasks(id) {
    const r = await supabase()
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", id)
      .is("deleted_at", null);
    return r.count ?? 0;
  },
};

// ---- 조회 ----

type ProjectJoined = ProjectRow & { company: { id: number; name: string } | null };

export interface ProjectListItem extends Project {
  companyName: string | null;
  taskCount: number;
  openCount: number;
  doneCount: number;
  totalMin: number;
}

export async function listProjects(
  opts: { includeArchived?: boolean; companyId?: number; scope?: ProjectScope } = {},
): Promise<ProjectListItem[]> {
  const db = supabase();
  let q = db.from(T).select("*, company:companies(id,name)").is("deleted_at", null).order("name");
  if (!opts.includeArchived) q = q.eq("status", "active");
  if ((opts.scope ?? "company") === "personal") q = q.is("company_id", null);
  if ((opts.scope ?? "company") === "company") q = q.not("company_id", "is", null);
  if (opts.companyId) q = q.eq("company_id", opts.companyId);
  const rows = unwrap(await q.returns<ProjectJoined[]>());
  const summary = unwrap(
    await db
      .from("project_summary")
      .select("*")
      .returns<{ id: number; task_count: number; open_count: number; done_count: number; total_min: number }[]>(),
  );
  const sm = new Map(summary.map((s) => [s.id, s]));
  return rows
    .map((r) => {
      const s = sm.get(r.id);
      return {
        ...toProject(r),
        companyName: r.company?.name ?? null,
        taskCount: s?.task_count ?? 0,
        openCount: s?.open_count ?? 0,
        doneCount: s?.done_count ?? 0,
        totalMin: Number(s?.total_min ?? 0),
      };
    })
    .sort((a, b) => {
      // 기간순: 시작일 최신 프로젝트가 먼저, 시작일 없는 것은 뒤로. archived 는 맨 뒤
      if (a.status !== b.status) return a.status === "active" ? -1 : 1;
      if (a.startedAt !== b.startedAt) {
        if (!a.startedAt) return 1;
        if (!b.startedAt) return -1;
        return b.startedAt.localeCompare(a.startedAt);
      }
      return a.name.localeCompare(b.name, "ko");
    });
}

export async function getProjectDetail(id: number, opts: { scope?: ProjectScope } = {}): Promise<ProjectListItem | null> {
  const all = await listProjects({ includeArchived: true, scope: opts.scope ?? "company" });
  return all.find((p) => p.id === id) ?? null;
}

export interface ProjectOption extends Option {
  companyName: string | null;
  companyId: number | null;
}

/** active 프로젝트만 (업무 생성/이동 대상) */
export async function listProjectOptions(opts: { scope?: ProjectScope } = {}): Promise<ProjectOption[]> {
  const scope = opts.scope ?? "company";
  let q = supabase()
    .from(T)
    .select("id,name, company:companies(id,name)")
    .is("deleted_at", null)
    .eq("status", "active")
    .order("name");
  if (scope === "personal") q = q.is("company_id", null);
  if (scope === "company") q = q.not("company_id", "is", null);
  const rows = unwrap(
    await q.returns<{ id: number; name: string; company: { id: number; name: string } | null }[]>(),
  );
  return rows
    .map((r) => ({
      id: r.id,
      label: r.company ? `${r.company.name} · ${r.name}` : `개인 · ${r.name}`,
      companyName: r.company?.name ?? null,
      companyId: r.company?.id ?? null,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));
}
