import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { AncestorSummary } from '../../../api/tasks.ts'
import { ChevronRightIcon } from '../../../components/icons.tsx'

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
      <ol className="flex flex-wrap items-center gap-1 text-sm text-stone-500">
        {ancestors.map((ancestor) => (
          <li key={ancestor.id} className="flex items-center gap-1">
            <Link to={`/tasks/${encodeURIComponent(ancestor.id)}`} className="max-w-56 truncate rounded px-1 font-medium hover:bg-stone-100 hover:text-brand-700">
              {ancestor.title}
            </Link>
            <ChevronRightIcon className="size-3.5 text-stone-400" />
          </li>
        ))}
      </ol>
    </nav>
  )
}
