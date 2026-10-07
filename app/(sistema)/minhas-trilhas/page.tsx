/* ============================================================================
   APP/(SISTEMA)/MINHAS-TRILHAS/PAGE.TSX (Minhas trilhas, EM CONSTRUÇÃO)
   O que é: página provisória da rota /minhas-trilhas, com o estado vazio "Em construção".
   Onde é usado: rota /minhas-trilhas. Chegam aqui: o menu lateral (components/shell/navegacao.ts) e a regra de lib/permissoes.ts (ROTAS_POR_PERFIL).
   Depende de: components/shell/EmConstrucao.tsx.
   Contexto: §4 (trilhas), §8 (Onda 2) e §15 item 4.
   ============================================================================ */
import EmConstrucao from '@/components/shell/EmConstrucao';

/**
 * Página provisória de Minhas trilhas.
 * ⚠️ ATENÇÃO: o acesso por perfil NÃO é decidido aqui, e sim em lib/permissoes.ts + layout do grupo (sistema).
 * @returns a página "Em construção".
 */
export default function PaginaMinhasTrilhas() {
  return <EmConstrucao titulo="Minhas trilhas" descricao="Trilhas atribuídas a você e o seu progresso." />;
}
