import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { PagePlaceholder } from '../components/PagePlaceholder.tsx'

export function TaskDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()

  return <PagePlaceholder title={t('pages.taskDetail.title', { id })} />
}
