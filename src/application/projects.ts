import {
  assertProjectDeletable,
  validateProjectInput,
  type ProjectInput,
  type ProjectStatus,
} from "@/domain/projects/project";
import { NotFoundError } from "@/domain/shared/errors";
import type { Id } from "@/domain/shared/types";
import type { Deps } from "./ports";

async function assertCompanyExists(deps: Deps, companyId: Id | null) {
  if (companyId !== null && !(await deps.companies.findById(companyId))) throw new NotFoundError("회사");
}

export async function createProject(deps: Deps, input: ProjectInput) {
  const valid = validateProjectInput(input);
  await assertCompanyExists(deps, valid.companyId);
  return deps.projects.insert(valid);
}

export async function updateProject(deps: Deps, id: Id, input: ProjectInput) {
  if (!(await deps.projects.findById(id))) throw new NotFoundError("프로젝트");
  const valid = validateProjectInput(input);
  await assertCompanyExists(deps, valid.companyId);
  return deps.projects.update(id, valid);
}

export async function setProjectStatus(deps: Deps, id: Id, status: ProjectStatus) {
  if (!(await deps.projects.findById(id))) throw new NotFoundError("프로젝트");
  await deps.projects.setStatus(id, status);
}

export async function deleteProject(deps: Deps, id: Id) {
  if (!(await deps.projects.findById(id))) throw new NotFoundError("프로젝트");
  assertProjectDeletable({ taskCount: await deps.projects.countTasks(id) });
  await deps.projects.softDelete(id);
}
