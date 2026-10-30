'use client'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ArrowUpRight, History, X } from 'lucide-react'
import type { Catalogue, Channel, Scene } from '@/lib/iptv/types'
import { usePreferences } from '@/hooks/use-preferences'
import { useViewport } from '@/hooks/use-viewport'
import { useSceneMotion } from '@/hooks/use-scene-motion'
import { QYXHeader, MobileNavigation } from './qyx-header'
import { FeaturedChannelHero } from './featured-channel-hero'
import { CategoryFilters, ChannelSearch } from './category-filters'
import { ChannelGrid } from './channel-grid'
import { CountryMegaMenu } from './country-mega-menu'
import { LiveTVPlayer } from './live-tv-player'
import { ChannelSidebar } from './channel-sidebar'
import { ChannelPicker, EPGGuide, ViewerDialog, fetchJson } from './viewer-dialogs'

export function QYXtvApp({ initialScene = 'discover' }: { initialScene?: Scene }) {
  useViewport()
  const { preferences, update, storageUnavailable } = usePreferences()
  const [scene, setScene] = useState<Scene>(initialScene)
  const [countryOpen, setCountryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [selected, setSelected] = useState<Channel | null>(null)
  const [online, setOnline] = useState(true)
  const [settingsTab, setSettingsTab] = useState<'filters' | 'viewing'>('filters')
  const catalogueKey = `/api/catalogue?country=${preferences.country}`
  const { data, error, isLoading, mutate } = useSWR<Catalogue>(catalogueKey, fetchJson, {
    revalidateOnFocus: false,
    errorRetryCount: 2,
    dedupingInterval: 60000
  })
  const libraryIds = scene === 'favorites' ? preferences.favorites : preferences.recent
  const {
    data: library,
    isLoading: libraryLoading,
    error: libraryError,
    mutate: retryLibrary
  } = useSWR<Catalogue>(
    (scene === 'favorites' || scene === 'recent') && libraryIds.length
      ? `/api/catalogue?ids=${encodeURIComponent(libraryIds.join(','))}`
      : null,
    fetchJson,
    { revalidateOnFocus: false }
  )
  const country =
    data?.countries.find(item => item.code === preferences.country) ??
    (preferences.country !== 'ALL'
      ? {
          code: preferences.country,
          name:
            new Intl.DisplayNames(['en'], { type: 'region' }).of(preferences.country) ??
            preferences.country,
          flag: '',
          count: 0
        }
      : undefined)
  const sceneRef = useSceneMotion(
    `${scene}:${preferences.country}:${selected?.id ?? ''}`,
    preferences.motion
  )
  const countries = data?.countries ?? []
  const sourceChannels =
    scene === 'favorites' || scene === 'recent' ? (library?.channels ?? []) : (data?.channels ?? [])
  const channels = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const result = sourceChannels.filter(
      channel =>
        (!category || channel.categories.includes(category)) &&
        (!language || channel.languages.includes(language)) &&
        (!needle ||
          `${channel.name} ${channel.country} ${channel.categories.join(' ')} ${countries.find(country => country.code === channel.country)?.name ?? ''}`
            .toLowerCase()
            .includes(needle))
    )
    return scene === 'recent'
      ? result.sort((a, b) => preferences.recent.indexOf(a.id) - preferences.recent.indexOf(b.id))
      : result
  }, [sourceChannels, query, category, language, countries, scene, preferences.recent])
  const featured =
    data?.channels.find(channel => channel.id === 'IciRadioCanadaTele.ca') ??
    data?.channels.find(channel => !channel.streams[0]?.restriction) ??
    data?.channels[0]
  const home = scene === 'discover' && !searchOpen && !query
  const playingScene = scene === 'live' && !!selected
  const title =
    scene === 'favorites'
      ? 'Your favorites'
      : scene === 'recent'
        ? 'Recently watched'
        : query
          ? 'Search results'
          : category
            ? `${data?.categories.find(item => item.id === category)?.name ?? category} channels`
            : preferences.country === 'CA'
              ? 'Live from Canada'
              : preferences.country === 'ALL'
                ? 'Live around the world'
                : `Live from ${country?.name ?? preferences.country}`

  useEffect(() => {
    document.documentElement.dataset.motion = preferences.motion
    return () => {
      delete document.documentElement.dataset.motion
    }
  }, [preferences.motion])

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine)
    const pop = () => {
      const path = location.pathname.split('/')[1]
      setScene(['live', 'favorites', 'recent'].includes(path) ? (path as Scene) : 'discover')
    }
    updateOnline()
    addEventListener('online', updateOnline)
    addEventListener('offline', updateOnline)
    addEventListener('popstate', pop)
    return () => {
      removeEventListener('online', updateOnline)
      removeEventListener('offline', updateOnline)
      removeEventListener('popstate', pop)
    }
  }, [])
  function navigate(next: Scene) {
    setScene(next)
    history.pushState(null, '', next === 'discover' ? '/' : `/${next}`)
  }
  function watch(channel: Channel) {
    setSelected(channel)
    navigate('live')
  }
  function favorite(id: string) {
    update(current => ({
      ...current,
      favorites: current.favorites.includes(id)
        ? current.favorites.filter(value => value !== id)
        : [...current.favorites, id].slice(-300)
    }))
  }
  function markWatched(id: string) {
    update(current => ({
      ...current,
      recent: [id, ...current.recent.filter(value => value !== id)].slice(0, 100)
    }))
  }
  function adjacent(direction: number) {
    const list = channels.length ? channels : (data?.channels ?? [])
    if (!list.length) return
    const index = list.findIndex(channel => channel.id === selected?.id)
    watch(list[(Math.max(0, index) + direction + list.length) % list.length])
  }
  function chooseCountry(code: string) {
    update(current => ({ ...current, country: code }))
    setCountryOpen(false)
    setCategory('')
    setLanguage('')
    setQuery('')
    if (scene === 'favorites' || scene === 'recent') navigate('discover')
  }
  function openFilters(tab: 'filters' | 'viewing') {
    setSettingsTab(tab)
    setSettingsOpen(true)
  }

  return (
    <div className="tv-shell" data-motion={preferences.motion} data-ready="true">
      <QYXHeader
        scene={scene}
        onNavigate={navigate}
        country={country}
        onCountries={() => setCountryOpen(true)}
        onSearch={() => {
          setSearchOpen(value => !value)
          if (scene === 'live') navigate('discover')
        }}
        onSettings={() => openFilters('viewing')}
        onCategories={() => openFilters('filters')}
      />
      {(!online || storageUnavailable || !!data?.warnings.length) && (
        <div className="app-notice" role="status">
          {!online
            ? 'Offline. Your saved choices are still available; streams need an internet connection.'
            : storageUnavailable
              ? 'Browser storage is unavailable. Your choices will last for this session only.'
              : data?.warnings[0]}
        </div>
      )}
      <main
        ref={sceneRef}
        className={`tv-main ${home ? 'home-scene' : playingScene ? 'watch-scene' : 'browse-scene'}`}
        id="main-content"
      >
        {home && (
          <FeaturedChannelHero
            countryName={country?.name ?? 'Worldwide'}
            featured={featured}
            onWatch={watch}
            onCountries={() => setCountryOpen(true)}
            count={data?.channels.length ?? 0}
          />
        )}
        {!playingScene && (
          <>
            <CategoryFilters
              value={category}
              onChange={setCategory}
              categories={data?.categories ?? []}
              onAdvanced={() => openFilters('filters')}
            />
            {(searchOpen || !home) && (
              <div className="browse-toolbar">
                <ChannelSearch query={query} onChange={setQuery} autoFocus={searchOpen} />
                {searchOpen && (
                  <button
                    className="icon-button"
                    aria-label="Close search"
                    onClick={() => {
                      setSearchOpen(false)
                      setQuery('')
                    }}
                  >
                    <X size={20} />
                  </button>
                )}
                <button
                  className="icon-button"
                  aria-label="Recently watched channels"
                  onClick={() => navigate('recent')}
                >
                  <History size={20} />
                </button>
              </div>
            )}
            <div className="catalogue-zone" data-scene-group>
              <ChannelGrid
                key={`${scene}:${preferences.country}:${category}:${language}:${query}`}
                title={title}
                subtitle={
                  isLoading ? 'Loading catalogue' : `${channels.length.toLocaleString()} channels`
                }
                channels={channels}
                favorites={preferences.favorites}
                onFavorite={favorite}
                onWatch={watch}
                loading={scene === 'favorites' || scene === 'recent' ? libraryLoading : isLoading}
                error={
                  (scene === 'favorites' || scene === 'recent' ? libraryError : error)?.message
                }
                onRetry={() => {
                  if (scene === 'favorites' || scene === 'recent') void retryLibrary()
                  else void mutate()
                }}
                carousel={home}
                selectedId={selected?.id}
              />
            </div>
          </>
        )}
        {playingScene && (
          <>
            <div className="watch-heading">
              <div>
                <span className="status-dot" />
                <span>LIVE TELEVISION</span>
                <span className="muted">/ {country?.name ?? 'Worldwide'}</span>
              </div>
              <button className="text-button" onClick={() => navigate('discover')}>
                Back to discover
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="watch-layout">
              <div className="watch-primary">
                <LiveTVPlayer
                  channel={selected}
                  onNext={() => adjacent(1)}
                  onPrevious={() => adjacent(-1)}
                  onChannels={() => setPickerOpen(true)}
                  onInfo={() => setInfoOpen(true)}
                  onPlaying={markWatched}
                />
              </div>
              <div className="watch-sidebar" data-scene-group>
                <ChannelSidebar
                  channels={data?.channels ?? []}
                  selectedId={selected.id}
                  onWatch={watch}
                />
              </div>
            </div>
          </>
        )}
      </main>
      <footer className="status-bar">
        <div>
          <span className="status-dot" />
          <span>YOUR WORLD. LIVE.</span>
          <span className="footer-rule" />
          <span className="muted">Powered by public IPTV-org streams</span>
        </div>
        <div>
          <span className="desktop-only muted">Availability varies by broadcaster and region.</span>
          <span className="footer-rule" />
          <span className="footer-brand">A QuantumYield experience</span>
        </div>
      </footer>
      <MobileNavigation
        scene={scene}
        onNavigate={navigate}
        onCountries={() => setCountryOpen(true)}
      />
      <CountryMegaMenu
        open={countryOpen}
        onOpenChange={setCountryOpen}
        countries={countries}
        selected={preferences.country}
        onSelect={chooseCountry}
      />
      <ViewerDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title={settingsTab === 'filters' ? 'Fine-tune your channels' : 'Your viewing experience'}
      >
        <div className="settings-tabs">
          <button
            className={settingsTab === 'filters' ? 'active' : ''}
            onClick={() => setSettingsTab('filters')}
          >
            Filters
          </button>
          <button
            className={settingsTab === 'viewing' ? 'active' : ''}
            onClick={() => setSettingsTab('viewing')}
          >
            Viewing
          </button>
        </div>
        {settingsTab === 'filters' ? (
          <div className="settings-form">
            <label>
              Category
              <select value={category} onChange={event => setCategory(event.target.value)}>
                <option value="">All categories</option>
                {data?.categories.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Broadcast language
              <select value={language} onChange={event => setLanguage(event.target.value)}>
                <option value="">All languages</option>
                {data?.languages
                  .filter(item =>
                    data.channels.some(channel => channel.languages.includes(item.code))
                  )
                  .map(item => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className="settings-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setCategory('')
                  setLanguage('')
                  setQuery('')
                }}
              >
                Reset filters
              </button>
              <button className="button primary" onClick={() => setSettingsOpen(false)}>
                Show channels
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-form">
            <label>
              Scene motion
              <select
                value={preferences.motion}
                onChange={event =>
                  update(current => ({
                    ...current,
                    motion: event.target.value as typeof current.motion
                  }))
                }
              >
                <option value="immersive">Immersive</option>
                <option value="balanced">Balanced</option>
                <option value="reduced">Reduced</option>
              </select>
            </label>
            <p>
              Immersive and Balanced use a three-second scene transition. Reduced is instant. Your
              system reduced-motion preference always takes priority.
            </p>
            <button
              className="button secondary"
              onClick={() => {
                setSettingsOpen(false)
                navigate('recent')
              }}
            >
              <History size={18} />
              Recently watched
            </button>
            <p className="muted">
              Favorites, recent channels, and country selection are saved only in this browser. No
              account is required.
            </p>
          </div>
        )}
      </ViewerDialog>
      <ChannelPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        channels={data?.channels ?? []}
        selectedId={selected?.id}
        onWatch={watch}
      />
      <ViewerDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        title={selected?.name ?? 'Channel information'}
      >
        {selected && <EPGGuide channel={selected} />}
      </ViewerDialog>
    </div>
  )
}
