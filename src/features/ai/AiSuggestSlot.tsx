import { useTranslation } from 'react-i18next'
import { useSuggestTask } from '../../api/ai.ts'
import { ErrorMessage } from '../../components/ErrorMessage.tsx'
import { SparklesIcon } from '../../components/icons.tsx'
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH, type TaskFormValues } from '../tasks/form/taskForm.ts'
import { SuggestReview } from './suggest/SuggestReview.tsx'

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
 * "Suggest with AI" (PLAN §5 Suggest, wave 3 T3.4). Rendered by `TaskForm` above its fields.
 * Drafts and saved tasks work the same way: accepting fills the form, and the user saves it (D7).
 * A failed request shows its message and leaves the form untouched.
 */
export function AiSuggestSlot({ values, onApply, disabled }: AiSuggestSlotProps) {
  const { t } = useTranslation('ai')
  const suggest = useSuggestTask()
  const title = values.title.trim()
  const description = values.description.trim()
  const inputValid =
    title !== '' && title.length <= TITLE_MAX_LENGTH && description !== '' && description.length <= DESCRIPTION_MAX_LENGTH

  return (
    <section
      aria-label={t('suggest.label')}
      className="flex flex-col gap-3 rounded-xl border border-sage-100 bg-sage-50 p-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => suggest.mutate({ title, description })}
          disabled={!inputValid || disabled || suggest.isPending}
          className="btn btn-ai-outline"
        >
          <SparklesIcon className={`size-4 ${suggest.isPending ? 'animate-pulse' : ''}`} />
          {suggest.isPending ? t('suggest.loading') : t('suggest.button')}
        </button>
        {!inputValid && <span className="text-xs text-brand-700/70">{t('suggest.hint')}</span>}
      </div>
      {suggest.isError && <ErrorMessage error={suggest.error} />}
      {suggest.isSuccess && (
        <SuggestReview
          // A new suggestion starts with every field checked again.
          key={suggest.submittedAt}
          current={values}
          suggestion={suggest.data}
          disabled={disabled}
          onAccept={(changes) => {
            onApply(changes)
            suggest.reset()
          }}
          onDismiss={() => suggest.reset()}
        />
      )}
    </section>
  )
}
