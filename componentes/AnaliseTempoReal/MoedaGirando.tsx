/**
 * MoedaGirando Component
 *
 * Moeda girando infinitamente com cifrão ($) no centro vazado
 * - Animação CSS de rotação contínua
 * - Cifrão transparente no centro
 * - Gira infinitamente para a direita (sentido horário)
 *
 * Performance:
 * - Server Component (compatível com App Router)
 * - CSS global em globals.css (cacheável)
 * - Usa transform e will-change para aceleração GPU
 * - Animação CSS pura (sem JavaScript)
 *
 * @returns {JSX.Element} Moeda girando com cifrão
 */
export default function MoedaGirando() {
  return (
    <div className="relative w-20 h-20">
      {/* Moeda girando */}
      <div
        className="moeda-girando w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/50"
        style={{
          boxShadow:
            '0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.4), 0 0 90px rgba(251, 191, 36, 0.2)',
        }}
      >
        {/* Cifrão no centro - vazado (transparente) */}
        <div
          className="text-white text-4xl font-bold"
          style={{
            WebkitTextStroke: '2px white',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
          }}
        >
          $
        </div>
      </div>
    </div>
  )
}
