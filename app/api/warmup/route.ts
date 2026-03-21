import { NextResponse } from 'next/server'
import { askFromKnowledgeBase } from '@/biblioteca/assistente/knowledgeBase'

/**
 * Endpoint de warm-up para manter funções serverless "quentes"
 * Chamado via cron job a cada 5 minutos
 *
 * Este endpoint pré-carrega:
 * - Índice da Knowledge Base
 * - Cache de normalização (via primeira chamada)
 * - Módulos necessários
 */
export async function GET() {
  const start = performance.now()

  try {
    // Pré-carregar KB (warm-up do índice invertido)
    // Isso força a inicialização do índice se ainda não foi feito
    askFromKnowledgeBase('warmup')

    // Fazer uma segunda chamada para aquecer cache de normalização
    askFromKnowledgeBase('teste de warmup')

    const latency = Math.round(performance.now() - start)

    return NextResponse.json({
      status: 'warmed',
      latencyMs: latency,
      timestamp: new Date().toISOString(),
      message: 'Função aquecida com sucesso',
    })
  } catch (error: unknown) {
    // Não falhar se houver erro (warm-up é opcional)
    return NextResponse.json(
      {
        status: 'warmed_with_errors',
        error: error instanceof Error ? error.message : 'unknown',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    ) // Retornar 200 mesmo com erro (warm-up não deve quebrar)
  }
}
