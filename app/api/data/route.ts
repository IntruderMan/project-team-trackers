import { NextResponse } from 'next/server'
import { getBoardData, saveBoardData } from '@/lib/db'

export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json(getBoardData())
}

export async function PUT(request: Request) {
  const data = await request.json()
  if (!data || !Array.isArray(data.members) || !Array.isArray(data.leaves) || !Array.isArray(data.modules)) {
    return NextResponse.json({ error: 'Invalid tracker data.' }, { status: 400 })
  }
  saveBoardData(data)
  return NextResponse.json({ ok: true })
}
