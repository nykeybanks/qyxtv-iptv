import {
  normalizePlaylist,
  safeHttpUrl,
  type ChannelMetadata,
  type FeedMetadata
} from './normalize'
import type { Catalogue, Country, GuideSource } from './types'

const API = 'https://iptv-org.github.io/api'
const TTL = 60 * 60 * 1000
let cache: Catalogue | undefined
let fetchedAt = 0
let pending: Promise<Catalogue> | undefined

async function resource<T>(name: string): Promise<T> {
  const response = await fetch(`${API}/${name}.json`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(20000)
  })
  if (!response.ok) throw new Error(`IPTV metadata unavailable (${response.status})`)
  return response.json() as Promise<T>
}

async function loadCatalogue(): Promise<Catalogue> {
  const warnings: string[] = []
  const [playlist, channels, feeds, countries, categories, languages, blocklist] =
    await Promise.all([
      fetch('https://iptv-org.github.io/iptv/index.m3u', {
        cache: 'no-store',
        signal: AbortSignal.timeout(20000)
      }).then(response => {
        if (!response.ok) throw new Error('Playlist unavailable')
        return response.text()
      }),
      resource<ChannelMetadata[]>('channels'),
      resource<FeedMetadata[]>('feeds').catch(() => {
        warnings.push('Language and quality metadata temporarily unavailable.')
        return []
      }),
      resource<Omit<Country, 'count'>[]>('countries'),
      resource<Catalogue['categories']>('categories'),
      resource<Catalogue['languages']>('languages'),
      resource<{ channel: string }[]>('blocklist')
    ])
  const normalized = normalizePlaylist(
    playlist,
    channels,
    feeds,
    new Set(blocklist.map(item => item.channel))
  )
  const counts = new Map<string, number>()
  for (const channel of normalized)
    counts.set(channel.country, (counts.get(channel.country) ?? 0) + 1)
  return {
    channels: normalized,
    countries: countries
      .map(country => ({ ...country, count: counts.get(country.code) ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    categories,
    languages,
    total: normalized.length,
    updatedAt: new Date().toISOString(),
    warnings
  }
}

export async function getCatalogue(): Promise<Catalogue> {
  if (cache && Date.now() - fetchedAt < TTL) return cache
  if (!pending)
    pending = loadCatalogue()
      .then(data => {
        cache = data
        fetchedAt = Date.now()
        return data
      })
      .catch(error => {
        if (cache)
          return {
            ...cache,
            warnings: [
              ...cache.warnings,
              'Showing the last available catalogue. Live metadata could not be refreshed.'
            ]
          }
        throw error
      })
      .finally(() => {
        pending = undefined
      })
  return pending
}

interface RawGuide {
  channel: string | null
  site: string
  lang: string
  sources: { url: string }[]
}
let guideCache: { expires: number; data: RawGuide[] } | undefined
let guidePending: Promise<RawGuide[]> | undefined
export async function getGuide(id: string): Promise<GuideSource[]> {
  if (!guideCache || Date.now() > guideCache.expires) {
    guidePending ??= resource<RawGuide[]>('guides')
      .then(data => {
        guideCache = { expires: Date.now() + TTL, data }
        return data
      })
      .finally(() => {
        guidePending = undefined
      })
    await guidePending
  }
  const entries = (guideCache?.data ?? []).filter(guide => guide.channel === id)
  return [
    ...new Map(
      entries.map(guide => [
        guide.site,
        { site: guide.site, language: guide.lang, url: safeHttpUrl(guide.sources[0]?.url) }
      ])
    ).values()
  ].slice(0, 4)
}
