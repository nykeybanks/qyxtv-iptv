import * as React from 'react'
import { type QYXProduct } from '../../lib/qyx-brand-assets'

type Variant =
  'white' | 'black' | 'silver-metallic' | 'gold-champagne' | 'monochrome' | 'outline' | '3d-premium'

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  product: QYXProduct
  variant?: Variant
  alt?: string
  height?: number
}

export function QYXProductMark({
  product,
  variant = 'white',
  alt,
  height = 26,
  style,
  ...props
}: Props) {
  const src = `/brand/qyx/source-05/logos/${product}-${variant}.png`
  const label = alt ?? product.toUpperCase()
  return (
    <img
      src={src}
      alt={label}
      height={height}
      draggable={false}
      decoding="async"
      style={{ width: 'auto', height, objectFit: 'contain', ...style }}
      {...props}
    />
  )
}
