import { useTranslation } from 'react-i18next'
import { PagePlaceholder } from '../components/PagePlaceholder.tsx'

export function ForgotPasswordPage() {
  const { t } = useTranslation()

  return <PagePlaceholder title={t('pages.forgotPassword.title')} />
}
