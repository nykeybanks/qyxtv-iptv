export const qyxBrandAssets = {
  emblem: {
    white: '/brand/qyx/source-05/logos/q-emblem-white.png',
    black: '/brand/qyx/source-05/logos/q-emblem-black.png',
    champagne: '/brand/qyx/source-05/logos/q-emblem-gold-champagne.png',
    silver: '/brand/qyx/source-05/logos/q-emblem-silver-metallic.png',
    mono: '/brand/qyx/source-05/logos/q-emblem-monochrome.png',
    outline: '/brand/qyx/source-05/logos/q-emblem-outline.png',
    premium: '/brand/qyx/source-05/logos/q-emblem-3d-premium.png'
  },
  qyx: {
    white: '/brand/qyx/source-05/logos/qyx-white.png',
    black: '/brand/qyx/source-05/logos/qyx-black.png',
    silver: '/brand/qyx/source-05/logos/qyx-silver-metallic.png',
    gold: '/brand/qyx/source-05/logos/qyx-gold-champagne.png',
    mono: '/brand/qyx/source-05/logos/qyx-monochrome.png',
    outline: '/brand/qyx/source-05/logos/qyx-outline.png',
    premium: '/brand/qyx/source-05/logos/qyx-3d-premium.png'
  },
  quantumYield: {
    white: '/brand/qyx/source-05/logos/quantumyield-white.png',
    black: '/brand/qyx/source-05/logos/quantumyield-black.png',
    silver: '/brand/qyx/source-05/logos/quantumyield-silver-metallic.png',
    gold: '/brand/qyx/source-05/logos/quantumyield-gold-champagne.png',
    mono: '/brand/qyx/source-05/logos/quantumyield-monochrome.png',
    outline: '/brand/qyx/source-05/logos/quantumyield-outline.png',
    premium: '/brand/qyx/source-05/logos/quantumyield-3d-premium.png'
  },
  product: {
    qyxos: '/brand/qyx/source-05/logos/qyxos-white.png',
    qyxai: '/brand/qyx/source-05/logos/qyxai-white.png',
    qyx20: '/brand/qyx/source-05/logos/qyx20-white.png',
    qyxar: '/brand/qyx/source-05/logos/qyxar-white.png',
    qyxvr: '/brand/qyx/source-05/logos/qyxvr-white.png',
    qyxtv: '/brand/qyx/source-05/logos/qyxtv-white.png'
  },
  lockup: {
    primary: '/brand/qyx/source-05/lockups/primary-lockup.png',
    horizontal: '/brand/qyx/source-05/lockups/horizontal-lockup.png',
    stacked: '/brand/qyx/source-05/lockups/stacked-lockup.png',
    brandSignature: '/brand/qyx/source-05/lockups/brand-signature.png',
    qyxos: '/brand/qyx/source-05/lockups/qyxos-lockup.png',
    qyx20: '/brand/qyx/source-05/lockups/qyx20-lockup.png'
  }
} as const

export type QYXEmblemVariant = keyof typeof qyxBrandAssets.emblem
export type QYXWordmarkVariant = keyof typeof qyxBrandAssets.qyx
export type QYXProduct = keyof typeof qyxBrandAssets.product
