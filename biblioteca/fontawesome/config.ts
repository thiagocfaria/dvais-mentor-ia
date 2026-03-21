/**
 * Configuração do FontAwesome
 *
 * IMPORTANTE: Este arquivo deve ser importado no app/layout.tsx
 * para garantir que a configuração seja aplicada globalmente.
 *
 * Configuração:
 * - autoAddCss = false: Desabilita CSS automático porque:
 *   - Estamos usando apenas SVG (mais leve)
 *   - CSS é gerenciado pelo Tailwind
 *   - Reduz bundle size em ~50KB
 */

import { config } from '@fortawesome/fontawesome-svg-core'

config.autoAddCss = false
