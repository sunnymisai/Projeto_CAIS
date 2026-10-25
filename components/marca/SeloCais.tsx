/* ============================================================================
   SELOCAIS.TSX — SELO FIXO "PLATAFORMA CAIS"
   O que é: um selo pequeno (símbolo + nome do CAIS) que aparece sempre, mesmo quando o tema troca o logo do cabeçalho pela marca da empresa cliente.
   Onde é usado: components/shell/Sidebar.tsx (rodapé do menu e da gaveta do celular), components/BrandPanel.tsx, components/AcessoLayout.tsx (rodapé do login no celular) e components/home/RodapeHome.tsx.
   Depende de: components/CaisLogo.tsx (CaisMark) e lib/utils.ts (cx).
   Contexto: docs/temas-contrato.md, "Identidade da empresa no tema (fase 2)".
   ============================================================================ */

import { CaisMark } from '@/components/CaisLogo';
import { cx } from '@/lib/utils';

/** Props do selo. */
interface SeloCaisProps {
  /** 'escuro' = sobre painel escuro (texto branco); 'claro' = sobre o fundo da página (tokens, valem nos dois modos). */
  fundo: 'claro' | 'escuro';
  /** Classes extras do selo (ex.: `lg:hidden`). */
  className?: string;
}

// [PV-1] O TEXTO do selo fixo. É a garantia de que o CAIS continua visível quando o tema usa a marca da empresa; mude aqui para trocar o texto em todas as telas.
/** Texto do selo. */
const TEXTO_DO_SELO = 'Plataforma CAIS';

/**
 * Selo fixo "Plataforma CAIS". Nunca depende do tema escolhido: o texto e o símbolo são sempre os do CAIS.
 * É Server Component (não lê o tema): só pinta o fundo conforme a prop.
 * ⚠️ ATENÇÃO: o texto precisa manter contraste AA (4,5:1) sobre o painel onde está; por isso o branco é 80%, não menos.
 * @param props.fundo - 'escuro' ou 'claro'.
 * @param props.className - classes extras.
 * @returns o selo, com o símbolo decorativo e o texto legível.
 * @example <SeloCais fundo="escuro" />
 */
export default function SeloCais({ fundo, className }: SeloCaisProps) {
  const escuro = fundo === 'escuro';
  return (
    <p className={cx(
      'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
      escuro ? 'border-white/15 bg-white/[0.06] text-white/80' : 'border-borda bg-superficie text-tinta-suave',
      className,
    )}>
      {/* Símbolo decorativo (aria-hidden dentro do CaisMark): o texto ao lado já identifica o CAIS. */}
      <CaisMark size={16} tone={escuro ? 'claro' : 'auto'} />
      {TEXTO_DO_SELO}
    </p>
  );
}
