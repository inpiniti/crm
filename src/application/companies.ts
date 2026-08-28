import { assertCompanyDeletable, validateCompanyInput, type CompanyInput } from "@/domain/companies/company";
import { NotFoundError } from "@/domain/shared/errors";
import type { Id } from "@/domain/shared/types";
import type { Deps } from "./ports";

export async function createCompany(deps: Deps, input: CompanyInput) {
  return deps.companies.insert(validateCompanyInput(input));
}

export async function updateCompany(deps: Deps, id: Id, input: CompanyInput) {
  if (!(await deps.companies.findById(id))) throw new NotFoundError("회사");
  return deps.companies.update(id, validateCompanyInput(input));
}

export async function deleteCompany(deps: Deps, id: Id) {
  if (!(await deps.companies.findById(id))) throw new NotFoundError("회사");
  assertCompanyDeletable(await deps.companies.countRefs(id));
  await deps.companies.softDelete(id);
}
