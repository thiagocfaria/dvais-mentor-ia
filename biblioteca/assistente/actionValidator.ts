import pageElements from '@/data/page-elements.json'

type AllowedAction = 'scrollToSection' | 'highlightSection' | 'navigateRoute' | 'showTooltip'

type Action = { type: AllowedAction; targetId?: string; route?: string; selector?: string }

const allowedRoutes = [
  '/',
  '/cadastro',
  '/login',
  '/seguranca',
  '/analise-tempo-real',
  '/aprendizado-continuo',
]

type PageElementsMap = Record<string, string>

const elementsMap = pageElements as PageElementsMap

export function validateActions(actions: Action[] | undefined, allowedIds: string[]): Action[] {
  if (!actions) return []
  
  const validated = actions
    .filter(action => {
      if (!action?.type) return false
      if (
        !['scrollToSection', 'highlightSection', 'navigateRoute', 'showTooltip'].includes(
          action.type
        )
      )
        return false
      if (action.type === 'navigateRoute') {
        // Validar route e targetId opcional (se fornecido, deve estar em allowedIds e mapeado)
        if (!action.route || !allowedRoutes.includes(action.route)) return false
        if (action.targetId) {
          if (!allowedIds.includes(action.targetId)) return false
          if (!elementsMap[action.targetId]) return false
        }
        return true
      }
      if (!action.targetId) return false
      if (!allowedIds.includes(action.targetId)) return false
      if (!elementsMap[action.targetId]) return false
      return true
    })
    .map(action => {
      if (action.type === 'navigateRoute') return action
      if (action.targetId && elementsMap[action.targetId]) {
        return { ...action, selector: elementsMap[action.targetId] }
      }
      return action
    })
  
  // Log em dev para identificar actions rejeitadas
  if (process.env.NODE_ENV === 'development') {
    const rejected = actions.filter(a => !validated.includes(a))
    if (rejected.length > 0) {
      console.warn('[ActionValidator] Rejected actions:', rejected)
    }
  }
  
  return validated
}

export function getSelectorForTargetId(targetId: string): string | null {
  return elementsMap[targetId] || null
}

export type { Action, AllowedAction }
