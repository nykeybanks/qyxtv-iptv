'use client'
import { QYXProductMark } from '@/components/brand'
import { useLanguage } from './language-provider'

export function QYXPreloader({ label, detail, compact = false }: { label?: string; detail?: string; compact?: boolean }) {
  const { t } = useLanguage()
  return (
    <div className={`qyx-preloader ${compact ? 'compact' : ''}`} role="status" aria-live="polite">
      <QYXProductMark product="qyxtv" height={compact ? 28 : 44} alt="QYXtv" />
      <span className="qyx-loading-track" aria-hidden="true"><span /></span>
      <strong>{label ?? t('Loading QYXtv')}</strong>
      {detail && <span className="qyx-loading-detail">{detail}</span>}
    </div>
  )
}
