import { NextRequest, NextResponse } from 'next/server'
import { logOps } from '@/biblioteca/logs/logOps'

type WebVitalPayload = {
  name?: string
  value?: number
  delta?: number
  rating?: string
  id?: string
  navigationType?: string
  path?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WebVitalPayload
    if (!body?.name || typeof body.value !== 'number') {
      return NextResponse.json({ error: 'invalid_metric' }, { status: 400 })
    }

    await logOps({
      topic: 'web_vitals',
      status: body.name,
      metricName: body.name,
      metricValue: body.value,
      metricDelta: body.delta,
      metricRating: body.rating,
      metricId: body.id,
      page: body.path,
      navigationType: body.navigationType,
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }
}
