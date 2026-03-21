'use client'

import { useMemo, useState } from 'react'
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
  const isAllowed = useMemo(() => PUBLIC_ROUTES.has(pathname), [pathname])

  if (!isAllowed) return null

  return (
    <div
      data-testid="assistente-widget"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
    >
      {open && (
        <div
          id="assistente-live-widget"
          className="w-[360px] max-w-[90vw] rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs uppercase text-cyan-200 font-semibold">Davi ao vivo</p>
              <p className="text-[11px] text-gray-300">Voz + selecao por duplo clique</p>
            </div>
            <button
              className="rounded-lg bg-gray-800 px-2 py-1 text-[11px] text-white hover:bg-gray-700 transition-colors"
              onClick={() => setOpen(false)}
            >
              Fechar
            </button>
          </div>
          <div className="p-3">
            <Assistente />
          </div>
        </div>
      )}

      <button
        className="group flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls="assistente-live-widget"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-200" />
        </span>
        <span>{open ? 'Ocultar Davi' : 'Falar com Davi'}</span>
      </button>
    </div>
  )
}
