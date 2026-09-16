-- ===== 0008_app_settings.sql =====
-- 앱 전역 설정 key-value 저장소
CREATE TABLE IF NOT EXISTS app_settings (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 초기값: 구글 계정 인덱스
INSERT INTO app_settings (key, value) VALUES ('google_account_index', '0')
  ON CONFLICT (key) DO NOTHING;
