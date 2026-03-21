'use client'

import { usePathname } from 'next/navigation'
import Comets from './Comets'

const ALLOWED_ROUTES = new Set([
  '/',
  '/cadastro',
  '/login',
  '/analise-tempo-real',
  '/seguranca',
  '/aprendizado-continuo',
])

export default function CometsLayer() {
  const pathname = usePathname()
  if (!ALLOWED_ROUTES.has(pathname)) return null
  return <Comets />
}
