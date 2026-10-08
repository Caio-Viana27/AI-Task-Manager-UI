import { useTranslation } from 'react-i18next'
import { SparklesIcon } from '../../../components/icons.tsx'

interface AnalyzeButtonProps {
  pending: boolean
  onClick: () => void
}

/** "Analyze with AI" on a task's detail page, between Edit and Delete (wave 4, D14). */
export function AnalyzeButton({ pending, onClick }: AnalyzeButtonProps) {
  const { t } = useTranslation('aiAnalysis')
  return (
    <button type="button" onClick={onClick} disabled={pending} className="btn btn-ai-outline">
      <SparklesIcon className={`size-4 ${pending ? 'animate-pulse' : ''}`} />
      {pending ? t('loading') : t('button')}
    </button>
  )
}
