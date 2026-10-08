import { useTranslation } from 'react-i18next'

/** Shown while the session is being restored from a stored token. */
export function SessionLoading() {
  const { t } = useTranslation()

  return (
    <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-sm text-slate-600">
      <span aria-hidden="true" className="size-8 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
      {t('session.loading')}
    </div>
  )
}

interface SessionErrorProps {
  onRetry: () => void
}

/** Shown when the session couldn't be restored (network error or 5xx). The token is kept. */
export function SessionError({ onRetry }: SessionErrorProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900">
      <p role="alert">{t('generic', { ns: 'errors' })}</p>
      <button
        type="button"
        onClick={onRetry}
        className="btn btn-primary"
      >
        {t('session.retry')}
      </button>
    </div>
  )
}
