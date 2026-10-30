'use client'
import { useEffect, useRef, useState } from 'react'
import type Hls from 'hls.js'
import {
  AlertCircle,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Radio,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListVideo,
  Info
} from 'lucide-react'
import type { Channel } from '@/lib/iptv/types'
import { ChannelLogo } from './channel-grid'
import { PlayerWatermark } from './player-watermark'
import { QYXPreloader } from './qyx-preloader'
import { BrandedPipWindow, useBrandedPip } from './branded-picture-in-picture'
import { useLanguage } from './language-provider'
import type { MessageKey, MessageValues } from '@/lib/iptv/i18n'

type Playback = 'loading' | 'playing' | 'paused' | 'error'
export function LiveTVPlayer({
  channel,
  onNext,
  onPrevious,
  onChannels,
  onInfo,
  onPlaying
}: {
  channel: Channel
  onNext: () => void
  onPrevious: () => void
  onChannels: () => void
  onInfo: () => void
  onPlaying: (id: string) => void
}) {
  const { t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const onPlayingRef = useRef(onPlaying)
  onPlayingRef.current = onPlaying
  const [status, setStatus] = useState<Playback>('loading')
  const [notice, setNotice] = useState<{ key: MessageKey; values: MessageValues } | null>(null)
  const message = notice ? t(notice.key, notice.values) : ''
  function setMessage(key: MessageKey | '', values: MessageValues = {}) {
    setNotice(key ? { key, values } : null)
  }
  const pip = useBrandedPip(videoRef, () => setMessage('Branded picture-in-picture is unavailable for this stream or embedded browser. Open QYXtv in a supported browser tab and try again.'))
  const [muted, setMuted] = useState(true)
  const [volume, setVolume] = useState(0.8)
  const [retry, setRetry] = useState(0)
  const [sourceChoice, setSourceChoice] = useState({ id: channel.id, index: 0 })
  const sourceIndex = sourceChoice.id === channel.id ? sourceChoice.index : 0
  const source = channel.streams[sourceIndex]
  const [fullscreenSupported, setFullscreenSupported] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [atLiveEdge, setAtLiveEdge] = useState(true)

  useEffect(() => {
    setFullscreenSupported(!!document.fullscreenEnabled)
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => document.removeEventListener('fullscreenchange', onFullscreen)
  }, [])
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume
  }, [volume])
  useEffect(() => {
    const video = videoRef.current
    if (!video || !source) return
    let disposed = false
    let retries = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let startup: ReturnType<typeof setTimeout> | undefined
    let engine: Hls | null = null
    setStatus('loading')
    setMessage('Connecting to broadcaster…')
    setAtLiveEdge(true)
    const fail = (reason: MessageKey, values?: MessageValues) => {
      if (!disposed) {
        clearTimeout(startup)
        setStatus('error')
        setMessage(reason, values)
      }
    }
    const attemptPlay = () => {
      if (!disposed)
        void video.play().catch(error => {
          if (!disposed && error.name !== 'AbortError') {
            clearTimeout(startup)
            setStatus('paused')
            setMessage('Press play to start this stream.')
          }
        })
    }
    const playing = () => {
      if (!disposed) {
        clearTimeout(startup)
        setStatus('playing')
        setMessage('')
        onPlayingRef.current(channel.id)
      }
    }
    const paused = () => {
      if (!disposed) {
        clearTimeout(startup)
        setStatus(current => (current === 'error' ? current : 'paused'))
      }
    }
    const waiting = () => {
      if (!disposed) {
        setStatus('loading')
        setMessage('Buffering live broadcast…')
        clearTimeout(startup)
        startup = setTimeout(() => {
          engine?.stopLoad()
          fail('The broadcast stopped responding. Retry or choose another channel.')
        }, 25000)
      }
    }
    const nativeError = () => {
      if (!engine)
        fail(
          'The broadcaster is unavailable or does not allow playback in this browser. Try another source or channel.'
        )
    }
    const offline = () => fail('You are offline. Reconnect, then retry this stream.')
    const timeUpdate = () => {
      if (video.seekable.length)
        setAtLiveEdge(video.seekable.end(video.seekable.length - 1) - video.currentTime < 15)
    }
    video.addEventListener('playing', playing)
    video.addEventListener('pause', paused)
    video.addEventListener('waiting', waiting)
    video.addEventListener('error', nativeError)
    video.addEventListener('timeupdate', timeUpdate)
    window.addEventListener('offline', offline)
    const begin = async () => {
      if (!navigator.onLine) {
        offline()
        return
      }
      if (source.restriction) {
        fail(
          '{restriction}. This source cannot be played directly here. Choose another source or channel.',
          { restriction: source.restriction }
        )
        return
      }
      startup = setTimeout(
        () =>
          fail(
            'The stream did not respond in time. It may be offline, geo-blocked, or restricted by CORS.'
          ),
        25000
      )
      if (
        video.canPlayType('application/vnd.apple.mpegurl') &&
        /Safari/.test(navigator.userAgent) &&
        !/Chrome|Chromium|Edg/.test(navigator.userAgent)
      ) {
        video.src = source.url
        video.addEventListener('loadedmetadata', attemptPlay)
        attemptPlay()
        return
      }
      try {
        const { default: HlsEngine } = await import('hls.js')
        if (disposed) return
        if (!HlsEngine.isSupported()) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source.url
            video.addEventListener('loadedmetadata', attemptPlay)
            attemptPlay()
            return
          }
          fail(
            'This browser does not support HLS playback. Try a current version of Safari, Chrome, Edge, or Firefox.'
          )
          return
        }
        engine = new HlsEngine({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
          maxBufferLength: 20,
          manifestLoadPolicy: {
            default: {
              maxTimeToFirstByteMs: 8000,
              maxLoadTimeMs: 12000,
              timeoutRetry: { maxNumRetry: 1, retryDelayMs: 1000, maxRetryDelayMs: 2000 },
              errorRetry: { maxNumRetry: 1, retryDelayMs: 1000, maxRetryDelayMs: 2000 }
            }
          }
        })
        hlsRef.current = engine
        engine.on(HlsEngine.Events.MANIFEST_PARSED, attemptPlay)
        engine.on(HlsEngine.Events.ERROR, (_, data) => {
          if (disposed || !data.fatal) return
          if (
            retries < 2 &&
            (data.type === HlsEngine.ErrorTypes.NETWORK_ERROR ||
              data.type === HlsEngine.ErrorTypes.MEDIA_ERROR)
          ) {
            retries += 1
            setStatus('loading')
            setMessage('Reconnecting to broadcaster ({count}/2)…', { count: retries })
            clearTimeout(timer)
            timer = setTimeout(() => {
              if (!disposed) {
                if (data.type === HlsEngine.ErrorTypes.MEDIA_ERROR) engine?.recoverMediaError()
                else engine?.startLoad()
              }
            }, retries * 1000)
          } else {
            engine?.stopLoad()
            fail(
              'This stream is unavailable. The broadcaster may be offline, geo-blocked, or blocking browser requests (CORS).'
            )
          }
        })
        engine.loadSource(source.url)
        engine.attachMedia(video)
      } catch {
        fail('The playback engine could not be loaded. Please retry.')
      }
    }
    void begin()
    return () => {
      disposed = true
      clearTimeout(timer)
      clearTimeout(startup)
      video.removeEventListener('playing', playing)
      video.removeEventListener('pause', paused)
      video.removeEventListener('waiting', waiting)
      video.removeEventListener('error', nativeError)
      video.removeEventListener('loadedmetadata', attemptPlay)
      video.removeEventListener('timeupdate', timeUpdate)
      window.removeEventListener('offline', offline)
      engine?.destroy()
      hlsRef.current = null
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [channel.id, source, retry])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused)
      void video.play().catch(() => setMessage('Playback was blocked. Try another stream.'))
    else video.pause()
  }
  function goLive() {
    const video = videoRef.current
    if (!video) return
    const position = hlsRef.current?.liveSyncPosition
    if (position != null) video.currentTime = position
    else if (video.seekable.length)
      video.currentTime = Math.max(0, video.seekable.end(video.seekable.length - 1) - 1)
    if (video.paused) void video.play().catch(() => setMessage('Press play to resume.'))
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await surfaceRef.current?.requestFullscreen()
    } catch {
      setMessage('Fullscreen is not permitted in this embedded view.')
    }
  }

  return (
    <section className="live-player" aria-label={t('{name} live player', { name: channel.name })}>
      <div className="video-surface" ref={surfaceRef}>
        <video
          data-scene-surface
          ref={videoRef}
          playsInline
          crossOrigin="anonymous"
          muted={muted}
          aria-label={t('{name} live stream', { name: channel.name })}
          onKeyDown={event => {
            if (event.key === ' ' && !event.nativeEvent.isComposing && event.keyCode !== 229) {
              event.preventDefault()
              togglePlay()
            }
          }}
        />
        {pip.active && (
          <div className="playback-overlay pip-placeholder">
            <PictureInPicture2 size={30} />
            <p>{t('Playing in picture-in-picture')}</p>
            <button className="button secondary" onClick={pip.close}>{t('Return to player')}</button>
          </div>
        )}
        {!pip.active && status === 'loading' && (
          <div className="playback-overlay" aria-busy="true">
            <QYXPreloader compact label={t('Tuning in')} detail={message} />
          </div>
        )}
        {!pip.active && status !== 'playing' && status !== 'loading' && (
          <div className="playback-overlay">
            <ChannelLogo channel={channel} />
            <div className="playback-message" role="status">
              {status === 'error' ? (
                <AlertCircle size={25} />
              ) : status === 'paused' ? (
                <Pause size={25} />
              ) : (
                <Radio size={25} />
              )}
              <strong>
                {status === 'error'
                  ? t("Stream unavailable")
                  : status === 'paused'
                    ? t("Broadcast paused")
                    : t("Tuning in")}
              </strong>
              <p>{message}</p>
              {status === 'error' ? (
                <button className="button secondary" onClick={() => setRetry(value => value + 1)}>
                  <RotateCcw size={17} />
                  {t("Retry stream")}
                </button>
              ) : (
                status === 'paused' && (
                  <button className="button primary" onClick={togglePlay}>
                    <Play size={17} />
                    {t("Play live")}
                  </button>
                )
              )}
            </div>
          </div>
        )}
        <div className="video-topline">
          <div className="video-broadcast-info">
            <span className="live-tag">
              <span />
              {status === 'playing' ? t("LIVE") : 'IPTV'}
            </span>
            <span>
              {source?.quality ?? 'HLS'} <span className="desktop-only">· {channel.country}</span>
            </span>
          </div>
          <PlayerWatermark />
        </div>
        <div className="player-controls">
          <button
            className="icon-button"
            onClick={togglePlay}
            disabled={status === 'error' || status === 'loading'}
            aria-label={status === 'playing' ? t("Pause live TV") : t("Play live TV")}
          >
            {status === 'playing' ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="icon-button" onClick={onPrevious} aria-label={t("Previous channel")}>
            <SkipBack size={18} />
          </button>
          <button className="icon-button" onClick={onNext} aria-label={t("Next channel")}>
            <SkipForward size={18} />
          </button>
          <button
            className="icon-button"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? t("Unmute") : t("Mute")}
          >
            {muted || !volume ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            className="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            aria-label={t("Volume")}
            onChange={event => {
              setVolume(Number(event.target.value))
              setMuted(false)
            }}
          />
          <button className="return-live" onClick={goLive} disabled={status === 'error'}>
            <span className={atLiveEdge && status === 'playing' ? 'status-dot' : 'muted-dot'} />
            <span>{atLiveEdge ? t("LIVE") : t("Go live")}</span>
          </button>
          <span className="control-spacer">
            <PlayerWatermark footer />
          </span>
          {pip.supported && (
            <button
              className="icon-button pip-button"
              onClick={pip.toggle}
              aria-label={pip.opening ? t('Opening picture-in-picture…') : pip.active ? t('Exit picture in picture') : t('Picture in picture')}
              aria-pressed={pip.active}
              disabled={pip.opening || (!pip.active && status !== 'playing')}
            >
              <PictureInPicture2 size={19} />
            </button>
          )}
          {fullscreenSupported && (
            <button
              className="icon-button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? t("Exit fullscreen") : t("Fullscreen")}
            >
              {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          )}
        </div>
      </div>
      <div className="player-info">
        <div className="now-watching">
          <span className="eyebrow">{t("NOW WATCHING")}</span>
          <h1>{channel.name}</h1>
        </div>
        <div className="player-info-actions">
          <label className="source-select">
            <span className="sr-only">{t("Stream source")}</span>
            <select
              aria-label={t("Stream source")}
              value={sourceIndex}
              onChange={event =>
                setSourceChoice({ id: channel.id, index: Number(event.target.value) })
              }
            >
              {channel.streams.map((stream, index) => (
                <option key={stream.url} value={index}>
                  {t('Source {count}', { count: index + 1 })}
                  {stream.quality ? ` · ${stream.quality}` : ''}
                  {stream.restriction ? ` · ${t('Restricted')}` : ''}
                </option>
              ))}
            </select>
          </label>
          <button
            className="icon-button"
            aria-label={t("Channel information and guide")}
            onClick={onInfo}
          >
            <Info size={20} />
          </button>
          <button className="button secondary channel-picker-button" onClick={onChannels}>
            <ListVideo size={18} />
            <span>{t("Channels")}</span>
          </button>
        </div>
      </div>
      {pip.pipWindow && <BrandedPipWindow pipWindow={pip.pipWindow} videoRef={videoRef} name={channel.name} status={status} message={message} muted={muted} onPlay={togglePlay} onMute={() => setMuted(!muted)} onPrevious={onPrevious} onNext={onNext} onReturn={pip.close} />}
      {message && status === 'playing' && (
        <p className="player-notice" role="status">
          {message}
        </p>
      )}
    </section>
  )
}
