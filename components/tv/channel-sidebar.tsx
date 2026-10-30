'use client'
import { useState } from 'react'
import { Play, Search } from 'lucide-react'
import type { Channel } from '@/lib/iptv/types'
import { useGridCapacity } from '@/hooks/use-viewport'
import { ChannelLogo, Pager } from './channel-grid'

export function ChannelSidebar({
  channels,
  selectedId,
  onWatch
}: {
  channels: Channel[]
  selectedId?: string
  onWatch: (channel: Channel) => void
}) {
  const [query, setQuery] = useState('')
  const [anchor, setAnchor] = useState(0)
  const { ref, capacity } = useGridCapacity(1000, 64)
  const filtered = channels.filter(channel =>
    channel.name.toLowerCase().includes(query.toLowerCase())
  )
  const pages = capacity ? Math.ceil(filtered.length / capacity) : 0
  const page = Math.min(Math.floor(anchor / (capacity || 1)), Math.max(0, pages - 1))
  return (
    <aside className="channel-sidebar" aria-label="Browse live channels">
      <div className="sidebar-heading">
        <h2>On the air</h2>
        <span>{filtered.length} channels</span>
      </div>
      <label className="search-field">
        <Search size={16} />
        <input
          aria-label="Search live channel list"
          placeholder="Find a channel"
          value={query}
          onChange={event => {
            setQuery(event.target.value)
            setAnchor(0)
          }}
        />
      </label>
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
                  {channel.categories[0] ?? 'General'} · {channel.country}
                </small>
              </span>
              {selectedId === channel.id && <Play size={14} />}
            </button>
          ))
        ) : (
          <p className="fit-notice">Close the keyboard to browse channels.</p>
        )}
        {capacity > 0 && !filtered.length && <p>No matching channels.</p>}
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
