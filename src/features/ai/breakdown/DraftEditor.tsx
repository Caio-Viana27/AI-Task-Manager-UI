import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SubtaskDraft } from '../../../api/aiBreakdown.ts'
import { useCreateSubtasks } from '../../../api/queries/tasks.ts'
import { TASK_COMPLEXITIES, TASK_PRIORITIES, type TaskComplexity, type TaskPriority } from '../../../api/tasks.ts'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon, TrashIcon } from '../../../components/icons.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { SelectField, TextAreaField } from '../../tasks/form/fields.tsx'
import { validateTaskForm, type TaskFormErrors } from '../../tasks/form/taskForm.ts'

interface DraftEditorProps {
  parentId: string
  /** The AI's drafts. Read once, when the editor mounts. */
  initialDrafts: SubtaskDraft[]
  /** Called after the subtasks are created, or when the user discards the drafts. */
  onClose: () => void
}

/** The task limits (PLAN §2), checked with the task form's own rules. */
function validateDraft(draft: SubtaskDraft): TaskFormErrors {
  return validateTaskForm({ ...draft, dueDate: '', status: 'TODO', estimatedHours: '' })
}

/**
 * An editable list of drafted subtasks (PLAN §6): edit, remove, and reorder them, then create
 * them in list order with one `POST /tasks/{id}/subtasks` (wave 2, D5). A failed create keeps the drafts.
 */
export function DraftEditor({ parentId, initialDrafts, onClose }: DraftEditorProps) {
  const { t } = useTranslation(['aiBreakdown', 'tasks'])
  // The task form's validation messages, keyed like `TaskForm`'s.
  const { t: tForm } = useTranslation(['tasks', 'errors'])
  const createSubtasks = useCreateSubtasks()
  const [drafts, setDrafts] = useState(initialDrafts)

  const errors = drafts.map(validateDraft)
  const valid = drafts.length > 0 && errors.every((draftErrors) => Object.keys(draftErrors).length === 0)

  function update(index: number, changes: Partial<SubtaskDraft>) {
    setDrafts((current) => current.map((draft, i) => (i === index ? { ...draft, ...changes } : draft)))
  }

  function move(index: number, offset: -1 | 1) {
    setDrafts((current) => {
      const next = [...current]
      const [draft] = next.splice(index, 1)
      next.splice(index + offset, 0, draft)
      return next
    })
  }

  function remove(index: number) {
    setDrafts((current) => current.filter((_, i) => i !== index))
  }

  function create() {
    if (!valid || createSubtasks.isPending) {
      return
    }
    createSubtasks.mutate(
      {
        parentId,
        subtasks: drafts.map((draft) => ({ ...draft, title: draft.title.trim(), description: draft.description.trim() })),
      },
      { onSuccess: onClose },
    )
  }

  const errorText = (draftErrors: TaskFormErrors, field: 'title' | 'description') => {
    const key = draftErrors[field]
    return key && tForm(key)
  }
  const pending = createSubtasks.isPending

  return (
    <div role="group" aria-label={t('reviewTitle')} className="flex animate-fade-in flex-col gap-4 rounded-xl border border-sage-200 bg-sage-50 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
        <SparklesIcon className="size-4 text-brand-600" />
        {t('reviewTitle')}
      </h3>
      {drafts.length === 0 ? (
        <p className="text-sm text-stone-600">{t('noDrafts')}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {drafts.map((draft, index) => {
            const number = index + 1
            return (
              // Drafts have no id; the index is their identity, and every field is controlled.
              <li key={index} aria-label={t('draftLabel', { number })} className="relative flex flex-col gap-3 rounded-xl bg-white p-4 pl-12 shadow-card ring-1 ring-sage-100">
                <span
                  aria-hidden="true"
                  className="absolute top-4 left-4 flex size-6 items-center justify-center rounded-full bg-sage-100 text-xs font-semibold text-brand-700"
                >
                  {number}
                </span>
                <FormField
                  label={t('tasks:fields.title')}
                  type="text"
                  value={draft.title}
                  onChange={(event) => update(index, { title: event.target.value })}
                  error={errorText(errors[index], 'title')}
                />
                <TextAreaField
                  label={t('tasks:fields.description')}
                  rows={2}
                  value={draft.description}
                  onChange={(event) => update(index, { description: event.target.value })}
                  error={errorText(errors[index], 'description')}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    label={t('tasks:fields.priority')}
                    value={draft.priority}
                    onChange={(event) => update(index, { priority: event.target.value as TaskPriority })}
                  >
                    {TASK_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {t(`tasks:priority.${priority}`)}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    label={t('tasks:fields.complexity')}
                    value={draft.complexity}
                    onChange={(event) => update(index, { complexity: event.target.value as TaskComplexity })}
                  >
                    {TASK_COMPLEXITIES.map((complexity) => (
                      <option key={complexity} value={complexity}>
                        {t(`tasks:complexity.${complexity}`)}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || pending}
                    aria-label={t('moveUp', { number })}
                    className="btn btn-sm btn-secondary"
                  >
                    <ChevronUpIcon className="size-3.5" />
                    {t('up')}
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === drafts.length - 1 || pending}
                    aria-label={t('moveDown', { number })}
                    className="btn btn-sm btn-secondary"
                  >
                    <ChevronDownIcon className="size-3.5" />
                    {t('down')}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={pending}
                    aria-label={t('remove', { number })}
                    className="btn btn-sm btn-danger-outline"
                  >
                    <TrashIcon className="size-3.5" />
                    {t('removeShort')}
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      <ErrorMessage error={createSubtasks.error} />
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="btn btn-secondary"
        >
          {t('discard')}
        </button>
        <button
          type="button"
          onClick={create}
          disabled={!valid || pending}
          className="btn btn-ai"
        >
          {pending ? t('creating') : t('create', { count: drafts.length })}
        </button>
      </div>
    </div>
  )
}
