import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { TaskDetail } from '../../../api/tasks.ts'
import { ListTreeIcon } from '../../../components/icons.tsx'
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
      className="card flex flex-col gap-4 p-6 sm:p-8"
    >
      <h2 id={headingId} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <ListTreeIcon className="size-5 text-stone-400" />
        {t('subtasks.title')}
      </h2>
      <AiBreakdownSlot task={task} canAddSubtasks={task.canAddSubtasks} />
      <SubtaskList subtasks={task.subtasks} />
      {task.canAddSubtasks ? (
        <AddSubtaskForm parentId={task.id} />
      ) : (
        <p className="alert-warning">{t('subtasks.maxDepth')}</p>
      )}
    </section>
  )
}
