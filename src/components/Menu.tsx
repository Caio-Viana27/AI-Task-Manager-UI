import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

interface MenuProps {
  /** The trigger's content. Give it an accessible name, e.g. with an `sr-only` span or `label`. */
  trigger: ReactNode
  /** Already translated accessible name of the trigger, when its content has none of its own. */
  label?: string
  triggerClassName?: string
  /** Which edge of the trigger the menu lines up with. */
  align?: 'start' | 'end'
  /** Where the menu opens. `up` for triggers near the bottom of the screen. */
  side?: 'down' | 'up'
  /** The items, given a `close` function. Use `MenuItem`. */
  children: (close: () => void) => ReactNode
}

function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])')) : []
}

/**
 * A button that opens a small menu. Focus moves to the first item when it opens; the arrow
 * keys move between items; Escape, Tab, a pick or a click outside closes it.
 */
export function Menu({ trigger, label, triggerClassName, align = 'end', side = 'down', children }: MenuProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const triggerId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    menuItems(menuRef.current)[0]?.focus()
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // Found by id rather than a ref, since `close` is handed to the items while rendering.
  function close() {
    setOpen(false)
    document.getElementById(triggerId)?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      close()
      return
    }
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }
    event.preventDefault()
    const items = menuItems(menuRef.current)
    const index = items.indexOf(document.activeElement as HTMLElement)
    const next = event.key === 'ArrowDown' ? index + 1 : index - 1
    items[(next + items.length) % items.length]?.focus()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          onKeyDown={onKeyDown}
          className={`absolute z-50 min-w-40 animate-pop-in rounded-lg border border-line bg-white p-1 shadow-lift ${
            align === 'end' ? 'right-0' : 'left-0'
          } ${side === 'down' ? 'top-full mt-1' : 'bottom-full mb-1'}`}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  onSelect: () => void
  /** `true` or `false` makes it a `menuitemradio` with that `aria-checked`. */
  checked?: boolean
  destructive?: boolean
  icon?: ReactNode
  children: ReactNode
}

export function MenuItem({ onSelect, checked, destructive = false, icon, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap focus:outline-none ${
        destructive
          ? 'text-red-700 hover:bg-red-50 focus:bg-red-50'
          : 'text-stone-700 hover:bg-stone-100 focus:bg-stone-100'
      } ${checked ? 'font-semibold text-brand-800' : ''}`}
    >
      {icon}
      {children}
    </button>
  )
}
