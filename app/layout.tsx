import type { Metadata, Viewport } from 'next'
import { qyxFontVariables } from '@/lib/qyx-fonts'
import { cookies } from 'next/headers'
import { LanguageProvider } from '@/components/tv/language-provider'
import { localeCookie } from '@/lib/iptv/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'QYXtv — Your world. Live.',
  description:
    'Discover live television in an English or French interface. Watch public IPTV-org streams with the branded QYXtv player, by QuantumYield.',
  icons: { icon: '/brand/qyx/source-05/lockups/app-icon.png' }
}
export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content'
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = (await cookies()).get(localeCookie)?.value === 'fr' ? 'fr' : 'en'
  return (
    <html lang={locale} className={qyxFontVariables}>
      <body className="qyx-root"><LanguageProvider initialLocale={locale}>{children}</LanguageProvider></body>
    </html>
  )
}
