// supabase/migrations/*.sql 을 하나로 합쳐 supabase/schema.sql 생성 (SQL Editor 에 붙여넣기용)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const out = files.map((f) => `-- ===== ${f} =====\n${readFileSync(join(dir, f), "utf8").trim()}\n`).join("\n");
writeFileSync("supabase/schema.sql", out);
console.log(`supabase/schema.sql <- ${files.join(", ")}`);
