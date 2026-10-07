/* ============================================================================
   APP/(SISTEMA)/MINHAS-TAREFAS/PAGE.TSX (Minhas tarefas, EM CONSTRUÇÃO)
   O que é: página provisória da rota /minhas-tarefas, com o estado vazio "Em construção".
   Onde é usado: rota /minhas-tarefas. Chegam aqui: o menu lateral (components/shell/navegacao.ts) e a regra de lib/permissoes.ts (ROTAS_POR_PERFIL).
   Depende de: components/shell/EmConstrucao.tsx.
   Contexto: §3 (Profissional vê e move as próprias tarefas) e §12 fluxo 4.
   ============================================================================ */
import EmConstrucao from '@/components/shell/EmConstrucao';

/**
 * Página provisória de Minhas tarefas.
 * ⚠️ ATENÇÃO: o acesso por perfil NÃO é decidido aqui, e sim em lib/permissoes.ts + layout do grupo (sistema).
 * @returns a página "Em construção".
 */
export default function PaginaMinhasTarefas() {
  return <EmConstrucao titulo="Minhas tarefas" descricao="Suas tarefas, prazos e a carga da semana." />;
}
