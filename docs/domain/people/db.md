# People — DB

```sql
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

ALTER TABLE people ENABLE ROW LEVEL SECURITY;  -- 정책 없음, service_role 만 접근
```

## 자주 쓰는 조회

```sql
-- 인물 요약 (뷰)
CREATE VIEW people_summary AS
SELECT p.id, p.name,
       COUNT(t.id)                                                     AS task_count,
       COUNT(t.id) FILTER (WHERE t.status IN ('todo','doing','hold'))  AS open_count,
       MAX(t.requested_at)                                             AS last_requested_at
FROM people p
LEFT JOIN tasks t ON t.requester_id = p.id AND t.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id;
```

이름 자동완성은 `ilike`:

```ts
supabase.from('people').select('id,name,title, company:companies(name)')
  .ilike('name', `%${q}%`).is('deleted_at', null).limit(10)
```
