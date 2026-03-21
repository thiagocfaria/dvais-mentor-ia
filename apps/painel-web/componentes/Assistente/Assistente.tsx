'use client'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { speakText, isSpeaking } from '@/biblioteca/assistente/textToSpeech'
import { getSelectorForTargetId } from '@/biblioteca/assistente/actionValidator'
import { highlightButton, stopHighlight } from '@/biblioteca/assistente/cometEvents'
import type { KBAction } from '@/biblioteca/assistente/knowledgeBase'
import { pickVariant } from '@/biblioteca/assistente/knowledgeBase'
import { ChatMessage } from './ChatMessage'
import { ThinkingIndicator, ListeningWave, TypingIndicator } from './StatusIndicators'
import { detectIntent } from '@/biblioteca/assistente/intentDetection'
import { useAssistantSession } from './hooks/useAssistantSession'
import { useClickContext } from './hooks/useClickContext'
import { useLiveVoice } from './hooks/useLiveVoice'

type GuidedStep = { id: string; title: string; description: string; targetId: string }
type TranscriptEntry = { question: string; answer: string; timestamp: number }
const HIGHLIGHT_MS = 3500
const MAX_SPOKEN_LEN = 260
const CLICK_CONTEXT_TTL_MS = 2 * 60 * 1000
const TRANSCRIPT_STORAGE_KEY = 'assistente_transcript'
const hasSTT = () =>
  typeof window !== 'undefined' &&
  (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition)
const hasTTS = () => typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'
const normalizeTtsText = (text: string) =>
  text
    .replace(/DVAi\$/gi, 'Davi')
    .replace(/DVAiS/gi, 'Davi')
    .replace(/DVAi/gi, 'Davi')

// Helper function para aguardar elemento aparecer no DOM (usando MutationObserver)
function waitForElement(selector: string, timeout: number = 10000): Promise<HTMLElement | null> {
  return new Promise(resolve => {
    // Verificar imediatamente
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      resolve(element)
      return
    }

    let observer: MutationObserver | null = null
    let timeoutId: number | null = null
    let resolved = false

    const cleanup = () => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    const checkAndResolve = (element: HTMLElement | null) => {
      if (!resolved && element) {
        resolved = true
        cleanup()
        resolve(element)
      }
    }

    // MutationObserver para detectar elementos adicionados
    observer = new MutationObserver(() => {
      const el = document.querySelector(selector) as HTMLElement
      checkAndResolve(el)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Timeout fallback
    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        const el = document.querySelector(selector) as HTMLElement
        resolve(el) // Retorna null se não encontrado
      }
    }, timeout) as any
  })
}

function formatTranscript(
  history: TranscriptEntry[],
  sessionId: string | null,
  currentPage: string
): string {
  const header = [
    'Transcricao de testes - Assistente Davi',
    `Sessao: ${sessionId ?? 'sem-id'}`,
    `Pagina: ${currentPage || '-'}`,
    `Gerado em: ${new Date().toISOString()}`,
  ]

  const entries = history
    .filter(item => item.question || item.answer)
    .map(item => {
      const timestamp = new Date(item.timestamp).toLocaleString('pt-BR')
      const lines: string[] = []
      if (item.question) {
        lines.push(`Usuario (${timestamp}): ${item.question}`)
      }
      if (item.answer) {
        lines.push(`Davi (${timestamp}): ${item.answer}`)
      }
      return lines.join('\n')
    })

  return [...header, '', ...entries].join('\n\n').trim()
}

