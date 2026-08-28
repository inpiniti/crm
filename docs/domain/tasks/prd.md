# Tasks — PRD

## 사용자 스토리

- 요청받은 업무를 프로젝트에 넣고, 누가 요청했는지, 언제까지인지 기록한다.
- 업무 상세에서 한 일(Work)을 시간순으로 본다.
- 요청자별 / 프로젝트별 / 상태별로 업무 목록을 본다.
- 첨부파일(요구사항, 캡처 등)을 붙인다.
- 홈 화면에서 "오늘 할 것 / 지연된 것 / 진행 중"을 한눈에 본다.

## 기능

| 기능 | 설명 | 우선순위 |
|---|---|---|
| 등록/수정/삭제 | 제목, 본문, 프로젝트, 요청자, 마감, 우선순위 | P0 |
| 상태 변경 | todo/doing/hold/done/canceled | P0 |
| 상세: Work 타임라인 | Work 목록 (최신순) + 인라인 추가 | P0 |
| 첨부파일 | 업로드/다운로드/삭제 | P0 |
| 목록 필터 | 프로젝트, 요청자, 상태, 마감 범위, 키워드 | P0 |
| 대시보드 | 오늘 마감 / 지연 / 진행 중 | P1 |
| 우선순위 | low/normal/high | P1 |
| 태그 | 자유 텍스트 태그 (`text[]`) | P2 |
| 요청 경로 | 구두/메신저/메일/회의 등 어디서 받았는지 | P2 |

## 필드

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| project_id | FK | ✓ | |
| requester_id | FK | | null = 본인 |
| title | string | ✓ | |
| body | text | | markdown. 요청 내용, 배경, 메모 |
| status | enum | ✓ | `todo`/`doing`/`hold`/`done`/`canceled` |
| priority | enum | ✓ | `low`/`normal`/`high` (기본 normal) |
| requested_at | date | | 요청받은 날 (기본 = 생성일) |
| due_at | datetime | | 마감 |
| completed_at | datetime | | done 전이 시 자동 기록 |
| source | string | | 요청 경로 (P2) |
| tags | string[] | | Postgres `text[]` (P2) |

## 화면 (초안)

- `/tasks` 목록: 필터바 + 테이블(상태, 제목, 프로젝트, 요청자, 마감, 최근 작업일)
- `/tasks/:id` 상세: 헤더(제목/상태/요청자/프로젝트/마감) · 본문 · 첨부 · Work 타임라인
- `/` 대시보드: 지연 / 오늘 / 진행 중 3개 섹션

## 제외 범위

- 반복 업무, 알림, 서브태스크 없음. 서브태스크는 Work 나 별도 Task 로.
- 담당자(assignee) 없음 — 항상 나.
