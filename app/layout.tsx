import type { Metadata, Viewport } from 'next'
import { qyxFontVariables } from '@/lib/qyx-fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'QYXtv — Your world. Live.',
  description:
    'Discover live television from Canada and around the world. Watch public IPTV-org streams with QYXtv, by QuantumYield.',
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={qyxFontVariables}>
      <body className="qyx-root">{children}</body>
    </html>
  )
}
