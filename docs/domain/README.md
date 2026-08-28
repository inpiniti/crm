# 도메인 개요

개인용 업무 메모장. CRM 구조를 본떠 만들되, 목적은 "내 업무가 어디서 왔고 무엇을 했는지"를 쌓아두는 것.

## 목표

- 특정 요청자가 요청했던 업무를 한 번에 본다.
- 특정 프로젝트(회사/개인)에 속한 업무와 그 작업 기록을 본다.
- 업무 하나를 열면 요청자, 소속 프로젝트, 한 일(work), 첨부파일이 다 보인다.

## 도메인 목록

| 도메인 | 역할 | 애그리거트 루트 | 문서 |
|---|---|---|---|
| companies | 다녔던/거래한 회사 | Company | [companies/](./companies/overview.md) |
| projects | 회사 또는 개인 프로젝트 | Project | [projects/](./projects/overview.md) |
| tasks | 업무 (중심 도메인) | Task | [tasks/](./tasks/overview.md) |
| work | 업무 안에서 실제로 한 작업 기록 | (Task 애그리거트 내부 엔티티) | [work/](./work/overview.md) |
| people | 요청자/지시자 | Person | [people/](./people/overview.md) |

## 관계 (컨텍스트 맵)

```
Company ─1:N─▶ Project ─1:N─▶ Task ─1:N─▶ Work
   │                            │
   └──────1:N───▶ Person ◀──N:1─┘ (requester, nullable)
```

- Project.company_id 는 nullable → null 이면 **개인 프로젝트**.
- Task.requester_id 는 nullable → null 이면 **내가 스스로 만든 업무**.
- Person.company_id 는 nullable → 소속 없는 개인(지인 등)도 등록 가능.
- Work 는 Task 없이 존재할 수 없다 (Task 애그리거트의 일부).
- 첨부파일은 Task 와 Work 에만 붙는다.

## 결정 사항 (ADR 요약)

1. **notes 도메인은 만들지 않는다.** 메모는 Task/Work 의 본문(markdown)으로 충분하다. Person/Company 에 메모가 필요하면 `memo` 텍스트 컬럼 하나로 해결. 나중에 "어디에도 안 붙는 독립 메모"가 필요해지면 그때 승격.
2. **Work 는 별도 애그리거트가 아니라 Task 의 하위 엔티티.** Work 는 항상 Task 를 통해서만 생성/수정/삭제된다.
3. **DB 는 Supabase (Postgres).** 파일 저장은 Supabase Storage.
4. **삭제는 soft delete** (`deleted_at`). 업무 이력이 자산이므로 실수로 날리지 않게.
5. **첨부파일은 DB 에 메타데이터만**, 실제 파일은 Supabase Storage 버킷 `attachments` (경로 `{owner_type}/{owner_id}/{uuid}_{filename}`). 버킷은 private, 다운로드는 signed URL.
6. 사용자는 한 명(나). **로그인 없음.** 앱은 내 PC 에서 로컬 실행하고, DB/Storage 접근은 Next.js 서버 쪽에서 `service_role` 키로만 한다 (브라우저에는 Supabase 키를 주지 않는다). RLS 는 켜두되 정책은 만들지 않는다 — service_role 은 RLS 를 우회하고, anon 은 아무것도 못 한다. **이 구성 그대로 공개 배포 금지.**

## 공통 규칙

- ID: `bigint generated always as identity`. (개인용이라 UUID 불필요. 외부 노출 URL 이 걱정되면 나중에 바꿈)
- 모든 테이블: `created_at`, `updated_at` (`timestamptz`, 기본 `now()`), `deleted_at` (`timestamptz`, nullable).
- `updated_at` 은 공통 트리거로 자동 갱신 (아래).
- 시각은 `timestamptz` 로 저장, 화면에서 `Asia/Seoul` 로 표시. 날짜 필드(입사일 등)는 `date`.
- 상태값(enum)은 `text` + `CHECK` 제약. (Postgres enum 타입은 값 추가/삭제가 번거로워 사용하지 않음)
- 모든 테이블 RLS 활성화, 정책 없음 (서버의 service_role 만 접근).
- 스키마 변경은 `supabase/migrations/` 로 관리 (supabase CLI).

## 공통 SQL (트리거 · RLS)

```sql
-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- 각 테이블마다:
-- CREATE TRIGGER trg_<table>_updated_at BEFORE UPDATE ON <table>
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: 켜기만 하고 정책은 없음. anon/authenticated 는 접근 불가, service_role 만 사용.
-- ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
```

## 첨부파일 (공통 스키마)

```sql
CREATE TABLE attachments (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_type    text NOT NULL CHECK (owner_type IN ('task', 'work')),
  owner_id      bigint NOT NULL,
  file_name     text NOT NULL,          -- 원본 파일명
  storage_path  text NOT NULL,          -- Storage 버킷 내 object path
  mime_type     text,
  size_bytes    bigint,
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX idx_attachments_owner ON attachments(owner_type, owner_id);
```

Storage 버킷 `attachments` 는 private, 정책 없음. 업로드/다운로드(signed URL) 모두 서버에서 service_role 로 처리.

