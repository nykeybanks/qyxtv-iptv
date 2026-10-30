import { NextRequest, NextResponse } from 'next/server'
import { getCatalogue } from '@/lib/iptv/service'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get('country') ?? 'CA'
  const ids = request.nextUrl.searchParams.get('ids')
  if (!/^(ALL|[A-Z]{2})$/.test(country) || (ids && ids.length > 16000))
    return NextResponse.json({ error: 'Invalid catalogue filter.' }, { status: 400 })
  try {
    const data = await getCatalogue()
    const selected = ids ? new Set(ids.split(',').slice(0, 300)) : null
    const channels = data.channels.filter(channel =>
      selected ? selected.has(channel.id) : country === 'ALL' || channel.country === country
    )
    return NextResponse.json(
      { ...data, channels },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch {
    return NextResponse.json(
      { error: 'The IPTV-org catalogue is temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
