import { supabase } from "@/infrastructure/supabase/client";

export const CRM_TOOL_DECLARATIONS = [
  {
    name: "queryCrm",
    description: "CRM 데이터베이스를 검색하거나 조회합니다. 회사(companies), 프로젝트(projects), 사람(people), 업무(tasks), 작업일지(work) 정보를 조회할 때 사용합니다.",
    parameters: {
      type: "OBJECT",
      properties: {
        table: {
          type: "STRING",
          description: "조회할 대상 테이블 (companies: 회사, projects: 프로젝트, people: 사람, tasks: 업무, work: 작업일지)",
        },
        keyword: {
          type: "STRING",
          description: "검색할 키워드나 명칭 (선택사항, 없으면 전체 또는 최근 목록 반환)",
        },
        limit: {
          type: "INTEGER",
          description: "가져올 최대 건수 (기본 20)",
        },
      },
      required: ["table"],
    },
  },
  {
    name: "createProject",
    description: "CRM에 새로운 프로젝트를 등록합니다.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "프로젝트 이름 (필수)" },
        description: { type: "STRING", description: "프로젝트 설명 및 개요" },
        companyName: { type: "STRING", description: "소속 회사 이름 (개인 프로젝트면 생략)" },
        startedAt: { type: "STRING", description: "시작일 (YYYY-MM-DD 형식)" },
        endedAt: { type: "STRING", description: "종료일 (YYYY-MM-DD 형식, 선택사항)" },
      },
      required: ["name"],
    },
  },
  {
    name: "createTask",
    description: "특정 프로젝트에 새로운 업무(Task)를 등록합니다.",
    parameters: {
      type: "OBJECT",
      properties: {
        projectName: { type: "STRING", description: "업무가 속할 프로젝트 이름 (필수)" },
        title: { type: "STRING", description: "업무 제목 (필수)" },
        body: { type: "STRING", description: "업무 상세 내용/요구사항" },
        priority: { type: "STRING", description: "우선순위 ('low', 'normal', 'high', 기본 'normal')" },
        dueAt: { type: "STRING", description: "마감일시 (YYYY-MM-DD 또는 ISO 문자열)" },
        tags: { type: "ARRAY", items: { type: "STRING" }, description: "태그 목록 (예: ['버그', '기능'])" },
      },
      required: ["projectName", "title"],
    },
  },
  {
    name: "createWorkLog",
    description: "업무(Task)에 대한 작업 일지(기록)를 추가합니다.",
    parameters: {
      type: "OBJECT",
      properties: {
        taskTitleOrId: { type: "STRING", description: "작업을 기록할 업무의 제목 또는 ID" },
        body: { type: "STRING", description: "작업 내용 (필수)" },
        durationMin: { type: "INTEGER", description: "소요 시간 (분 단위, 예: 60)" },
        kind: { type: "STRING", description: "작업 분류 ('dev', 'meeting', 'call', 'doc', 'etc' 중 하나, 기본 'dev')" },
        workedAt: { type: "STRING", description: "작업 일시 (기본: 현재 시각)" },
      },
      required: ["body"],
    },
  },
];

