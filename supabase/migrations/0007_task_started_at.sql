-- 업무 시작일 (마감일과 별개로, 실제 일을 시작한/시작할 날짜)
ALTER TABLE tasks ADD COLUMN started_at date;
