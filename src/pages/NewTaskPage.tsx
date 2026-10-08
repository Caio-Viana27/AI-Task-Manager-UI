import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useCreateTask } from '../api/queries/tasks.ts'
import { TaskForm } from '../features/tasks/form/TaskForm.tsx'
import { EMPTY_TASK_FORM_VALUES, toCreateRequest } from '../features/tasks/form/taskForm.ts'

/** Creates a top-level task, then opens its page (PLAN §4, Create a task). */
export function NewTaskPage() {
  const { t } = useTranslation(['common', 'tasks'])
  const navigate = useNavigate()
  const createTask = useCreateTask()

  return (
    <section className="card mx-auto flex max-w-3xl flex-col gap-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('pages.newTask.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('pages.newTask.subtitle')}</p>
      </div>
      <TaskForm
        mode="create"
        label={t('pages.newTask.title')}
        initialValues={EMPTY_TASK_FORM_VALUES}
        submitLabel={t('tasks:form.create')}
        pendingLabel={t('tasks:form.creating')}
        pending={createTask.isPending}
        error={createTask.error}
        onSubmit={(values) =>
          createTask.mutate(toCreateRequest(values), {
            onSuccess: (task) => void navigate(`/tasks/${encodeURIComponent(task.id)}`, { replace: true }),
          })
        }
        onCancel={() => void navigate('/')}
      />
    </section>
  )
}