export async function executeCrmTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const db = supabase();

  if (name === "queryCrm") {
    const table = String(args.table || "").toLowerCase();
    const keyword = args.keyword ? String(args.keyword).trim().toLowerCase() : "";
    const limit = typeof args.limit === "number" ? args.limit : 20;

    if (table.includes("compan")) {
      const { data } = await db
        .from("companies")
        .select("id, name, type, joined_at, left_at, memo")
        .is("deleted_at", null)
        .order("joined_at", { ascending: true, nullsFirst: false });
      
      let res = data ?? [];
      if (keyword) {
        res = res.filter((c) => c.name.toLowerCase().includes(keyword) || (c.memo && c.memo.toLowerCase().includes(keyword)));
      }
      return {
        table: "companies",
        count: res.length,
        items: res.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          joinedAt: c.joined_at,
          leftAt: c.left_at ?? "재직 중",
          memoSnippet: c.memo ? c.memo.slice(0, 150) : null,
        })),
      };
    }

    if (table.includes("project")) {
      const { data } = await db
        .from("projects")
        .select("id, name, status, description, started_at, ended_at, company:companies(name)")
        .is("deleted_at", null)
        .order("started_at", { ascending: false, nullsFirst: false });

      let res = data ?? [];
      if (keyword) {
        res = res.filter((p) => p.name.toLowerCase().includes(keyword) || (p.description && p.description.toLowerCase().includes(keyword)));
      }
      return {
        table: "projects",
        count: res.length,
        items: res.slice(0, limit).map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          companyName: Array.isArray(p.company) ? p.company[0]?.name : (p.company as { name?: string })?.name ?? "개인",
          startedAt: p.started_at,
          endedAt: p.ended_at ?? "현재 진행 중",
          descriptionSnippet: p.description ? p.description.slice(0, 200) : null,
        })),
      };
    }

    if (table.includes("person") || table.includes("people")) {
      const { data } = await db
        .from("people")
        .select("id, name, department, title, email, phone, memo, company:companies(name)")
        .is("deleted_at", null)
        .order("name");

      let res = data ?? [];
      if (keyword) {
        res = res.filter((pe) => pe.name.toLowerCase().includes(keyword) || (pe.department && pe.department.toLowerCase().includes(keyword)));
      }
      return {
        table: "people",
        count: res.length,
        items: res.slice(0, limit),
      };
    }

    if (table.includes("task")) {
      let q = db
        .from("tasks")
        .select("id, title, body, status, priority, due_at, tags, project:projects(name)")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (keyword) {
        q = q.or(`title.ilike.%${keyword}%,body.ilike.%${keyword}%`);
      }
      const { data } = await q;
      return {
        table: "tasks",
        count: data?.length ?? 0,
        items: (data ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          projectName: Array.isArray(t.project) ? t.project[0]?.name : (t.project as { name?: string })?.name ?? null,
          dueAt: t.due_at,
          bodySnippet: t.body ? t.body.slice(0, 150) : null,
        })),
      };
    }

    if (table.includes("work")) {
      const { data } = await db
        .from("work")
        .select("id, body, worked_at, duration_min, kind, task:tasks(title, project:projects(name))")
        .is("deleted_at", null)
        .order("worked_at", { ascending: false })
        .limit(limit);

      return {
        table: "work",
        count: data?.length ?? 0,
        items: (data ?? []).map((w) => ({
          id: w.id,
          workedAt: w.worked_at,
          durationMin: w.duration_min,
          kind: w.kind,
          taskTitle: Array.isArray(w.task) ? w.task[0]?.title : (w.task as { title?: string })?.title,
          projectName: Array.isArray(w.task) ? (w.task[0]?.project as { name?: string })?.name : ((w.task as { project?: { name?: string } })?.project)?.name,
          body: w.body,
        })),
      };
    }

    return { error: `알 수 없는 테이블 요청: ${table}` };
  }

  if (name === "createProject") {
    const projectName = String(args.name || "").trim();
    if (!projectName) return { success: false, message: "프로젝트 이름은 필수입니다." };

    let companyId: number | null = null;
    if (args.companyName) {
      const { data: companies } = await db.from("companies").select("id, name").is("deleted_at", null);
      const match = (companies ?? []).find((c) => c.name.toLowerCase().includes(String(args.companyName).toLowerCase()));
      if (match) companyId = match.id;
    }

    const { data, error } = await db
      .from("projects")
      .insert({
        name: projectName,
        description: args.description ? String(args.description) : null,
        company_id: companyId,
        started_at: args.startedAt ? String(args.startedAt) : new Date().toISOString().slice(0, 10),
        ended_at: args.endedAt ? String(args.endedAt) : null,
        status: "active",
      })
      .select("id, name, started_at")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, message: `프로젝트 '${data.name}'(ID: ${data.id})이(가) 성공적으로 생성되었습니다.`, project: data };
  }

  if (name === "createTask") {
    const title = String(args.title || "").trim();
    const projectName = String(args.projectName || "").trim();
    if (!title) return { success: false, message: "업무 제목은 필수입니다." };

    // 프로젝트 찾기
    const { data: projects } = await db.from("projects").select("id, name").is("deleted_at", null);
    const match = (projects ?? []).find((p) => p.name.toLowerCase().includes(projectName.toLowerCase()));
    if (!match) {
      return { success: false, message: `프로젝트 '${projectName}'을(를) 찾을 수 없습니다. 등록된 프로젝트 이름을 확인해 주세요.` };
    }

    const priority = args.priority && ["low", "normal", "high"].includes(String(args.priority)) ? String(args.priority) : "normal";
    const tags = Array.isArray(args.tags) ? args.tags.map(String) : [];

    const { data, error } = await db
      .from("tasks")
      .insert({
        project_id: match.id,
        title,
        body: args.body ? String(args.body) : null,
        priority,
        status: "todo",
        tags,
        due_at: args.dueAt ? new Date(String(args.dueAt)).toISOString() : null,
      })
      .select("id, title, priority, status")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, message: `업무 '${data.title}'(ID: ${data.id})이(가) '${match.name}' 프로젝트에 등록되었습니다.`, task: data };
  }

  if (name === "createWorkLog") {
    const body = String(args.body || "").trim();
    if (!body) return { success: false, message: "작업 일지 내용은 필수입니다." };

    // 태스크 찾기
    let taskId: number | null = null;
    let targetTaskTitle = "";

    if (args.taskTitleOrId) {
      const searchKey = String(args.taskTitleOrId).trim();
      if (/^\d+$/.test(searchKey)) {
        taskId = Number(searchKey);
      } else {
        const { data: tasks } = await db.from("tasks").select("id, title").is("deleted_at", null).order("updated_at", { ascending: false });
        const match = (tasks ?? []).find((t) => t.title.toLowerCase().includes(searchKey.toLowerCase()));
        if (match) {
          taskId = match.id;
          targetTaskTitle = match.title;
        }
      }
    }

    // 지정되지 않았으면 가장 최근 업무에 기록
    if (!taskId) {
      const { data: latestTask } = await db.from("tasks").select("id, title").is("deleted_at", null).order("updated_at", { ascending: false }).limit(1).single();
      if (latestTask) {
        taskId = latestTask.id;
        targetTaskTitle = latestTask.title;
      }
    }

    if (!taskId) {
      return { success: false, message: "작업을 기록할 업무를 찾을 수 없습니다. 업무를 먼저 생성해 주세요." };
    }

    const { data, error } = await db
      .from("work")
      .insert({
        task_id: taskId,
        body,
        duration_min: typeof args.durationMin === "number" ? args.durationMin : null,
        kind: args.kind && ["dev", "meeting", "call", "doc", "etc"].includes(String(args.kind)) ? String(args.kind) : "dev",
        worked_at: args.workedAt ? new Date(String(args.workedAt)).toISOString() : new Date().toISOString(),
      })
      .select("id, worked_at, duration_min, kind")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, message: `업무 '${targetTaskTitle}'에 작업 일지가 등록되었습니다.`, work: data };
  }

  return { error: `알 수 없는 도구: ${name}` };
}
