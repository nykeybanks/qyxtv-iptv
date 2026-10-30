import { notFound } from 'next/navigation'
import { QYXtvApp } from '@/components/tv/qyxtv-app'
import type { Scene } from '@/lib/iptv/types'

export default async function Page({ params }: { params: Promise<{ scene?: string[] }> }) {
  const { scene } = await params
  const route = scene?.[0] ?? 'discover'
  if ((scene?.length ?? 0) > 1 || !['discover', 'live', 'favorites', 'recent'].includes(route))
    notFound()
  return <QYXtvApp initialScene={route as Scene} />
}
