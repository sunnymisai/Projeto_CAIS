/* ============================================================================
   APP/(SISTEMA)/CARGA/PAGE.TSX (Carga da equipe, EM CONSTRUÇÃO)
   O que é: página provisória da rota /carga, com o estado vazio "Em construção".
   Onde é usado: rota /carga. Chegam aqui: o menu lateral (components/shell/navegacao.ts) e a regra de lib/permissoes.ts (ROTAS_POR_PERFIL).
   Depende de: components/shell/EmConstrucao.tsx.
   Contexto: §6 (painel do admin: pessoas, alocação e carga) e §16 (semáforo de carga por período).
   ============================================================================ */
import EmConstrucao from '@/components/shell/EmConstrucao';

/**
 * Página provisória de Carga da equipe.
 * ⚠️ ATENÇÃO: o acesso por perfil NÃO é decidido aqui, e sim em lib/permissoes.ts + layout do grupo (sistema).
 * @returns a página "Em construção".
 */
export default function PaginaCarga() {
  return <EmConstrucao titulo="Carga da equipe" descricao="Quanto cada pessoa está alocada, semana a semana." />;
}
