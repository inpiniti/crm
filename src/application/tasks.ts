import { assertProjectAcceptsTasks } from "@/domain/projects/project";
import { NotFoundError } from "@/domain/shared/errors";
import type { Id } from "@/domain/shared/types";
import { assertTaskAcceptsWork, validateTaskInput, type TaskInput } from "@/domain/tasks/task";
import { assertTransition, type TaskStatus } from "@/domain/tasks/task-status";
import { validateWorkInput, type WorkInput } from "@/domain/tasks/work";
import type { Deps } from "./ports";

async function loadTask(deps: Deps, id: Id) {
  const task = await deps.tasks.findById(id);
  if (!task) throw new NotFoundError("업무");
  return task;
}

async function loadOpenProject(deps: Deps, projectId: Id) {
  const project = await deps.projects.findById(projectId);
  if (!project) throw new NotFoundError("프로젝트");
  assertProjectAcceptsTasks(project);
  return project;
}

async function assertRequesterExists(deps: Deps, requesterId: Id | null) {
  if (requesterId !== null && !(await deps.people.findById(requesterId))) throw new NotFoundError("요청자");
}

export async function createTask(deps: Deps, input: TaskInput) {
  const valid = validateTaskInput(input);
  await loadOpenProject(deps, valid.projectId);
  await assertRequesterExists(deps, valid.requesterId);
  return deps.tasks.insert(valid);
}

export async function updateTask(deps: Deps, id: Id, input: TaskInput) {
  const task = await loadTask(deps, id);
  const valid = validateTaskInput(input);
  if (valid.projectId !== task.projectId) await loadOpenProject(deps, valid.projectId);
  await assertRequesterExists(deps, valid.requesterId);
  return deps.tasks.update(id, valid);
}

export async function changeTaskStatus(deps: Deps, id: Id, to: TaskStatus) {
  const task = await loadTask(deps, id);
  assertTransition(task.status, to);
  await deps.tasks.setStatus(id, to);
}

export async function moveTask(deps: Deps, id: Id, projectId: Id) {
  const task = await loadTask(deps, id);
  if (task.projectId === projectId) return;
  await loadOpenProject(deps, projectId);
  await deps.tasks.move(id, projectId);
}

export async function deleteTask(deps: Deps, id: Id) {
  await loadTask(deps, id);
  await deps.tasks.softDeleteCascade(id);
}

// ---- work (Task 애그리거트 내부) ----

export async function addWork(deps: Deps, taskId: Id, input: WorkInput) {
  const task = await loadTask(deps, taskId);
  assertTaskAcceptsWork(task);
  return deps.work.insert(taskId, validateWorkInput(input));
}

export async function updateWork(deps: Deps, workId: Id, input: WorkInput) {
  const work = await deps.work.findById(workId);
  if (!work) throw new NotFoundError("작업");
  return deps.work.update(workId, validateWorkInput(input));
}

export async function deleteWork(deps: Deps, workId: Id) {
  const work = await deps.work.findById(workId);
  if (!work) throw new NotFoundError("작업");
  await deps.work.softDelete(workId);
}
