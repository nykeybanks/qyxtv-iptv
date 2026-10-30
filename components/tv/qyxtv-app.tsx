'use client'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ArrowUpRight, History, X, ChevronLeft, ListVideo } from 'lucide-react'
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

import { LanguageSwitch, useLanguage } from './language-provider'
import { QYXPreloader } from './qyx-preloader'
import { createChannelIndex, searchChannels } from '@/lib/iptv/search'

const emptyChannels: Channel[] = []
export function QYXtvApp({ initialScene = 'discover' }: { initialScene?: Scene }) {
  useViewport()
  const { t, locale, countryName, categoryName, languageName, channelCount } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { preferences, update, storageUnavailable } = usePreferences()
  const [scene, setScene] = useState<Scene>(initialScene)
  const [countryOpen, setCountryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
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
            countryName(preferences.country),
          flag: '',
          count: 0
        }
      : undefined)
  const sceneRef = useSceneMotion(
    `${scene}:${preferences.country}:${selected?.id ?? ''}`,
    preferences.motion
  )
  const countries = useMemo(() => (data?.countries ?? []).map(item => ({ ...item, name: countryName(item.code, item.name) })).sort((a, b) => a.name.localeCompare(b.name, locale)), [data?.countries, locale, countryName])
  const selectedCountryName = country ? countryName(country.code, country.name) : t('Worldwide')
  const sourceChannels =
    scene === 'favorites' || scene === 'recent' ? (library?.channels ?? emptyChannels) : (data?.channels ?? emptyChannels)
  const searchIndex = useMemo(() => createChannelIndex(sourceChannels, data), [sourceChannels, data])
  const channels = useMemo(() => {
    const result = searchChannels(searchIndex, deferredQuery).filter(channel =>
      (!category || channel.categories.includes(category)) && (!language || channel.languages.includes(language)))
    return scene === 'recent' && !deferredQuery.trim()
      ? result.sort((a, b) => preferences.recent.indexOf(a.id) - preferences.recent.indexOf(b.id))
      : result
  }, [searchIndex, deferredQuery, category, language, scene, preferences.recent])
  const featured =
    data?.channels.find(channel => channel.id === 'IciRadioCanadaTele.ca') ??
    data?.channels.find(channel => !channel.streams[0]?.restriction) ??
    data?.channels[0]
  const home = scene === 'discover' && !searchOpen && !query
  const playingScene = scene === 'live' && !!selected
  const initialLoading = !selected && isLoading && !data && !error
  const title =
    scene === 'favorites'
      ? t('Your favorites')
      : scene === 'recent'
        ? t('Recently watched')
        : query
          ? t('Search results')
          : category
            ? t('{name} channels', { name: categoryName(category) })
            : preferences.country === 'CA'
              ? t('Live from Canada')
              : preferences.country === 'ALL'
                ? t('Live around the world')
                : t('Live from {name}', { name: selectedCountryName })

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
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229 || event.altKey) return
      const target = event.target as HTMLElement | null
      const editing = target?.matches('input, textarea, select, [contenteditable="true"]')
      if ((event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !editing)) {
        event.preventDefault()
        setSearchOpen(true)
        if (scene === 'live') { setScene('discover'); history.pushState(null, '', '/') }
        requestAnimationFrame(() => document.querySelector<HTMLInputElement>('.browse-toolbar input[type="search"]')?.focus())
      }
    }
    addEventListener('keydown', shortcut)
    return () => removeEventListener('keydown', shortcut)
  }, [scene])
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
            ? t("Offline. Your saved choices are still available; streams need an internet connection.")
            : storageUnavailable
              ? t("Browser storage is unavailable. Your choices will last for this session only.")
              : data?.warnings[0]}
        </div>
      )}
      <main
        ref={sceneRef}
        className={`tv-main ${initialLoading ? 'catalogue-loading' : home ? 'home-scene' : playingScene ? 'watch-scene' : 'browse-scene'}`}
        id="main-content"
      >
        {initialLoading && <QYXPreloader label={t('Loading QYXtv')} detail={t('Connecting to IPTV-org')} />}
        {!initialLoading && home && (
          <FeaturedChannelHero
            countryName={selectedCountryName}
            featured={featured}
            onWatch={watch}
            onCountries={() => setCountryOpen(true)}
            count={data?.channels.length ?? 0}
          />
        )}
        {!initialLoading && !playingScene && (
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
                {preferences.country !== 'ALL' && scene !== 'favorites' && scene !== 'recent' && (
                  <button className="search-scope" title={t('Search worldwide')} aria-label={t('Search worldwide')} onClick={() => update(current => ({ ...current, country: 'ALL' }))}>
                    {selectedCountryName}<ArrowUpRight size={14} />
                  </button>
                )}
                {searchOpen && (
                  <button
                    className="icon-button"
                    aria-label={t("Close search")}
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
                  aria-label={t("Recently watched channels")}
                  onClick={() => navigate('recent')}
                >
                  <History size={20} />
                </button>
              </div>
            )}
            <div className="catalogue-zone" data-scene-group>
              <ChannelGrid
                key={`${scene}:${preferences.country}:${category}:${language}:${deferredQuery}`}
                title={title}
                subtitle={
                  isLoading ? t('Loading catalogue') : channelCount(channels.length)
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
                onReset={query || category || language ? () => { setQuery(''); setCategory(''); setLanguage('') } : undefined}
              />
            </div>
          </>
        )}
        {playingScene && (
          <>
            <div className="watch-heading">
              <div>
                <span className="status-dot" />
                <span>{t("LIVE TELEVISION")}</span>
                <span className="muted">/ {selectedCountryName}</span>
              </div>
              <button className="text-button" onClick={() => navigate('discover')}>
                {t("Back to discover")}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className={`watch-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
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
              <div className="watch-sidebar" id="live-channel-panel" hidden={!sidebarOpen} data-scene-group>
                <ChannelSidebar
                  channels={data?.channels ?? emptyChannels}
                  metadata={data}
                  selectedId={selected.id}
                  onWatch={watch}
                  onCollapse={() => setSidebarOpen(false)}
                />
              </div>
              {!sidebarOpen && <button className="collapsed-channel-rail" aria-label={t('Expand channel panel')} aria-expanded={false} aria-controls="live-channel-panel" onClick={() => setSidebarOpen(true)}>
                <ChevronLeft size={18} className="channel-toggle-hint" />
                <ListVideo size={19} />
                <span>{t('On the air')}</span>
                <small>{data?.channels.length ?? 0}</small>
              </button>}
            </div>
          </>
        )}
      </main>
      <footer className="status-bar">
        <div>
          <span className="status-dot" />
          <span>{t("YOUR WORLD. LIVE.")}</span>
          <span className="footer-rule" />
          <span className="muted">{t("Powered by public IPTV-org streams")}</span>
        </div>
        <div>
          <span className="desktop-only muted">{t("Availability varies by broadcaster and region.")}</span>
          <span className="footer-rule" />
          <span className="footer-brand">{t("A QuantumYield experience")}</span>
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
        title={settingsTab === 'filters' ? t("Fine-tune your channels") : t("Your viewing experience")}
      >
        <div className="settings-tabs">
          <button
            className={settingsTab === 'filters' ? 'active' : ''}
            onClick={() => setSettingsTab('filters')}
          >
            {t("Filters")}
          </button>
          <button
            className={settingsTab === 'viewing' ? 'active' : ''}
            onClick={() => setSettingsTab('viewing')}
          >
            {t("Viewing")}
          </button>
        </div>
        {settingsTab === 'filters' ? (
          <div className="settings-form">
            <label>
              {t("Category")}
              <select value={category} onChange={event => setCategory(event.target.value)}>
                <option value="">{t("All categories")}</option>
                {data?.categories.map(item => (
                  <option key={item.id} value={item.id}>
                    {categoryName(item.id, item.name)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Broadcast language")}
              <select value={language} onChange={event => setLanguage(event.target.value)}>
                <option value="">{t("All languages")}</option>
                {data?.languages
                  .filter(item =>
                    data.channels.some(channel => channel.languages.includes(item.code))
                  )
                  .map(item => (
                    <option key={item.code} value={item.code}>
                      {languageName(item.code, item.name)}
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
                {t("Reset filters")}
              </button>
              <button className="button primary" onClick={() => setSettingsOpen(false)}>
                {t("Show channels")}
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-form">
            <div className="language-setting"><span>{t('Interface language')}</span><LanguageSwitch /></div>
            <label>
              {t("Scene motion")}
              <select
                value={preferences.motion}
                onChange={event =>
                  update(current => ({
                    ...current,
                    motion: event.target.value as typeof current.motion
                  }))
                }
              >
                <option value="immersive">{t("Immersive")}</option>
                <option value="balanced">{t("Balanced")}</option>
                <option value="reduced">{t("Reduced")}</option>
              </select>
            </label>
            <p>
              {t("Immersive and Balanced use a three-second scene transition. Reduced is instant. Your system reduced-motion preference always takes priority.")}
            </p>
            <button
              className="button secondary"
              onClick={() => {
                setSettingsOpen(false)
                navigate('recent')
              }}
            >
              <History size={18} />
              {t("Recently watched")}
            </button>
            <p className="muted">
              {t("Favorites, recent channels, and country selection are saved only in this browser. No account is required.")}
            </p>
          </div>
        )}
      </ViewerDialog>
      <ChannelPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        channels={data?.channels ?? emptyChannels}
        metadata={data}
        selectedId={selected?.id}
        onWatch={watch}
      />
      <ViewerDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        title={selected?.name ?? t("Channel information")}
      >
        {selected && <EPGGuide channel={selected} />}
      </ViewerDialog>
    </div>
  )
}