export default function Assistente() {
  const [isActive, setIsActive] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [useVoice, setUseVoice] = useState(false)
  const [caption, setCaption] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [question, setQuestion] = useState('')
  const [qaAnswer, setQaAnswer] = useState('')
  const [mode, setMode] = useState<'normal' | 'economico' | 'erro'>('normal')
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ question: string; answer: string; timestamp: number }>
  >([])
  const [isThinking, setIsThinking] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [visibleElements, setVisibleElements] = useState<string[]>([])
  const [continuousMode, setContinuousMode] = useState(false) // Modo conversa contínua
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false) // Flag para rastrear quando TTS está falando
  const cleanupRef = useRef<(() => void) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const assistantRootRef = useRef<HTMLDivElement>(null)
  const handleAskRef = useRef<
    ((speechAvailable: boolean, ttsAvailable: boolean) => Promise<void>) | null
  >(null)
  const highlightTimeoutRef = useRef<number | null>(null) // Para cleanup de timeouts de highlight
  const scrollTimeoutRef = useRef<number | null>(null) // Para cleanup de timeout de scroll pós-navegação
  const actionTimeoutRef = useRef<number | null>(null) // Para cleanup de timeout de actions
  const startLiveTimeoutRef = useRef<number | null>(null) // Para cleanup de timeout de startLive

  const showTextDebug = process.env.NEXT_PUBLIC_ASSISTENTE_TEXT_DEBUG === 'true'
  const enableTranscriptDebug = process.env.NODE_ENV !== 'production' || showTextDebug
  const liveHintFallback =
    'Use clique único para abrir e duplo clique rápido para selecionar o assunto.'

  // Refs para evitar stale closures no modo contínuo
  const isActiveRef = useRef(isActive)
  const continuousModeRef = useRef(continuousMode)
  const isThinkingRef = useRef(isThinking)
  const isTTSSpeakingRef = useRef(isTTSSpeaking)
  const isRestartingRef = useRef(false) // Flag para evitar race condition no reinício

  // Atualizar refs sempre que os valores mudarem
  useEffect(() => {
    isActiveRef.current = isActive
  }, [isActive])

  useEffect(() => {
    continuousModeRef.current = continuousMode
  }, [continuousMode])

  useEffect(() => {
    isThinkingRef.current = isThinking
  }, [isThinking])

  useEffect(() => {
    isTTSSpeakingRef.current = isTTSSpeaking
  }, [isTTSSpeaking])

  const sessionIdRef = useAssistantSession()
  const currentPage = typeof window !== 'undefined' ? window.location.pathname : ''

  const steps: GuidedStep[] = useMemo(
    () => [
      {
        id: 'hero',
        title: 'Bem-vindo ao DVAi$',
        description:
          'Esta é a página inicial. Aqui você encontra informações sobre a plataforma e pode começar seu cadastro clicando em "Começar Agora".',
        targetId: 'hero-content',
      },
      {
        id: 'features',
        title: 'Funcionalidades chave',
        description:
          'O DVAi$ oferece três pilares principais: Análise em Tempo Real para acompanhar o mercado, Proteção Inteligente para gestão de risco, e Aprendizado Contínuo para evoluir seus conhecimentos.',
        targetId: 'features-section',
      },
      {
        id: 'stats',
        title: 'Resultados e métricas',
        description:
          'Veja os números que comprovam a eficácia da plataforma e a confiança dos investidores que já utilizam o DVAi$.',
        targetId: 'stats-section',
      },
    ],
    []
  )

  // Carregar histórico de conversa do sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = sessionStorage.getItem('assistente_conversation')
    if (saved) {
      try {
        const history = JSON.parse(saved)
        // Manter apenas últimas 10 mensagens
        const recent = history.slice(-10)
        setConversationHistory(recent)
      } catch (e) {
        // Ignorar erro de parse
      }
    }
  }, [])

  // Salvar histórico quando mudar
  useEffect(() => {
    if (typeof window === 'undefined' || conversationHistory.length === 0) return
    sessionStorage.setItem('assistente_conversation', JSON.stringify(conversationHistory))
  }, [conversationHistory])

  const buildTranscript = useCallback(() => {
    return formatTranscript(conversationHistory, sessionIdRef.current, currentPage)
  }, [conversationHistory, currentPage, sessionIdRef])

  useEffect(() => {
    if (typeof window === 'undefined' || !enableTranscriptDebug) return
    if (conversationHistory.length === 0) return
    const transcript = buildTranscript()
    if (!transcript) return
    try {
      localStorage.setItem(TRANSCRIPT_STORAGE_KEY, transcript)
    } catch (error) {
      // Ignorar falhas de storage no modo debug
    }
  }, [conversationHistory, buildTranscript, enableTranscriptDebug])

  const handleExportTranscript = useCallback(() => {
    if (typeof window === 'undefined') return
    const transcript = buildTranscript()
    if (!transcript) return
    const blob = new Blob([`${transcript}\n`], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    link.href = url
    link.download = `davi-transcricao-${timestamp}.txt`
    link.click()
    window.URL.revokeObjectURL(url)
  }, [buildTranscript])

  const handleClearTranscript = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(TRANSCRIPT_STORAGE_KEY)
    } catch (error) {
      // Ignorar falhas de storage no modo debug
    }
  }, [])

  // Scroll automático para última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory, caption, qaAnswer])

  // Detectar elementos visíveis na página (estabilizado com debounce e threshold maior)
  useEffect(() => {
    if (typeof window === 'undefined' || !isActive) return

    const visibleSet = new Set<string>()
    let debounceTimer: number | null = null

    const updateVisibleElements = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      debounceTimer = setTimeout(() => {
        setVisibleElements(Array.from(visibleSet))
        debounceTimer = null
      }, 200) as any
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target.id) {
            visibleSet.add(entry.target.id)
          } else if (entry.target.id) {
            visibleSet.delete(entry.target.id)
          }
        })
        updateVisibleElements()
      },
      { threshold: 0.5 } // Aumentado de 0.3 para 0.5 (50% visível)
    )

    // Observar elementos com IDs conhecidos
    const targetIds = [
      'hero-content',
      'features-section',
      'stats-section',
      'analise-hero',
      'seguranca-hero',
      'aprendizado-hero',
      'login-card',
      'cadastro-card',
    ]

    targetIds.forEach(id => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      observer.disconnect()
    }
  }, [isActive])

  const shouldClearClickedContext = useCallback((text: string): boolean => {
    const normalized = text.toLowerCase().trim()
    const clearPhrases = [
      'ja entendi',
      'já entendi',
      'entendi',
      'obrigado',
      'obrigada',
      'valeu',
      'ok',
      'beleza',
      'tudo bem',
      'não precisa',
      'nao precisa',
      'pode seguir',
      'segue',
      'próximo',
      'proximo',
      'mudar assunto',
      'outro assunto',
      'outra coisa',
      'outra parte',
      'quero ver outra',
      'pode ir',
      'segue em frente',
    ]
    return clearPhrases.some(phrase => normalized.includes(phrase))
  }, [])

  const appendFollowUp = useCallback((text: string): string => {
    const trimmed = text.trim()
    if (!trimmed) return text
    if (trimmed.endsWith('?')) return trimmed
    if (/quer saber mais/i.test(trimmed)) return trimmed
    const next = `${trimmed} Quer saber mais sobre esse assunto?`
    return next.length > MAX_SPOKEN_LEN ? trimmed : next
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !isActive || showTextDebug) return
    const bodyStyle = document.body.style
    const prevUserSelect = bodyStyle.userSelect
    const prevWebkitUserSelect = (bodyStyle as any).webkitUserSelect
    const prevTouchCallout = (bodyStyle as any).webkitTouchCallout

    bodyStyle.userSelect = 'none'
    ;(bodyStyle as any).webkitUserSelect = 'none'
    ;(bodyStyle as any).webkitTouchCallout = 'none'

    return () => {
      bodyStyle.userSelect = prevUserSelect
      ;(bodyStyle as any).webkitUserSelect = prevWebkitUserSelect
      ;(bodyStyle as any).webkitTouchCallout = prevTouchCallout
    }
  }, [isActive, showTextDebug])

  const highlight = useCallback((targetId: string) => {
    // Limpar timeout anterior se existir
    if (highlightTimeoutRef.current !== null) {
      clearTimeout(highlightTimeoutRef.current)
      highlightTimeoutRef.current = null
    }
    cleanupRef.current && cleanupRef.current()
    const selector = getSelectorForTargetId(targetId) || `#${targetId}`
    const el = document.querySelector(selector) as HTMLElement
    if (!el) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      cleanupRef.current = null
      return
    }
    const prev = el.style.boxShadow
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.7)'
    cleanupRef.current = () => {
      el.style.boxShadow = prev
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      cleanupRef.current && cleanupRef.current()
      highlightTimeoutRef.current = null
    }, HIGHLIGHT_MS)
  }, [])

  const highlightElement = useCallback((element: HTMLElement | null) => {
    if (!element) return
    // Limpar timeout anterior se existir
    if (highlightTimeoutRef.current !== null) {
      clearTimeout(highlightTimeoutRef.current)
      highlightTimeoutRef.current = null
    }
    cleanupRef.current && cleanupRef.current()
    const prev = element.style.boxShadow
    element.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.7)'
    cleanupRef.current = () => {
      element.style.boxShadow = prev
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      cleanupRef.current && cleanupRef.current()
      highlightTimeoutRef.current = null
    }, HIGHLIGHT_MS)
  }, [])

  const { clickedContext, setClickedContext, hintMessage, setHintMessage } = useClickContext({
    isActive,
    showTextDebug,
    assistantRootRef,
    highlight,
    highlightElement,
  })
  const liveHintMessage = hintMessage || (caption && caption !== qaAnswer ? caption : liveHintFallback)
  const activeSelection =
    clickedContext && Date.now() - clickedContext.timestamp < CLICK_CONTEXT_TTL_MS
      ? clickedContext
      : null

  useEffect(() => {
    if (!clickedContext) return
    const timeoutId = window.setTimeout(() => {
      setClickedContext(prev =>
        prev && Date.now() - prev.timestamp >= CLICK_CONTEXT_TTL_MS ? null : prev
      )
    }, CLICK_CONTEXT_TTL_MS)
    return () => clearTimeout(timeoutId)
  }, [clickedContext, setClickedContext])

  const {
    isListening,
    setIsListening,
    toggleListening,
    startContinuousListeningRef,
    stopListening,
    cleanupVoice,
  } = useLiveVoice({
    hasSTT,
    hasTTS,
    isActiveRef,
    continuousModeRef,
    isThinkingRef,
    isTTSSpeakingRef,
    handleAskRef,
    setQuestion,
    setCaption,
    setContinuousMode,
  })

  useEffect(() => {
    return () => {
      // Limpar todos os timeouts
      if (highlightTimeoutRef.current !== null) {
        clearTimeout(highlightTimeoutRef.current)
        highlightTimeoutRef.current = null
      }
      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = null
      }
      if (actionTimeoutRef.current !== null) {
        clearTimeout(actionTimeoutRef.current)
        actionTimeoutRef.current = null
      }
      if (startLiveTimeoutRef.current !== null) {
        clearTimeout(startLiveTimeoutRef.current)
        startLiveTimeoutRef.current = null
      }
      cleanupRef.current && cleanupRef.current()
      abortControllerRef.current?.abort()
      cleanupVoice()
      isRestartingRef.current = false // Limpar flag de reinício no cleanup do componente
    }
  }, [cleanupVoice])

  const runStep = useCallback(
    (index: number) => {
      const step = steps[index]
      if (!step) return
      const msg = step.description || step.title
      setCaption(msg)
      if (useVoice && hasTTS()) speakText(normalizeTtsText(msg))
      highlight(step.targetId)
    },
    [useVoice, highlight]
  )

  const activate = useCallback(
    (withVoice: boolean, continuous: boolean = false) => {
      const voiceEnabled = withVoice && hasSTT()
      setUseVoice(voiceEnabled)
      setIsActive(true)
      setShowConsent(false)
      setCurrentIndex(0)
      const willBeContinuous = continuous && voiceEnabled
      setContinuousMode(willBeContinuous)

      const introMessage =
        'Assistente ativado. Clique uma vez para abrir, e dê um duplo clique rápido para selecionar o assunto. Depois pergunte por voz e eu respondo em tempo real.'
      setHintMessage(introMessage)
      setConversationHistory(prev =>
        [...prev, { question: '', answer: introMessage, timestamp: Date.now() }].slice(-10)
      )

      const startLive = () => {
        // Limpar timeout anterior se existir
        if (startLiveTimeoutRef.current !== null) {
          clearTimeout(startLiveTimeoutRef.current)
        }
        startLiveTimeoutRef.current = window.setTimeout(() => {
          if (startContinuousListeningRef.current) {
            startContinuousListeningRef.current()
          }
          startLiveTimeoutRef.current = null
        }, 500)
      }

      if (willBeContinuous) {
        if (voiceEnabled && hasTTS()) {
          setIsTTSSpeaking(true)
          speakText(normalizeTtsText(introMessage))
            .catch(() => {})
            .finally(() => {
              setIsTTSSpeaking(false)
              startLive()
            })
        } else {
          startLive()
        }
      } else {
        runStep(0)
      }
    },
    [runStep]
  )

  const deactivate = useCallback(() => {
    // Limpar todos os timeouts ao desativar
    if (highlightTimeoutRef.current !== null) {
      clearTimeout(highlightTimeoutRef.current)
      highlightTimeoutRef.current = null
    }
    if (scrollTimeoutRef.current !== null) {
      clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = null
    }
    if (actionTimeoutRef.current !== null) {
      clearTimeout(actionTimeoutRef.current)
      actionTimeoutRef.current = null
    }
    if (startLiveTimeoutRef.current !== null) {
      clearTimeout(startLiveTimeoutRef.current)
      startLiveTimeoutRef.current = null
    }
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    stopListening()
    setIsActive(false)
    setQuestion('')
    setQaAnswer('')
    setCaption('')
    setHintMessage('')
    setClickedContext(null)
    setMode('normal')
    setIsListening(false)
    setContinuousMode(false)
    setIsTTSSpeaking(false) // Limpar flag TTS ao desativar
    isRestartingRef.current = false // Limpar flag de reinício ao desativar
  }, [stopListening])

  // Mapear rota para targetId do botão
  const getButtonTargetIdForRoute = useCallback((route: string): string | null => {
    const routeMap: Record<string, string> = {
      '/cadastro': 'button-comecar-agora',
      '/login': 'button-login',
      '/analise-tempo-real': 'nav-analise',
      '/seguranca': 'nav-seguranca',
      '/aprendizado-continuo': 'nav-aprendizado',
    }
    return routeMap[route] || null
  }, [])

  // Processar actions[] recebidas da API
  const processActions = useCallback(
    (actions: KBAction[] = []) => {
      // Limpar timeout anterior se existir
      if (actionTimeoutRef.current !== null) {
        clearTimeout(actionTimeoutRef.current)
      }
      // Executar actions com pequeno delay para garantir que UI atualizou
      actionTimeoutRef.current = window.setTimeout(() => {
        for (const action of actions) {
          switch (action.type) {
            case 'scrollToSection':
              if (action.targetId) {
                highlight(action.targetId)
              }
              break
            case 'highlightSection':
              if (action.targetId) {
                highlight(action.targetId)
              }
              break
            case 'navigateRoute':
              handleNavigation(action.route, action.targetId) // targetId opcional para scroll pós-navegação
              break
            case 'showTooltip':
              // Implementar tooltip se necessário
              if (action.targetId && action.text) {
                setCaption(action.text)
              }
              break
          }
        }
        actionTimeoutRef.current = null
      }, 100) // Pequeno delay para garantir que resposta foi exibida
    },
    [highlight]
  )

  // Handle navigation com comets highlight
  const handleNavigation = useCallback(
    async (route: string, targetId?: string) => {
      // targetId agora vem do action.navigateRoute.targetId
      // 1. Falar sobre navegação
      const navMessage = `Para acessar esta informação, vamos para a página correspondente. Clique no botão destacado.`
      setCaption(navMessage)
      if (useVoice && hasTTS()) speakText(normalizeTtsText(navMessage))

      // 2. Encontrar targetId do botão que leva à rota
      const buttonTargetId = getButtonTargetIdForRoute(route)
      if (!buttonTargetId) {
        // Fallback: orientação textual
        const buttonName =
          route === '/cadastro'
            ? 'Começar Agora'
            : route === '/login'
              ? 'Login'
              : 'o botão correspondente'
        setCaption(`Para acessar esta página, clique em ${buttonName} no topo da página.`)
        return
      }

      // 3. Salvar pendingNavigation ANTES do clique
      if (targetId) {
        sessionStorage.setItem(
          'pendingNavigation',
          JSON.stringify({
            route,
            targetId,
            timestamp: Date.now(),
          })
        )
      }

      // 4. Highlight com comets (usa targetId, não selector)
      highlightButton(buttonTargetId)

      // 5. Usuário clica no botão (navegação automática via href)
      // NÃO navegar programaticamente - deixar o botão fazer a navegação
    },
    [useVoice, getButtonTargetIdForRoute]
  )

  // Scroll automático pós-navegação com MutationObserver
  useEffect(() => {
    // Verificar se há navegação pendente
    const pending = sessionStorage.getItem('pendingNavigation')
    if (!pending) return

    try {
      const { route, targetId, timestamp } = JSON.parse(pending)

      // Verificar se é da mesma sessão (últimos 30s)
      if (Date.now() - timestamp > 30000) {
        sessionStorage.removeItem('pendingNavigation')
        return
      }

      // Verificar se estamos na rota correta
      if (window.location.pathname !== route) return

      // Scroll com waitForElement (MutationObserver)
      const scrollToTarget = async () => {
        const selector = getSelectorForTargetId(targetId)
        if (!selector) {
          sessionStorage.removeItem('pendingNavigation')
          return
        }

        try {
          const element = await waitForElement(selector, 10000) // 10s timeout
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Highlight visual
            const prev = element.style.boxShadow
            element.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.7)'
            // Armazenar timeout para cleanup
            const highlightTimeoutId = window.setTimeout(() => {
              element.style.boxShadow = prev
            }, 3500)
            // Armazenar em ref para cleanup se componente desmontar
            if (highlightTimeoutRef.current !== null) {
              clearTimeout(highlightTimeoutRef.current)
            }
            highlightTimeoutRef.current = highlightTimeoutId

            sessionStorage.removeItem('pendingNavigation')

            // IA explica
            const routeNames: Record<string, string> = {
              '/analise-tempo-real': 'Análise em Tempo Real',
              '/seguranca': 'Proteção Inteligente',
              '/aprendizado-continuo': 'Aprendizado Contínuo',
            }
            const routeName = routeNames[route] || route
            const explanation = `Estamos na página ${routeName}. ${targetId ? 'Veja a seção destacada.' : ''}`
            setCaption(explanation)
            // Usar hasTTS() diretamente (não depende de useVoice aqui pois é pós-navegação)
            if (hasTTS()) speakText(normalizeTtsText(explanation))
          } else {
            sessionStorage.removeItem('pendingNavigation')
            setCaption('A seção está nesta página, role até encontrar.')
          }
        } catch (e) {
          sessionStorage.removeItem('pendingNavigation')
        }
      }

      // Executar após pequeno delay - armazenar timeout para cleanup
      scrollTimeoutRef.current = window.setTimeout(() => {
        scrollToTarget()
        scrollTimeoutRef.current = null
      }, 300)
    } catch (e) {
      sessionStorage.removeItem('pendingNavigation')
    }
  }, []) // Executar uma vez na montagem

  // Limpar pendingNavigation quando desativar ou fazer nova pergunta
  useEffect(() => {
    if (!isActive) {
      sessionStorage.removeItem('pendingNavigation')
      stopHighlight()
    }
  }, [isActive])

  const handleAsk = useCallback(
    async (speechAvailable: boolean, ttsAvailable: boolean) => {
      const q = question.trim()
      if (!q) return
      if (q.length > 300) {
        setCaption('Resuma sua pergunta em até 300 caracteres.')
        return
      }

      if (clickedContext && shouldClearClickedContext(q)) {
        const clearMessage =
          'Perfeito. Se quiser, posso explicar outra parte. Dê um duplo clique no item e pergunte.'
        setClickedContext(null)
        setHintMessage(clearMessage)
        setQaAnswer(clearMessage)
        setCaption(clearMessage)
        setConversationHistory(prev =>
          [...prev, { question: q, answer: clearMessage, timestamp: Date.now() }].slice(-10)
        )
        if (useVoice && ttsAvailable) {
          setIsTTSSpeaking(true)
          try {
            await speakText(normalizeTtsText(clearMessage))
          } finally {
            setIsTTSSpeaking(false)
          }
        }
        return
      }

      // Parar captura de voz se estiver ativa (mas não se estiver em modo contínuo)
      if (isListening && !continuousMode) {
        stopListening()
      }

      // Cancelar requisição anterior se existir
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      // Limpar pendingNavigation ao fazer nova pergunta
      sessionStorage.removeItem('pendingNavigation')
      stopHighlight()

      // Adicionar pergunta ao histórico imediatamente
      const questionTimestamp = Date.now()
      setConversationHistory(prev => [
        ...prev,
        { question: q, answer: '', timestamp: questionTimestamp },
      ])
      setQuestion('')
      setIsThinking(true)
      setIsStreaming(false)

      // Detectar intenção antes de chamar API
      // Usar detectMultiple=true para detectar intenções compostas
      // Usar considerHistory=true para considerar contexto de conversa
      const intent = detectIntent(q, {
        detectMultiple: true,
        considerHistory: true,
        useFuzzy: true,
      })

      // Preparar histórico de conversa (últimas 5 mensagens válidas)
      const recentHistory = conversationHistory
        .filter(h => h.question)
        .slice(-5)
        .map(h => ({
          role: 'user' as const,
          content: h.question,
        }))

      const now = Date.now()
      const activeClick =
        clickedContext && now - clickedContext.timestamp < CLICK_CONTEXT_TTL_MS
          ? clickedContext
          : null

      // Preparar contexto adicional
      const context: Record<string, unknown> = {
        currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
        visibleSections: visibleElements,
        intent: intent.type,
        intentConfidence: intent.confidence,
      }
      if (activeClick) {
        if (activeClick.targetId) context.clickedTargetId = activeClick.targetId
        if (activeClick.text) context.clickedText = activeClick.text
        if (activeClick.tag) context.clickedTag = activeClick.tag
      }

      // KB é consultada no route.ts (fonte da verdade)
      // Frontend apenas executa actions[] recebidas
      try {
        const headers: Record<string, string> = { 'content-type': 'application/json' }
        if (sessionIdRef.current) {
          headers['x-user-id'] = sessionIdRef.current
        }

        const resp = await fetch('/api/assistente/perguntar', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            question: q,
            history: recentHistory, // Enviar histórico para contexto
            context, // Enviar contexto adicional (página atual, elementos visíveis, intenção)
          }),
          signal: abortControllerRef.current.signal,
        })
        const data = await resp.json()
        setIsThinking(false)

        if (!resp.ok) {
          setMode(data?.mode === 'economico' ? 'economico' : 'erro')
          setCaption(data?.error ?? 'Não consegui responder agora.')
          setQaAnswer('')
          // Atualizar última mensagem com erro
          setConversationHistory(prev => {
            const updated = [...prev]
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                answer: data?.error ?? 'Erro ao processar.',
              }
            }
            return updated
          })
          return
        }

        // Opção A: Se veio da KB, escolher variação no client
        let spoken = data?.spokenText
        if (!spoken && data?.entryId && data?.responses) {
          // KB retornou entryId e responses - escolher variação no client
          spoken = pickVariant(data.responses, data.entryId)
        } else if (!spoken) {
          spoken = 'Posso ajudar nisso.'
        }

        if (activeClick) {
          spoken = appendFollowUp(spoken)
        }

        setMode(data?.mode === 'economico' ? 'economico' : 'normal')
        setQaAnswer(spoken)
        setCaption(spoken)

        // Parar STT antes de TTS (se modo contínuo)
        if (useVoice && ttsAvailable) {
          if (continuousMode && isListening) {
            stopListening()
          }

          // Marcar TTS como falando antes de iniciar
          setIsTTSSpeaking(true)
          try {
            await speakText(normalizeTtsText(spoken)) // Aguardar término do TTS
          } finally {
            // Sempre marcar como não falando, mesmo se houver erro
            setIsTTSSpeaking(false)
          }
        }

        // Atualizar histórico de conversa com resposta
        setConversationHistory(prev => {
          const updated = [...prev]
          if (updated.length > 0 && updated[updated.length - 1].question === q) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              answer: spoken,
            }
          } else {
            updated.push({ question: q, answer: spoken, timestamp: questionTimestamp })
          }
          return updated.slice(-10) // Manter apenas últimas 10
        })

        // Processar actions[] recebidas - executar automaticamente
        const actions = Array.isArray(data?.actions) ? data.actions : []
        processActions(actions as KBAction[])

        if (activeClick) {
          setClickedContext(prev =>
            prev ? { ...prev, timestamp: Date.now() } : prev
          )
        }

        // Se modo contínuo, limpar pergunta após resposta
        // A escuta será reiniciada automaticamente pelo onEnd do STT
        if (continuousMode && useVoice) {
          setQuestion('')
        }

        // Se não houver actions mas houver targetId implícito na resposta, fazer scroll suave
        if (actions.length === 0 && spoken) {
          // Tentar detectar se a resposta menciona algo que está na página
          // Por enquanto, apenas processar actions explícitas
        }
      } catch (err: any) {
        setIsThinking(false)
        if (err.name === 'AbortError') {
          // Requisição cancelada, não mostrar erro
          return
        }
        setMode('erro')
        setCaption('Falha ao consultar o assistente. Tente novamente.')
        setQaAnswer('')
        // Atualizar última mensagem com erro
        setConversationHistory(prev => {
          const updated = [...prev]
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              answer: 'Erro ao processar. Tente novamente.',
            }
          }
          return updated
        })
      }
    },
    [
      question,
      visibleElements,
      conversationHistory,
      clickedContext,
      appendFollowUp,
      shouldClearClickedContext,
      processActions,
      continuousMode,
      stopListening,
      useVoice,
      isActive,
      isThinking,
    ]
  )

  // Atualizar refs sempre que as funções mudarem (evita dependências circulares)
  useEffect(() => {
    handleAskRef.current = handleAsk
  }, [handleAsk])

  // Reiniciar escuta contínua após resposta (se modo contínuo ativo)
  // Usa ref para rastrear última resposta e evitar loops
  // TTS já terminou (aguardado em handleAsk), então não precisa de timeout fixo
  // Proteção contra race condition: flag isRestartingRef + debounce de 500ms
  const lastAnswerRef = useRef<string>('')
  useEffect(() => {
    // Proteção contra race condition: se já está reiniciando, ignorar
    if (isRestartingRef.current) return

    // Só reiniciar se:
    // 1. Modo contínuo ativo
    // 2. Não está pensando
    // 3. Não está ouvindo
    // 4. Assistente ativo
    // 5. Houve uma nova resposta (qaAnswer mudou)
    // 6. TTS não está falando (proteção crítica - evita conflito STT/TTS)
    // Nota: Usar valores diretos aqui é OK pois estamos dentro de useEffect com dependências
    if (
      continuousMode &&
      useVoice &&
      !isThinking &&
      !isListening &&
      isActive &&
      qaAnswer &&
      qaAnswer !== lastAnswerRef.current &&
      !isTTSSpeaking && // Flag local para garantir sincronização
      !isSpeaking() // Proteção adicional (função do módulo TTS)
    ) {
      lastAnswerRef.current = qaAnswer

      // Marcar como reiniciando para evitar múltiplas execuções simultâneas
      isRestartingRef.current = true

      // Debounce de 500ms para evitar race condition se dependências mudarem rapidamente
      const timeoutId = setTimeout(() => {
        // Verificar novamente antes de reiniciar usando refs (valores sempre atualizados)
        // IMPORTANTE: Verificar flag isTTSSpeaking para evitar conflito STT/TTS
        if (
          startContinuousListeningRef.current &&
          continuousModeRef.current &&
          isActiveRef.current &&
          !isThinkingRef.current &&
          !isListening &&
          !isTTSSpeakingRef.current // Usar ref para valor sempre atualizado
        ) {
          startContinuousListeningRef.current()
        }
        // Limpar flag após tentativa de reinício
        isRestartingRef.current = false
      }, 500) // Debounce de 500ms

      // Cleanup: limpar timeout e flag se o componente desmontar ou dependências mudarem
      return () => {
        clearTimeout(timeoutId)
        isRestartingRef.current = false
      }
    }
  }, [continuousMode, useVoice, isThinking, isListening, isActive, qaAnswer, isTTSSpeaking])

  const speechAvailable = hasSTT()
  const ttsAvailable = hasTTS()

  const lastQuestion = useMemo(() => {
    for (let i = conversationHistory.length - 1; i >= 0; i -= 1) {
      const item = conversationHistory[i]
      if (item?.question) return item.question
    }
    return ''
  }, [conversationHistory])

  const lastAnswer = useMemo(() => {
    for (let i = conversationHistory.length - 1; i >= 0; i -= 1) {
      const item = conversationHistory[i]
      if (item?.answer) return item.answer
    }
    return ''
  }, [conversationHistory])

  // Memoizar histórico de mensagens (fora do JSX para evitar problemas de hooks)
  const memoizedMessages = useMemo(
    () =>
      conversationHistory.map((msg, idx) => (
        <div key={`${msg.timestamp}-${idx}`}>
          {msg.question && (
            <ChatMessage role="user" content={msg.question} timestamp={msg.timestamp} />
          )}
          {msg.answer && (
            <ChatMessage
              role="assistant"
              content={msg.answer}
              timestamp={msg.timestamp}
              isStreaming={isStreaming && idx === conversationHistory.length - 1}
            />
          )}
        </div>
      )),
    [conversationHistory, isStreaming]
  )

  return (
    <div
      ref={assistantRootRef}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur flex flex-col relative z-20"
      style={{ minHeight: '500px', maxHeight: '700px' }}
    >
      {!isActive ? (
        <div className="space-y-3 p-4">
          <p className="text-sm text-gray-200">
            Assistente ao vivo (voz). Ative para iniciar a apresentação e tirar dúvidas em tempo real.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500"
              onClick={() => setShowConsent(true)}
            >
              <span className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-20 bg-white/20" />
              <span className="relative flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                  🎧
                </span>
                <span>Ativar IA ao vivo</span>
              </span>
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Voz em tempo real + seleção por clique para explicar cada parte da página.
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <p className="text-xs uppercase text-blue-200 font-semibold">
                {continuousMode ? '🎤 Conversa Contínua' : 'Assistente ativo'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {isListening ? (
                  <ListeningWave />
                ) : isThinking ? (
                  <ThinkingIndicator />
                ) : isTTSSpeaking ? (
                  <div className="flex items-center gap-2">
                    <div className="text-cyan-400 text-xs animate-pulse">🔊 Assistente falando...</div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    {continuousMode
                      ? 'Aguardando sua fala...'
                      : useVoice && ttsAvailable
                        ? 'Voz ativa'
                        : showTextDebug
                          ? 'Modo texto'
                          : 'Voz indisponível'}
                  </p>
                )}
              </div>
            </div>
            <button
              className="rounded-lg bg-gray-800 px-3 py-2 text-xs text-white hover:bg-gray-700 transition-colors"
              onClick={deactivate}
            >
              Desativar
            </button>
          </div>

          {/* Chat Area - Scrollável */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ minHeight: '300px' }}>
            {showTextDebug ? (
              <>
                {/* Mensagens do histórico - memoizado */}
                {memoizedMessages}

                {/* Indicador de pensando */}
                {isThinking && !isListening && <ThinkingIndicator />}

                {/* Indicador de streaming */}
                {isStreaming && <TypingIndicator />}

                {/* Scroll anchor */}
                <div ref={chatEndRef} />
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-blue-200 font-semibold">Resumo ao vivo</p>
                  <span className="text-[10px] text-gray-400">Live</span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-400">Última pergunta</p>
                  <p className="text-sm text-gray-100">
                    {lastQuestion || 'Ainda não recebi perguntas.'}
                  </p>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-400">Resposta atual</p>
                  <p className="text-sm text-gray-100">
                    {lastAnswer || qaAnswer || caption || hintMessage || liveHintFallback}
                  </p>
                </div>
                {activeSelection && (
                  <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase text-cyan-200 font-semibold">
                        Assunto selecionado
                      </p>
                      <button
                        className="text-[10px] text-cyan-100/70 hover:text-cyan-100 transition-colors"
                        onClick={() => {
                          setClickedContext(null)
                          setHintMessage(
                            'Seleção limpa. Dê um duplo clique no item e pergunte novamente.'
                          )
                        }}
                      >
                        Limpar
                      </button>
                    </div>
                    <p className="text-sm text-cyan-50 mt-1">
                      {activeSelection.text || activeSelection.targetId || 'Item selecionado'}
                    </p>
                  </div>
                )}
                {isThinking && !isListening && (
                  <div className="mt-3">
                    <ThinkingIndicator />
                  </div>
                )}
                {isStreaming && (
                  <div className="mt-2">
                    <TypingIndicator />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 space-y-2">
            {/* Modo tour - controles */}
            {caption && !qaAnswer && !continuousMode && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 mb-2">
                <p className="text-xs text-blue-300 mb-1">Agora: {steps[currentIndex]?.title}</p>
                <p className="text-sm text-gray-100">
                  {caption || steps[currentIndex]?.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 transition-colors"
                    onClick={() => runStep(currentIndex)}
                  >
                    Repetir
                  </button>
                  <button
                    className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                    onClick={() => runStep(Math.min(currentIndex + 1, steps.length - 1))}
                    disabled={currentIndex >= steps.length - 1}
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {/* Input de pergunta */}
            {showTextDebug ? (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    className="w-full rounded-lg bg-gray-900/70 px-3 py-2 pr-10 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder={
                      isListening
                        ? 'Ouvindo... fale sua pergunta'
                        : 'Perguntar (KB primeiro, LLM se necessário)'
                    }
                    value={question}
                    onChange={e => {
                      const value = e.target.value
                      setQuestion(value)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && question.trim() && !isListening) {
                        e.preventDefault()
                        handleAsk(speechAvailable, ttsAvailable)
                      }
                    }}
                    maxLength={320}
                    disabled={isListening || isThinking}
                  />
                  {useVoice && speechAvailable && (
                    <button
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors ${
                        isListening
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      onClick={toggleListening}
                      title={isListening ? 'Parar captura de voz' : 'Iniciar captura de voz'}
                      disabled={isThinking}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  onClick={() => handleAsk(speechAvailable, ttsAvailable)}
                  disabled={!question.trim() || isListening || isThinking}
                >
                  {isThinking ? 'Pensando...' : 'Perguntar'}
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white">
                <p className="text-xs text-blue-300 mb-1">Modo Live ativo</p>
                <p className="text-sm text-gray-100">{liveHintMessage}</p>
                {!speechAvailable && (
                  <p className="text-xs text-amber-200 mt-2">
                    ⚠️ Captura de voz indisponível. Use um navegador compatível.
                  </p>
                )}
              </div>
            )}

            {/* Status footer */}
            <div className="text-xs text-gray-400 space-y-1">
              {isTTSSpeaking && (
                <div className="text-cyan-400 animate-pulse flex items-center gap-1">
                  <span>🔊</span>
                  <span>Assistente falando... Aguarde para falar.</span>
                </div>
              )}
              {mode === 'economico' && (
                <div className="text-amber-200">Modo econômico/seguro ativo.</div>
              )}
              {mode === 'erro' && (
                <div className="text-red-300">Assistente indisponível agora.</div>
              )}
            </div>

            {enableTranscriptDebug && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-gray-300">
                <span className="text-gray-400">Transcricao (debug)</span>
                <button
                  className="rounded-md bg-gray-800 px-2 py-1 text-xs text-white hover:bg-gray-700 transition-colors"
                  onClick={handleExportTranscript}
                >
                  Exportar .txt
                </button>
                <button
                  className="rounded-md bg-gray-800 px-2 py-1 text-xs text-white hover:bg-gray-700 transition-colors"
                  onClick={handleClearTranscript}
                >
                  Limpar log
                </button>
                <span className="text-gray-500">Salvo em localStorage.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {showConsent && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/60 p-3 text-sm text-white space-y-2">
          <p className="font-semibold">Consentimento de voz</p>
          <p className="text-xs text-gray-200">Ative o modo ao vivo para começar:</p>
          <div className="flex flex-col gap-2">
            <button
              className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => activate(true, true)}
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
                  onClick={() => activate(true, false)}
                  disabled={!speechAvailable}
                >
                  🎙️ Voz Manual (debug)
                </button>
                <p className="text-xs text-gray-400 px-2">
                  Clique para falar, depois clique em &quot;Perguntar&quot;
                </p>

                <button
                  className="rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
                  onClick={() => activate(false)}
                >
                  ⌨️ Apenas Texto (debug)
                </button>
              </>
            )}

            <button
              className="rounded-lg bg-gray-800 px-3 py-2 text-xs text-white hover:bg-gray-700 transition-colors"
              onClick={() => setShowConsent(false)}
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
      )}
    </div>
  )
}
