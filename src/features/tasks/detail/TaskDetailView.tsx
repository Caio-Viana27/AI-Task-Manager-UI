import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useAnalyzeTask } from '../../../api/aiAnalysis.ts'
import { useDeleteTask, usePatchTask } from '../../../api/queries/tasks.ts'
import type { TaskDetail } from '../../../api/tasks.ts'
import { ConfirmDialog } from '../../../components/ConfirmDialog.tsx'
import { Accent } from '../../../components/Accent.tsx'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { PencilIcon, TrashIcon } from '../../../components/icons.tsx'
import { AnalysisReview, type AnalysisFields } from '../../ai/analysis/AnalysisReview.tsx'
import { AnalyzeButton } from '../../ai/analysis/AnalyzeButton.tsx'
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
  const analyze = useAnalyzeTask()
  // The values the edit form opens with, or null when not editing. "Apply to form" merges the
  // checked analysis fields into the task's values (wave 4, D14).
  const [editValues, setEditValues] = useState<TaskFormValues | null>(null)
  const editing = editValues !== null
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function startEditing(changes: Partial<AnalysisFields> = {}) {
    patchTask.reset()
    analyze.reset()
    setEditValues({ ...taskToFormValues(task), ...changes })
  }

  function save(values: TaskFormValues) {
    // Only the changed fields, so an OVERDUE task is saved without its status (D6).
    const patch = diffTaskForm(task, values)
    if (Object.keys(patch).length === 0) {
      setEditValues(null)
      return
    }
    patchTask.mutate({ id: task.id, patch }, { onSuccess: () => setEditValues(null) })
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
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          {task.ancestors.length > 0 ? (
            <Breadcrumb ancestors={task.ancestors} />
          ) : (
            <p className="eyebrow flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-sage-500" />
              {t('detail.eyebrow')}
            </p>
          )}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight break-words text-brand-950 sm:text-4xl">
            {task.title}
            <Accent />
          </h1>
        </div>
        {!editing && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => startEditing()} className="btn btn-secondary">
              <PencilIcon />
              {t('detail.edit')}
            </button>
            <AnalyzeButton pending={analyze.isPending} onClick={() => analyze.mutate(task.id)} />
            <button
              type="button"
              onClick={() => {
                deleteTask.reset()
                setConfirmingDelete(true)
              }}
              className="btn btn-danger-outline"
            >
              <TrashIcon />
              {t('detail.delete')}
            </button>
          </div>
        )}
      </header>
      {!editing && analyze.isError && <ErrorMessage error={analyze.error} />}
      {!editing && analyze.isSuccess && (
        <AnalysisReview
          // A new analysis starts with every field checked again.
          key={analyze.submittedAt}
          task={task}
          analysis={analyze.data}
          onApply={(changes) => startEditing(changes)}
          onDismiss={() => analyze.reset()}
        />
      )}
      <section className="card p-6 sm:p-8">
        {editValues !== null ? (
          <TaskForm
            mode="edit"
            label={t('form.editLabel')}
            initialValues={editValues}
            taskId={task.id}
            submitLabel={t('form.save')}
            pendingLabel={t('form.saving')}
            pending={patchTask.isPending}
            error={patchTask.error}
            onSubmit={save}
            onCancel={() => setEditValues(null)}
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
