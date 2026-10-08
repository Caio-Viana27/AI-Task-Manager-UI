interface BadgeProps {
  /** Tailwind color classes for the background, text and ring. */
  colorClassName: string
  /** Tailwind background class for the leading dot. Omit for no dot. */
  dotClassName?: string
  /** Already translated field name, e.g. "Priority". Read by screen readers before the value. */
  field: string
  /** Already translated value, e.g. "High". */
  value: string
}

/** A small pill holding one value. Base of the task badges. */
export function Badge({ colorClassName, dotClassName, field, value }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${colorClassName}`}
    >
      {dotClassName && <span aria-hidden="true" className={`size-1.5 rounded-full ${dotClassName}`} />}
      <span className="sr-only">{field}: </span>
      <span>{value}</span>
    </span>
  )
}
