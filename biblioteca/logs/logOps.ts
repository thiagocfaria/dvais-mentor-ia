import fs from 'fs/promises'
import path from 'path'

type LogPayload = {
  topic: string
  status: string
  latencyMs?: number
  tokens?: number
  mode?: string
  error?: string
  user?: string | number
  attempt?: number
  memoryUsed?: number
  memoryTotal?: number
  memory?: number
  intent?: string
  confidence?: number
  keywords?: string
  secondaryIntents?: string
  metricName?: string
  metricValue?: number
  metricDelta?: number
  metricRating?: string
  metricId?: string
  page?: string
  navigationType?: string
}

const LOG_PATH = path.join(process.cwd(), 'storage', 'logs', 'log_ops.jsonl')
const COLLECTOR_URL = process.env.LOG_COLLECTOR_URL
const MAX_LOG_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_LOG_FILES = 5

async function rotateLogIfNeeded() {
  try {
    const stats = await fs.stat(LOG_PATH).catch(() => null)
    if (!stats || stats.size < MAX_LOG_SIZE) return

    // Rotacionar arquivos existentes
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const oldFile = `${LOG_PATH}.${i}`
      const newFile = `${LOG_PATH}.${i + 1}`
      try {
        await fs.access(oldFile)
        await fs.rename(oldFile, newFile)
      } catch {
        // Arquivo não existe, continuar
      }
    }

    // Mover arquivo atual para .1
    await fs.rename(LOG_PATH, `${LOG_PATH}.1`)
  } catch {
    // Ignorar erro de rotação
  }
}

async function appendLocal(line: string) {
  try {
    await fs.mkdir(path.dirname(LOG_PATH), { recursive: true })

    // Rotacionar logs se necessário ANTES de append
    await rotateLogIfNeeded()

    await fs.appendFile(LOG_PATH, `${line}\n`, { encoding: 'utf8' })
  } catch {
    // ignore in dev if FS fails
  }
}

async function sendToCollector(line: string) {
  if (!COLLECTOR_URL) return false
  try {
    await fetch(COLLECTOR_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: line,
    })
    return true
  } catch {
    return false
  }
}

export async function logOps(payload: LogPayload) {
  const entry = { ts: new Date().toISOString(), ...payload }
  const line = JSON.stringify(entry)
  if (!process.env.VERCEL) {
    await appendLocal(line)
    return
  }
  // Produção: preferir coletor remoto (KV/Blob/DB por trás)
  const sent = await sendToCollector(line)
  if (!sent) {
    console.log('[log_ops]', line)
  }
}
