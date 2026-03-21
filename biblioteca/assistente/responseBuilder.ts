import { NextResponse } from 'next/server'
import { gzip } from 'zlib'
import { promisify } from 'util'
import type { AssistantResponse } from '@/app/api/assistente/state'

const gzipAsync = promisify(gzip)

/**
 * Cria resposta otimizada com compressão gzip e cache headers para edge (Vercel CDN).
 */
export async function createOptimizedResponse(
  data: AssistantResponse,
  isCacheHit: boolean = false
): Promise<NextResponse> {
  const jsonString = JSON.stringify(data)

  const shouldCompress = process.env.NODE_ENV === 'production' && jsonString.length > 1024
  let body: BodyInit = jsonString
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (shouldCompress) {
    try {
      const compressed = await gzipAsync(Buffer.from(jsonString))
      body = new Uint8Array(compressed)
      headers['Content-Encoding'] = 'gzip'
    } catch {
      body = jsonString
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    headers['Cache-Control'] = 'no-store'
    return new NextResponse(body, { headers })
  }

  if (isCacheHit) {
    headers['Cache-Control'] = 'public, s-maxage=600, stale-while-revalidate=300, max-age=60'
    headers['CDN-Cache-Control'] = 'public, s-maxage=600'
    headers['Vercel-CDN-Cache-Control'] = 'public, s-maxage=600'
  } else {
    headers['Cache-Control'] = 'public, s-maxage=300, stale-while-revalidate=60, max-age=30'
    headers['CDN-Cache-Control'] = 'public, s-maxage=300'
    headers['Vercel-CDN-Cache-Control'] = 'public, s-maxage=300'
  }

  return new NextResponse(body, { headers })
}
