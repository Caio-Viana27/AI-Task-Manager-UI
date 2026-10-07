import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { TaskDetail } from '../../../api/tasks.ts'
import { AiBreakdownSlot } from '../../ai/AiBreakdownSlot.tsx'
import { AddSubtaskForm } from './AddSubtaskForm.tsx'
import { SubtaskList } from './SubtaskList.tsx'

interface SubtaskSectionProps {
  task: TaskDetail
}

/**
 * The task's direct subtasks and the ways to add more. Adding is offered only while
 * `canAddSubtasks` is true; the UI never needs to know the depth limit (PLAN §2).
 */
export function SubtaskSection({ task }: SubtaskSectionProps) {
  const { t } = useTranslation('tasks')
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id={headingId} className="text-lg font-semibold">
        {t('subtasks.title')}
      </h2>
      <AiBreakdownSlot task={task} canAddSubtasks={task.canAddSubtasks} />
      <SubtaskList subtasks={task.subtasks} />
      {task.canAddSubtasks ? (
        <AddSubtaskForm parentId={task.id} />
      ) : (
        <p className="text-sm text-slate-600">{t('subtasks.maxDepth')}</p>
      )}
    </section>
  )
}
