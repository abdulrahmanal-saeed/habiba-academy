import { useState, useEffect, type FC } from 'react'
import { Search } from 'lucide-react'

export interface HelpSearchProps {
  placeholder?: string
  onSearch: (value: string) => void
}

export const HelpSearch: FC<HelpSearchProps> = ({
  placeholder = 'ابحث في مركز المساعدة...',
  onSearch,
}) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    const id = setTimeout(() => onSearch(value), 300)
    return () => clearTimeout(id)
  }, [value, onSearch])

  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--muted)' }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-lg)] py-3 pe-4 ps-12 text-sm outline-none transition-colors"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--ink)',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}
