import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PagePlaceholder } from '../components/PagePlaceholder.tsx'

export function LoginPage() {
  const { t } = useTranslation()

  return (
    <PagePlaceholder title={t('pages.login.title')}>
      <Link to="/forgot-password" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
        {t('pages.login.forgotPassword')}
      </Link>
    </PagePlaceholder>
  )
}
