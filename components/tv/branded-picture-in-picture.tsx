'use client'
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Pause, Play, Volume2, VolumeX, PictureInPicture2, SkipBack, SkipForward } from 'lucide-react'
import { createPipCompositor } from '@/lib/iptv/pip-compositor'
import { PlayerWatermark } from './player-watermark'
import { QYXPreloader } from './qyx-preloader'
import { useLanguage } from './language-provider'

type DocumentPipAPI = { requestWindow: (options: { width: number; height: number }) => Promise<Window> }
type PipWindow = Window & { documentPictureInPicture?: DocumentPipAPI }
export function useBrandedPip(videoRef: RefObject<HTMLVideoElement | null>, onError: () => void) {
  const [supported, setSupported] = useState(false)
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const [active, setActive] = useState(false)
  const [opening, setOpening] = useState(false)
  const session = useRef<{ window?: Window; controller?: AbortController; compositor?: Awaited<ReturnType<typeof createPipCompositor>> } | null>(null)
  const mounted = useRef(true)
  const errorRef = useRef(onError)
  errorRef.current = onError

  useEffect(() => {
    mounted.current = true
    setSupported(Boolean((window as PipWindow).documentPictureInPicture) || Boolean(document.pictureInPictureEnabled && HTMLCanvasElement.prototype.captureStream))
    return () => {
      mounted.current = false
      const current = session.current
      session.current = null
      current?.window?.close()
      current?.controller?.abort()
      if (document.pictureInPictureElement === current?.compositor?.video) void document.exitPictureInPicture().catch(() => {})
      current?.compositor?.dispose()
    }
  }, [])

  function close() {
    const current = session.current
    session.current = null
    current?.window?.close()
    current?.controller?.abort()
    if (document.pictureInPictureElement === current?.compositor?.video) void document.exitPictureInPicture().catch(() => {})
    current?.compositor?.dispose()
    if (mounted.current) { setPipWindow(null); setActive(false); setOpening(false) }
  }
  async function toggle() {
    if (session.current) { close(); return }
    const video = videoRef.current
    if (!video || video.readyState < 2) return
    const current: NonNullable<typeof session.current> = {}
    session.current = current
    setOpening(true)
    try {
      const api = (window as PipWindow).documentPictureInPicture
      if (api && window.top === window) {
        const floating = await api.requestWindow({ width: 640, height: 420 })
        if (!mounted.current || session.current !== current) { floating.close(); return }
        current.window = floating
        floating.document.title = 'QYXtv'
        floating.document.documentElement.className = document.documentElement.className
        floating.document.documentElement.lang = document.documentElement.lang
        floating.document.documentElement.dataset.motion = document.documentElement.dataset.motion
        floating.document.body.className = 'qyx-root pip-document'
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach(style => floating.document.head.append(style.cloneNode(true)))
        floating.addEventListener('pagehide', () => {
          if (session.current === current) {
            session.current = null
            if (mounted.current) { setPipWindow(null); setActive(false) }
          }
        }, { once: true })
        setPipWindow(floating)
      } else {
        const controller = new AbortController()
        current.controller = controller
        const compositor = await createPipCompositor(video, controller.signal, () => { close(); errorRef.current() })
        if (!mounted.current || session.current !== current) { compositor.dispose(); return }
        current.compositor = compositor
        const floating = await compositor.video.requestPictureInPicture()
        compositor.resize(floating.width, floating.height)
        const resize = () => compositor.resize(floating.width, floating.height)
        floating.addEventListener('resize', resize)
        compositor.video.addEventListener('leavepictureinpicture', () => {
          floating.removeEventListener('resize', resize)
          compositor.dispose()
          if (session.current === current) {
            session.current = null
            if (mounted.current) setActive(false)
          }
        }, { once: true })
      }
      if (mounted.current && session.current === current) setActive(true)
    } catch {
      if (session.current === current) { close(); errorRef.current() }
    } finally { if (mounted.current) setOpening(false) }
  }
  return { supported, pipWindow, active, opening, toggle, close }
}

export function BrandedPipWindow({ pipWindow, videoRef, name, status, message, muted, onPlay, onMute, onPrevious, onNext, onReturn }: {
  pipWindow: Window
  videoRef: RefObject<HTMLVideoElement | null>
  name: string
  status: 'loading' | 'playing' | 'paused' | 'error'
  message: string
  muted: boolean
  onPlay: () => void
  onMute: () => void
  onPrevious: () => void
  onNext: () => void
  onReturn: () => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const { t, locale } = useLanguage()
  useLayoutEffect(() => {
    const video = videoRef.current
    const parent = video?.parentElement
    if (!video || !parent || !host.current) return
    const sibling = video.nextSibling
    host.current.append(video)
    const restore = () => {
      if (video.parentElement !== parent) parent.insertBefore(video, sibling?.parentNode === parent ? sibling : null)
    }
    pipWindow.addEventListener('pagehide', restore, { once: true })
    return () => { restore(); pipWindow.removeEventListener('pagehide', restore) }
  }, [pipWindow, videoRef])
  useEffect(() => {
    pipWindow.document.documentElement.lang = locale
    pipWindow.document.title = `${name} · QYXtv`
    const syncMotion = () => { pipWindow.document.documentElement.dataset.motion = document.documentElement.dataset.motion }
    const observer = new MutationObserver(syncMotion)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] })
    return () => observer.disconnect()
  }, [pipWindow, locale, name])
  return createPortal(
    <section className="pip-player" aria-label={t('{name} live player', { name })}>
      <div className="pip-video" ref={host} />
      <div className="video-topline"><span className="live-tag">{status === 'playing' ? t('LIVE') : 'IPTV'}</span><PlayerWatermark /></div>
      {status !== 'playing' && <div className="pip-status">{status === 'loading' ? <QYXPreloader compact label={t('Tuning in')} /> : <p role="status">{status === 'error' ? t('Stream unavailable') : t('Broadcast paused')}</p>}{message && <p>{message}</p>}</div>}
      <div className="pip-controls">
        <button className="icon-button" onClick={onPlay} disabled={status === 'loading' || status === 'error'} aria-label={status === 'playing' ? t('Pause live TV') : t('Play live TV')}>{status === 'playing' ? <Pause size={18} /> : <Play size={18} />}</button>
        <button className="icon-button" onClick={onPrevious} aria-label={t('Previous channel')}><SkipBack size={17} /></button>
        <button className="icon-button" onClick={onNext} aria-label={t('Next channel')}><SkipForward size={17} /></button>
        <button className="icon-button" onClick={onMute} aria-label={muted ? t('Unmute') : t('Mute')}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
        <span className="pip-channel-name">{name}</span>
        <button className="icon-button" onClick={onReturn} aria-label={t('Return to player')}><PictureInPicture2 size={18} /></button>
        <div className="pip-signature"><PlayerWatermark footer /></div>
      </div>
    </section>, pipWindow.document.body
  )
}
