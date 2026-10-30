'use client'
import * as Dialog from '@radix-ui/react-dialog'
import useSWR from 'swr'
import { useRef } from 'react'
import { ExternalLink, X } from 'lucide-react'
import type { Channel, GuideSource } from '@/lib/iptv/types'
import { ChannelSidebar } from './channel-sidebar'

export const fetchJson = async (url: string) => {
  const response = await fetch(url)
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new Error('The catalogue service is unreachable. Please try again.')
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'Unable to load data.')
  return data
}

export function ViewerDialog({
  open,
  onOpenChange,
  title,
  children,
  className = ''
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  const returnFocus = useRef<HTMLElement | null>(null)
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop" />
        <Dialog.Content
          className={`viewer-dialog ${className}`}
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            returnFocus.current = document.activeElement as HTMLElement
          }}
          onCloseAutoFocus={event => {
            event.preventDefault()
            returnFocus.current?.focus()
          }}
        >
          <div className="dialog-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label={`Close ${title.toLowerCase()}`}>
              <X size={21} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
export function ChannelPicker({
  open,
  onOpenChange,
  channels,
  selectedId,
  onWatch
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  channels: Channel[]
  selectedId?: string
  onWatch: (channel: Channel) => void
}) {
  return (
    <ViewerDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Live channels"
      className="channel-picker"
    >
      <ChannelSidebar
        channels={channels}
        selectedId={selectedId}
        onWatch={channel => {
          onWatch(channel)
          onOpenChange(false)
        }}
      />
    </ViewerDialog>
  )
}
export function EPGGuide({ channel }: { channel: Channel }) {
  const { data, error, isLoading } = useSWR<{ sources: GuideSource[] }>(
    `/api/guide?id=${encodeURIComponent(channel.id)}`,
    fetchJson,
    { revalidateOnFocus: false }
  )
  return (
    <div className="guide-content">
      <p>
        Schedule times and current program details are not supplied by the M3U playlist. QYXtv does
        not estimate or invent them.
      </p>
      {isLoading ? (
        <p role="status">Checking IPTV-org guide metadata…</p>
      ) : error ? (
        <p role="alert">Guide metadata is temporarily unavailable.</p>
      ) : data?.sources.length ? (
        <div>
          <h3>Listed guide providers</h3>
          <div className="guide-sources">
            {data.sources.map(source => (
              <div key={source.site}>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.site}
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span>{source.site}</span>
                )}
                <small>
                  {source.language.toUpperCase()}
                  {!source.url && ' · No public schedule feed'}
                </small>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>No guide source is listed for this channel.</p>
      )}
      {channel.website && (
        <a
          className="button secondary"
          href={channel.website}
          target="_blank"
          rel="noopener noreferrer"
        >
          Broadcaster website
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  )
}
