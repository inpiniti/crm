import type { Company, CompanyInput } from "@/domain/companies/company";
import type { Person, PersonInput } from "@/domain/people/person";
import type { Project, ProjectInput, ProjectStatus } from "@/domain/projects/project";
import type { Attachment, AttachmentOwnerType } from "@/domain/tasks/attachment";
import type { Task, TaskInput } from "@/domain/tasks/task";
import type { TaskStatus } from "@/domain/tasks/task-status";
import type { Work, WorkInput } from "@/domain/tasks/work";
import type { Id } from "@/domain/shared/types";

export interface CompanyRepository {
  findById(id: Id): Promise<Company | null>;
  insert(input: CompanyInput): Promise<Company>;
  update(id: Id, input: CompanyInput): Promise<Company>;
  softDelete(id: Id): Promise<void>;
  countRefs(id: Id): Promise<{ projectCount: number; personCount: number }>;
}

export interface PersonRepository {
  findById(id: Id): Promise<Person | null>;
  insert(input: PersonInput): Promise<Person>;
  update(id: Id, input: PersonInput): Promise<Person>;
  softDelete(id: Id): Promise<void>;
  countTasks(id: Id): Promise<number>;
}

export interface ProjectRepository {
  findById(id: Id): Promise<Project | null>;
  insert(input: ProjectInput): Promise<Project>;
  update(id: Id, input: ProjectInput): Promise<Project>;
  setStatus(id: Id, status: ProjectStatus): Promise<void>;
  softDelete(id: Id): Promise<void>;
  countTasks(id: Id): Promise<number>;
}

export interface TaskRepository {
  findById(id: Id): Promise<Task | null>;
  insert(input: TaskInput): Promise<Task>;
  update(id: Id, input: TaskInput): Promise<Task>;
  setStatus(id: Id, status: TaskStatus): Promise<void>;
  move(id: Id, projectId: Id): Promise<void>;
  /** work, attachments 까지 함께 soft delete */
  softDeleteCascade(id: Id): Promise<void>;
}

export interface WorkRepository {
  findById(id: Id): Promise<Work | null>;
  insert(taskId: Id, input: WorkInput): Promise<Work>;
  update(id: Id, input: WorkInput): Promise<Work>;
  softDelete(id: Id): Promise<void>;
}

export interface AttachmentRepository {
  findById(id: Id): Promise<Attachment | null>;
  insert(meta: Omit<Attachment, "id" | "createdAt" | "deletedAt">): Promise<Attachment>;
  softDelete(id: Id): Promise<void>;
}

export interface FileStorage {
  upload(path: string, data: ArrayBuffer, contentType: string | null): Promise<void>;
  signedUrl(path: string, fileName: string): Promise<string>;
  remove(path: string): Promise<void>;
}

export interface Deps {
  companies: CompanyRepository;
  people: PersonRepository;
  projects: ProjectRepository;
  tasks: TaskRepository;
  work: WorkRepository;
  attachments: AttachmentRepository;
  storage: FileStorage;
  newId(): string; // 파일명 충돌 방지용 랜덤 id
}

export type { AttachmentOwnerType };
