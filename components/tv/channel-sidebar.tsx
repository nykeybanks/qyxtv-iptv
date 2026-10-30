'use client'
import { useDeferredValue, useMemo, useState } from 'react'
import { Play, ChevronRight } from 'lucide-react'
import type { Catalogue, Channel } from '@/lib/iptv/types'
import { createChannelIndex, searchChannels } from '@/lib/iptv/search'
import { ChannelSearch } from './category-filters'
import { useLanguage } from './language-provider'
import { useGridCapacity } from '@/hooks/use-viewport'
import { ChannelLogo, Pager } from './channel-grid'

export function ChannelSidebar({
  channels,
  selectedId,
  onWatch,
  onCollapse,
  metadata
}: {
  channels: Channel[]
  selectedId?: string
  onWatch: (channel: Channel) => void
  onCollapse?: () => void
  metadata?: Pick<Catalogue, 'countries' | 'languages'>
}) {
  const { t, categoryName, channelCount } = useLanguage()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [anchor, setAnchor] = useState(0)
  const { ref, capacity } = useGridCapacity(1000, 64)
  const index = useMemo(() => createChannelIndex(channels, metadata), [channels, metadata])
  const filtered = useMemo(() => searchChannels(index, deferredQuery), [index, deferredQuery])
  const pages = capacity ? Math.ceil(filtered.length / capacity) : 0
  const page = Math.min(Math.floor(anchor / (capacity || 1)), Math.max(0, pages - 1))
  return (
    <aside className="channel-sidebar" aria-label={t("Browse live channels")}>
      <div className="sidebar-heading">
        <div><h2>{t('On the air')}</h2><span role="status">{channelCount(filtered.length)}</span></div>
        {onCollapse && <button className="icon-button channel-collapse" onClick={onCollapse} aria-label={t('Collapse channel panel')} title={t('Hide channels')} aria-expanded={true} aria-controls="live-channel-panel"><ChevronRight size={20} className="channel-toggle-hint" /></button>}
      </div>
      <ChannelSearch label={t('Search live channel list')} placeholder={t('Find a channel')} query={query} onChange={value => { setQuery(value); setAnchor(0) }} />
      <div className="sidebar-channels" ref={ref}>
        {capacity ? (
          filtered.slice(page * capacity, (page + 1) * capacity).map(channel => (
            <button
              key={channel.id}
              onClick={() => onWatch(channel)}
              className={`sidebar-channel ${selectedId === channel.id ? 'selected' : ''}`}
              aria-current={selectedId === channel.id ? 'true' : undefined}
            >
              <ChannelLogo channel={channel} />
              <span>
                <strong>{channel.name}</strong>
                <small>
                  {categoryName(channel.categories[0] ?? 'general')} · {channel.country}
                </small>
              </span>
              {selectedId === channel.id && <Play size={14} />}
            </button>
          ))
        ) : (
          <p className="fit-notice">{t("Close the keyboard to browse channels.")}</p>
        )}
        {capacity > 0 && !filtered.length && <p>{t("No matching channels.")}</p>}
      </div>
      <Pager
        page={page}
        pages={pages}
        onPage={next => setAnchor(next * capacity)}
        label="live channels"
      />
    </aside>
  )
}
