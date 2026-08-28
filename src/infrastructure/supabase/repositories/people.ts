import "server-only";
import type { PersonRepository } from "@/application/ports";
import { personLabel, type Person, type PersonInput } from "@/domain/people/person";
import type { Id } from "@/domain/shared/types";
import { supabase, unwrap } from "../client";
import { fromPersonInput, toPerson, type PersonRow } from "../rows";
import type { Option } from "./companies";

const T = "people";

export const personRepository: PersonRepository = {
  async findById(id) {
    const row = unwrap(
      await supabase().from(T).select("*").eq("id", id).is("deleted_at", null).maybeSingle<PersonRow>(),
    );
    return row ? toPerson(row) : null;
  },
  async insert(input: PersonInput) {
    const row = unwrap(await supabase().from(T).insert(fromPersonInput(input)).select("*").single<PersonRow>());
    return toPerson(row);
  },
  async update(id: Id, input: PersonInput) {
    const row = unwrap(
      await supabase().from(T).update(fromPersonInput(input)).eq("id", id).select("*").single<PersonRow>(),
    );
    return toPerson(row);
  },
  async softDelete(id) {
    unwrap(await supabase().from(T).update({ deleted_at: new Date().toISOString() }).eq("id", id));
  },
  async countTasks(id) {
    const r = await supabase()
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("requester_id", id)
      .is("deleted_at", null);
    return r.count ?? 0;
  },
};

// ---- 조회 ----

type PersonJoined = PersonRow & { company: { id: number; name: string } | null };

export interface PersonListItem extends Person {
  companyName: string | null;
  taskCount: number;
  openCount: number;
  lastRequestedAt: string | null;
}

export async function listPeople(opts: { companyId?: number } = {}): Promise<PersonListItem[]> {
  const db = supabase();
  let q = db.from(T).select("*, company:companies(id,name)").is("deleted_at", null).order("name");
  if (opts.companyId) q = q.eq("company_id", opts.companyId);
  const rows = unwrap(await q.returns<PersonJoined[]>());
  const summary = unwrap(
    await db
      .from("people_summary")
      .select("*")
      .returns<{ id: number; task_count: number; open_count: number; last_requested_at: string | null }[]>(),
  );
  const sm = new Map(summary.map((s) => [s.id, s]));
  return rows.map((r) => {
    const s = sm.get(r.id);
    return {
      ...toPerson(r),
      companyName: r.company?.name ?? null,
      taskCount: s?.task_count ?? 0,
      openCount: s?.open_count ?? 0,
      lastRequestedAt: s?.last_requested_at ?? null,
    };
  });
}

export async function getPersonDetail(id: number): Promise<PersonListItem | null> {
  const rows = await listPeople();
  return rows.find((p) => p.id === id) ?? null;
}

export async function listPersonOptions(): Promise<Option[]> {
  const rows = unwrap(
    await supabase()
      .from(T)
      .select("id,name,title, company:companies(name)")
      .is("deleted_at", null)
      .order("name")
      .returns<{ id: number; name: string; title: string | null; company: { name: string } | null }[]>(),
  );
  return rows.map((r) => ({ id: r.id, label: personLabel({ name: r.name, title: r.title, companyName: r.company?.name }) }));
}
