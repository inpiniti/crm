"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as uc from "@/application/companies";
import { deps } from "@/infrastructure/container";
import { COMPANY_TYPES } from "@/domain/companies/company";
import { int, run, str, type ActionResult } from "./result";

const Form = z.object({
  name: z.string(),
  type: z.enum(COMPANY_TYPES),
  joinedAt: z.string().nullable(),
  leftAt: z.string().nullable(),
  memo: z.string().nullable(),
});

const parse = (fd: FormData) =>
  Form.parse({
    name: str(fd, "name") ?? "",
    type: str(fd, "type") ?? "employer",
    joinedAt: str(fd, "joinedAt"),
    leftAt: str(fd, "leftAt"),
    memo: str(fd, "memo"),
  });

function revalidate(id?: number) {
  revalidatePath("/companies");
  revalidatePath("/projects");
  revalidatePath("/people");
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/companies/${id}`);
}

export async function createCompanyAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const c = await uc.createCompany(deps, parse(fd));
    revalidate();
    return { ok: true, id: c.id, redirect: `/companies/${c.id}` };
  });
}

export async function updateCompanyAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const id = int(fd, "id");
    if (!id) throw new Error("id");
    await uc.updateCompany(deps, id, parse(fd));
    revalidate(id);
  });
}

export async function deleteCompany(id: number): Promise<ActionResult> {
  return run(async () => {
    await uc.deleteCompany(deps, id);
    revalidate(id);
    return { ok: true, redirect: "/companies" };
  });
}
