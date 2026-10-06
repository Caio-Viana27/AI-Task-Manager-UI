import { useTranslation } from 'react-i18next'
import { PagePlaceholder } from '../components/PagePlaceholder.tsx'

export function NewTaskPage() {
  const { t } = useTranslation()

  return <PagePlaceholder title={t('pages.newTask.title')} />
}
