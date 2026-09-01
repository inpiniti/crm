import type { Company, CompanyInput, CompanyType } from "@/domain/companies/company";
import type { Person, PersonInput } from "@/domain/people/person";
import type { Project, ProjectInput, ProjectStatus } from "@/domain/projects/project";
import type { Attachment, AttachmentOwnerType } from "@/domain/tasks/attachment";
import type { Task, TaskInput, TaskPriority } from "@/domain/tasks/task";
import type { TaskStatus } from "@/domain/tasks/task-status";
import type { Work, WorkInput, WorkKind } from "@/domain/tasks/work";

// DB 행 타입 (supabase gen types 대신 수기 관리 — 스키마는 supabase/migrations 참조)

export interface CompanyRow {
  id: number;
  name: string;
  type: CompanyType;
  joined_at: string | null;
  left_at: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PersonRow {
  id: number;
  company_id: number | null;
  name: string;
  department: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProjectRow {
  id: number;
  company_id: number | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskRow {
  id: number;
  project_id: number;
  requester_id: number | null;
  title: string;
  body: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  requested_at: string | null;
  started_at: string | null;
  due_at: string | null;
  completed_at: string | null;
  status_changed_at: string | null;
  source: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkRow {
  id: number;
  task_id: number;
  body: string;
  worked_at: string;
  duration_min: number | null;
  kind: WorkKind | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AttachmentRow {
  id: number;
  owner_type: AttachmentOwnerType;
  owner_id: number;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  deleted_at: string | null;
}

// ---- mappers ----

export const toCompany = (r: CompanyRow): Company => ({
  id: r.id,
  name: r.name,
  type: r.type,
  joinedAt: r.joined_at,
  leftAt: r.left_at,
  memo: r.memo,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});
export const fromCompanyInput = (i: CompanyInput) => ({
  name: i.name,
  type: i.type,
  joined_at: i.joinedAt,
  left_at: i.leftAt,
  memo: i.memo,
});

export const toPerson = (r: PersonRow): Person => ({
  id: r.id,
  companyId: r.company_id,
  name: r.name,
  department: r.department,
  title: r.title,
  email: r.email,
  phone: r.phone,
  memo: r.memo,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});
export const fromPersonInput = (i: PersonInput) => ({
  company_id: i.companyId,
  name: i.name,
  department: i.department,
  title: i.title,
  email: i.email,
  phone: i.phone,
  memo: i.memo,
});

export const toProject = (r: ProjectRow): Project => ({
  id: r.id,
  companyId: r.company_id,
  name: r.name,
  description: r.description,
  status: r.status,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});
export const fromProjectInput = (i: ProjectInput) => ({
  company_id: i.companyId,
  name: i.name,
  description: i.description,
  started_at: i.startedAt,
  ended_at: i.endedAt,
});

export const toTask = (r: TaskRow): Task => ({
  id: r.id,
  projectId: r.project_id,
  requesterId: r.requester_id,
  title: r.title,
  body: r.body,
  status: r.status,
  priority: r.priority,
  requestedAt: r.requested_at,
  startedAt: r.started_at,
  dueAt: r.due_at,
  completedAt: r.completed_at,
  statusChangedAt: r.status_changed_at,
  source: r.source,
  tags: r.tags ?? [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});
export const fromTaskInput = (i: TaskInput) => ({
  project_id: i.projectId,
  requester_id: i.requesterId,
  title: i.title,
  body: i.body,
  priority: i.priority,
  requested_at: i.requestedAt,
  started_at: i.startedAt,
  due_at: i.dueAt,
  source: i.source,
  tags: i.tags,
});

export const toWork = (r: WorkRow): Work => ({
  id: r.id,
  taskId: r.task_id,
  body: r.body,
  workedAt: r.worked_at,
  durationMin: r.duration_min,
  kind: r.kind,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});
export const fromWorkInput = (i: WorkInput) => ({
  body: i.body,
  worked_at: i.workedAt,
  duration_min: i.durationMin,
  kind: i.kind,
});

export const toAttachment = (r: AttachmentRow): Attachment => ({
  id: r.id,
  ownerType: r.owner_type,
  ownerId: r.owner_id,
  fileName: r.file_name,
  storagePath: r.storage_path,
  mimeType: r.mime_type,
  sizeBytes: r.size_bytes,
  createdAt: r.created_at,
  deletedAt: r.deleted_at,
});
