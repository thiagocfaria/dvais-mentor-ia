import { askFromKnowledgeBase } from '../knowledgeBase'

describe('askFromKnowledgeBase', () => {
  test('retorna elevator_pitch para pergunta sobre o DVAi$', () => {
    const result = askFromKnowledgeBase('o que é o DVAi$?')
    expect(result?.entryId).toBe('elevator_pitch')
  })

  test('retorna cadastro com action de navegação', () => {
    const result = askFromKnowledgeBase('quero fazer cadastro')
    expect(result?.entryId).toBe('cadastro')
    expect(result?.actions?.[0]).toMatchObject({
      type: 'navigateRoute',
      route: '/cadastro',
      targetId: 'cadastro-card',
    })
  })

  test('retorna garantia_lucro para promessas de lucro', () => {
    const result = askFromKnowledgeBase('lucro garantido sem risco')
    expect(result?.entryId).toBe('garantia_lucro')
  })

  test('prioriza cadastro em vez de elevator_pitch para perguntas genericas sobre cadastro', () => {
    const result = askFromKnowledgeBase('como funciona o cadastro?')
    expect(result?.entryId).toBe('cadastro')
  })
})

describe('KB papel de apresentadora/vendedora', () => {
  test('elevator_pitch fala da plataforma em terceira pessoa, nao como se fosse o produto', () => {
    const result = askFromKnowledgeBase('o que é o DVAi$?')
    expect(result).not.toBeNull()
    const allResponses = result!.responses.join(' ')
    // Deve falar "a plataforma" ou "o DVAi$", não "eu te guio"
    expect(allResponses).toMatch(/plataforma|DVAi\$/i)
    expect(allResponses).not.toMatch(/protótipo técnico/)
  })

  test('analise_em_tempo_real descreve o que a plataforma vai fazer', () => {
    const result = askFromKnowledgeBase('análise em tempo real')
    expect(result?.entryId).toBe('analise_em_tempo_real')
    const allResponses = result!.responses.join(' ')
    expect(allResponses).toMatch(/plataforma|IA/i)
  })

  test('saudacao se apresenta como assistente do site, nao como mentor', () => {
    const result = askFromKnowledgeBase('oi')
    expect(result?.entryId).toBe('saudacao')
    const allResponses = result!.responses.join(' ')
    expect(allResponses).toMatch(/apresentar|explicar|mostrar/i)
  })

  test('sobre_ia se descreve como assistente do site', () => {
    const result = askFromKnowledgeBase('quem é você?')
    expect(result?.entryId).toBe('sobre_ia')
    const allResponses = result!.responses.join(' ')
    expect(allResponses).toMatch(/assistente.*site|apresent/i)
  })

  test('cadastro menciona que é demonstracao', () => {
    const result = askFromKnowledgeBase('quero fazer cadastro')
    expect(result?.entryId).toBe('cadastro')
    const allResponses = result!.responses.join(' ')
    expect(allResponses).toMatch(/demo|demonstra/i)
  })

  test('login menciona que é demonstracao', () => {
    const result = askFromKnowledgeBase('como fazer login')
    expect(result?.entryId).toBe('login')
    const allResponses = result!.responses.join(' ')
    expect(allResponses).toMatch(/demo|demonstra/i)
  })
})

describe('KB novas entradas de produto', () => {
  test('retorna como_funciona_metodo para "como começo a investir"', () => {
    const result = askFromKnowledgeBase('como começo a investir?')
    expect(result?.entryId).toBe('como_funciona_metodo')
  })

  test('retorna o_que_posso_fazer para "o que posso fazer aqui"', () => {
    const result = askFromKnowledgeBase('o que posso fazer aqui?')
    expect(result?.entryId).toBe('o_que_posso_fazer')
  })

  test('retorna assistente_voz para "como usar a voz"', () => {
    const result = askFromKnowledgeBase('como falar com você por voz?')
    expect(result?.entryId).toBe('assistente_voz')
  })

  test('retorna protecao_inteligente para "proteção inteligente segurança"', () => {
    const result = askFromKnowledgeBase('proteção inteligente segurança')
    expect(result?.entryId).toBe('protecao_inteligente')
  })

  test('retorna aprendizado_continuo para "aprendizado contínuo"', () => {
    const result = askFromKnowledgeBase('aprendizado contínuo')
    expect(result?.entryId).toBe('aprendizado_continuo')
  })

  test('retorna alertas_inteligentes para "alertas"', () => {
    const result = askFromKnowledgeBase('alertas inteligentes')
    expect(result?.entryId).toBe('alertas_inteligentes')
  })

  test('retorna ia_personalizada para "a IA se adapta"', () => {
    const result = askFromKnowledgeBase('a plataforma se adapta ao meu perfil?')
    expect(result?.entryId).toBe('ia_personalizada')
  })

  test('retorna nao_e_consultoria para "é consultoria"', () => {
    const result = askFromKnowledgeBase('isso é consultoria financeira regulada?')
    expect(result?.entryId).toBe('nao_e_consultoria')
  })

  test('retorna porque_cadastrar para "vale a pena"', () => {
    const result = askFromKnowledgeBase('por que vale a pena se cadastrar?')
    expect(result?.entryId).toBe('porque_cadastrar')
  })
})

