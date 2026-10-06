import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">{t('pages.notFound.title')}</h1>
      <Link to="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
        {t('pages.notFound.backHome')}
      </Link>
    </section>
  )
}
