# Tasks — 개요

**중심 도메인.** "누가(요청자) 무엇을(업무) 언제까지" 를 기록하고, 그 안에서 실제로 한 일(Work)을 쌓는다.

## 용어

- **Task (업무)**: 요청받았거나 스스로 정한 해야 할 일 한 건.
- **요청자 (requester)**: 이 업무를 요청/지시한 Person. null 이면 "내가 직접".
- **Work (작업)**: Task 를 처리하면서 실제로 한 행동의 기록. → [work/](../work/overview.md)
- **첨부파일**: 요청 시 받은 파일, 요구사항 문서 등.

## 애그리거트

- 루트: `Task`
- 하위 엔티티: `Work[]`, `Attachment[]`
- 참조: `Project` (필수), `Person` (requester, nullable)

Work 와 Attachment 의 생성/수정/삭제는 반드시 Task 를 통해서 이루어진다.

## 상태 흐름

```
todo ──▶ doing ──▶ done
  │         │
  └────▶ hold ◀──┘      (보류; 다시 todo/doing 으로 복귀 가능)
  │
  └────▶ canceled
```

- `done`, `canceled` 는 종료 상태. 종료 상태에서 Work 추가 불가 (되살리려면 상태를 먼저 되돌린다).
- 상태 전이 시 `status_changed_at` 갱신.

## 불변 규칙

- 제목, 프로젝트 필수.
- 요청자는 어느 회사 소속이든 무관 (프로젝트의 회사와 일치할 필요 없음 — 타 부서/외부 요청 가능).
- `due_at` 은 선택. 지났고 종료 상태가 아니면 "지연"으로 표시.
- `requested_at` 은 "요청받은 날"로 `created_at` 과 다르다. 기본값은 오늘이지만 과거로 소급 입력할 수 있다.
- Task 는 다른 Project 로 **옮길 수 있다** (잘못 넣은 경우 대비). 단 archived 프로젝트로는 못 옮긴다. Work·Attachment 는 함께 따라간다.
- Task 삭제(soft) 시 하위 Work·Attachment 도 함께 soft delete. Storage 의 실제 파일은 남긴다 (영구 삭제 배치 없음).
