# Projects — DB

```sql
CREATE TABLE projects (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id   bigint REFERENCES companies(id),   -- NULL = 개인 프로젝트
  name         text NOT NULL,
  description  text,
  status       text NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'archived')),
  started_at   date,
  ended_at     date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE INDEX idx_projects_company ON projects(company_id);
-- 회사별 이름 유일. NULL 은 유니크 비교에서 서로 다르게 취급되므로
-- 개인 프로젝트는 COALESCE 로 0 처리.
CREATE UNIQUE INDEX uq_projects_company_name_active
  ON projects(COALESCE(company_id, 0), name) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;  -- 정책 없음, service_role 만 접근
```
