import "server-only";
import { randomUUID } from "node:crypto";
import type { Deps } from "@/application/ports";
import { companyRepository } from "./supabase/repositories/companies";
import { personRepository } from "./supabase/repositories/people";
import { projectRepository } from "./supabase/repositories/projects";
import { attachmentRepository, taskRepository, workRepository } from "./supabase/repositories/tasks";
import { fileStorage } from "./supabase/storage";

export const deps: Deps = {
  companies: companyRepository,
  people: personRepository,
  projects: projectRepository,
  tasks: taskRepository,
  work: workRepository,
  attachments: attachmentRepository,
  storage: fileStorage,
  newId: () => randomUUID().slice(0, 8),
};
