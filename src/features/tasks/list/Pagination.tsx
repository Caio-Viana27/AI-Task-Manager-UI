import { useTranslation } from 'react-i18next'

interface PaginationProps {
  /** One-based. */
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const BUTTON_CLASS =
  'rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50'

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation('tasks')

  return (
    <nav aria-label={t('list.pagination.label')} className="flex items-center justify-between gap-4">
      <button type="button" className={BUTTON_CLASS} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        {t('list.pagination.previous')}
      </button>
      <span className="text-sm text-slate-600">{t('list.pagination.page', { page, totalPages })}</span>
      <button
        type="button"
        className={BUTTON_CLASS}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('list.pagination.next')}
      </button>
    </nav>
  )
}
