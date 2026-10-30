import parser from 'iptv-playlist-parser'
import type { Channel } from './types'

export interface ChannelMetadata {
  id: string
  name: string
  country: string
  categories: string[]
  is_nsfw: boolean
  closed: string | null
  website: string | null
}
export interface FeedMetadata {
  channel: string
  id: string
  languages: string[]
  format: string
}

export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}

export function normalizePlaylist(
  text: string,
  metadata: ChannelMetadata[],
  feeds: FeedMetadata[],
  blocked: Set<string>
): Channel[] {
  if (!text.trimStart().startsWith('#EXTM3U')) throw new Error('Invalid upstream playlist')
  const channelMap = new Map(metadata.map(channel => [channel.id, channel]))
  const feedMap = new Map(feeds.map(feed => [`${feed.channel}@${feed.id}`, feed]))
  const result = new Map<string, Channel>()
  for (const item of parser.parse(text).items) {
    const [id, feedId] = item.tvg.id.split('@')
    const meta = channelMap.get(id)
    if (!meta || meta.is_nsfw || meta.closed || blocked.has(id)) continue
    const url = safeHttpUrl(item.url)
    if (!url) continue
    const feed = feedMap.get(`${id}@${feedId}`)
    const restriction = !url.startsWith('https:')
      ? 'HTTP stream: blocked on secure pages'
      : /http-(referrer|user-agent)[=:]/i.test(item.raw)
        ? 'Requires broadcaster-specific request headers'
        : !/\.m3u8(?:[?#]|$)/i.test(url)
          ? 'Format not identified as HLS'
          : null
    const channel = result.get(id) ?? {
      id,
      name: meta.name,
      country: meta.country,
      categories: meta.categories,
      logo: safeHttpUrl(item.tvg.logo)?.replace(/^http:/, 'https:') ?? null,
      languages: [],
      streams: [],
      website: safeHttpUrl(meta.website)
    }
    if (!channel.streams.some(stream => stream.url === url))
      channel.streams.push({
        url,
        feed: feedId || null,
        quality: feed?.format ?? null,
        restriction
      })
    channel.languages = [...new Set([...channel.languages, ...(feed?.languages ?? [])])]
    result.set(id, channel)
  }
  for (const channel of result.values())
    channel.streams.sort((a, b) => Number(!!a.restriction) - Number(!!b.restriction))
  return [...result.values()].sort(
    (a, b) =>
      Number(a.country !== 'CA') - Number(b.country !== 'CA') ||
      Number(!!a.streams[0]?.restriction) - Number(!!b.streams[0]?.restriction) ||
      a.name.localeCompare(b.name)
  )
}
