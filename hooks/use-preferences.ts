'use client'
import useSWR from 'swr'
import { useState } from 'react'
import type { Preferences } from '@/lib/iptv/types'

const key = 'qyxtv.preferences.v1'
const defaults: Preferences = { country: 'CA', favorites: [], recent: [], motion: 'balanced' }
const ids = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string' && id.length <= 200).slice(0, 300)
    : []
export function usePreferences() {
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  const { data = defaults, mutate } = useSWR<Preferences>(
    key,
    () => {
      try {
        const stored = JSON.parse(localStorage.getItem(key) ?? 'null')
        if (!stored) return defaults
        return {
          country: /^(ALL|[A-Z]{2})$/.test(stored.country) ? stored.country : 'CA',
          favorites: ids(stored.favorites),
          recent: ids(stored.recent),
          motion: ['immersive', 'balanced', 'reduced'].includes(stored.motion)
            ? stored.motion
            : 'balanced'
        }
      } catch {
        setStorageUnavailable(true)
        return defaults
      }
    },
    { fallbackData: defaults, revalidateOnFocus: false, revalidateOnReconnect: false }
  )
  function update(transform: (current: Preferences) => Preferences) {
    void mutate(
      current => {
        const next = transform(current ?? defaults)
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          setStorageUnavailable(true)
        }
        return next
      },
      { revalidate: false }
    )
  }
  return { preferences: data, update, storageUnavailable }
}
