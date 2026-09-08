import "server-only";
import type { AttachmentRepository, TaskRepository, WorkRepository } from "@/application/ports";
import type { Attachment } from "@/domain/tasks/attachment";
import type { Task, TaskInput } from "@/domain/tasks/task";
import { OPEN_STATUSES, type TaskStatus } from "@/domain/tasks/task-status";
import type { Work, WorkInput } from "@/domain/tasks/work";
import type { Id } from "@/domain/shared/types";
import { dayRangeKst, toDateKst } from "@/lib/date";
import { supabase, unwrap } from "../client";
import {
  fromTaskInput,
  fromWorkInput,
  toAttachment,
  toTask,
  toWork,
  type AttachmentRow,
  type TaskRow,
  type WorkRow,
} from "../rows";

export const taskRepository: TaskRepository = {
  async findById(id) {
    const row = unwrap(
      await supabase().from("tasks").select("*").eq("id", id).is("deleted_at", null).maybeSingle<TaskRow>(),
    );
    return row ? toTask(row) : null;
  },
  async insert(input: TaskInput) {
    const row = unwrap(await supabase().from("tasks").insert(fromTaskInput(input)).select("*").single<TaskRow>());
    return toTask(row);
  },
  async update(id: Id, input: TaskInput) {
    const row = unwrap(
      await supabase().from("tasks").update(fromTaskInput(input)).eq("id", id).select("*").single<TaskRow>(),
    );
    return toTask(row);
  },
  async setStatus(id, status: TaskStatus) {
    unwrap(await supabase().from("tasks").update({ status }).eq("id", id));
  },
  async move(id, projectId) {
    unwrap(await supabase().from("tasks").update({ project_id: projectId }).eq("id", id));
  },
  async softDeleteCascade(id) {
    const db = supabase();
    const now = new Date().toISOString();
    const works = unwrap(
      await db.from("work").select("id").eq("task_id", id).is("deleted_at", null).returns<{ id: number }[]>(),
    );
    const workIds = works.map((w) => w.id);
    if (workIds.length) {
      unwrap(await db.from("work").update({ deleted_at: now }).in("id", workIds));
      unwrap(
        await db.from("attachments").update({ deleted_at: now }).eq("owner_type", "work").in("owner_id", workIds),
      );
    }
    unwrap(await db.from("attachments").update({ deleted_at: now }).eq("owner_type", "task").eq("owner_id", id));
    unwrap(await db.from("tasks").update({ deleted_at: now }).eq("id", id));
  },
};

export const workRepository: WorkRepository = {
  async findById(id) {
    const row = unwrap(
      await supabase().from("work").select("*").eq("id", id).is("deleted_at", null).maybeSingle<WorkRow>(),
    );
    return row ? toWork(row) : null;
  },
  async insert(taskId, input: WorkInput) {
    const row = unwrap(
      await supabase()
        .from("work")
        .insert({ task_id: taskId, ...fromWorkInput(input) })
        .select("*")
        .single<WorkRow>(),
    );
    return toWork(row);
  },
  async update(id, input: WorkInput) {
    const row = unwrap(
      await supabase().from("work").update(fromWorkInput(input)).eq("id", id).select("*").single<WorkRow>(),
    );
    return toWork(row);
  },
  async softDelete(id) {
    const now = new Date().toISOString();
    const db = supabase();
    unwrap(await db.from("attachments").update({ deleted_at: now }).eq("owner_type", "work").eq("owner_id", id));
    unwrap(await db.from("work").update({ deleted_at: now }).eq("id", id));
  },
};

export const attachmentRepository: AttachmentRepository = {
  async findById(id) {
    const row = unwrap(
      await supabase().from("attachments").select("*").eq("id", id).is("deleted_at", null).maybeSingle<AttachmentRow>(),
    );
    return row ? toAttachment(row) : null;
  },
  async insert(meta) {
    const row = unwrap(
      await supabase()
        .from("attachments")
        .insert({
          owner_type: meta.ownerType,
          owner_id: meta.ownerId,
          file_name: meta.fileName,
          storage_path: meta.storagePath,
          mime_type: meta.mimeType,
          size_bytes: meta.sizeBytes,
        })
        .select("*")
        .single<AttachmentRow>(),
    );
    return toAttachment(row);
  },
  async softDelete(id) {
    unwrap(await supabase().from("attachments").update({ deleted_at: new Date().toISOString() }).eq("id", id));
  },
};

