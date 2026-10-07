import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { AncestorSummary } from '../../../api/tasks.ts'

interface BreadcrumbProps {
  /** Root first, down to the direct parent (PLAN §2). */
  ancestors: AncestorSummary[]
}

/** The path from the top-level task to the parent, each step linking to its task. Nothing for a top-level task. */
export function Breadcrumb({ ancestors }: BreadcrumbProps) {
  const { t } = useTranslation('tasks')
  if (ancestors.length === 0) {
    return null
  }
  return (
    <nav aria-label={t('detail.breadcrumb')}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
        {ancestors.map((ancestor) => (
          <li key={ancestor.id} className="flex items-center gap-1">
            <Link to={`/tasks/${encodeURIComponent(ancestor.id)}`} className="text-blue-600 hover:underline">
              {ancestor.title}
            </Link>
            <span aria-hidden="true">/</span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
