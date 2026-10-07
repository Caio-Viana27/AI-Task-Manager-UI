import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface ConfirmDialogProps {
  open: boolean
  /** Already translated. */
  title: string
  /** Already translated. */
  message: string
  /** Already translated. Defaults to "Confirm". */
  confirmLabel?: string
  /** Already translated. Defaults to "Cancel". */
  cancelLabel?: string
  /** Styles the confirm button as a destructive action, e.g. a delete. */
  destructive?: boolean
  /** Disables both buttons while the confirmed action runs. */
  pending?: boolean
  /** Shown inside the dialog, e.g. an `<ErrorMessage>` for a failed action. */
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

/**
 * A modal confirmation. Focus moves to Cancel when it opens, so Enter never confirms by
 * accident; Escape and a click on the backdrop cancel.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  pending = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const messageId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const previousFocus = document.activeElement
    cancelRef.current?.focus()
    return () => {
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus()
      }
    }
  }, [open])

  if (!open) {
    return null
  }

  const confirmColor = destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onCancel()
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !pending) {
            event.stopPropagation()
            onCancel()
          }
        }}
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p id={messageId} className="mt-2 text-sm text-slate-600">
          {message}
        </p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel ?? t('dialog.cancel')}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${confirmColor}`}
          >
            {confirmLabel ?? t('dialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
