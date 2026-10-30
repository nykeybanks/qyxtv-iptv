import type { Catalogue, Channel } from './types'
import { categoryName, displayName } from './i18n'

export function normalizeSearch(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}
type Metadata = Pick<Catalogue, 'countries' | 'languages'>
export function createChannelIndex(channels: Channel[], metadata?: Metadata) {
  const countryNames = new Map(metadata?.countries.map(country => [country.code, country.name]))
  const languageNames = new Map(metadata?.languages.map(language => [language.code, language.name]))
  return channels.map(channel => ({
    channel,
    name: normalizeSearch(channel.name),
    text: normalizeSearch([
      channel.name, channel.id, channel.country, countryNames.get(channel.country),
      ...(['en', 'fr'] as const).map(locale => displayName(channel.country, locale, 'region')),
      ...channel.categories.flatMap(id => [id, categoryName(id, 'en'), categoryName(id, 'fr')]),
      ...channel.languages.flatMap(code => [code, languageNames.get(code), displayName(code, 'en', 'language'), displayName(code, 'fr', 'language')])
    ].join(' '))
  }))
}
export function searchChannels(index: ReturnType<typeof createChannelIndex>, query: string) {
  const needle = normalizeSearch(query)
  if (!needle) return index.map(item => item.channel)
  const tokens = needle.split(' ')
  return index
    .filter(item => tokens.every(token => item.text.includes(token)))
    .map(item => ({ ...item, score: item.name === needle ? 3 : item.name.startsWith(needle) ? 2 : item.name.includes(needle) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.channel)
}
