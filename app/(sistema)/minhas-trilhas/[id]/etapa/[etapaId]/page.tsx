/* ============================================================================
   APP/(SISTEMA)/MINHAS-TRILHAS/[ID]/ETAPA/[ETAPAID]/PAGE.TSX (PLAYER, EM CONSTRUÇÃO)
   O que é: página provisória do player de etapa, para os botões "Começar" e
     "Continuar" do D02 não levarem a um 404. O D03 substitui este arquivo.
   Onde é usado: rota /minhas-trilhas/[id]/etapa/[etapaId] (lib/trilhas.ts: hrefEtapa).
   Depende de: components/shell/EmConstrucao.tsx.
   Contexto: §4 (etapa contém conteúdo e, opcionalmente, quiz) e prompt D03.
   ============================================================================ */
import EmConstrucao from '@/components/shell/EmConstrucao';

/**
 * Player provisório.
 * ⚠️ ATENÇÃO: o acesso por perfil é decidido em lib/permissoes.ts (prefixo /minhas-trilhas)
 * e no layout do grupo (sistema); o D03 também confere se a etapa está liberada para a pessoa.
 * @returns a página "Em construção".
 */
export default function PlayerEtapaProvisorio() {
  return <EmConstrucao titulo="Etapa da trilha" descricao="O player com o conteúdo da etapa e o quiz chega no D03." />;
}
