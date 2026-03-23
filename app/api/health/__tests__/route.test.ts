import { GET } from '../route'
import { BUILD_INFO, KB_VERSION } from '@/app/api/assistente/state'

describe('GET /api/health', () => {
  test('expõe kbVersion real e bloco de build para verificação de rollout', async () => {
    const response = await GET()
    expect(response.status).toBe(200)

    const data = await response.json()

    expect(data.kbVersion).toBe(KB_VERSION)
    expect(data.kbVersion).not.toBe('1.0.0')
    expect(data).toHaveProperty('build')
    expect(data.build).toMatchObject({
      gitSha: BUILD_INFO.gitSha,
      buildId: BUILD_INFO.buildId,
    })
    expect(data.build).toHaveProperty('gitShortSha')
  })
})
