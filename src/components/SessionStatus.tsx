import { useTranslation } from 'react-i18next'

/** Shown while the session is being restored from a stored token. */
export function SessionLoading() {
  const { t } = useTranslation()

  return (
    <div role="status" className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
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
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        {t('session.retry')}
      </button>
    </div>
  )
}
