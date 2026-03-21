/**
 * @experimental Model management scaffolding; no real models loaded yet.
 *
 * AI Models Management
 *
 * Gerenciamento de modelos de IA (TensorFlow.js)
 * Cache inteligente e lazy loading de modelos
 */

'use client'

// Tipos para modelos (serão carregados dinamicamente quando necessário)
type TFModel = unknown

/**
 * Tipo de modelo
 */
export type ModelType = 'classification' | 'regression' | 'detection' | 'custom'

/**
 * Informações do modelo
 */
export interface ModelInfo {
  name: string
  type: ModelType
  url: string
  loaded: boolean
  size?: number
}

/**
 * Cache de modelos carregados
 */
const modelCache = new Map<string, TFModel>()

/**
 * Registro de modelos disponíveis
 */
const modelRegistry: Map<string, ModelInfo> = new Map()

/**
 * Registra um modelo
 */
export function registerModel(name: string, info: Omit<ModelInfo, 'loaded'>): void {
  modelRegistry.set(name, {
    ...info,
    loaded: false,
  })
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📋 Modelo registrado: ${name}`)
  }
}

/**
 * Carrega um modelo (com cache)
 * Nota: Requer @tensorflow/tfjs completo (não apenas core)
 */
export async function loadModel(name: string): Promise<TFModel> {
  // Verificar se já está em cache
  if (modelCache.has(name)) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Modelo em cache: ${name}`)
    }
    return modelCache.get(name)!
  }

  // Verificar se está registrado
  const modelInfo = modelRegistry.get(name)
  if (!modelInfo) {
    throw new Error(`Modelo não registrado: ${name}`)
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`⏳ Carregando modelo: ${name} (${modelInfo.url})`)
    }
    const startTime = performance.now()

    // Carregar modelo (importação dinâmica do TensorFlow.js completo)
    const tf = await import('@tensorflow/tfjs')
    const model = await tf.loadLayersModel(modelInfo.url)

    const endTime = performance.now()
    const loadTime = endTime - startTime

    // Adicionar ao cache
    modelCache.set(name, model)
    modelInfo.loaded = true

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Modelo carregado: ${name} (${loadTime.toFixed(2)}ms)`)
    }

    return model
  } catch (error) {
    console.error(`❌ Erro ao carregar modelo ${name}:`, error)
    throw error
  }
}

/**
 * Descarrega um modelo (libera memória)
 */
export async function unloadModel(name: string): Promise<void> {
  const model = modelCache.get(name)
  if (model) {
    // Verificar se o modelo tem método dispose (TensorFlow.js)
    if (
      model &&
      typeof model === 'object' &&
      'dispose' in model &&
      typeof (model as { dispose: () => void }).dispose === 'function'
    ) {
      ;(model as { dispose: () => void }).dispose()
    }
    modelCache.delete(name)

    const modelInfo = modelRegistry.get(name)
    if (modelInfo) {
      modelInfo.loaded = false
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🗑️ Modelo descarregado: ${name}`)
    }
  }
}

/**
 * Lista modelos disponíveis
 */
export function listModels(): ModelInfo[] {
  return Array.from(modelRegistry.values())
}

/**
 * Verifica se um modelo está carregado
 */
export function isModelLoaded(name: string): boolean {
  return modelCache.has(name)
}

/**
 * Limpa todos os modelos (libera memória)
 */
export async function clearModelCache(): Promise<void> {
  // Usar Array.from para evitar problemas com downlevelIteration
  const entries = Array.from(modelCache.entries())
  for (const [name, model] of entries) {
    // Verificar se o modelo tem método dispose (TensorFlow.js)
    if (
      model &&
      typeof model === 'object' &&
      'dispose' in model &&
      typeof (model as { dispose: () => void }).dispose === 'function'
    ) {
      ;(model as { dispose: () => void }).dispose()
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🗑️ Modelo descarregado: ${name}`)
    }
  }

  modelCache.clear()

  // Usar Array.from para evitar problemas com downlevelIteration
  const modelInfos = Array.from(modelRegistry.values())
  for (const modelInfo of modelInfos) {
    modelInfo.loaded = false
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Cache de modelos limpo')
  }
}

/**
 * Retorna informações de memória usada pelos modelos
 * Nota: Requer TensorFlow.js carregado
 */
export async function getMemoryInfo(): Promise<{
  numTensors: number
  numBytes: number
  numBytesFormatted: string
}> {
  const tf = await import('@tensorflow/tfjs')
  const memoryInfo = tf.memory()

  return {
    numTensors: memoryInfo.numTensors,
    numBytes: memoryInfo.numBytes,
    numBytesFormatted: formatBytes(memoryInfo.numBytes),
  }
}

/**
 * Formata bytes para formato legível
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Exemplo de modelo pré-registrado (placeholder)
// Em produção, registre seus modelos reais aqui
if (typeof window !== 'undefined') {
  // registerModel('example-model', {
  //   name: 'Example Model',
  //   type: 'classification',
  //   url: '/models/example-model/model.json',
  // })
}
