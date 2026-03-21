const SESSION_LIMIT = 5
const DAILY_LIMIT = 20
const GLOBAL_LIMIT = 1000

type BudgetState = {
  session: Map<string, number>
  day: Map<string, number>
  global: number
}

const budget: BudgetState = {
  session: new Map(),
  day: new Map(),
  global: 0,
}

export function todayKey(user: string): string {
  const d = new Date()
  return `${user}-${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
}

/**
 * Verifica e incrementa orçamento de requisições LLM.
 * Retorna true se permitido, false se excedeu algum limite.
 */
export function checkBudget(user: string, sessionId: string): boolean {
  const sessionUsed = budget.session.get(sessionId) ?? 0
  const dayKey = todayKey(user)
  const dayUsed = budget.day.get(dayKey) ?? 0

  if (sessionUsed >= SESSION_LIMIT) return false
  if (dayUsed >= DAILY_LIMIT) return false
  if (budget.global >= GLOBAL_LIMIT) return false

  budget.session.set(sessionId, sessionUsed + 1)
  budget.day.set(dayKey, dayUsed + 1)
  budget.global += 1
  return true
}
