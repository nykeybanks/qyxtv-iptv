'use client'
import { useId } from 'react'
import { QYXProductMark, QuantumYieldWordmark } from '@/components/brand'

export function PlayerWatermark({ footer = false }: { footer?: boolean }) {
  const id = `brand-outline-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <span className={`player-watermark ${footer ? 'player-footer-brand' : ''}`} aria-hidden="true">
      <svg className="brand-filter-definitions" width="0" height="0" focusable="false" aria-hidden="true">
        <defs>
          <filter id={id} x="-20%" y="-50%" width="140%" height="200%" colorInterpolationFilters="sRGB">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="outline" />
            <feFlood floodColor="#000000" result="black" />
            <feComposite in="black" in2="outline" operator="in" result="border" />
            <feMerge><feMergeNode in="border" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </svg>
      {footer ? (
        <QuantumYieldWordmark variant="white" height={24} alt="" style={{ filter: `url(#${id})` }} />
      ) : (
        <QYXProductMark product="qyxtv" variant="white" height={28} alt="" style={{ filter: `url(#${id})` }} />
      )}
    </span>
  )
}