describe('KB forbidden topics', () => {
  test('bloqueia perguntas sobre futebol', () => {
    const result = askFromKnowledgeBase('quem ganhou o jogo de futebol?')
    expect(result?.entryId).toBe('forbidden')
  })

  test('bloqueia perguntas sobre senha/credenciais', () => {
    const result = askFromKnowledgeBase('qual é a minha senha?')
    expect(result?.entryId).toBe('forbidden')
  })
})

describe('KB correções de matching (cenários que falhavam)', () => {
  test('o que é a proteção inteligente retorna protecao_inteligente', () => {
    const result = askFromKnowledgeBase('o que é a proteção inteligente?')
    expect(result?.entryId).toBe('protecao_inteligente')
  })

  test('como funciona o aprendizado contínuo retorna aprendizado_continuo', () => {
    const result = askFromKnowledgeBase('como funciona o aprendizado contínuo?')
    expect(result?.entryId).toBe('aprendizado_continuo')
  })

  test('o que é o guia financeiro retorna guia_financeiro', () => {
    const result = askFromKnowledgeBase('o que é o guia financeiro?')
    expect(result?.entryId).toBe('guia_financeiro')
  })

  test('pergunta fora de escopo não cai em FAQ por stopword', () => {
    const result = askFromKnowledgeBase('me fala uma receita de bolo')
    expect(result).toBeNull()
  })

  test('proteção inteligente NÃO retorna cadastro', () => {
    const result = askFromKnowledgeBase('como funciona a proteção inteligente?')
    expect(result?.entryId).toBe('protecao_inteligente')
  })

  test('alertas inteligentes NÃO retorna cadastro', () => {
    const result = askFromKnowledgeBase('como funcionam os alertas inteligentes?')
    expect(result?.entryId).toBe('alertas_inteligentes')
  })

  test('como usar a voz retorna assistente_voz', () => {
    const result = askFromKnowledgeBase('como usar a voz?')
    expect(result?.entryId).toBe('assistente_voz')
  })

  test('quanto custa retorna precos', () => {
    const result = askFromKnowledgeBase('quanto custa?')
    expect(result?.entryId).toBe('precos')
  })

  test('meus dados estão seguros retorna seguranca_dados', () => {
    const result = askFromKnowledgeBase('meus dados estão seguros?')
    expect(result?.entryId).toBe('seguranca_dados')
  })

  test('para quem serve retorna para_quem_serve', () => {
    const result = askFromKnowledgeBase('para quem serve essa plataforma?')
    expect(result?.entryId).toBe('para_quem_serve')
  })

  test('como funciona a plataforma retorna como_funciona_plataforma', () => {
    const result = askFromKnowledgeBase('como funciona a plataforma?')
    expect(result?.entryId).toBe('como_funciona_plataforma')
  })

  test('por que deveria me cadastrar retorna porque_cadastrar', () => {
    const result = askFromKnowledgeBase('por que eu deveria me cadastrar?')
    expect(result?.entryId).toBe('porque_cadastrar')
  })

  test('vou ganhar dinheiro retorna garantia_lucro', () => {
    const result = askFromKnowledgeBase('vou ganhar dinheiro com isso?')
    expect(result?.entryId).toBe('garantia_lucro')
  })

  test('guia financeiro retorna guia_financeiro', () => {
    const result = askFromKnowledgeBase('quero saber sobre o guia financeiro')
    expect(result?.entryId).toBe('guia_financeiro')
  })

  test('precos menciona gratuito', () => {
    const result = askFromKnowledgeBase('quanto custa?')
    expect(result?.entryId).toBe('precos')
    const allResponses = result!.responses.join(' ')
    expect(allResponses).toMatch(/gratuit/i)
  })
})

