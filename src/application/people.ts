import { assertPersonDeletable, validatePersonInput, type PersonInput } from "@/domain/people/person";
import { NotFoundError } from "@/domain/shared/errors";
import type { Id } from "@/domain/shared/types";
import type { Deps } from "./ports";

async function assertCompanyExists(deps: Deps, companyId: Id | null) {
  if (companyId !== null && !(await deps.companies.findById(companyId))) throw new NotFoundError("회사");
}

export async function createPerson(deps: Deps, input: PersonInput) {
  const valid = validatePersonInput(input);
  await assertCompanyExists(deps, valid.companyId);
  return deps.people.insert(valid);
}

export async function updatePerson(deps: Deps, id: Id, input: PersonInput) {
  if (!(await deps.people.findById(id))) throw new NotFoundError("사람");
  const valid = validatePersonInput(input);
  await assertCompanyExists(deps, valid.companyId);
  return deps.people.update(id, valid);
}

export async function deletePerson(deps: Deps, id: Id) {
  if (!(await deps.people.findById(id))) throw new NotFoundError("사람");
  assertPersonDeletable({ taskCount: await deps.people.countTasks(id) });
  await deps.people.softDelete(id);
}