// ---- 조회 (read model) ----

type TaskJoined = TaskRow & {
  last_work: { worked_at: string }[] | null;
  project: { id: number; name: string; status: string; company: { id: number; name: string } | null } | null;
  requester: { id: number; name: string } | null;
};

export interface TaskListItem extends Task {
  projectName: string;
  companyName: string | null;
  requesterName: string | null;
  lastWorkedAt: string | null;
}

export interface TaskFilter {
  status?: TaskStatus | "open" | "all";
  projectId?: number;
  requesterId?: number;
  q?: string;
  tag?: string;
  dueBefore?: string;
  dueAfter?: string;
  overdue?: boolean;
  limit?: number;
}

function mapTask(r: TaskJoined): TaskListItem {
  return {
    ...toTask(r),
    projectName: r.project?.name ?? "(삭제된 프로젝트)",
    companyName: r.project?.company?.name ?? null,
    requesterName: r.requester?.name ?? null,
    lastWorkedAt: r.last_work?.[0]?.worked_at ?? null,
  };
}

// last_work: work 를 worked_at 내림차순 1건만 임베드 (아래 taskQuery 에서 order/limit 지정)
const TASK_SELECT =
  "*, project:projects(id,name,status, company:companies(id,name)), requester:people(id,name), last_work:work(worked_at)";

function taskQuery() {
  return supabase()
    .from("tasks")
    .select(TASK_SELECT)
    .is("deleted_at", null)
    .is("last_work.deleted_at", null)
    .order("worked_at", { referencedTable: "last_work", ascending: false })
    .limit(1, { referencedTable: "last_work" });
}

