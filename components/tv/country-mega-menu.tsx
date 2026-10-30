'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { useMemo, useRef, useState } from 'react'
import { Check, Globe2, Search, X } from 'lucide-react'
import type { Country } from '@/lib/iptv/types'
import { useGridCapacity } from '@/hooks/use-viewport'
import { Pager } from './channel-grid'
import { useLanguage } from './language-provider'
import { normalizeSearch } from '@/lib/iptv/search'

export function CountryMegaMenu({
  open,
  onOpenChange,
  countries,
  selected,
  onSelect
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  countries: Country[]
  selected: string
  onSelect: (code: string) => void
}) {
  const { t } = useLanguage()
  const returnFocus = useRef<HTMLElement | null>(null)
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState('')
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop" />
        <Dialog.Content
          className="country-dialog"
          aria-describedby="country-description"
          onOpenAutoFocus={() => {
            returnFocus.current = document.activeElement as HTMLElement
          }}
          onCloseAutoFocus={event => {
            event.preventDefault()
            returnFocus.current?.focus()
          }}
        >
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">{t("NO BORDERS. JUST TELEVISION.")}</span>
              <Dialog.Title>{t("Explore the world.")}</Dialog.Title>
            </div>
            <Dialog.Close className="icon-button" aria-label={t("Close country menu")}>
              <X size={22} />
            </Dialog.Close>
          </div>
          <Dialog.Description id="country-description">
            {t("Find your home. Discover somewhere new.")}
          </Dialog.Description>
          <div className="country-tools">
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label={t("Search countries")}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={t("Search countries…")}
              />
            </label>
            <select
              aria-label={t("Country alphabetical group")}
              value={letter}
              onChange={event => setLetter(event.target.value)}
            >
              <option value="">A–Z</option>
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="country-pinned">
            <button className={selected === 'CA' ? 'active' : ''} onClick={() => onSelect('CA')}>
              <span className="country-flag">
                {countries.find(country => country.code === 'CA')?.flag ?? 'CA'}
              </span>
              <span>
                <strong>Canada</strong>
                <small>{t("HOME COUNTRY")}</small>
              </span>
              {selected === 'CA' && <Check size={18} />}
            </button>
            <button className={selected === 'ALL' ? 'active' : ''} onClick={() => onSelect('ALL')}>
              <Globe2 size={24} />
              <span>
                <strong>{t("Worldwide")}</strong>
                <small>{t("EVERY COUNTRY")}</small>
              </span>
              {selected === 'ALL' && <Check size={18} />}
            </button>
          </div>
          <CountryResults
            key={`${query}:${letter}`}
            countries={countries}
            query={query}
            letter={letter}
            selected={selected}
            onSelect={onSelect}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function CountryResults({
  countries,
  query,
  letter,
  selected,
  onSelect
}: {
  countries: Country[]
  query: string
  letter: string
  selected: string
  onSelect: (code: string) => void
}) {
  const { t, channelCount, number } = useLanguage()
  const { ref, capacity, columns } = useGridCapacity(180, 88)
  const [anchor, setAnchor] = useState(0)
  const filtered = useMemo(
    () =>
      countries.filter(
        country =>
          (normalizeSearch(country.name).includes(normalizeSearch(query)) ||
            normalizeSearch(country.code) === normalizeSearch(query)) &&
          (!letter || normalizeSearch(country.name).startsWith(letter.toLowerCase()))
      ),
    [countries, query, letter]
  )
  const pages = capacity ? Math.ceil(filtered.length / capacity) : 0
  const page = Math.min(Math.floor(anchor / (capacity || 1)), Math.max(0, pages - 1))
  return (
    <div className="country-results">
      <div
        className="country-grid"
        ref={ref}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {!capacity ? (
          <p className="fit-notice">{t("Close the keyboard to browse the country grid.")}</p>
        ) : (
          filtered.slice(page * capacity, (page + 1) * capacity).map(country => (
            <button
              className={`country-option ${selected === country.code ? 'selected' : ''}`}
              key={country.code}
              onClick={() => onSelect(country.code)}
              aria-pressed={selected === country.code}
            >
              <span className="country-flag">{country.flag}</span>
              <span>
                <strong>{country.name}</strong>
                <small>{channelCount(country.count)}</small>
              </span>
              {selected === country.code && <Check size={16} />}
            </button>
          ))
        )}
        {capacity > 0 && !filtered.length && <p>{t("No matching countries.")}</p>}
      </div>
      <div className="country-bottom">
        <span>
          {t('{count} countries', { count: number(filtered.length) })} <span className="desktop-only">· {t('Alphabetical order')}</span>
        </span>
        <Pager
          page={page}
          pages={pages}
          onPage={next => setAnchor(next * capacity)}
          label="countries"
        />
      </div>
    </div>
  )
}
