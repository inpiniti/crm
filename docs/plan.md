# 개발 플랜

도메인 문서: [domain/README.md](./domain/README.md)

## 1. 확정 사항

| 항목 | 결정 |
|---|---|
| 사용 환경 | **PC, 로컬 실행** (`npm run dev` 또는 `next start`). 공개 배포 안 함 |
| 로그인 | **없음.** DB 접근은 서버에서 `service_role` 키로만. 브라우저에 Supabase 키 없음 |
| DB / 파일 | Supabase Postgres + Storage (서울 리전) |
| 디자인 | 토스 스킬 토큰, 포인트 컬러 파랑 `#3182f6`, **데스크톱 레이아웃** |
| 마크다운 | Task / Work 본문. textarea + 미리보기 |
| 백업 / 데이터 이전 | 없음 |
| 이슈 관리 | GitHub Issues 안 씀. 필요하면 `docs/issues/` 에 md 파일로 |
| 소스 관리 | 추후 GitHub 업로드. `.env.local` 은 커밋 금지 |

## 2. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Next.js (App Router) + TypeScript** | 서버 컴포넌트/서버 액션 덕분에 Supabase 키를 서버에만 두고 로그인 없이 안전하게 씀. API 레이어 불필요 |
| 스타일 | **Tailwind CSS v4** + CSS 변수 토큰 | 토스 토큰을 `@theme` 로 한 번 정의 |
| 데이터 | `@supabase/supabase-js` (서버 전용, service_role) | `@supabase/ssr` 불필요 (세션 없음) |
| 타입 | `supabase gen types typescript` | DB 스키마 → TS 타입 |
| 검증 | `zod` | 서버 액션 입구에서 도메인 규칙 검증 |
| 마크다운 | `react-markdown` + `remark-gfm` | |
| 테스트 | `vitest` | 도메인 규칙 유닛 테스트만 |

React SPA(Vite)는 브라우저가 Supabase 를 직접 호출해야 해서 로그인 없이는 DB 가 공개된다. 서버가 있는 Next.js 로 간다.

## 3. 디자인 방향 (PC) — 2026-08-27 개정: 토스증권 톤

- **다크 기본** (`#17171c` 배경, `#1e1e24` 패널), 라이트 토글 유지. 그림자 없음, 얇은 구분선, 촘촘한 리스트, 굵은 tabular 숫자.
- **이모지 사용 안 함.** 아이콘은 lucide.
- **shadcn/ui (base-ui)** 프리미티브: `components/ui/` — button, input, textarea, native-select, dialog, alert-dialog, dropdown-menu, popover, command, tooltip, kbd, skeleton, sonner.
- 앱 조합 컴포넌트는 `components/common/` — ActionForm(+SubmitButton, ConfirmAction), Combobox(Popover+Command), Field, Markdown, MarkdownEditor, Panel(+PageHeader, Section, EmptyState, Stat), StatusBadge.
- 상단 헤더 내비(사이드바 없음), 본문 max 1120px. 폰트 Pretendard Variable(로컬).
- 아래는 초기(토스 앱 톤) 설계 기록으로 남겨둔다.

### (초기안) 토스 앱 톤

- 토스 토큰: 배경 `#f7f9fc`, 서피스 `#fff`, 텍스트 `#191f28 / #4e5968 / #8b95a1`, 구분선 `#e5e8eb`, 포인트 `#3182f6`, 경고 `#f04452`, 성공 `#03b26c`, 주의 `#ff9500`(hold 상태).
- 카드 radius 16px, 그림자 `0 2px 8px rgba(0,0,0,.06)`, 계층은 색보다 웨이트·여백으로.
- **레이아웃**: 좌측 사이드바(대시보드 / 업무 / 작업 타임라인 / 프로젝트 / 사람 / 회사) + 본문. 본문은 `max-width 1200px`.
- **토스 모바일 패턴의 PC 치환**
  - 바텀시트 → 모달 또는 우측 슬라이드 패널 (상세는 패널, 생성은 모달)
  - 하단 고정 CTA → 화면당 fill 버튼 1개 (우상단 또는 폼 하단)
  - 선택 박스 → 콤보박스(검색 가능 드롭다운). 요청자/프로젝트 선택에 사용
  - 스켈레톤 / 빈 상태 / 토스트 / 해요체 문구는 그대로
- 키보드: `n` 새 업무, `/` 검색, 모달 `Esc` 닫기, 폼 `Ctrl+Enter` 저장.
- 다크 모드: 토큰만 변수화, 1차 제외.

## 4. 프로젝트 구조 (DDD 레이어)

