"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as uc from "@/application/people";
import { deps } from "@/infrastructure/container";
import { int, run, str, type ActionResult } from "./result";

const Form = z.object({
  companyId: z.number().int().nullable(),
  name: z.string(),
  department: z.string().nullable(),
  title: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  memo: z.string().nullable(),
});

const parse = (fd: FormData) =>
  Form.parse({
    companyId: int(fd, "companyId"),
    name: str(fd, "name") ?? "",
    department: str(fd, "department"),
    title: str(fd, "title"),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    memo: str(fd, "memo"),
  });

function revalidate(id?: number) {
  revalidatePath("/people");
  revalidatePath("/companies");
  revalidatePath("/tasks");
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/people/${id}`);
}

export async function createPersonAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const p = await uc.createPerson(deps, parse(fd));
    revalidate();
    const stay = str(fd, "stay") === "1";
    return { ok: true, id: p.id, redirect: stay ? undefined : `/people/${p.id}` };
  });
}

export async function updatePersonAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const id = int(fd, "id");
    if (!id) throw new Error("id");
    await uc.updatePerson(deps, id, parse(fd));
    revalidate(id);
  });
}

export async function deletePerson(id: number): Promise<ActionResult> {
  return run(async () => {
    await uc.deletePerson(deps, id);
    revalidate(id);
    return { ok: true, redirect: "/people" };
  });
}
