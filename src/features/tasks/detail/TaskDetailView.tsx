import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useDeleteTask, usePatchTask } from '../../../api/queries/tasks.ts'
import type { TaskDetail } from '../../../api/tasks.ts'
import { ConfirmDialog } from '../../../components/ConfirmDialog.tsx'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { TaskForm } from '../form/TaskForm.tsx'
import { diffTaskForm, taskToFormValues, type TaskFormValues } from '../form/taskForm.ts'
import { SubtaskSection } from '../subtasks/SubtaskSection.tsx'
import { Breadcrumb } from './Breadcrumb.tsx'
import { TaskFields } from './TaskFields.tsx'

interface TaskDetailViewProps {
  task: TaskDetail
}

/**
 * A loaded task: breadcrumb, fields (or the edit form), delete, and the subtask section.
 * Mount it with `key={task.id}` so moving to another task resets the edit and delete state.
 */
export function TaskDetailView({ task }: TaskDetailViewProps) {
  const { t } = useTranslation('tasks')
  const navigate = useNavigate()
  const patchTask = usePatchTask()
  const deleteTask = useDeleteTask()
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function startEditing() {
    patchTask.reset()
    setEditing(true)
  }

  function save(values: TaskFormValues) {
    // Only the changed fields, so an OVERDUE task is saved without its status (D6).
    const patch = diffTaskForm(task, values)
    if (Object.keys(patch).length === 0) {
      setEditing(false)
      return
    }
    patchTask.mutate({ id: task.id, patch }, { onSuccess: () => setEditing(false) })
  }

  function confirmDelete() {
    const parentTaskId = task.parentTaskId
    deleteTask.mutate(
      { id: task.id, parentTaskId },
      {
        onSuccess: () =>
          void navigate(parentTaskId ? `/tasks/${encodeURIComponent(parentTaskId)}` : '/', { replace: true }),
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Breadcrumb ancestors={task.ancestors} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="min-w-0 break-words text-2xl font-semibold">{task.title}</h1>
          {!editing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startEditing}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('detail.edit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTask.reset()
                  setConfirmingDelete(true)
                }}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                {t('detail.delete')}
              </button>
            </div>
          )}
        </div>
        {editing ? (
          <TaskForm
            mode="edit"
            label={t('form.editLabel')}
            initialValues={taskToFormValues(task)}
            taskId={task.id}
            submitLabel={t('form.save')}
            pendingLabel={t('form.saving')}
            pending={patchTask.isPending}
            error={patchTask.error}
            onSubmit={save}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <TaskFields task={task} />
        )}
      </section>

      <SubtaskSection task={task} />

      <ConfirmDialog
        open={confirmingDelete}
        title={t('detail.deleteDialog.title')}
        message={t('detail.deleteDialog.message', { title: task.title })}
        confirmLabel={deleteTask.isPending ? t('detail.deleteDialog.deleting') : t('detail.deleteDialog.confirm')}
        destructive
        pending={deleteTask.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      >
        {deleteTask.error && <ErrorMessage error={deleteTask.error} />}
      </ConfirmDialog>
    </div>
  )
}
