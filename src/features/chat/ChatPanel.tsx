import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSendChatMessage, type ChatMessage } from '../../api/chat.ts'
import { ErrorMessage } from '../../components/ErrorMessage.tsx'

/** `message` limit (PLAN §5). */
export const MAX_MESSAGE_LENGTH = 1000
/** How many of the latest messages go with each request as `history` (PLAN §5). */
export const HISTORY_SIZE = 10

const EXAMPLE_KEYS = ['examples.overdue', 'examples.first', 'examples.week'] as const

interface ListedMessage extends ChatMessage {
  id: number
}

/**
 * The read-only chat assistant (PLAN §5, Chat), in the protected `AppLayout`'s slot (wave 4, D7).
 * The conversation lives only in this component's state (D8): it survives navigation between
 * protected pages and is gone after logout, which unmounts the layout.
 */
export function ChatPanel() {
  const { t } = useTranslation('chat')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ListedMessage[]>([])
  const [input, setInput] = useState('')
  const nextId = useRef(0)
  const listRef = useRef<HTMLOListElement>(null)
  const send = useSendChatMessage()
  const bodyId = useId()

  const pending = send.isPending
  const canSend = !pending && input.trim() !== ''

  useEffect(() => {
    const list = listRef.current
    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [messages, pending, open])

  function submit() {
    const message = input.trim()
    if (pending || message === '') {
      return
    }
    const history = messages.slice(-HISTORY_SIZE).map(({ role, content }) => ({ role, content }))
    send.mutate(
      { message, history },
      {
        // A message joins the list only with its reply; on failure the input keeps its text (D8).
        onSuccess: ({ reply }) => {
          const userId = nextId.current++
          const replyId = nextId.current++
          setMessages((current) => [
            ...current,
            { id: userId, role: 'user', content: message },
            { id: replyId, role: 'assistant', content: reply },
          ])
          setInput((current) => (current.trim() === message ? '' : current))
        },
      },
    )
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  function clear() {
    setMessages([])
    send.reset()
  }

  return (
    <section aria-label={t('panel.title')} className="sticky top-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        aria-label={open ? t('panel.close') : t('panel.open')}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        <span>{t('panel.title')}</span>
        <span aria-hidden="true" className="text-slate-500">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div id={bodyId} className="flex flex-col gap-3 border-t border-slate-200 p-4">
          {messages.length === 0 ? (
            <div className="text-sm text-slate-600">
              <p>{t('panel.intro')}</p>
              <p className="mt-3 font-medium text-slate-700">{t('examples.title')}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {EXAMPLE_KEYS.map((key) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setInput(t(key))}
                      className="text-left text-blue-700 hover:underline"
                    >
                      {t(key)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol
              ref={listRef}
              aria-label={t('panel.messages')}
              aria-live="polite"
              className="flex max-h-96 flex-col gap-2 overflow-y-auto"
            >
              {messages.map(({ id, role, content }) => (
                <li
                  key={id}
                  className={
                    role === 'user'
                      ? 'ml-6 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white'
                      : 'mr-6 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800'
                  }
                >
                  <span className="sr-only">{role === 'user' ? t('panel.you') : t('panel.assistant')}: </span>
                  <span className="whitespace-pre-wrap break-words">{content}</span>
                </li>
              ))}
            </ol>
          )}
          {pending && (
            <p role="status" className="text-sm italic text-slate-500">
              {t('panel.typing')}
            </p>
          )}
          <ErrorMessage error={send.error} />
          <form onSubmit={onSubmit} className="flex flex-col gap-2">
            <label className="sr-only" htmlFor={`${bodyId}-input`}>
              {t('panel.inputLabel')}
            </label>
            <textarea
              id={`${bodyId}-input`}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={3}
              placeholder={t('panel.placeholder')}
              className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clear}
                disabled={pending || messages.length === 0}
                className="text-sm text-slate-600 hover:text-slate-900 disabled:invisible"
              >
                {t('panel.clear')}
              </button>
              <button
                type="submit"
                disabled={!canSend}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {t('panel.send')}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
