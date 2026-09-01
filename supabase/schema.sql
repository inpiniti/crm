-- ===== 0001_common.sql =====
-- 공통: updated_at 트리거 함수
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- ===== 0002_companies.sql =====
CREATE TABLE companies (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL,
  type        text NOT NULL DEFAULT 'employer'
              CHECK (type IN ('employer', 'client', 'other')),
  joined_at   date,
  left_at     date,
  memo        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE UNIQUE INDEX uq_companies_name_active
  ON companies(name) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ===== 0003_people.sql =====
CREATE TABLE people (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id   bigint REFERENCES companies(id),
  name         text NOT NULL,
  department   text,
  title        text,
  email        text,
  phone        text,
  memo         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE INDEX idx_people_company ON people(company_id);
CREATE INDEX idx_people_name    ON people(name);

CREATE TRIGGER trg_people_updated_at BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- ===== 0004_projects.sql =====
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
CREATE UNIQUE INDEX uq_projects_company_name_active
  ON projects(COALESCE(company_id, 0), name) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ===== 0005_tasks_work.sql =====
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
  started_at         date,                              -- 0007
  due_at             timestamptz,
  completed_at       timestamptz,
  status_changed_at  timestamptz,
  source             text,
  tags               text[] NOT NULL DEFAULT '{}',
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

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- work
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

ALTER TABLE work ENABLE ROW LEVEL SECURITY;

-- 읽기 뷰
CREATE VIEW tasks_with_last_work AS
SELECT t.*, (SELECT MAX(w.worked_at) FROM work w WHERE w.task_id = t.id AND w.deleted_at IS NULL) AS last_worked_at
FROM tasks t;

CREATE VIEW people_summary AS
SELECT p.id,
       COUNT(t.id)                                                     AS task_count,
       COUNT(t.id) FILTER (WHERE t.status IN ('todo','doing','hold'))  AS open_count,
       MAX(t.requested_at)                                             AS last_requested_at
FROM people p
LEFT JOIN tasks t ON t.requester_id = p.id AND t.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id;

CREATE VIEW project_summary AS
SELECT p.id,
       COUNT(t.id)                                                     AS task_count,
       COUNT(t.id) FILTER (WHERE t.status IN ('todo','doing','hold'))  AS open_count,
       COUNT(t.id) FILTER (WHERE t.status = 'done')                    AS done_count,
       COALESCE((SELECT SUM(w.duration_min) FROM work w JOIN tasks t2 ON t2.id = w.task_id
                 WHERE t2.project_id = p.id AND w.deleted_at IS NULL AND t2.deleted_at IS NULL), 0) AS total_min
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- ===== 0006_attachments.sql =====
CREATE TABLE attachments (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_type    text NOT NULL CHECK (owner_type IN ('task', 'work')),
  owner_id      bigint NOT NULL,
  file_name     text NOT NULL,
  storage_path  text NOT NULL,
  mime_type     text,
  size_bytes    bigint,
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX idx_attachments_owner ON attachments(owner_type, owner_id);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Storage 버킷 (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;
