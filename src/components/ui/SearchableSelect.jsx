import { useState, useRef, useEffect } from 'react'
import Icon from './Icons'

// options: [{ value, label }]
// value, onChange(value), placeholder, disabled, required
export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Selecione…', disabled = false, required = false, className = '' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selected = options.find(o => o.value === value)

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    if (!open) { setQuery('') }
    else { setTimeout(() => inputRef.current?.focus(), 0) }
  }, [open])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(val) {
    onChange(val)
    setOpen(false)
  }

  const baseCls = `h-[42px] px-[14px] rounded-md border border-line bg-surface text-ink-2 font-body text-md
    focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/12 transition-colors w-full ${className}`

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`${baseCls} flex items-center justify-between gap-2 text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${!selected ? 'text-ink-4' : ''}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <Icon name="chevronRight" size={14} className={`shrink-0 text-ink-3 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>

      {required && (
        <input
          tabIndex={-1}
          value={value ?? ''}
          onChange={() => {}}
          required
          className="absolute opacity-0 h-0 w-0 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-line rounded-md shadow-md overflow-hidden">
          <div className="px-2 pt-2 pb-1.5">
            <div className="flex items-center gap-2 h-[32px] px-2.5 rounded border border-line-2 focus-within:border-line transition-colors">
              <Icon name="search" size={12} className="text-ink-4 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar…"
                className="flex-1 bg-transparent text-[13px] text-ink-2 placeholder:text-ink-4 focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-[13px] text-ink-3 italic">Nenhum resultado</li>
            ) : filtered.map(o => (
              <li
                key={o.value}
                onClick={() => handleSelect(o.value)}
                className={`px-3 py-2 text-[13px] cursor-pointer transition-colors hover:bg-surface-2
                  ${o.value === value ? 'font-medium text-ink' : 'text-ink-2'}`}
              >
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
