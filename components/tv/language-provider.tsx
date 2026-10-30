'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { categoryName, displayName, localeCookie, translate, type Locale, type MessageKey, type MessageValues } from '@/lib/iptv/i18n'

function makeLanguage(locale: Locale) {
  const number = (value: number) => value.toLocaleString(locale === 'fr' ? 'fr-CA' : 'en-CA')
  return {
    locale,
    t: (key: MessageKey, values?: MessageValues) => translate(locale, key, values),
    categoryName: (id: string, fallback?: string) => categoryName(id, locale, fallback),
    countryName: (code: string, fallback?: string) => displayName(code, locale, 'region', fallback),
    languageName: (code: string, fallback?: string) => displayName(code, locale, 'language', fallback),
    number,
    channelCount: (count: number) => translate(locale, count === 1 ? '{count} channel' : '{count} channels', { count: number(count) })
  }
}
const LanguageContext = createContext({ ...makeLanguage('en'), setLocale: (_locale: Locale) => {} })
export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale)
  const setLocale = useCallback((next: Locale) => {
    updateLocale(next)
    document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
  }, [])
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  const value = useMemo(() => ({ ...makeLanguage(locale), setLocale }), [locale, setLocale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
export const useLanguage = () => useContext(LanguageContext)

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLanguage()
  return (
    <div className="language-switch" role="group" aria-label={t('Interface language')}>
      <button type="button" lang="en" aria-label="English" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
      <button type="button" lang="fr" aria-label="Français" aria-pressed={locale === 'fr'} onClick={() => setLocale('fr')}>FR</button>
    </div>
  )
}
