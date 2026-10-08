import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSendChatMessage, type ChatMessage } from '../../api/chat.ts'
import { ErrorMessage } from '../../components/ErrorMessage.tsx'
import { SendIcon, SparklesIcon, XIcon } from '../../components/icons.tsx'
import { useShell } from '../../layouts/useShell.ts'

/** `message` limit (PLAN §5). */
export const MAX_MESSAGE_LENGTH = 1000
/** How many of the latest messages go with each request as `history` (PLAN §5). */
export const HISTORY_SIZE = 10

const EXAMPLE_KEYS = ['examples.overdue', 'examples.first', 'examples.week'] as const

interface ListedMessage extends ChatMessage {
  id: number
}

/**
 * The read-only chat assistant (PLAN §5, Chat), in the signed-in `AppShell`'s assistant column (wave 4, D7).
 * The conversation lives only in this component's state (D8): it survives navigation between
 * protected pages and is gone after logout, which unmounts the layout.
 */
export function ChatPanel() {
  const { t } = useTranslation('chat')
  const { assistantOpen: open, setAssistantOpen } = useShell()
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

  if (!open) {
    // Hidden, but still mounted, so the conversation is kept (D8).
    return null
  }

  return (
    <section aria-label={t('panel.title')} className="card sticky top-24 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="flex items-center gap-3 text-sm font-semibold text-stone-800">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-sage-100 text-brand-700">
            <SparklesIcon className="size-4" />
          </span>
          {t('panel.title')}
        </span>
        <button
          type="button"
          onClick={() => setAssistantOpen(false)}
          aria-label={t('panel.hide')}
          className="btn btn-ghost p-1.5"
        >
          <XIcon />
        </button>
      </div>
        <div id={bodyId} className="flex animate-fade-in flex-col gap-3 border-t border-stone-100 p-4">
          {messages.length === 0 ? (
            <div className="text-sm text-stone-600">
              <p className="leading-relaxed">{t('panel.intro')}</p>
              <p className="mt-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">{t('examples.title')}</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {EXAMPLE_KEYS.map((key) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setInput(t(key))}
                      className="w-full cursor-pointer rounded-lg border border-line bg-stone-50 px-3 py-2 text-left text-stone-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
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
              className="-mx-1 flex max-h-[28rem] flex-col gap-2.5 overflow-y-auto px-1"
            >
              {messages.map(({ id, role, content }) => (
                <li
                  key={id}
                  className={
                    role === 'user'
                      ? 'ml-8 animate-fade-in self-end rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2 text-sm text-white shadow-sm'
                      : 'mr-8 animate-fade-in self-start rounded-2xl rounded-bl-md bg-stone-100 px-3.5 py-2 text-sm text-stone-800'
                  }
                >
                  <span className="sr-only">{role === 'user' ? t('panel.you') : t('panel.assistant')}: </span>
                  <span className="whitespace-pre-wrap break-words">{content}</span>
                </li>
              ))}
            </ol>
          )}
          {pending && (
            <p role="status" className="flex items-center gap-2 text-sm text-stone-500">
              <span aria-hidden="true" className="flex gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-stone-400" />
              </span>
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
              className="input resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clear}
                disabled={pending || messages.length === 0}
                className="btn btn-sm btn-ghost disabled:invisible"
              >
                {t('panel.clear')}
              </button>
              <button
                type="submit"
                disabled={!canSend}
                className="btn btn-primary px-3.5 py-1.5"
              >
                <SendIcon />
                {t('panel.send')}
              </button>
            </div>
          </form>
        </div>
    </section>
  )
}
