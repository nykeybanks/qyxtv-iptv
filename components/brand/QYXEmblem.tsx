import * as React from 'react'
import { qyxBrandAssets, type QYXEmblemVariant } from '../../lib/qyx-brand-assets'

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  variant?: QYXEmblemVariant
  alt?: string
  size?: number
}

export function QYXEmblem({ variant = 'white', alt = 'QYX', size = 40, style, ...props }: Props) {
  return (
    <img
      src={qyxBrandAssets.emblem[variant]}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      decoding="async"
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
      {...props}
    />
  )
}
