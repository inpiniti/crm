import "server-only";
import type { CompanyRepository } from "@/application/ports";
import { companySortKey, type Company, type CompanyInput } from "@/domain/companies/company";
import type { Id } from "@/domain/shared/types";
import { supabase, unwrap } from "../client";
import { fromCompanyInput, toCompany, type CompanyRow } from "../rows";

const T = "companies";

export const companyRepository: CompanyRepository = {
  async findById(id) {
    const row = unwrap(
      await supabase().from(T).select("*").eq("id", id).is("deleted_at", null).maybeSingle<CompanyRow>(),
    );
    return row ? toCompany(row) : null;
  },
  async insert(input: CompanyInput) {
    const row = unwrap(await supabase().from(T).insert(fromCompanyInput(input)).select("*").single<CompanyRow>());
    return toCompany(row);
  },
  async update(id: Id, input: CompanyInput) {
    const row = unwrap(
      await supabase().from(T).update(fromCompanyInput(input)).eq("id", id).select("*").single<CompanyRow>(),
    );
    return toCompany(row);
  },
  async softDelete(id) {
    unwrap(await supabase().from(T).update({ deleted_at: new Date().toISOString() }).eq("id", id));
  },
  async countRefs(id) {
    const db = supabase();
    const [p, h] = await Promise.all([
      db.from("projects").select("id", { count: "exact", head: true }).eq("company_id", id).is("deleted_at", null),
      db.from("people").select("id", { count: "exact", head: true }).eq("company_id", id).is("deleted_at", null),
    ]);
    return { projectCount: p.count ?? 0, personCount: h.count ?? 0 };
  },
};

// ---- 조회 ----

export interface CompanyListItem extends Company {
  projectCount: number;
  personCount: number;
}

export async function listCompanies(): Promise<CompanyListItem[]> {
  const db = supabase();
  const rows = unwrap(await db.from(T).select("*").is("deleted_at", null).order("name").returns<CompanyRow[]>());
  const [projects, people] = await Promise.all([
    db.from("projects").select("company_id").is("deleted_at", null).not("company_id", "is", null),
    db.from("people").select("company_id").is("deleted_at", null).not("company_id", "is", null),
  ]);
  const count = (list: { company_id: number | null }[] | null) => {
    const m = new Map<number, number>();
    for (const r of list ?? []) if (r.company_id) m.set(r.company_id, (m.get(r.company_id) ?? 0) + 1);
    return m;
  };
  const pc = count(projects.data);
  const hc = count(people.data);
  return rows
    .map((r) => ({ ...toCompany(r), projectCount: pc.get(r.id) ?? 0, personCount: hc.get(r.id) ?? 0 }))
    .sort((a, b) => companySortKey(a) - companySortKey(b) || a.name.localeCompare(b.name, "ko"));
}

export interface Option {
  id: number;
  label: string;
}

export async function listCompanyOptions(): Promise<Option[]> {
  const rows = unwrap(
    await supabase().from(T).select("id,name,type,left_at").is("deleted_at", null).returns<Pick<CompanyRow, "id" | "name" | "type" | "left_at">[]>(),
  );
  return rows
    .sort(
      (a, b) =>
        companySortKey({ type: a.type, leftAt: a.left_at }) - companySortKey({ type: b.type, leftAt: b.left_at }) ||
        a.name.localeCompare(b.name, "ko"),
    )
    .map((r) => ({ id: r.id, label: r.name }));
}
