'use client'

export type ConsentModalProps = {
  speechAvailable: boolean
  showTextDebug: boolean
  onActivate: (withVoice: boolean, continuous?: boolean) => void
  onCancel: () => void
}

export function ConsentModal({
  speechAvailable,
  showTextDebug,
  onActivate,
  onCancel,
}: ConsentModalProps) {
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/60 p-3 text-sm text-white space-y-2">
      <p className="font-semibold">Consentimento de voz</p>
      <p className="text-xs text-gray-200">Ative o modo ao vivo para começar:</p>
      <div className="flex flex-col gap-2">
        <button
          className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onActivate(true, true)}
          disabled={!speechAvailable}
        >
          🎤 Conversa Contínua (Live)
        </button>
        <p className="text-xs text-gray-400 px-2">
          Escuta contínua - fale naturalmente, e use duplo clique para selecionar o assunto
        </p>

        {showTextDebug && (
          <>
            <button
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onActivate(true, false)}
              disabled={!speechAvailable}
            >
              🎙️ Voz Manual (debug)
            </button>
            <p className="text-xs text-gray-400 px-2">
              Clique para falar, depois clique em &quot;Perguntar&quot;
            </p>

            <button
              className="rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
              onClick={() => onActivate(false)}
            >
              ⌨️ Apenas Texto (debug)
            </button>
          </>
        )}

        <button
          className="rounded-lg bg-gray-800 px-3 py-2 text-xs text-white hover:bg-gray-700 transition-colors"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
      {!speechAvailable && (
        <p className="text-xs text-amber-200 mt-2">
          ⚠️ Sem Web Speech API ou permissão negada. Use um navegador compatível.
        </p>
      )}
    </div>
  )
}
