import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchIcon } from '../../../components/icons.tsx'
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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="field-label">
        {t('list.filters.search')}
      </label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -transtone-y-1/2 text-stone-400" />
        <input
          id={id}
          type="search"
          value={text}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder={t('list.filters.searchPlaceholder')}
          onChange={(event) => setText(event.target.value)}
          className="input pl-9"
        />
      </div>
    </div>
  )
}
