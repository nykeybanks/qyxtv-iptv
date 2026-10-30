'use client'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Heart, Play, Radio, Tv } from 'lucide-react'
import type { Channel } from '@/lib/iptv/types'
import { useGridCapacity } from '@/hooks/use-viewport'

export function ChannelLogo({ channel, className = '' }: { channel: Channel; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  return channel.logo && failed !== channel.logo ? (
    <img
      className={`channel-logo ${className}`}
      src={channel.logo}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(channel.logo)}
    />
  ) : (
    <span className={`logo-fallback ${className}`}>{channel.name}</span>
  )
}

export function ChannelCard({
  channel,
  favorite,
  onWatch,
  onFavorite,
  selected
}: {
  channel: Channel
  favorite: boolean
  onWatch: (channel: Channel) => void
  onFavorite: (id: string) => void
  selected?: boolean
}) {
  return (
    <article className={`channel-card ${selected ? 'selected' : ''}`}>
      <button
        className="channel-watch"
        onClick={() => onWatch(channel)}
        aria-label={`Watch ${channel.name}`}
      >
        <span className="channel-art">
          <span className="live-tag">
            <span />
            LIVE
          </span>
          <ChannelLogo channel={channel} />
          <span className="play-card">
            <Play size={20} fill="currentColor" />
          </span>
          <span className="quality-label">{channel.streams[0]?.quality || 'IPTV'}</span>
        </span>
        <span className="channel-caption">
          <strong>{channel.name}</strong>
          <span>
            {channel.country} <span aria-hidden="true">·</span> {channel.categories[0] ?? 'General'}
            {channel.streams[0]?.restriction ? ' · Restricted' : ''}
          </span>
        </span>
      </button>
      <button
        className={`favorite-button ${favorite ? 'active' : ''}`}
        aria-label={`${favorite ? 'Remove' : 'Add'} ${channel.name} ${favorite ? 'from' : 'to'} favorites`}
        aria-pressed={favorite}
        onClick={() => onFavorite(channel.id)}
      >
        <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  )
}

export function Pager({
  page,
  pages,
  onPage,
  label
}: {
  page: number
  pages: number
  onPage: (page: number) => void
  label: string
}) {
  return (
    <div className="pager">
      <span className="page-count">
        {pages ? page + 1 : 0} / {pages}
      </span>
      <button
        className="icon-button"
        disabled={page === 0 || !pages}
        onClick={() => onPage(page - 1)}
        aria-label={`Previous ${label}`}
      >
        <ArrowLeft size={18} />
      </button>
      <button
        className="icon-button"
        disabled={page >= pages - 1}
        onClick={() => onPage(page + 1)}
        aria-label={`Next ${label}`}
      >
        <ArrowRight size={18} />
      </button>
    </div>
  )
}

export function ChannelGrid({
  channels,
  title,
  subtitle,
  favorites,
  onWatch,
  onFavorite,
  loading,
  error,
  onRetry,
  carousel = false,
  selectedId
}: {
  channels: Channel[]
  title: string
  subtitle?: string
  favorites: string[]
  onWatch: (channel: Channel) => void
  onFavorite: (id: string) => void
  loading?: boolean
  error?: string
  onRetry?: () => void
  carousel?: boolean
  selectedId?: string
}) {
  const { ref, capacity, columns } = useGridCapacity(
    carousel ? 180 : 200,
    carousel ? 176 : 184,
    carousel
  )
  const [anchor, setAnchor] = useState(0)
  const pages = capacity ? Math.ceil(channels.length / capacity) : 0
  const page = Math.min(Math.floor(anchor / (capacity || 1)), Math.max(0, pages - 1))
  const visible = capacity ? channels.slice(page * capacity, (page + 1) * capacity) : []
  return (
    <section className={`channel-section ${carousel ? 'carousel' : ''}`} aria-label={title}>
      <div className="section-heading">
        <div className="section-title">
          <h2>{title}</h2>
          {subtitle && <span>{subtitle}</span>}
        </div>
        <Pager
          page={page}
          pages={pages}
          onPage={next => setAnchor(next * capacity)}
          label="channels"
        />
      </div>
      <div
        className="channel-grid"
        ref={ref}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {loading ? (
          Array.from({ length: Math.max(1, capacity) }, (_, index) => (
            <div className="channel-skeleton" key={index} aria-hidden="true" />
          ))
        ) : error ? (
          <div className="grid-message" role="alert">
            <Radio />
            <strong>Unable to load channels</strong>
            <p>{error}</p>
            <button className="button secondary" onClick={onRetry}>
              Try again
            </button>
          </div>
        ) : !capacity ? (
          <div className="grid-message">
            <p>
              More height is needed to show channels readably. Close the keyboard or rotate your
              screen.
            </p>
          </div>
        ) : channels.length ? (
          visible.map(channel => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              favorite={favorites.includes(channel.id)}
              selected={selectedId === channel.id}
              onWatch={onWatch}
              onFavorite={onFavorite}
            />
          ))
        ) : (
          <div className="grid-message">
            <Tv size={28} />
            <strong>No channels here yet</strong>
            <p>Try another country or filter, or save a channel to your favorites.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export const ChannelCarousel = ChannelGrid
