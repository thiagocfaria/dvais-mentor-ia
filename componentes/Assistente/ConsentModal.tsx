'use client'

export type ConsentModalProps = {
  speechAvailable: boolean
  isCoarsePointer: boolean
  onActivate: (withVoice: boolean, continuous?: boolean) => void
  onCancel: () => void
}

export function ConsentModal({
  speechAvailable,
  isCoarsePointer,
  onActivate,
  onCancel,
}: ConsentModalProps) {
  return (
    <div className="m-3 rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-sm text-white shadow-2xl">
      <p className="text-sm font-semibold">Ligar o Davi</p>
      <p className="mt-1 text-xs text-slate-300">
        O Davi tenta iniciar uma sessão por voz na própria página. Se o navegador limitar a captura
        ou o áudio, o chat entra em modo texto automaticamente.
      </p>

      <div className="mt-4 grid gap-3">
        <button
          className="rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-left text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 hover:from-cyan-400 hover:to-blue-500 transition-colors"
          onClick={() => onActivate(true, !isCoarsePointer)}
          disabled={!speechAvailable}
        >
          Ligar Davi por voz
        </button>

        <button
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onActivate(false)}
        >
          Continuar em texto
        </button>
      </div>

      {!speechAvailable && (
        <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          Este navegador não oferece captura de voz confiável aqui. O chat continua funcionando em texto.
        </p>
      )}

      <button
        className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10 transition-colors"
        onClick={onCancel}
      >
        Cancelar
      </button>
    </div>
  )
}
