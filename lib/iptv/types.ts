export interface StreamSource {
  url: string
  quality: string | null
  feed: string | null
  restriction: string | null
}
export interface Channel {
  id: string
  name: string
  logo: string | null
  country: string
  categories: string[]
  languages: string[]
  streams: StreamSource[]
  website: string | null
}
export interface Country {
  code: string
  name: string
  flag: string
  count: number
}
export interface Catalogue {
  channels: Channel[]
  countries: Country[]
  categories: { id: string; name: string }[]
  languages: { code: string; name: string }[]
  total: number
  updatedAt: string
  warnings: string[]
}
export interface GuideSource {
  site: string
  language: string
  url: string | null
}
export type Scene = 'discover' | 'live' | 'favorites' | 'recent'
export interface Preferences {
  country: string
  favorites: string[]
  recent: string[]
  motion: 'immersive' | 'balanced' | 'reduced'
}