/** PostgREST or() 필터에 안전하게 넣을 수 있도록 특수문자 제거 */
function sanitizeSearch(s: string): string {
  return s.replace(/[,()%\\"']/g, " ").trim();
}

export async function listTasks(f: TaskFilter = {}): Promise<TaskListItem[]> {
  let q = taskQuery();
  const status = f.status ?? "open";
  if (status === "open") q = q.in("status", [...OPEN_STATUSES]);
  else if (status !== "all") q = q.eq("status", status);
  if (f.projectId) q = q.eq("project_id", f.projectId);
  if (f.requesterId) q = q.eq("requester_id", f.requesterId);
  const search = f.q ? sanitizeSearch(f.q) : "";
  if (search) q = q.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
  if (f.tag) q = q.contains("tags", [f.tag]);
  if (f.dueBefore) q = q.lt("due_at", f.dueBefore);
  if (f.dueAfter) q = q.gte("due_at", f.dueAfter);
  if (f.overdue) q = q.lt("due_at", new Date().toISOString()).in("status", [...OPEN_STATUSES]);
  q = q.order("due_at", { ascending: true, nullsFirst: false }).order("updated_at", { ascending: false });
  if (f.limit) q = q.limit(f.limit);
  const rows = unwrap(await q.returns<TaskJoined[]>());
  return rows.map(mapTask);
}

export interface WorkWithAttachments extends Work {
  attachments: Attachment[];
}

export interface TaskDetail extends TaskListItem {
  projectStatus: string;
  work: WorkWithAttachments[];
  attachments: Attachment[];
  totalMin: number;
}

export async function getTaskDetail(id: number): Promise<TaskDetail | null> {
  const db = supabase();
  const row = unwrap(await taskQuery().eq("id", id).maybeSingle<TaskJoined>());
  if (!row) return null;
  const works = unwrap(
    await db.from("work").select("*").eq("task_id", id).is("deleted_at", null).order("worked_at", { ascending: false }).returns<WorkRow[]>(),
  );
  const workIds = works.map((w) => w.id);
  const [taskAtt, workAtt] = await Promise.all([
    db.from("attachments").select("*").eq("owner_type", "task").eq("owner_id", id).is("deleted_at", null).order("created_at").returns<AttachmentRow[]>(),
    workIds.length
      ? db.from("attachments").select("*").eq("owner_type", "work").in("owner_id", workIds).is("deleted_at", null).order("created_at").returns<AttachmentRow[]>()
      : Promise.resolve({ data: [] as AttachmentRow[], error: null }),
  ]);
  const wa = new Map<number, Attachment[]>();
  for (const a of unwrap(workAtt)) {
    const list = wa.get(a.owner_id) ?? [];
    list.push(toAttachment(a));
    wa.set(a.owner_id, list);
  }
  const work = works.map((w) => ({ ...toWork(w), attachments: wa.get(w.id) ?? [] }));
  return {
    ...mapTask(row),
    projectStatus: row.project?.status ?? "active",
    work,
    attachments: unwrap(taskAtt).map(toAttachment),
    totalMin: work.reduce((s, w) => s + (w.durationMin ?? 0), 0),
  };
}

export interface WorkTimelineItem extends Work {
  taskTitle: string;
  taskStatus: TaskStatus;
  projectName: string;
  companyName: string | null;
}

export async function listWorkByDate(date: string): Promise<WorkTimelineItem[]> {
  const { start, end } = dayRangeKst(date);
  type Row = WorkRow & {
    task: { id: number; title: string; status: TaskStatus; project: { name: string; company: { name: string } | null } | null } | null;
  };
  const rows = unwrap(
    await supabase()
      .from("work")
      .select("*, task:tasks(id,title,status, project:projects(name, company:companies(name)))")
      .gte("worked_at", start)
      .lt("worked_at", end)
      .is("deleted_at", null)
      .order("worked_at")
      .returns<Row[]>(),
  );
  return rows.map((r) => ({
    ...toWork(r),
    taskTitle: r.task?.title ?? "",
    taskStatus: r.task?.status ?? "todo",
    projectName: r.task?.project?.name ?? "",
    companyName: r.task?.project?.company?.name ?? null,
  }));
}

/** 작업이 있는 날짜와 건수 (타임라인 날짜 네비용. days 미지정 시 전체 조회) */
export async function listWorkDates(days?: number): Promise<{ date: string; count: number }[]> {
  let q = supabase().from("work").select("worked_at").is("deleted_at", null);
  if (days) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    q = q.gte("worked_at", since);
  }
  const rows = unwrap(await q.returns<{ worked_at: string }[]>());
  const m = new Map<string, number>();
  for (const r of rows) {
    const d = toDateKst(r.worked_at);
    m.set(d, (m.get(d) ?? 0) + 1);
  }
  return [...m.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => b.date.localeCompare(a.date));
}

export async function listAllTags(): Promise<string[]> {
  const rows = unwrap(
    await supabase().from("tasks").select("tags").is("deleted_at", null).returns<{ tags: string[] }[]>(),
  );
  const s = new Set<string>();
  for (const r of rows) for (const t of r.tags ?? []) s.add(t);
  return [...s].sort((a, b) => a.localeCompare(b, "ko"));
}

/** 마지막으로 만든 업무의 프로젝트 (빠른 입력 기본값) */
export async function getLastUsedProjectId(): Promise<number | null> {
  const row = unwrap(
    await supabase()
      .from("tasks")
      .select("project_id")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ project_id: number }>(),
  );
  return row?.project_id ?? null;
}

/** 작업 추가 모달 등에서 사용할 업무 선택 목록 */
export async function listTaskOptions(): Promise<{ id: number; label: string }[]> {
  const rows = unwrap(
    await supabase()
      .from("tasks")
      .select("id, title, project:projects(name)")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .returns<{ id: number; title: string; project: { name: string } | null }[]>(),
  );
  return rows.map((r) => ({
    id: r.id,
    label: r.project?.name ? `${r.title} (${r.project.name})` : r.title,
  }));
}

