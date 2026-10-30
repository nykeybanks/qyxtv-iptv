import * as React from 'react'
import { qyxBrandAssets, type QYXWordmarkVariant } from '../../lib/qyx-brand-assets'

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  variant?: QYXWordmarkVariant
  alt?: string
  height?: number
}

export function QYXWordmark({
  variant = 'white',
  alt = 'QYX',
  height = 28,
  style,
  ...props
}: Props) {
  return (
    <img
      src={qyxBrandAssets.qyx[variant]}
      alt={alt}
      height={height}
      draggable={false}
      decoding="async"
      style={{ width: 'auto', height, objectFit: 'contain', ...style }}
      {...props}
    />
  )
}
