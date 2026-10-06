import { useTranslation } from 'react-i18next'
import { PagePlaceholder } from '../components/PagePlaceholder.tsx'

export function ResetPasswordPage() {
  const { t } = useTranslation()

  return <PagePlaceholder title={t('pages.resetPassword.title')} />
}
