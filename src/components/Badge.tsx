interface BadgeProps {
  /** Tailwind color classes for the background, text and ring. */
  colorClassName: string
  /** Already translated field name, e.g. "Priority". Read by screen readers before the value. */
  field: string
  /** Already translated value, e.g. "High". */
  value: string
}

/** A small pill holding one value. Base of the task badges. */
export function Badge({ colorClassName, field, value }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colorClassName}`}
    >
      <span className="sr-only">{field}: </span>
      <span>{value}</span>
    </span>
  )
}
