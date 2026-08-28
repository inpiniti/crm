# 업무 기록 (개인용 CRM 스타일 메모장)

누가 무엇을 시켰고, 내가 무엇을 했는지 쌓아두는 개인용 도구.
`회사 > 프로젝트 > 업무 > 작업` 계층에 `업무 → 요청자(사람)` 관계.

- 도메인 문서: [docs/domain/README.md](docs/domain/README.md)
- 개발 플랜: [docs/plan.md](docs/plan.md)

## 처음 실행

1. Supabase 프로젝트의 **SQL Editor** 에서 `supabase/schema.sql` 전체를 붙여넣고 실행한다.
   (테이블, 트리거, 뷰, Storage 버킷 `attachments` 가 만들어진다)
2. `.env.local` 에 값을 채운다 (Settings → API).
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
   `NEXT_PUBLIC_` 접두사를 붙이지 않는다. 이 키는 서버에서만 쓰인다.
3. 실행
   ```
   npm run dev      # http://localhost:3000
   ```

> 로그인이 없다. 내 PC 에서만 띄우는 전제이며, 이 상태로 외부에 공개 배포하면 안 된다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm start` | 프로덕션 빌드 / 실행 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | 도메인 규칙 유닛 테스트 (vitest) |
| `npm run db:schema` | `supabase/migrations/*.sql` → `supabase/schema.sql` 합치기 |

## 단축키

- `n` 새 업무 (어느 화면에서든)
- `/` 업무 검색
- 폼에서 `Ctrl+Enter` 저장, `Esc` 닫기

## 구조

```
src/
├── domain/          순수 TS. 타입 + 규칙 (상태 전이, 삭제 가능 여부 …). 아무것도 import 하지 않음
├── application/     유스케이스. domain + ports 만 사용
├── infrastructure/  Supabase 리포지토리 · Storage · 조회(read model). 'server-only'
├── app/             Next.js 라우트. actions/* 는 zod 파싱 → 유스케이스 → revalidatePath
├── components/ui    shadcn/ui 프리미티브 (base-ui). 직접 수정하지 않고 npx shadcn add 로 관리
├── components/common  앱 조합 컴포넌트 (ActionForm, Combobox, Panel, Markdown …)
├── components/features  업무 테이블, 상세, 작업 타임라인, 첨부, 엔티티 폼
└── lib/             날짜(KST), 유틸
supabase/migrations/ 스키마 (docs/domain/*/db.md 와 동일)
```

스키마를 바꿀 때는 `supabase/migrations/` 에 새 파일을 추가하고 `npm run db:schema` 로 `schema.sql` 을 다시 만든 뒤, 새 파일만 SQL Editor 에서 실행한다.
