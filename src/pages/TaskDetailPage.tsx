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
      <section className="card mx-auto flex max-w-xl flex-col items-center p-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{t('detail.notFound.title')}</h1>
        <p className="mt-2 text-stone-600">{t('detail.notFound.body')}</p>
        <Link to="/" className="btn btn-secondary mt-6">
          {t('detail.notFound.backHome')}
        </Link>
      </section>
    )
  }
  if (task.error) {
    return (
      <section className="card flex flex-col items-start gap-4 p-6">
        <ErrorMessage error={task.error} />
        <button
          type="button"
          onClick={() => void task.refetch()}
          className="btn btn-secondary"
        >
          {t('detail.retry')}
        </button>
      </section>
    )
  }
  return (
    <div role="status" className="card flex flex-col gap-4 p-6">
      <span className="sr-only">{t('detail.loading')}</span>
      <div aria-hidden="true" className="h-4 w-1/4 animate-pulse rounded bg-stone-200" />
      <div aria-hidden="true" className="h-7 w-2/3 animate-pulse rounded bg-stone-200" />
      <div aria-hidden="true" className="h-16 w-full animate-pulse rounded bg-stone-100" />
    </div>
  )
}
