import { useTranslation } from 'react-i18next'
import { ChevronLeftIcon, ChevronRightIcon } from '../../../components/icons.tsx'

interface PaginationProps {
  /** One-based. */
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const BUTTON_CLASS = 'btn btn-secondary px-3 py-1.5'

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation('tasks')

  return (
    <nav aria-label={t('list.pagination.label')} className="flex items-center justify-between gap-4">
      <button type="button" className={BUTTON_CLASS} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeftIcon />
        {t('list.pagination.previous')}
      </button>
      <span className="text-sm font-medium text-slate-600">{t('list.pagination.page', { page, totalPages })}</span>
      <button
        type="button"
        className={BUTTON_CLASS}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('list.pagination.next')}
        <ChevronRightIcon />
      </button>
    </nav>
  )
}
