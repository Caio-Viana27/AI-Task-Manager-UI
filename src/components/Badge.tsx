import type { ReactNode } from 'react'

interface BadgeProps {
  /** Tailwind color classes for the background, text and ring. */
  colorClassName: string
  /** Tailwind background class for the leading dot. Omit for no dot. */
  dotClassName?: string
  /** A leading icon, e.g. the priority flag. Takes the place of the dot. */
  icon?: ReactNode
  /** `pill` (default) is fully rounded; `tag` has small corners, like the priority flag. */
  shape?: 'pill' | 'tag'
  /** Already translated field name, e.g. "Priority". Read by screen readers before the value. */
  field: string
  /** Already translated value, e.g. "High". */
  value: string
}

/** A small label holding one value. Base of the task badges. */
export function Badge({ colorClassName, dotClassName, icon, shape = 'pill', field, value }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${
        shape === 'pill' ? 'rounded-full' : 'rounded-md'
      } ${colorClassName}`}
    >
      {icon ?? (dotClassName && <span aria-hidden="true" className={`size-1.5 rounded-full ${dotClassName}`} />)}
      <span className="sr-only">{field}: </span>
      <span>{value}</span>
    </span>
  )
}
