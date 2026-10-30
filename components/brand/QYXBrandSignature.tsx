import * as React from 'react'
import { QYXEmblem } from './QYXEmblem'
import { QYXWordmark } from './QYXWordmark'
import { QuantumYieldWordmark } from './QuantumYieldWordmark'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  compact?: boolean
}

export function QYXBrandSignature({ compact = false, style, ...props }: Props) {
  return (
    <div
      aria-label="QYX by QuantumYield"
      style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? 8 : 12, ...style }}
      {...props}
    >
      <QYXEmblem size={compact ? 28 : 36} />
      <div style={{ display: 'grid', gap: 3 }}>
        <QYXWordmark height={compact ? 17 : 21} />
        {!compact && <QuantumYieldWordmark height={10} style={{ opacity: 0.78 }} />}
      </div>
    </div>
  )
}
