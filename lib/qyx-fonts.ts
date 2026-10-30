/* Optional Next.js recipe. No font binaries are distributed in this package. */
import { Exo_2, Inter, JetBrains_Mono, Orbitron } from 'next/font/google'

export const qyxDisplay = Orbitron({
  subsets: ['latin'],
  variable: '--font-qyx-display',
  display: 'swap'
})
export const qyxUI = Inter({ subsets: ['latin'], variable: '--font-qyx-ui', display: 'swap' })
export const qyxBody = Exo_2({ subsets: ['latin'], variable: '--font-qyx-body', display: 'swap' })
export const qyxMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-qyx-mono',
  display: 'swap'
})

export const qyxFontVariables = `${qyxDisplay.variable} ${qyxUI.variable} ${qyxBody.variable} ${qyxMono.variable}`
