/* ============================================================================
   APP/(SISTEMA)/ACESSOS/PAGE.TSX (Acessos, EM CONSTRUÇÃO)
   O que é: página provisória da rota /acessos, com o estado vazio "Em construção".
   Onde é usado: rota /acessos. Chegam aqui: o menu lateral (components/shell/navegacao.ts) e a regra de lib/permissoes.ts (ROTAS_POR_PERFIL).
   Depende de: components/shell/EmConstrucao.tsx.
   Contexto: §8 (cadastros: gestão de acessos) e §15 item 3.
   ============================================================================ */
import EmConstrucao from '@/components/shell/EmConstrucao';

/**
 * Página provisória de Acessos.
 * ⚠️ ATENÇÃO: o acesso por perfil NÃO é decidido aqui, e sim em lib/permissoes.ts + layout do grupo (sistema).
 * @returns a página "Em construção".
 */
export default function PaginaAcessos() {
  return <EmConstrucao titulo="Acessos" descricao="Gestão de acessos e permissões de cada pessoa." />;
}
