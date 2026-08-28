# Tasks — DB

```sql
CREATE TABLE tasks (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id         bigint NOT NULL REFERENCES projects(id),
  requester_id       bigint REFERENCES people(id),      -- NULL = 본인
  title              text NOT NULL,
  body               text,
  status             text NOT NULL DEFAULT 'todo'
                     CHECK (status IN ('todo', 'doing', 'hold', 'done', 'canceled')),
  priority           text NOT NULL DEFAULT 'normal'
                     CHECK (priority IN ('low', 'normal', 'high')),
  requested_at       date DEFAULT CURRENT_DATE,
  due_at             timestamptz,
  completed_at       timestamptz,
  status_changed_at  timestamptz,
  source             text,
  tags               text[],
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz
);
CREATE INDEX idx_tasks_project   ON tasks(project_id);
CREATE INDEX idx_tasks_requester ON tasks(requester_id);
CREATE INDEX idx_tasks_status    ON tasks(status);
CREATE INDEX idx_tasks_due       ON tasks(due_at);
CREATE INDEX idx_tasks_tags      ON tasks USING gin(tags);

CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 상태 전이 시각 / 완료 시각 자동 기록
CREATE OR REPLACE FUNCTION tasks_on_status_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = now();
    IF NEW.status = 'done' THEN
      NEW.completed_at = now();
    ELSIF OLD.status = 'done' THEN
      NEW.completed_at = NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_tasks_status_change BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION tasks_on_status_change();

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;  -- 정책 없음, service_role 만 접근
```

- `tags` 는 SQLite 초안의 콤마 문자열 대신 Postgres `text[]` 사용. GIN 인덱스로 태그 필터.
- 첨부파일: `attachments` (owner_type = 'task'). 스키마는 [README](../README.md) 의 "첨부파일 (공통 스키마)" 참조.

## 자주 쓰는 조회

```sql
-- 요청자별 업무
SELECT t.* FROM tasks t
WHERE t.requester_id = :person_id AND t.deleted_at IS NULL
ORDER BY t.requested_at DESC;

-- 지연 업무
SELECT * FROM tasks
WHERE due_at < now() AND status NOT IN ('done', 'canceled') AND deleted_at IS NULL;

-- 목록에 붙일 "최근 작업일" (뷰로 만들어 supabase-js 에서 바로 select)
CREATE VIEW tasks_with_last_work AS
SELECT t.*, MAX(w.worked_at) AS last_worked_at
FROM tasks t
LEFT JOIN work w ON w.task_id = t.id AND w.deleted_at IS NULL
GROUP BY t.id;
```

supabase-js 에서 관계 조회 예:

```ts
supabase.from('tasks')
  .select('*, project:projects(id,name), requester:people(id,name), work(*)')
  .is('deleted_at', null)
```
