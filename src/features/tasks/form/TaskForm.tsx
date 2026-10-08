import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TASK_COMPLEXITIES,
  TASK_PRIORITIES,
  USER_SETTABLE_STATUSES,
  type TaskComplexity,
  type TaskPriority,
  type TaskStatus,
} from '../../../api/tasks.ts'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { AiSuggestSlot, type AiSuggestFields } from '../../ai/AiSuggestSlot.tsx'
import { isIsoDate } from '../list/dashboardParams.ts'
import { SelectField, TextAreaField } from './fields.tsx'
import {
  fieldErrorsFromApi,
  validateTaskForm,
  type TaskFormErrors,
  type TaskFormValues,
} from './taskForm.ts'

export interface TaskFormProps {
  /** `create` hides the status control (new tasks start as `TODO`); `edit` shows it (D6). */
  mode: 'create' | 'edit'
  /** Already translated accessible name of the form, e.g. "New subtask". */
  label: string
  /** Read once, when the form mounts. Remount it (with a `key`) to reset it. */
  initialValues: TaskFormValues
  /** The saved task's id in edit mode, passed on to the AI suggest slot. */
  taskId?: string
  /** Already translated. */
  submitLabel: string
  /** Already translated, shown on the submit button while `pending`. */
  pendingLabel: string
  pending: boolean
  /** The last failed save. Field errors are shown on their fields, anything else above the buttons. */
  error: unknown
  /** Called with the raw values once they pass client-side validation. */
  onSubmit: (values: TaskFormValues) => void
  onCancel?: () => void
}

/** The task form for create, edit and add-subtask (PLAN §2 validation, D6 status control). */
export function TaskForm({
  mode,
  label,
  initialValues,
  taskId,
  submitLabel,
  pendingLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const { t } = useTranslation(['tasks', 'errors'])
  const [values, setValues] = useState(initialValues)
  const [clientErrors, setClientErrors] = useState<TaskFormErrors>({})
  // The server error seen at the last submit. It is hidden until a newer one arrives.
  const [staleError, setStaleError] = useState<unknown>(null)

  const serverError = error !== staleError ? error : null
  const { fields: serverFields, formError } = fieldErrorsFromApi(serverError)
  const fieldErrors: TaskFormErrors = { ...serverFields, ...clientErrors }
  const errorText = (field: keyof TaskFormValues) => {
    const key = fieldErrors[field]
    return key && t(key)
  }

  function update(changes: Partial<TaskFormValues>) {
    setValues((current) => ({ ...current, ...changes }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateTaskForm(values)
    setClientErrors(errors)
    setStaleError(error)
    if (Object.keys(errors).length === 0) {
      onSubmit(values)
    }
  }

  const suggestValues: AiSuggestFields = {
    title: values.title,
    description: values.description,
    priority: values.priority,
    complexity: values.complexity,
  }
  // The current status is shown even when it's OVERDUE, which the user can't pick (D6).
  const statusOptions: TaskStatus[] =
    initialValues.status === 'OVERDUE' ? ['OVERDUE', ...USER_SETTABLE_STATUSES] : [...USER_SETTABLE_STATUSES]

  return (
    <form noValidate aria-label={label} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <AiSuggestSlot taskId={taskId} values={suggestValues} onApply={update} disabled={pending} />
      <FormField
        label={t('fields.title')}
        type="text"
        name="title"
        value={values.title}
        hint={t('form.titleHint')}
        onChange={(event) => update({ title: event.target.value })}
        error={errorText('title')}
      />
      <TextAreaField
        label={t('fields.description')}
        name="description"
        rows={4}
        value={values.description}
        hint={t('form.descriptionHint')}
        onChange={(event) => update({ description: event.target.value })}
        error={errorText('description')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('fields.dueDate')}
          type="date"
          name="dueDate"
          value={values.dueDate}
          hint={t('form.dueDateHint')}
          // The native input gives `YYYY-MM-DD` or '' (cleared or incomplete); it's never parsed into a Date (D6).
          onChange={(event) => update({ dueDate: isIsoDate(event.target.value) ? event.target.value : '' })}
          error={errorText('dueDate')}
        />
        <SelectField
          label={t('fields.priority')}
          name="priority"
          value={values.priority}
          onChange={(event) => update({ priority: event.target.value as TaskPriority })}
          error={errorText('priority')}
        >
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {t(`priority.${priority}`)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('fields.complexity')}
          name="complexity"
          value={values.complexity}
          onChange={(event) => update({ complexity: event.target.value as TaskComplexity | '' })}
          error={errorText('complexity')}
        >
          <option value="">{t('complexity.none')}</option>
          {TASK_COMPLEXITIES.map((complexity) => (
            <option key={complexity} value={complexity}>
              {t(`complexity.${complexity}`)}
            </option>
          ))}
        </SelectField>
        {mode === 'edit' && (
          <SelectField
            label={t('fields.status')}
            name="status"
            value={values.status}
            hint={values.status === 'OVERDUE' ? t('form.overdueHint') : undefined}
            onChange={(event) => update({ status: event.target.value as TaskStatus })}
            error={errorText('status')}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status} disabled={status === 'OVERDUE'}>
                {t(`status.${status}`)}
              </option>
            ))}
          </SelectField>
        )}
      </div>
      <ErrorMessage error={formError} />
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="btn btn-secondary"
          >
            {t('form.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
