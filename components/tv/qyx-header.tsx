'use client'
import {
  ChevronDown,
  Globe2,
  Heart,
  Search,
  Tv,
  Compass,
  Grid2X2,
  SlidersHorizontal
} from 'lucide-react'
import { QYXProductMark } from '@/components/brand'
import type { Country, Scene } from '@/lib/iptv/types'
import { LanguageSwitch, useLanguage } from './language-provider'

export function QYXHeader({
  scene,
  onNavigate,
  country,
  onCountries,
  onSearch,
  onSettings,
  onCategories
}: {
  scene: Scene
  onNavigate: (scene: Scene) => void
  country?: Country
  onCountries: () => void
  onSearch: () => void
  onSettings: () => void
  onCategories: () => void
}) {
  const { t, countryName } = useLanguage()
  return (
    <header className="qyx-header">
      <button className="brand-link" onClick={() => onNavigate('discover')} aria-label={t("QYXtv home")}>
        <QYXProductMark product="qyxtv" height={30} alt="QYXtv" />
      </button>
      <span className="header-divider" />
      <nav className="primary-nav" aria-label={t("Main navigation")}>
        <button className={scene === 'live' ? 'active' : ''} onClick={() => onNavigate('live')}>
          <Tv size={16} />
          {t("Live TV")}
        </button>
        <button
          className={scene === 'discover' ? 'active' : ''}
          onClick={() => onNavigate('discover')}
        >
          <Compass size={16} />
          {t("Discover")}
        </button>
        <button onClick={onCategories}>
          <Grid2X2 size={16} />
          {t("Categories")}
        </button>
        <button onClick={onCountries}>
          <Globe2 size={16} />
          {t("Countries")}
        </button>
        <button
          className={scene === 'favorites' ? 'active' : ''}
          onClick={() => onNavigate('favorites')}
        >
          <Heart size={16} />
          {t("Favorites")}
        </button>
      </nav>
      <div className="header-actions">
        <LanguageSwitch />
        <button
          className="icon-button search-trigger"
          onClick={onSearch}
          aria-label={t("Search channels")}
        >
          <Search size={20} />
        </button>
        <button
          className="country-selector"
          onClick={onCountries}
          aria-label={t('Select country, current {name}', { name: country ? countryName(country.code, country.name) : t('Worldwide') })}
        >
          <span className="country-flag">{country?.flag ?? <Globe2 size={18} />}</span>
          <span className="selected-country-name">{country ? countryName(country.code, country.name) : t('Worldwide')}</span>
          <ChevronDown size={14} />
        </button>
        <button
          className="icon-button settings-trigger"
          onClick={onSettings}
          aria-label={t("Viewing settings")}
        >
          <SlidersHorizontal size={19} />
        </button>
      </div>
    </header>
  )
}

export function MobileNavigation({
  scene,
  onNavigate,
  onCountries
}: {
  scene: Scene
  onNavigate: (scene: Scene) => void
  onCountries: () => void
}) {
  const { t, countryName } = useLanguage()
  return (
    <nav className="mobile-nav" aria-label={t("Mobile navigation")}>
      <button
        className={scene === 'discover' ? 'active' : ''}
        onClick={() => onNavigate('discover')}
      >
        <Compass size={18} />
        <span>{t("Discover")}</span>
      </button>
      <button className={scene === 'live' ? 'active' : ''} onClick={() => onNavigate('live')}>
        <Tv size={18} />
        <span>{t("Live TV")}</span>
      </button>
      <button onClick={onCountries}>
        <Globe2 size={18} />
        <span>{t("Countries")}</span>
      </button>
      <button
        className={scene === 'favorites' ? 'active' : ''}
        onClick={() => onNavigate('favorites')}
      >
        <Heart size={18} />
        <span>{t("Favorites")}</span>
      </button>
    </nav>
  )
}
