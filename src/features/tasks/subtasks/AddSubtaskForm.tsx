import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateSubtasks } from '../../../api/queries/tasks.ts'
import { PlusIcon } from '../../../components/icons.tsx'
import { TaskForm } from '../form/TaskForm.tsx'
import { EMPTY_TASK_FORM_VALUES, toCreateRequest } from '../form/taskForm.ts'

interface AddSubtaskFormProps {
  parentId: string
}

/**
 * A button that opens the task form for a new subtask. After each save the form is cleared
 * and stays open, so several subtasks can be added in a row.
 */
export function AddSubtaskForm({ parentId }: AddSubtaskFormProps) {
  const { t } = useTranslation('tasks')
  const createSubtasks = useCreateSubtasks()
  const [open, setOpen] = useState(false)
  // Bumped after a save to remount (and so clear) the form.
  const [formKey, setFormKey] = useState(0)

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            createSubtasks.reset()
            setOpen(true)
          }}
          className="btn btn-secondary"
        >
          <PlusIcon />
          {t('subtasks.add')}
        </button>
      </div>
    )
  }
  return (
    <div className="animate-fade-in rounded-xl border border-line bg-stone-50/60 p-5">
      <TaskForm
        key={formKey}
        mode="create"
        label={t('subtasks.formLabel')}
        initialValues={EMPTY_TASK_FORM_VALUES}
        // Subtask create takes no estimate (wave 4, D10).
        showEstimatedHours={false}
        submitLabel={t('subtasks.create')}
        pendingLabel={t('subtasks.creating')}
        pending={createSubtasks.isPending}
        error={createSubtasks.error}
        onSubmit={(values) =>
          createSubtasks.mutate(
            { parentId, subtasks: [toCreateRequest(values)] },
            { onSuccess: () => setFormKey((key) => key + 1) },
          )
        }
        onCancel={() => setOpen(false)}
      />
    </div>
  )
}
