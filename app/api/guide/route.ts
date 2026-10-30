import { NextRequest, NextResponse } from 'next/server'
import { getGuide } from '@/lib/iptv/service'
export const maxDuration = 60
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? ''
  if (!/^[\w.+-]{1,200}$/.test(id))
    return NextResponse.json({ error: 'Invalid channel.' }, { status: 400 })
  try {
    return NextResponse.json(
      { sources: await getGuide(id) },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
    )
  } catch {
    return NextResponse.json(
      { error: 'Guide metadata is temporarily unavailable.' },
      { status: 503 }
    )
  }
}
