import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSendChatMessage, type ChatMessage } from '../../api/chat.ts'
import { ErrorMessage } from '../../components/ErrorMessage.tsx'
import { ArrowUpIcon, SparklesIcon, XIcon } from '../../components/icons.tsx'
import { useShell } from '../../layouts/useShell.ts'
import { AssistantIntro } from './AssistantIntro.tsx'

/** `message` limit (PLAN §5). */
export const MAX_MESSAGE_LENGTH = 1000
/** How many of the latest messages go with each request as `history` (PLAN §5). */
export const HISTORY_SIZE = 10

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
  const inputId = useId()

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
    <section aria-label={t('panel.title')} className="card flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-lg bg-sage-100 text-brand-700">
            <SparklesIcon className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-brand-950">{t('panel.heading')}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[0.6875rem] text-stone-500">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-sage-500" />
              {t('panel.subtitle')}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setAssistantOpen(false)} aria-label={t('panel.hide')} className="btn btn-ghost p-1.5">
          <XIcon />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {messages.length === 0 ? (
          <AssistantIntro onPick={setInput} />
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
                    ? 'ml-8 animate-fade-in self-end rounded-2xl rounded-br-md bg-brand-700 px-3.5 py-2 text-sm text-white'
                    : 'mr-8 animate-fade-in self-start rounded-2xl rounded-bl-md bg-sage-50 px-3.5 py-2 text-sm text-stone-800 ring-1 ring-sage-100'
                }
              >
                <span className="sr-only">{role === 'user' ? t('panel.you') : t('panel.assistant')}: </span>
                <span className="break-words whitespace-pre-wrap">{content}</span>
              </li>
            ))}
          </ol>
        )}
        {pending && (
          <p role="status" className="flex items-center gap-2 text-sm text-stone-500">
            <span aria-hidden="true" className="flex gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-sage-400 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-sage-400 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-sage-400" />
            </span>
            {t('panel.typing')}
          </p>
        )}
        <ErrorMessage error={send.error} />
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-line bg-white p-3 transition-shadow focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-500/10"
        >
          <label className="sr-only" htmlFor={inputId}>
            {t('panel.inputLabel')}
          </label>
          <textarea
            id={inputId}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={2}
            placeholder={t('panel.placeholder')}
            className="block w-full resize-none bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[0.6875rem] text-stone-400">
              <SparklesIcon className="size-3.5" />
              {t('panel.readOnly')}
            </span>
            <button
              type="submit"
              disabled={!canSend}
              aria-label={t('panel.send')}
              title={t('panel.send')}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-sage-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-sage-500"
            >
              <ArrowUpIcon className="size-4" />
            </button>
          </div>
        </form>
        <button
          type="button"
          onClick={clear}
          disabled={pending || messages.length === 0}
          className="cursor-pointer self-center text-xs text-stone-500 hover:text-stone-900 disabled:invisible"
        >
          {t('panel.clear')}
        </button>
      </div>
    </section>
  )
}
