'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export function useViewport() {
  useEffect(() => {
    const viewport = window.visualViewport
    const update = () => {
      // Keep browser magnification/panning native; only keyboard and browser chrome resize the shell.
      if (viewport && viewport.scale !== 1) return
      const height = viewport?.height ?? window.innerHeight
      document.documentElement.dataset.viewportHeight =
        height <= 480 ? 'focused' : height <= 670 ? 'compact' : 'expanded'
      document.documentElement.style.setProperty('--usable-height', `${height}px`)
      document.documentElement.style.setProperty('--viewport-top', `${viewport?.offsetTop ?? 0}px`)
    }
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      document.documentElement.style.removeProperty('--usable-height')
      document.documentElement.style.removeProperty('--viewport-top')
      delete document.documentElement.dataset.viewportHeight
    }
  }, [])
}

export function useGridCapacity(minWidth = 200, rowHeight = 190, oneRow = false) {
  const ref = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ capacity: 0, columns: 1 })
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new ResizeObserver(([entry]) => {
      clearTimeout(timer)
      const { width, height } = entry.contentRect
      const columns = Math.max(1, Math.floor((width + 16) / (minWidth + 16)))
      const rows =
        height < rowHeight ? 0 : oneRow ? 1 : Math.floor((height + 16) / (rowHeight + 16))
      const next = { capacity: columns * rows, columns }
      setLayout(current => {
        if (next.capacity <= current.capacity || current.capacity === 0) return next
        timer = setTimeout(() => setLayout(next), 220)
        return current
      })
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [minWidth, rowHeight, oneRow])
  return { ref, ...layout }
}