```
src/
├── domain/                      # 순수 TS. 프레임워크·Supabase 의존 없음
│   ├── companies/  company.ts
│   ├── projects/   project.ts
│   ├── tasks/      task.ts, work.ts, task-status.ts(전이 표), attachment.ts
│   ├── people/     person.ts
│   └── shared/     result.ts, errors.ts
├── application/                 # 유스케이스. domain + ports 만 사용
│   ├── tasks/      create-task.ts, change-task-status.ts, move-task.ts, add-work.ts, ...
│   ├── projects/   archive-project.ts, ...
│   └── ports/      task-repository.ts, person-repository.ts, file-storage.ts, ...
├── infrastructure/supabase/
│   ├── client.ts                # service_role 클라이언트. 'server-only' import 로 브라우저 번들 차단
│   ├── repositories/*.ts
│   ├── storage.ts
│   └── database.types.ts        # 생성 파일
├── app/
│   ├── layout.tsx               # 사이드바
│   ├── page.tsx                 # 대시보드
│   ├── tasks/      page.tsx, [id]/page.tsx
│   ├── work/       page.tsx     # 일자별 타임라인
│   ├── projects/, people/, companies/
│   └── actions/    tasks.ts, work.ts, ... (zod → 유스케이스 → revalidatePath)
├── components/
│   ├── ui/          Button, Card, Input, Textarea, Modal, Panel, Combobox, Toast, Skeleton, EmptyState, Badge
│   └── features/    TaskTable, TaskDetail, WorkTimeline, RequesterCombobox, ProjectCombobox, MarkdownEditor, AttachmentList
└── lib/             date(KST), markdown, format
supabase/
└── migrations/      0001_common.sql ... 0006_attachments.sql (domain/*/db.md 그대로)
docs/
├── domain/
├── plan.md
└── issues/          # 필요 시. `NNN-제목.md`, 상단에 status: open|done
```

규칙:
- `domain/` 은 아무것도 import 하지 않는다. 상태 전이 허용 표, "종료 Task 에 Work 불가", "참조 있으면 삭제 불가" 같은 규칙은 여기.
- `application/` 은 `domain/` 과 `ports/` 만 본다.
- `infrastructure/supabase/client.ts` 는 `import 'server-only'` 로 시작한다. 클라이언트 컴포넌트에서 실수로 import 하면 빌드가 깨지게.
- `app/actions/*` 는 zod 파싱 → 유스케이스 호출 → `revalidatePath` 만.
- 조회는 서버 컴포넌트에서 리포지토리/뷰를 직접 읽는다 (CQRS 라이트).

## 5. 단계별 작업

### Phase 0 — 셋업
- `git init`, `.gitignore` (`.env.local` 포함)
- Next.js + Tailwind v4 + TypeScript 생성, `supabase` CLI 설치
- Supabase 프로젝트 생성(서울), `.env.local` 에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (NEXT_PUBLIC_ 접두사 절대 금지)
- 마이그레이션 0001~0006 작성·적용, `database.types.ts` 생성, Storage 버킷 `attachments` 생성
- `globals.css` 에 토스 토큰, `ui/` 기본 컴포넌트, 사이드바 레이아웃

### Phase 1 — 핵심 루프 (P0): 업무 적고, 한 일 쌓기
1. Company / Project / Person 최소 CRUD (테이블 + 생성 모달)
2. **Task 빠른 생성** — `n` 키 또는 `+` 버튼 → 제목만 입력 → 생성. 프로젝트 기본값 = 마지막 사용, 요청자 = 본인
3. **Task 상세** — 헤더(상태/프로젝트/요청자/마감 인라인 수정), 본문 markdown, Work 타임라인 + 인라인 추가
4. **Task 목록** — 상태/프로젝트/요청자 필터, 최근 작업일 컬럼
5. 첨부파일 업로드/다운로드 (Task, Work)

여기까지 되면 실제로 쓰기 시작하고, 쓰면서 나머지를 조정한다.

### Phase 2 — 되돌아보기 (P1)
- 대시보드: 지연 / 오늘 마감 / 진행 중
- 인물 상세: 요청 업무 목록 + 요약(`people_summary`)
- 프로젝트 상세: 업무 목록 + 상태별 카운트, archive
- 일자별 Work 타임라인, 소요시간 입력 + 프로젝트별 합산
- Task 프로젝트 이동

### Phase 3 — 편의 (P2)
- 태그, 요청 경로, 작업 유형
- 검색 (`ilike` → 필요하면 `tsvector`)
- 다크 모드

## 6. 진행 상태 (2026-08-27)

Phase 0~3 의 코드 작업 완료. 실제 DB 연결 후 사용하며 다듬는 단계.

| 항목 | 상태 |
|---|---|
| 스캐폴딩, 토큰, 레이아웃, 단축키 | ✅ |
| 마이그레이션 0001~0006, `schema.sql` | ✅ (SQL Editor 에서 실행 필요) |
| Company / Project / Person CRUD | ✅ |
| Task 빠른 생성 · 상세 · 목록 필터 · 상태 전이 · 프로젝트 이동 | ✅ |
| Work 타임라인 · 소요시간 · 유형 | ✅ |
| 첨부파일 (Task, Work) | ✅ (Storage 버킷은 schema.sql 이 만듦) |
| 대시보드, 인물/프로젝트 상세, 일자별 타임라인 | ✅ |
| 태그, 요청 경로, 검색(ilike), 다크 모드 | ✅ |
| 도메인 유닛 테스트 (vitest) | ✅ 20개 |
| 실 DB 로 E2E 확인 | ⏳ `.env.local` 채운 뒤 |

## 7. 남은 판단 (개발하면서 정해도 됨)
- 첨부파일 용량 제한: 우선 20MB/파일. Storage 무료 1GB
- 로컬 실행 방식: `npm run dev` 로 충분한지, 부팅 시 자동 실행(작업 스케줄러)까지 갈지
- 나중에 모바일에서도 보고 싶어지면 그때 로그인 + 배포를 붙인다 (구조상 `app/` 위에 얹기만 하면 됨)
