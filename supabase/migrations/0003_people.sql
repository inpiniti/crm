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
