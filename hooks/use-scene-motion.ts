'use client'
import { useLayoutEffect, useRef } from 'react'
import type { Preferences } from '@/lib/iptv/types'

export function useSceneMotion(sceneKey: string, mode: Preferences['motion']) {
  const ref = useRef<HTMLDivElement>(null)
  const previous = useRef(sceneKey)
  const interrupted = useRef<{ opacity: string; transform: string } | null>(null)
  useLayoutEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const element = ref.current
    if (!element) return
    const animations: Animation[] = []
    const cancel = () => animations.forEach(animation => animation.cancel())
    if (previous.current !== sceneKey && !media.matches && mode !== 'reduced') {
      const surface = element.querySelector<HTMLElement>('[data-scene-surface]') ?? element
      const groups = element.querySelectorAll<HTMLElement>('[data-scene-group]')
      if (surface) {
        const mediaOnly = !surface.classList.contains('hero-visual')
        const start = interrupted.current ?? {
          opacity: mediaOnly ? '0.92' : '0.55',
          transform: mediaOnly ? 'none' : 'translateY(6px) scale(1.005)'
        }
        animations.push(
          surface.animate(
            [
              { opacity: start.opacity, transform: mediaOnly ? 'none' : start.transform },
              {
                opacity: 0.94,
                transform: mediaOnly ? 'none' : 'translateY(1px) scale(1.001)',
                offset: 0.7
              },
              { opacity: 1, transform: 'none' }
            ],
            { duration: 3000, easing: 'cubic-bezier(0.22,1,0.36,1)' }
          )
        )
      }
      interrupted.current = null
      groups.forEach(group =>
        animations.push(
          group.animate([{ opacity: 0.75 }, { opacity: 1 }], {
            delay: 150,
            duration: 2400,
            easing: 'cubic-bezier(0.22,1,0.36,1)'
          })
        )
      )
    }
    previous.current = sceneKey
    const reduce = () => {
      if (media.matches) cancel()
    }
    media.addEventListener('change', reduce)
    return () => {
      const surface = element.querySelector<HTMLElement>('[data-scene-surface]') ?? element
      if (
        surface &&
        animations.some(animation => animation.playState === 'running') &&
        !media.matches
      ) {
        const style = getComputedStyle(surface)
        interrupted.current = { opacity: style.opacity, transform: style.transform }
      } else interrupted.current = null
      cancel()
      media.removeEventListener('change', reduce)
    }
  }, [sceneKey, mode])
  return ref
}
