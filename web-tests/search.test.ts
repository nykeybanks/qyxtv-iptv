import { describe, expect, it } from 'vitest'
import { createChannelIndex, normalizeSearch, searchChannels } from '../lib/iptv/search'
import { categoryName, displayName, french, translate } from '../lib/iptv/i18n'
import type { Channel } from '../lib/iptv/types'
const channel = (id: string, name: string, country = 'CA', categories = ['news'], languages = ['fra']): Channel => ({ id, name, country, categories, languages, streams: [], logo: null, website: null })
const channels = [
  channel('ottawa', 'Télé Ottawa'), channel('tele', 'Télé'),
  channel('us', 'World News', 'US', ['news'], ['eng']),
  channel('sports', 'Sports Montréal', 'CA', ['sports'], ['fra'])
]
const index = createChannelIndex(channels)
describe('bilingual channel discovery', () => {
  it('normalizes accents, punctuation and whitespace', () => {
    expect(normalizeSearch('  TÉLÉ—Québec  ')).toBe('tele quebec')
    expect(normalizeSearch('café')).toBe(normalizeSearch('cafe\u0301'))
  })
  it('ranks exact channel names above prefixes', () => {
    expect(searchChannels(index, 'tele').map(item => item.id)).toEqual(['tele', 'ottawa'])
  })
  it('matches all words across bilingual metadata', () => {
    expect(searchChannels(index, 'canada actualites francais').map(item => item.id)).toEqual(['ottawa', 'tele'])
    expect(searchChannels(index, 'united states english').map(item => item.id)).toEqual(['us'])
    expect(searchChannels(index, 'etats unis actualites').map(item => item.id)).toEqual(['us'])
  })
  it('preserves order for empty searches and does not mutate inputs', () => {
    expect(searchChannels(index, '   ')).toEqual(channels)
    searchChannels(index, 'tele')
    expect(index[0].channel.id).toBe('ottawa')
    expect(searchChannels(index, 'does not exist')).toEqual([])
  })
  it('matches supplied language metadata when browser display names cannot resolve it', () => {
    const items = [channel('custom', 'Custom', 'CA', [], ['zzz'])]
    const custom = createChannelIndex(items, { countries: [], languages: [{ code: 'zzz', name: 'Local language' }] })
    expect(searchChannels(custom, 'local language')).toEqual(items)
  })
})
describe('English / French interface', () => {
  it('translates and formats without translating channel names', () => {
    expect(translate('fr', 'Watch {name}', { name: 'Télé Ottawa' })).toBe('Regarder Télé Ottawa')
    expect(translate('en', 'Watch {name}', { name: 'Télé Ottawa' })).toBe('Watch Télé Ottawa')
    expect(translate('fr', '{count} channels', { count: 130 })).toBe('130 chaînes')
  })
  it('preserves every interpolation key in French', () => {
    for (const [key, value] of Object.entries(french)) {
      expect(value.match(/\{\w+\}/g)?.sort() ?? []).toEqual(key.match(/\{\w+\}/g)?.sort() ?? [])
    }
  })
  it('provides safe localized region, category and language names', () => {
    expect(displayName('US', 'fr', 'region')).toBe('États-Unis')
    expect(displayName('fra', 'en', 'language')).toBe('French')
    expect(displayName('ALL', 'fr', 'region')).toBe('Monde entier')
    expect(displayName('not-a-region', 'fr', 'region', 'Fallback')).toBe('Fallback')
    expect(categoryName('news', 'fr')).toBe('Actualités')
    expect(categoryName('future-category', 'fr', 'New category')).toBe('New category')
  })
})
