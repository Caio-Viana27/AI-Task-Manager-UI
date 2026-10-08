import type { ParseKeys } from 'i18next'
import { ApiError } from '../../../api/client.ts'
import type {
  CreateTaskRequest,
  PatchTaskRequest,
  Task,
  TaskComplexity,
  TaskPriority,
  TaskStatus,
} from '../../../api/tasks.ts'
import { isIsoDate } from '../list/dashboardParams.ts'

/** Limits from PLAN §2 (Validation and defaults), mirroring the API. */
export const TITLE_MAX_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 500
/** Estimated hours are a whole number in this range (wave 4, D10). */
export const ESTIMATED_HOURS_MIN = 1
export const ESTIMATED_HOURS_MAX = 999

/**
 * What the task form edits. Every value is a string the form controls can hold:
 * `dueDate` is `YYYY-MM-DD` or `''` (none), `complexity` is a name or `''` (not estimated),
 * `estimatedHours` is what the number input holds, or `''` (not estimated).
 * `status` is only edited in edit mode; it can hold `OVERDUE` as the task's current status (D6).
 */
export interface TaskFormValues {
  title: string
  description: string
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
  complexity: TaskComplexity | ''
  estimatedHours: string
}

export type TaskFormField = keyof TaskFormValues

/** A message key from the `tasks` namespace, or `errors:<CODE>`. */
export type TaskFormMessageKey = ParseKeys<['tasks', 'errors']>
export type TaskFormErrors = Partial<Record<TaskFormField, TaskFormMessageKey>>

const TASK_FORM_FIELDS: readonly TaskFormField[] = ['title', 'description', 'dueDate', 'priority', 'status', 'complexity', 'estimatedHours']

/** The create form's starting values: the PLAN §2 defaults. */
export const EMPTY_TASK_FORM_VALUES: TaskFormValues = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'MEDIUM',
  status: 'TODO',
  complexity: '',
  estimatedHours: '',
}

export function taskToFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ?? '',
    priority: task.priority,
    status: task.status,
    complexity: task.complexity ?? '',
    estimatedHours: task.estimatedHours === null ? '' : String(task.estimatedHours),
  }
}

/** Client-side checks mirroring PLAN §2. Title and description are checked trimmed, like the API's not-blank rule. */
export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {}
  const title = values.title.trim()
  const description = values.description.trim()

  if (title === '') {
    errors.title = 'form.validation.titleRequired'
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = 'form.validation.titleTooLong'
  }

  if (description === '') {
    errors.description = 'form.validation.descriptionRequired'
  } else if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = 'form.validation.descriptionTooLong'
  }

  if (values.dueDate !== '' && !isIsoDate(values.dueDate)) {
    errors.dueDate = 'form.validation.dueDateInvalid'
  }

  if (values.estimatedHours.trim() !== '' && parseEstimatedHours(values.estimatedHours) === null) {
    errors.estimatedHours = 'form.validation.estimatedHoursInvalid'
  }

  return errors
}

/** The hours as a number, or `null` when the text is empty or not a whole number from 1 to 999. */
export function parseEstimatedHours(text: string): number | null {
  const trimmed = text.trim()
  if (!/^\d+$/.test(trimmed)) {
    return null
  }
  const hours = Number(trimmed)
  return hours >= ESTIMATED_HOURS_MIN && hours <= ESTIMATED_HOURS_MAX ? hours : null
}

/**
 * The body of `POST /tasks` (or one `POST /tasks/{id}/subtasks` item). Title and description
 * are trimmed; an empty due date, complexity or estimate is left out, so the API default (`null`)
 * applies. The subtask forms never fill in hours, so subtask items never carry them (D10).
 */
export function toCreateRequest(values: TaskFormValues): CreateTaskRequest {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    priority: values.priority,
    ...(values.dueDate !== '' && { dueDate: values.dueDate }),
    ...(values.complexity !== '' && { complexity: values.complexity }),
    ...(values.estimatedHours.trim() !== '' && { estimatedHours: parseEstimatedHours(values.estimatedHours) }),
  }
}

/**
 * The `PATCH` body for an edit (D2, D6): only the fields that differ from `task`. A cleared
 * due date, complexity or estimate is sent as `null`. `status` is sent only when the user picked a
 * different one, so an `OVERDUE` task saves without it. An empty object means nothing changed.
 */
export function diffTaskForm(task: Task, values: TaskFormValues): PatchTaskRequest {
  const patch: PatchTaskRequest = {}
  const title = values.title.trim()
  const description = values.description.trim()
  const dueDate = values.dueDate === '' ? null : values.dueDate
  const complexity = values.complexity === '' ? null : values.complexity
  const estimatedHours = parseEstimatedHours(values.estimatedHours)

  if (title !== task.title) {
    patch.title = title
  }
  if (description !== task.description) {
    patch.description = description
  }
  if (dueDate !== task.dueDate) {
    patch.dueDate = dueDate
  }
  if (values.priority !== task.priority) {
    patch.priority = values.priority
  }
  if (values.status !== task.status && values.status !== 'OVERDUE') {
    patch.status = values.status
  }
  if (complexity !== task.complexity) {
    patch.complexity = complexity
  }
  if (estimatedHours !== task.estimatedHours) {
    patch.estimatedHours = estimatedHours
  }
  return patch
}

/** `title`, `subtasks[0].title` and `[0].title` all name the `title` field. */
function fieldOf(path: string): TaskFormField | undefined {
  const name = /(\w+)$/.exec(path)?.[1]
  return TASK_FORM_FIELDS.find((field) => field === name)
}

const CODE_FIELDS: Partial<Record<string, TaskFormField>> = {
  INVALID_PRIORITY: 'priority',
  INVALID_STATUS: 'status',
  INVALID_COMPLEXITY: 'complexity',
}

/**
 * Maps a failed save onto the form's fields. Server field errors get a localized message,
 * never the server's English text. Whatever can't be tied to a field stays a form-level error.
 */
export function fieldErrorsFromApi(error: unknown): { fields: TaskFormErrors; formError: unknown } {
  if (!(error instanceof ApiError)) {
    return { fields: {}, formError: error }
  }
  const codeField = error.code !== null ? CODE_FIELDS[error.code] : undefined
  if (codeField) {
    return { fields: { [codeField]: `errors:${error.code}` as TaskFormMessageKey }, formError: null }
  }
  if (error.code === 'VALIDATION_ERROR') {
    const fields: TaskFormErrors = {}
    for (const { field } of error.errors) {
      const name = fieldOf(field)
      if (name) {
        fields[name] = `form.validation.${name}Invalid`
      }
    }
    if (Object.keys(fields).length > 0) {
      return { fields, formError: null }
    }
  }
  return { fields: {}, formError: error }
}
