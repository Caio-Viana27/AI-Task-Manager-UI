import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useCreateTask } from '../api/queries/tasks.ts'
import { Accent } from '../components/Accent.tsx'
import { TaskForm } from '../features/tasks/form/TaskForm.tsx'
import { EMPTY_TASK_FORM_VALUES, toCreateRequest } from '../features/tasks/form/taskForm.ts'

/** Creates a top-level task, then opens its page (PLAN §4, Create a task). */
export function NewTaskPage() {
  const { t } = useTranslation(['common', 'tasks'])
  const navigate = useNavigate()
  const createTask = useCreateTask()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <p className="eyebrow flex items-center gap-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-sage-500" />
          {t('pages.newTask.eyebrow')}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
          {t('pages.newTask.title')}
          <Accent />
        </h1>
        <p className="mt-3 text-sm text-stone-500">{t('pages.newTask.subtitle')}</p>
      </header>
      <section className="card p-6 sm:p-8">
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
    </div>
  )
}
