'use client'

import { useEffect } from 'react'
import type { Metric } from 'web-vitals'

export default function WebVitals() {
  useEffect(() => {
    const shouldSend =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_VITALS_DEBUG === 'true'

    if (!shouldSend || typeof window === 'undefined') return

    const sendMetric = (metric: Metric) => {
      const payload = {
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
        path: window.location.pathname,
      }

      const body = JSON.stringify(payload)
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' })
        navigator.sendBeacon('/api/metrics', blob)
        return
      }

      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }

    import('web-vitals')
      .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        onCLS(sendMetric)
        onFCP(sendMetric)
        onINP(sendMetric)
        onLCP(sendMetric)
        onTTFB(sendMetric)
      })
      .catch(() => {})
  }, [])

  return null
}
