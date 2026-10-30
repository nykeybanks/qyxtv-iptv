import Image from 'next/image'
import { ArrowUpRight, Play, Radio, Globe2 } from 'lucide-react'
import type { Channel } from '@/lib/iptv/types'
import { ChannelLogo } from './channel-grid'

export function FeaturedChannelHero({
  countryName,
  featured,
  onWatch,
  onCountries,
  count
}: {
  countryName: string
  featured?: Channel
  onWatch: (channel: Channel) => void
  onCountries: () => void
  count: number
}) {
  return (
    <section className="featured-hero" aria-label="Featured live television">
      <div className="hero-visual" data-scene-surface>
        <Image
          src="/images/toronto-night.png"
          alt="Cinematic editorial artwork of the Toronto skyline at dusk"
          fill
          priority
          sizes="100vw"
          quality={85}
        />
        <div className="hero-shade" />
      </div>
      <div className="hero-content">
        <div className="hero-eyebrow">
          <span className="status-dot" /> LIVE TELEVISION. REIMAGINED.
        </div>
        <h1>
          Your world.
          <br />
          <span>Live.</span>
        </h1>
        <p>
          Closer to home. Connected to the world.
          <br />
          Discover live television, the QYX way.
        </p>
        <div className="hero-buttons">
          <button
            className="button primary"
            disabled={!featured}
            onClick={() => featured && onWatch(featured)}
          >
            <Play size={18} fill="currentColor" />
            Watch live
          </button>
          <button className="button glass" onClick={onCountries}>
            <Globe2 size={18} />
            Explore countries
          </button>
        </div>
        <div className="hero-meta">
          <span className="mini-rule" />
          {countryName} first<span className="meta-dot">·</span>
          {count ? `${count.toLocaleString()} channels to explore` : 'Connecting to IPTV-org'}
        </div>
      </div>
      {featured && (
        <button className="featured-channel" onClick={() => onWatch(featured)}>
          <span className="featured-label">
            <Radio size={14} /> IN FOCUS
          </span>
          <span className="featured-channel-body">
            <span className="featured-logo">
              <ChannelLogo channel={featured} />
            </span>
            <span>
              <strong>{featured.name}</strong>
              <small>
                {featured.categories[0] ?? 'Live television'} · {featured.country}
              </small>
            </span>
            <ArrowUpRight size={19} />
          </span>
        </button>
      )}
      <span className="hero-location">
        TORONTO, CANADA <span>43.65° N / 79.38° W</span>
      </span>
    </section>
  )
}
