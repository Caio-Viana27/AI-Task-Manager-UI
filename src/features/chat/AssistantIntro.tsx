import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useFirstTask, useTaskCount } from '../../api/queries/tasks.ts'
import { Accent } from '../../components/Accent.tsx'
import { ArrowRightIcon, ArrowUpIcon, SparklesIcon } from '../../components/icons.tsx'
import { DueDate } from '../tasks/list/DueDate.tsx'
import { OPEN_STATUSES } from '../tasks/list/views.ts'

const EXAMPLE_KEYS = ['examples.overdue', 'examples.first', 'examples.week'] as const

interface AssistantIntroProps {
  /** Puts an example question in the input; the user still sends it. */
  onPick: (question: string) => void
}

/**
 * What the assistant shows before the first message: how many tasks are open, the next one to
 * do (the open task due soonest), a tip and example questions.
 */
export function AssistantIntro({ onPick }: AssistantIntroProps) {
  const { t, i18n } = useTranslation(['chat', 'tasks'])
  const open = useTaskCount({ status: [...OPEN_STATUSES] })
  const next = useFirstTask({ status: [...OPEN_STATUSES] }, 'dueDate,asc')

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="eyebrow text-[0.625rem]">{t('empty.eyebrow')}</p>
        <h3 className="mt-3 text-2xl leading-tight font-medium tracking-tight text-brand-950">
          {t('empty.title')}
          <Accent />
        </h3>
        {open.data !== undefined && (
          <p className="mt-3 text-xs leading-relaxed text-stone-600">
            {open.data > 0 ? (
              <Trans
                t={t}
                i18nKey="empty.openCount"
                count={open.data}
                components={{ strong: <strong className="font-semibold text-stone-900" /> }}
              />
            ) : (
              t('empty.noOpen')
            )}
          </p>
        )}
      </div>

      {next.data && (
        <div className="rounded-lg bg-sage-100/70 p-4">
          <p className="eyebrow flex items-center gap-1.5 text-[0.625rem] text-brand-700/70">
            <span aria-hidden="true" className="size-1 rounded-full bg-sage-500" />
            {t('nextStep.label')}
          </p>
          <p className="mt-2 text-sm leading-snug font-semibold text-brand-950">{next.data.title}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[0.6875rem] text-stone-600">
            <DueDate date={next.data.dueDate} overdue={next.data.status === 'OVERDUE'} className="text-[0.6875rem]" />
            <span aria-hidden="true">·</span>
            {t('nextStep.priority', {
              priority: t(`tasks:priority.${next.data.priority}`).toLocaleLowerCase(i18n.language),
            })}
          </p>
          <Link
            to={`/tasks/${encodeURIComponent(next.data.id)}`}
            className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-brand-800 hover:text-brand-950"
          >
            {t('nextStep.view')}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      )}

      <p className="flex gap-2.5 text-xs leading-relaxed text-stone-500">
        <SparklesIcon className="mt-0.5 size-4 shrink-0 text-brand-700" />
        {t('empty.tip')}
      </p>

      <div>
        <p className="eyebrow text-[0.625rem]">{t('examples.title')}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {EXAMPLE_KEYS.map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => onPick(t(key))}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-left text-xs text-stone-700 transition-colors hover:border-sage-300 hover:bg-sage-50"
              >
                {t(key)}
                <ArrowUpIcon className="size-3.5 shrink-0 text-stone-400" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
