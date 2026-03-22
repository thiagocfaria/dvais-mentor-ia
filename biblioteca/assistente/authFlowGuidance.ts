import type { AssistantResponse } from '@/app/api/assistente/state'
import type { AuthFlowHint } from '@/biblioteca/assistente/conversationSignals'
import { inferAuthFlowHintFromText, normalizeConversationText } from '@/biblioteca/assistente/conversationSignals'

export type AuthFlowSubtype =
  | 'cadastro_next_step'
  | 'cadastro_fix_data'
  | 'cadastro_post_email'
  | 'login_next_step'
  | 'login_password_help'
  | 'login_access_issue'
  | 'login_mobile'

type AuthFlowGuidance = {
  subtype: AuthFlowSubtype
  response: AssistantResponse
}

const DIRECT_CADASTRO_RE =
  /\b(como funciona o cadastro|fazer cadastro|quero fazer cadastro|criar conta)\b/

const DIRECT_LOGIN_RE =
  /\b(como funciona o login|fazer login|quero fazer login|acessar conta)\b/

const GENERIC_NEXT_RE =
  /\b(e depois disso|e agora|o que eu faco depois|qual o proximo passo)\b/

const CADASTRO_AFTER_CADASTRO_RE = /\b(e depois do cadastro|depois do cadastro)\b/

const CADASTRO_POST_EMAIL_RE =
  /\b(depois que eu confirmar o email|confirmar o email)\b/

const CADASTRO_DATA_RE =
  /\b(errar meus dados|errei meus dados|dados errados|corrigir meus dados|corrigir os dados)\b/

const LOGIN_PASSWORD_RE =
  /\b(esqueci a senha|esquecer a senha|nao lembro a senha|recuperar senha)\b/

const LOGIN_FAIL_RE =
  /\b(nao consigo entrar|nao entra|o que eu faco se nao entrar|login nao entra|nao consigo fazer login)\b/

const LOGIN_MOBILE_RE = /\b(celular|mobile|iphone|android)\b/

export function buildAuthFlowGuidance(args: {
  sanitizedQuestion: string
  flowHint: AuthFlowHint
  hasUsefulHistory: boolean
}): AuthFlowGuidance | null {
  const normalizedQuestion = normalizeConversationText(args.sanitizedQuestion)
  const explicitFlowHint = inferAuthFlowHintFromText(normalizedQuestion)
  const flowHint = args.flowHint || explicitFlowHint

  if (DIRECT_CADASTRO_RE.test(normalizedQuestion) || DIRECT_LOGIN_RE.test(normalizedQuestion)) {
    return null
  }

  if (flowHint === 'cadastro') {
    if (CADASTRO_DATA_RE.test(normalizedQuestion)) {
      return {
        subtype: 'cadastro_fix_data',
        response: {
          spokenText:
            'Se algum dado sair errado, corrija o campo no formulário e envie de novo. A própria tela valida email, CPF, telefone e senha antes de você seguir.',
          actions: [{ type: 'navigateRoute', route: '/cadastro', targetId: 'cadastro-card' }],
          requiresUserClick: false,
          confidence: 0.96,
          mode: 'normal',
        },
      }
    }

    if (CADASTRO_AFTER_CADASTRO_RE.test(normalizedQuestion)) {
      return {
        subtype: 'cadastro_next_step',
        response: {
          spokenText:
            'Depois do cadastro, o próximo passo é abrir o Login e continuar a jornada demonstrativa. Se quiser, eu te guio até a tela de login agora.',
          actions: [{ type: 'navigateRoute', route: '/login', targetId: 'login-card' }],
          requiresUserClick: false,
          confidence: 0.95,
          mode: 'normal',
        },
      }
    }

    if (CADASTRO_POST_EMAIL_RE.test(normalizedQuestion)) {
      return {
        subtype: 'cadastro_post_email',
        response: {
          spokenText:
            'Depois de confirmar o email nesta demo, o próximo passo é abrir o Login e continuar a jornada. Se quiser, eu te guio até a tela de login agora.',
          actions: [{ type: 'navigateRoute', route: '/login', targetId: 'login-card' }],
          requiresUserClick: false,
          confidence: 0.95,
          mode: 'normal',
        },
      }
    }

    if (args.hasUsefulHistory && GENERIC_NEXT_RE.test(normalizedQuestion)) {
      return {
        subtype: 'cadastro_next_step',
        response: {
          spokenText:
            'Depois do cadastro, o próximo passo é revisar o formulário, confirmar o email e seguir para o Login. A partir daí, você continua a jornada demonstrativa sem recomeçar a explicação.',
          actions: [{ type: 'navigateRoute', route: '/login', targetId: 'login-card' }],
          requiresUserClick: false,
          confidence: 0.94,
          mode: 'normal',
        },
      }
    }
  }

  if (flowHint === 'login' || LOGIN_PASSWORD_RE.test(normalizedQuestion) || LOGIN_FAIL_RE.test(normalizedQuestion)) {
    if (LOGIN_PASSWORD_RE.test(normalizedQuestion)) {
      return {
        subtype: 'login_password_help',
        response: {
          spokenText:
            'Nesta versão pública não existe recuperação automática de senha conectada. Se você esqueceu a senha, o caminho real disponível hoje é falar com o responsável do projeto na página de contato.',
          actions: [],
          requiresUserClick: false,
          confidence: 0.97,
          mode: 'normal',
        },
      }
    }

    if (LOGIN_FAIL_RE.test(normalizedQuestion)) {
      return {
        subtype: 'login_access_issue',
        response: {
          spokenText:
            'Se o login não entrar, revise email e senha e veja as mensagens de validação da tela. Como esta demo não autentica em backend, o caminho real para suporte é a página de contato.',
          actions: [{ type: 'navigateRoute', route: '/login', targetId: 'login-card' }],
          requiresUserClick: false,
          confidence: 0.96,
          mode: 'normal',
        },
      }
    }

    if (flowHint === 'login' && args.hasUsefulHistory && LOGIN_MOBILE_RE.test(normalizedQuestion)) {
      return {
        subtype: 'login_mobile',
        response: {
          spokenText:
            'No celular, faça o login pelo formulário normal, em texto e toque. Vale revisar email e senha com calma na tela; se a voz estiver instável, mantenha o fluxo manual.',
          actions: [{ type: 'navigateRoute', route: '/login', targetId: 'login-card' }],
          requiresUserClick: false,
          confidence: 0.94,
          mode: 'normal',
        },
      }
    }

    if (flowHint === 'login' && args.hasUsefulHistory && GENERIC_NEXT_RE.test(normalizedQuestion)) {
      return {
        subtype: 'login_next_step',
        response: {
          spokenText:
            'Depois de abrir o Login, preencha email e senha e confira as validações locais antes de enviar. Se algo travar nesta demo, revise os campos ou siga para contato.',
          actions: [{ type: 'navigateRoute', route: '/login', targetId: 'login-card' }],
          requiresUserClick: false,
          confidence: 0.95,
          mode: 'normal',
        },
      }
    }
  }

  return null
}
