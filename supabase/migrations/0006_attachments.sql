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
