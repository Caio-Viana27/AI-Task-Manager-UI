import { useTranslation } from 'react-i18next'
import { useBreakdownTask } from '../../api/aiBreakdown.ts'
import type { TaskDetail } from '../../api/tasks.ts'
import { ErrorMessage } from '../../components/ErrorMessage.tsx'
import { DraftEditor } from './breakdown/DraftEditor.tsx'

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
 * "Break down with AI" (PLAN §5 Breakdown, wave 3 T3.5), at the top of the subtask section.
 * The drafts are only kept here until the user creates or discards them.
 */
export function AiBreakdownSlot({ task, canAddSubtasks }: AiBreakdownSlotProps) {
  const { t } = useTranslation('aiBreakdown')
  const breakdown = useBreakdownTask()

  if (!canAddSubtasks) {
    return null
  }
  return (
    <div className="flex flex-col gap-2">
      {!breakdown.isSuccess && (
        <div>
          <button
            type="button"
            onClick={() => breakdown.mutate(task.id)}
            disabled={breakdown.isPending}
            className="rounded-md border border-violet-300 px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-50 disabled:opacity-60"
          >
            {breakdown.isPending ? t('loading') : t('button')}
          </button>
        </div>
      )}
      {breakdown.isError && <ErrorMessage error={breakdown.error} />}
      {breakdown.isSuccess && (
        <DraftEditor
          key={breakdown.submittedAt}
          parentId={task.id}
          initialDrafts={breakdown.data}
          onClose={() => breakdown.reset()}
        />
      )}
    </div>
  )
}
