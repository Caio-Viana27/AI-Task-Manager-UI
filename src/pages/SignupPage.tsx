import { useTranslation } from 'react-i18next'
import { PagePlaceholder } from '../components/PagePlaceholder.tsx'

export function SignupPage() {
  const { t } = useTranslation()

  return <PagePlaceholder title={t('pages.signup.title')} />
}
