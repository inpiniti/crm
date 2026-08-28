# Work — DB

```sql
CREATE TABLE work (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  task_id       bigint NOT NULL REFERENCES tasks(id),
  body          text NOT NULL,
  worked_at     timestamptz NOT NULL DEFAULT now(),
  duration_min  integer CHECK (duration_min IS NULL OR duration_min >= 0),
  kind          text CHECK (kind IS NULL OR kind IN ('dev', 'meeting', 'call', 'doc', 'etc')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX idx_work_task      ON work(task_id);
CREATE INDEX idx_work_worked_at ON work(worked_at);

CREATE TRIGGER trg_work_updated_at BEFORE UPDATE ON work
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 종료 상태 Task 에는 Work 추가 불가 (도메인 규칙을 DB 에서도 보장)
CREATE OR REPLACE FUNCTION work_check_task_open()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM tasks
    WHERE id = NEW.task_id AND (status IN ('done', 'canceled') OR deleted_at IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'cannot add work to a closed or deleted task';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_work_check_task_open BEFORE INSERT ON work
  FOR EACH ROW EXECUTE FUNCTION work_check_task_open();

ALTER TABLE work ENABLE ROW LEVEL SECURITY;  -- 정책 없음, service_role 만 접근
```

첨부파일: `attachments` (owner_type = 'work').

## 자주 쓰는 조회

```sql
-- 일자별 타임라인 (KST 기준 날짜)
SELECT w.*, t.title AS task_title, p.name AS project_name
FROM work w
JOIN tasks t ON t.id = w.task_id
JOIN projects p ON p.id = t.project_id
WHERE (w.worked_at AT TIME ZONE 'Asia/Seoul')::date = :date
  AND w.deleted_at IS NULL
ORDER BY w.worked_at;

-- 프로젝트별 소요시간 합산
SELECT p.id, p.name, COALESCE(SUM(w.duration_min), 0) AS total_min
FROM projects p
JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL
JOIN work w ON w.task_id = t.id AND w.deleted_at IS NULL
GROUP BY p.id;
```

일자별 타임라인은 supabase-js 에서 `gte/lt` 로 KST 하루 범위를 넘기는 게 간단하다:

```ts
supabase.from('work')
  .select('*, task:tasks(id,title, project:projects(id,name))')
  .gte('worked_at', dayStartKst).lt('worked_at', dayEndKst)
  .is('deleted_at', null).order('worked_at')
```
