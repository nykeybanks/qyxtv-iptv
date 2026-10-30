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
  return (
    <header className="qyx-header">
      <button className="brand-link" onClick={() => onNavigate('discover')} aria-label="QYXtv home">
        <QYXProductMark product="qyxtv" height={30} alt="QYXtv" />
      </button>
      <span className="header-divider" />
      <nav className="primary-nav" aria-label="Main navigation">
        <button className={scene === 'live' ? 'active' : ''} onClick={() => onNavigate('live')}>
          <Tv size={16} />
          Live TV
        </button>
        <button
          className={scene === 'discover' ? 'active' : ''}
          onClick={() => onNavigate('discover')}
        >
          <Compass size={16} />
          Discover
        </button>
        <button onClick={onCategories}>
          <Grid2X2 size={16} />
          Categories
        </button>
        <button onClick={onCountries}>
          <Globe2 size={16} />
          Countries
        </button>
        <button
          className={scene === 'favorites' ? 'active' : ''}
          onClick={() => onNavigate('favorites')}
        >
          <Heart size={16} />
          Favorites
        </button>
      </nav>
      <div className="header-actions">
        <button
          className="icon-button search-trigger"
          onClick={onSearch}
          aria-label="Search channels"
        >
          <Search size={20} />
        </button>
        <button
          className="country-selector"
          onClick={onCountries}
          aria-label={`Select country, current ${country?.name ?? 'Worldwide'}`}
        >
          <span className="country-flag">{country?.flag ?? <Globe2 size={18} />}</span>
          <span className="selected-country-name">{country?.name ?? 'Worldwide'}</span>
          <ChevronDown size={14} />
        </button>
        <button
          className="icon-button settings-trigger"
          onClick={onSettings}
          aria-label="Viewing settings"
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
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <button
        className={scene === 'discover' ? 'active' : ''}
        onClick={() => onNavigate('discover')}
      >
        <Compass size={18} />
        <span>Discover</span>
      </button>
      <button className={scene === 'live' ? 'active' : ''} onClick={() => onNavigate('live')}>
        <Tv size={18} />
        <span>Live TV</span>
      </button>
      <button onClick={onCountries}>
        <Globe2 size={18} />
        <span>Countries</span>
      </button>
      <button
        className={scene === 'favorites' ? 'active' : ''}
        onClick={() => onNavigate('favorites')}
      >
        <Heart size={18} />
        <span>Favorites</span>
      </button>
    </nav>
  )
}
