import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Accent } from '../components/Accent.tsx'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="card mx-auto flex max-w-xl flex-col items-center p-10 text-center">
      <p aria-hidden="true" className="text-6xl font-bold text-sage-500">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-950">
        {t('pages.notFound.title')}
        <Accent />
      </h1>
      <Link to="/" className="btn btn-secondary mt-6">
        {t('pages.notFound.backHome')}
      </Link>
    </section>
  )
}
