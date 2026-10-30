'use client'
import { useRef } from 'react'
import {
  Search,
  X,
  SlidersHorizontal,
  Radio,
  Newspaper,
  Trophy,
  Clapperboard,
  Music2,
  Smile,
  Earth,
  Sparkles
} from 'lucide-react'
const presets = [
  { id: '', name: 'All channels', icon: Radio },
  { id: 'news', name: 'News', icon: Newspaper },
  { id: 'sports', name: 'Sports', icon: Trophy },
  { id: 'entertainment', name: 'Entertainment', icon: Sparkles },
  { id: 'movies', name: 'Movies', icon: Clapperboard },
  { id: 'music', name: 'Music', icon: Music2 },
  { id: 'kids', name: 'Kids', icon: Smile },
  { id: 'documentary', name: 'Documentary', icon: Earth }
]
export function CategoryFilters({
  value,
  onChange,
  categories,
  onAdvanced
}: {
  value: string
  onChange: (value: string) => void
  categories: { id: string; name: string }[]
  onAdvanced: () => void
}) {
  return (
    <div className="category-bar">
      <div className="category-pills" role="group" aria-label="Channel categories">
        {presets.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            className={value === id ? 'active' : ''}
            onClick={() => onChange(id)}
            aria-pressed={value === id}
          >
            <Icon size={16} />
            {name}
          </button>
        ))}
      </div>
      <label className="category-select">
        <SlidersHorizontal size={16} />
        <select
          aria-label="Channel category"
          value={value}
          onChange={event => onChange(event.target.value)}
        >
          <option value="">All channels</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <button className="filter-button" onClick={onAdvanced}>
        <SlidersHorizontal size={16} />
        <span>Filters</span>
      </button>
    </div>
  )
}
export function ChannelSearch({
  query,
  onChange,
  autoFocus
}: {
  query: string
  onChange: (value: string) => void
  autoFocus?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <label className="search-field channel-search">
      <Search size={19} />
      <input
        ref={ref}
        aria-label="Search channels"
        placeholder="Search channels, countries or categories…"
        value={query}
        onChange={event => onChange(event.target.value)}
        autoFocus={autoFocus}
      />
      {query && (
        <button
          type="button"
          className="icon-button"
          aria-label="Clear search"
          onClick={() => {
            onChange('')
            ref.current?.focus()
          }}
        >
          <X size={18} />
        </button>
      )}
    </label>
  )
}
