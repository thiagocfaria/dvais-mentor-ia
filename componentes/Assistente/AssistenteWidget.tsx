'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const Assistente = dynamic(() => import('./Assistente'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] rounded-2xl border border-white/10 bg-white/5" />
  ),
})

const PUBLIC_ROUTES = new Set([
  '/',
  '/cadastro',
  '/login',
  '/analise-tempo-real',
  '/seguranca',
  '/aprendizado-continuo',
])

export default function AssistenteWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mobileSelectionMode, setMobileSelectionMode] = useState(false)
  const [cancelSelectionToken, setCancelSelectionToken] = useState(0)
  const isAllowed = useMemo(() => PUBLIC_ROUTES.has(pathname), [pathname])
  const isSelectionOverlay = open && mobileSelectionMode

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleSelectionMode = (event: Event) => {
      const detail = (event as CustomEvent<{ active?: boolean; mobileSelection?: boolean }>).detail
      setMobileSelectionMode(Boolean(detail?.active && detail?.mobileSelection))
    }

    window.addEventListener('assistente:selection-mode', handleSelectionMode as EventListener)
    return () => {
      window.removeEventListener('assistente:selection-mode', handleSelectionMode as EventListener)
    }
  }, [])

  if (!isAllowed) return null

  return (
    <div
      data-testid="assistente-widget"
      className={`fixed z-50 flex flex-col gap-3 ${
        isSelectionOverlay
          ? 'inset-x-3 top-3 items-stretch sm:inset-auto sm:bottom-6 sm:right-6 sm:items-end'
          : 'inset-x-2 bottom-4 items-end sm:inset-auto sm:bottom-6 sm:right-6'
      }`}
    >
      {open && (
        <div
          id="assistente-live-widget"
          aria-hidden={isSelectionOverlay}
          className={`h-[min(720px,calc(100vh-5rem))] max-h-[calc(100vh-5rem)] w-[calc(100vw-1rem)] max-w-none overflow-hidden rounded-[30px] border border-white/10 bg-black/75 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl transition-all duration-200 sm:h-[min(760px,calc(100vh-3rem))] sm:max-h-[min(760px,calc(100vh-3rem))] sm:w-[420px] sm:max-w-[92vw] ${
            isSelectionOverlay
              ? 'pointer-events-none invisible fixed -bottom-[200vh] left-0 top-auto h-px w-px overflow-hidden border-transparent opacity-0'
              : 'pointer-events-auto opacity-100'
          }`}
        >
          <Assistente
            onMobileSelectionModeChange={setMobileSelectionMode}
            cancelSelectionToken={cancelSelectionToken}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      {isSelectionOverlay && (
        <div
          data-testid="assistente-selection-overlay"
          data-assistente-selection-ui="true"
          className="pointer-events-auto fixed inset-x-3 top-3 z-[60] flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-slate-950/96 px-4 py-3 shadow-2xl shadow-cyan-950/50 sm:hidden"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Selecionando item
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-100">
              Toque em um elemento real da página. O chat volta automaticamente depois da captura.
            </p>
          </div>
          <button
            data-assistente-selection-ui="true"
            className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
            onClick={() => setCancelSelectionToken(prev => prev + 1)}
          >
            Cancelar
          </button>
        </div>
      )}

      {!isSelectionOverlay && (
        <button
          className="group flex items-center gap-2 self-end rounded-full border border-white/10 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500"
          onClick={() => {
            if (open) {
              setMobileSelectionMode(false)
            }
            setOpen(prev => !prev)
          }}
          aria-expanded={open}
          aria-controls="assistente-live-widget"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-200" />
          </span>
          <span>{open ? 'Ocultar Davi' : 'Falar com Davi'}</span>
        </button>
      )}
    </div>
  )
}
