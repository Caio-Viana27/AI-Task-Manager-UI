import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useDeleteTask } from '../../../api/queries/tasks.ts'
import type { Task } from '../../../api/tasks.ts'
import { ConfirmDialog } from '../../../components/ConfirmDialog.tsx'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { ArrowRightIcon, MoreHorizontalIcon, TrashIcon } from '../../../components/icons.tsx'
import { Menu, MenuItem } from '../../../components/Menu.tsx'

interface RowMenuProps {
  task: Task
}

/** The "⋯" menu of a task row: open the task, or delete it after a confirmation. */
export function RowMenu({ task }: RowMenuProps) {
  const { t } = useTranslation('tasks')
  const navigate = useNavigate()
  const deleteTask = useDeleteTask()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <Menu
        label={t('list.menu.label', { title: task.title })}
        triggerClassName="btn btn-ghost p-1.5 text-stone-400 hover:text-stone-700"
        trigger={<MoreHorizontalIcon className="size-5" />}
      >
        {(close) => (
          <>
            <MenuItem
              icon={<ArrowRightIcon className="size-4" />}
              onSelect={() => {
                close()
                void navigate(`/tasks/${encodeURIComponent(task.id)}`)
              }}
            >
              {t('list.menu.open')}
            </MenuItem>
            <MenuItem
              destructive
              icon={<TrashIcon className="size-4" />}
              onSelect={() => {
                close()
                deleteTask.reset()
                setConfirming(true)
              }}
            >
              {t('list.menu.delete')}
            </MenuItem>
          </>
        )}
      </Menu>
      <ConfirmDialog
        open={confirming}
        title={t('detail.deleteDialog.title')}
        message={t('detail.deleteDialog.message', { title: task.title })}
        confirmLabel={deleteTask.isPending ? t('detail.deleteDialog.deleting') : t('detail.deleteDialog.confirm')}
        destructive
        pending={deleteTask.isPending}
        onConfirm={() =>
          deleteTask.mutate(
            { id: task.id, parentTaskId: task.parentTaskId },
            { onSuccess: () => setConfirming(false) },
          )
        }
        onCancel={() => setConfirming(false)}
      >
        {deleteTask.error && <ErrorMessage error={deleteTask.error} />}
      </ConfirmDialog>
    </>
  )
}
