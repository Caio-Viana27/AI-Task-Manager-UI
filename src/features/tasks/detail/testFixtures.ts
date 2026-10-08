import type { TaskDetail } from '../../../api/tasks.ts'

/** A `GET /tasks/{id}` body for tests: a top-level task with no subtasks unless overridden. */
export function taskDetail(id: string, overrides: Partial<TaskDetail> = {}): TaskDetail {
  return {
    id,
    title: `Task ${id}`,
    description: 'Description',
    dueDate: null,
    priority: 'MEDIUM',
    status: 'TODO',
    complexity: null,
    estimatedHours: null,
    parentTaskId: null,
    ancestors: [],
    canAddSubtasks: true,
    subtasks: [],
    createdAt: '2026-10-07T12:00:00Z',
    updatedAt: '2026-10-07T12:00:00Z',
    ...overrides,
  }
}
