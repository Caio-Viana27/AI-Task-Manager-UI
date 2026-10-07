import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface FieldShellProps {
  id: string
  label: string
  /** Already translated. */
  error?: string
  /** Already translated. */
  hint?: string
  children: ReactNode
}

/** Label, control, then the hint or the error, like `FormField`. */
function FieldShell({ id, label, error, hint, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined
}

function controlClass(error?: string): string {
  return `rounded-md border bg-white px-3 py-2 text-sm ${error ? 'border-red-500' : 'border-slate-300'}`
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> {
  label: string
  error?: string
  hint?: string
}

export function TextAreaField({ label, error, hint, ...props }: TextAreaFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={controlClass(error)}
        {...props}
      />
    </FieldShell>
  )
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'> {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export function SelectField({ label, error, hint, children, ...props }: SelectFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={controlClass(error)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
}
