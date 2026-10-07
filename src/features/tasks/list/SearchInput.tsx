import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.ts'
import { MAX_SEARCH_LENGTH } from './dashboardParams.ts'

interface SearchInputProps {
  /** The search in the URL. */
  value: string | undefined
  /** Called with the trimmed text, or `undefined` when blank, once typing pauses. */
  onSearch: (q: string | undefined) => void
}

function normalize(text: string): string | undefined {
  return text.trim() || undefined
}

/** The text search. Keeps what the user types locally and writes it to the URL debounced. */
export function SearchInput({ value, onSearch }: SearchInputProps) {
  const { t } = useTranslation('tasks')
  const id = useId()
  const [text, setText] = useState(value ?? '')
  const [syncedValue, setSyncedValue] = useState(value)
  const debounced = useDebouncedValue(text)

  // The URL changed from outside (back button, "Clear filters"): show its value.
  if (value !== syncedValue) {
    setSyncedValue(value)
    if (value !== normalize(text)) {
      setText(value ?? '')
    }
  }

  useEffect(() => {
    const q = normalize(debounced)
    if (q !== value) {
      onSearch(q)
    }
    // Only a settled change of the text triggers a search; `value` catching up must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {t('list.filters.search')}
      </label>
      <input
        id={id}
        type="search"
        value={text}
        maxLength={MAX_SEARCH_LENGTH}
        placeholder={t('list.filters.searchPlaceholder')}
        onChange={(event) => setText(event.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  )
}
