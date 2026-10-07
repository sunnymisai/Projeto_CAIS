/* ============================================================================
   APP/(SISTEMA)/PERFIL/PAGE.TSX (Meu perfil, EM CONSTRUÇÃO)
   O que é: página provisória da rota /perfil, com o estado vazio "Em construção".
   Onde é usado: rota /perfil. Chegam aqui: o menu lateral (components/shell/navegacao.ts) e a regra de lib/permissoes.ts (ROTAS_POR_PERFIL).
   Depende de: components/shell/EmConstrucao.tsx.
   Contexto: §8 (Onda 1: perfil e preferências).
   ============================================================================ */
import EmConstrucao from '@/components/shell/EmConstrucao';

/**
 * Página provisória de Meu perfil.
 * ⚠️ ATENÇÃO: o acesso por perfil NÃO é decidido aqui, e sim em lib/permissoes.ts + layout do grupo (sistema).
 * @returns a página "Em construção".
 */
export default function PaginaPerfil() {
  return <EmConstrucao titulo="Meu perfil" descricao="Seus dados e preferências." />;
}
