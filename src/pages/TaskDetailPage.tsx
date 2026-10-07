import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client.ts'
import { useTask } from '../api/queries/tasks.ts'
import { ErrorMessage } from '../components/ErrorMessage.tsx'
import { TaskDetailView } from '../features/tasks/detail/TaskDetailView.tsx'

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'TASK_NOT_FOUND'
}

/** One task with its ancestors and direct subtasks (PLAN §4, View a task; §6). */
export function TaskDetailPage() {
  const { t } = useTranslation('tasks')
  const { id } = useParams()
  const task = useTask(id)

  if (task.data) {
    return <TaskDetailView key={task.data.id} task={task.data} />
  }
  if (isNotFound(task.error)) {
    // The API answers 404 whether the task doesn't exist or belongs to someone else (PLAN §2).
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{t('detail.notFound.title')}</h1>
        <p className="mt-2 text-slate-600">{t('detail.notFound.body')}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          {t('detail.notFound.backHome')}
        </Link>
      </section>
    )
  }
  if (task.error) {
    return (
      <section className="flex flex-col items-start gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <ErrorMessage error={task.error} />
        <button
          type="button"
          onClick={() => void task.refetch()}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          {t('detail.retry')}
        </button>
      </section>
    )
  }
  return (
    <p role="status" className="text-slate-600">
      {t('detail.loading')}
    </p>
  )
}
