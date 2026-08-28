"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as uc from "@/application/projects";
import { deps } from "@/infrastructure/container";
import { PROJECT_STATUSES } from "@/domain/projects/project";
import { int, run, str, type ActionResult } from "./result";

const Form = z.object({
  companyId: z.number().int().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
});

const parse = (fd: FormData) =>
  Form.parse({
    companyId: int(fd, "companyId"),
    name: str(fd, "name") ?? "",
    description: str(fd, "description"),
    startedAt: str(fd, "startedAt"),
    endedAt: str(fd, "endedAt"),
  });

function revalidate(id?: number) {
  revalidatePath("/projects");
  revalidatePath("/companies");
  revalidatePath("/tasks");
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/projects/${id}`);
}

export async function createProjectAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const p = await uc.createProject(deps, parse(fd));
    revalidate();
    return { ok: true, id: p.id, redirect: `/projects/${p.id}` };
  });
}

export async function updateProjectAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const id = int(fd, "id");
    if (!id) throw new Error("id");
    await uc.updateProject(deps, id, parse(fd));
    revalidate(id);
  });
}

export async function setProjectStatus(id: number, status: string): Promise<ActionResult> {
  return run(async () => {
    await uc.setProjectStatus(deps, id, z.enum(PROJECT_STATUSES).parse(status));
    revalidate(id);
  });
}

export async function deleteProject(id: number): Promise<ActionResult> {
  return run(async () => {
    await uc.deleteProject(deps, id);
    revalidate(id);
    return { ok: true, redirect: "/projects" };
  });
}