describe('KB novas entradas v2', () => {
  test('retorna custodia_dinheiro para "preciso depositar dinheiro"', () => {
    const result = askFromKnowledgeBase('preciso depositar dinheiro em vocês?')
    expect(result?.entryId).toBe('custodia_dinheiro')
  })

  test('custodia_dinheiro deixa claro que não guarda dinheiro', () => {
    const result = askFromKnowledgeBase('vocês guardam meu dinheiro?')
    expect(result?.entryId).toBe('custodia_dinheiro')
    const allResponses = result!.responses.join(' ')
    expect(allResponses).toMatch(/não.*guarda|não.*custódia|não.*depósito/i)
  })

  test('retorna perfis_comparacao para "diferença entre os perfis"', () => {
    const result = askFromKnowledgeBase('qual a diferença entre os perfis?')
    expect(result?.entryId).toBe('perfis_comparacao')
  })

  test('retorna ativos_mercados para "funciona com cripto"', () => {
    const result = askFromKnowledgeBase('funciona com cripto?')
    expect(result?.entryId).toBe('ativos_mercados')
  })

  test('retorna ativos_mercados para "quais mercados"', () => {
    const result = askFromKnowledgeBase('quais mercados vocês cobrem?')
    expect(result?.entryId).toBe('ativos_mercados')
  })

  test('retorna corretora_integracao para "funciona com qualquer corretora"', () => {
    const result = askFromKnowledgeBase('funciona com qualquer corretora?')
    expect(result?.entryId).toBe('corretora_integracao')
  })

  test('retorna corretora_integracao para "preciso trocar de corretora"', () => {
    const result = askFromKnowledgeBase('preciso trocar de corretora?')
    expect(result?.entryId).toBe('corretora_integracao')
  })

  test('retorna compatibilidade_navegador para "funciona no celular"', () => {
    const result = askFromKnowledgeBase('funciona no celular?')
    expect(result?.entryId).toBe('compatibilidade_navegador')
    const combined = result?.responses.join(' ') || ''
    expect(combined).toMatch(/texto \+ toque/i)
    expect(combined).toMatch(/navegador|sem instalar|sem app/i)
  })

  test('retorna compatibilidade_navegador para "tem app"', () => {
    const result = askFromKnowledgeBase('tem aplicativo pra baixar?')
    expect(result?.entryId).toBe('compatibilidade_navegador')
    const combined = result?.responses.join(' ') || ''
    expect(combined).toMatch(/sem (precisar )?instalar|sem app|navegador/i)
  })

  test('retorna assistente_voz com fluxo manual previsível', () => {
    const result = askFromKnowledgeBase('como usar a voz?')
    expect(result?.entryId).toBe('assistente_voz')
    const combined = result?.responses.join(' ') || ''
    expect(combined).toMatch(/tocar para falar|ouvir resposta/i)
    expect(combined).not.toMatch(/reabre sozinho|microfone volta|continuo ouvindo|volta a ouvir automaticamente/i)
  })

  test('retorna tempo_aprendizado para "quanto tempo leva"', () => {
    const result = askFromKnowledgeBase('quanto tempo leva pra aprender?')
    expect(result?.entryId).toBe('tempo_aprendizado')
  })

  test('retorna despedida para "obrigado"', () => {
    const result = askFromKnowledgeBase('obrigado!')
    expect(result?.entryId).toBe('despedida')
  })

  test('retorna despedida para "tchau"', () => {
    const result = askFromKnowledgeBase('tchau, até mais!')
    expect(result?.entryId).toBe('despedida')
  })

  test('é pago retorna precos', () => {
    const result = askFromKnowledgeBase('é pago? preciso pagar?')
    expect(result?.entryId).toBe('precos')
  })

  test('lgpd retorna seguranca_dados', () => {
    const result = askFromKnowledgeBase('vocês cumprem a LGPD?')
    expect(result?.entryId).toBe('seguranca_dados')
  })

  test('minhas informações seguras retorna seguranca_dados', () => {
    const result = askFromKnowledgeBase('minhas informações pessoais estão seguras?')
    expect(result?.entryId).toBe('seguranca_dados')
  })
})
