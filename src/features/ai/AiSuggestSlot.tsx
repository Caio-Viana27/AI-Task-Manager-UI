import type { TaskFormValues } from '../tasks/form/taskForm.ts'

/** The form fields the "Suggest with AI" flow reads and may fill (PLAN §5). */
export type AiSuggestFields = Pick<TaskFormValues, 'title' | 'description' | 'priority' | 'complexity'>

export interface AiSuggestSlotProps {
  /** The saved task's id in the edit form; `undefined` for a draft (the create and add-subtask forms). */
  taskId?: string
  /** The form's current values, as the user typed them (not trimmed). */
  values: AiSuggestFields
  /**
   * Writes accepted suggestions into the form. Only the given fields change; the user still
   * saves the form, which sends `POST` for a draft or `PATCH` with the changed fields for a saved task.
   */
  onApply: (changes: Partial<AiSuggestFields>) => void
  /** True while the form is saving; the slot should not apply suggestions then. */
  disabled: boolean
}

/**
 * Placeholder for Wave 3 (T3.4, "Suggest with AI"). Rendered by `TaskForm` next to its fields.
 * Renders nothing until then.
 */
export function AiSuggestSlot(props: AiSuggestSlotProps) {
  void props
  return null
}
