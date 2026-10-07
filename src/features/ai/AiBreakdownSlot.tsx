import type { TaskDetail } from '../../api/tasks.ts'

export interface AiBreakdownSlotProps {
  /** The saved task to break down, with its ancestors (root first) and current direct subtasks. */
  task: TaskDetail
  /**
   * `false` when the task is at the maximum depth (PLAN §2): the slot must then render nothing,
   * like the add-subtask form. Accepted drafts go through `useCreateSubtasks()`
   * (`POST /tasks/{id}/subtasks`), which refreshes this page's subtask list.
   */
  canAddSubtasks: boolean
}

/**
 * Placeholder for Wave 3 (T3.5, "Break down with AI"). Rendered at the top of the subtask
 * section of the task detail page. Renders nothing until then.
 */
export function AiBreakdownSlot(props: AiBreakdownSlotProps) {
  void props
  return null
}
