import { describe, expect, it } from 'vitest'
import { normalizePlaylist, safeHttpUrl, type ChannelMetadata } from '../lib/iptv/normalize'
const meta = (id: string, country = 'CA'): ChannelMetadata => ({
  id,
  name: id,
  country,
  categories: ['news'],
  is_nsfw: false,
  closed: null,
  website: null
})
const playlist = (id: string, url: string) =>
  `#EXTINF:-1 tvg-id="${id}@HD" tvg-logo="https://example.org/logo.png",${id}\n${url}`
describe('IPTV catalogue normalization', () => {
  it('merges feeds by stable channel ID and deduplicates URLs', () => {
    const text = `#EXTM3U\n${playlist('News.ca', 'https://example.org/live.m3u8')}\n${playlist('News.ca', 'https://example.org/live.m3u8')}`
    const channels = normalizePlaylist(
      text,
      [meta('News.ca')],
      [{ channel: 'News.ca', id: 'HD', languages: ['eng'], format: '1080p' }],
      new Set()
    )
    expect(channels).toHaveLength(1)
    expect(channels[0].streams).toHaveLength(1)
    expect(channels[0].languages).toEqual(['eng'])
    expect(channels[0].streams[0].quality).toBe('1080p')
  })
  it('excludes blocked, adult, closed and unverified channels', () => {
    const text =
      '#EXTM3U\n' +
      ['Blocked.ca', 'Adult.ca', 'Closed.ca', 'Unknown.ca']
        .map(id => playlist(id, 'https://example.org/live.m3u8'))
        .join('\n')
    expect(
      normalizePlaylist(
        text,
        [
          meta('Blocked.ca'),
          { ...meta('Adult.ca'), is_nsfw: true },
          { ...meta('Closed.ca'), closed: '2020-01-01' }
        ],
        [],
        new Set(['Blocked.ca'])
      )
    ).toHaveLength(0)
  })
  it('prioritizes Canada and browser-compatible sources', () => {
    const text =
      '#EXTM3U\n' +
      [
        playlist('A.us', 'https://example.org/a.m3u8'),
        playlist('B.ca', 'http://example.org/b.m3u8'),
        playlist('B.ca', 'https://example.org/b.m3u8')
      ].join('\n')
    const channels = normalizePlaylist(text, [meta('A.us', 'US'), meta('B.ca')], [], new Set())
    expect(channels[0].id).toBe('B.ca')
    expect(channels[0].streams[0].restriction).toBeNull()
    expect(channels[0].streams[1].restriction).toContain('HTTP')
  })
  it('rejects non-playlist responses and unsafe URLs', () => {
    expect(() => normalizePlaylist('<html>error</html>', [], [], new Set())).toThrow()
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpUrl('https://user:password@example.org')).toBeNull()
  })
})
