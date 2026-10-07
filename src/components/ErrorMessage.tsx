import { useTranslation } from 'react-i18next'
import { errorKey } from '../i18n/errorKey.ts'

interface ErrorMessageProps {
  /** Any thrown value. An `ApiError` shows the message for its `code`; anything else the generic one. */
  error: unknown
  className?: string
}

/** An alert with the localized message for an error. Renders nothing when `error` is null or undefined. */
export function ErrorMessage({ error, className }: ErrorMessageProps) {
  const { t } = useTranslation('errors')
  if (error === null || error === undefined) {
    return null
  }
  return (
    <p role="alert" className={`rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ${className ?? ''}`}>
      {t(errorKey(error))}
    </p>
  )
}
