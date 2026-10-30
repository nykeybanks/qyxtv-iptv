'use client'
import { useRef } from 'react'
import { useLanguage } from './language-provider'
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
] as const
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
  const { t, categoryName } = useLanguage()
  return (
    <div className="category-bar">
      <div className="category-pills" role="group" aria-label={t("Channel categories")}>
        {presets.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            className={value === id ? 'active' : ''}
            onClick={() => onChange(id)}
            aria-pressed={value === id}
          >
            <Icon size={16} />
            {t(name)}
          </button>
        ))}
      </div>
      <label className="category-select">
        <SlidersHorizontal size={16} />
        <select
          aria-label={t("Channel category")}
          value={value}
          onChange={event => onChange(event.target.value)}
        >
          <option value="">{t("All channels")}</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {categoryName(category.id, category.name)}
            </option>
          ))}
        </select>
      </label>
      <button className="filter-button" onClick={onAdvanced} aria-label={t('Filters')}>
        <SlidersHorizontal size={16} />
        <span>{t("Filters")}</span>
      </button>
    </div>
  )
}
export function ChannelSearch({
  query,
  onChange,
  autoFocus,
  label,
  placeholder
}: {
  query: string
  onChange: (value: string) => void
  autoFocus?: boolean
  label?: string
  placeholder?: string
}) {
  const { t } = useLanguage()
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="search-field channel-search" role="search">
      <Search size={19} />
      <input
        ref={ref}
        type="search"
        aria-label={label ?? t('Search channels')}
        placeholder={placeholder ?? t('Channel, country, category or language…')}
        autoComplete="off"
        spellCheck={false}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) return
          if (event.key === 'Escape' && query) { event.stopPropagation(); onChange('') }
        }}
        value={query}
        onChange={event => onChange(event.target.value)}
        autoFocus={autoFocus}
      />
      {query && (
        <button
          type="button"
          className="icon-button"
          aria-label={t("Clear search")}
          onClick={() => {
            onChange('')
            ref.current?.focus()
          }}
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}
