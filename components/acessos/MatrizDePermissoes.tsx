/* ============================================================================
   MATRIZDEPERMISSOES.TSX — "O QUE CADA PERFIL PODE FAZER"
   O que é: duas tabelas somente leitura (telas e ações por perfil), geradas direto das regras de lib/permissoes.ts, para o time e a PROGLOGIC validarem.
   Onde é usado: app/(sistema)/acessos/page.tsx.
   Depende de: lib/permissoes (ROTAS_POR_PERFIL, rótulos, permissaoDaAcao), lib/metricas (ROTULO_PERFIL), components/ui/Tabela e components/ui/basicos (Card, CardTitulo, Etiqueta).
   Contexto: §3 (perfis), §5 (permissões "a confirmar com a PROGLOGIC") e §15 item 3.
   ============================================================================ */

import { Check, Minus, CircleDot } from 'lucide-react';
import { ROTAS_POR_PERFIL, ROTULO_DAS_ROTAS, ROTULO_DAS_ACOES, CONDICAO_DA_ACAO, TODAS_AS_ACOES, permissaoDaAcao } from '@/lib/permissoes';
import { ROTULO_PERFIL } from '@/lib/metricas';
import type { Perfil } from '@/lib/tipos';
import { Card, CardTitulo, Etiqueta } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';

const PERFIS: Perfil[] = ['admin', 'empresa', 'profissional'];

/**
 * Célula "Sim / Não / Em parte" com ícone e texto (cor nunca sozinha).
 * @param props.valor - 'sim', 'nao' ou 'condicional'.
 * @param props.nota - explicação da condição (quando 'condicional').
 */
function Celula({ valor, nota }: { valor: 'sim' | 'nao' | 'condicional'; nota?: string }) {
  if (valor === 'sim') return <Etiqueta tom="sucesso"><Check className="h-3 w-3" aria-hidden />Sim</Etiqueta>;
  if (valor === 'nao') return <Etiqueta tom="neutro"><Minus className="h-3 w-3" aria-hidden />Não</Etiqueta>;
  return <Etiqueta tom="aviso"><CircleDot className="h-3 w-3" aria-hidden />Em parte{nota ? `: ${nota}` : ''}</Etiqueta>;
}

/**
 * Bloco com as duas tabelas. É só leitura: para mudar uma regra, edita-se lib/permissoes.ts.
 * @returns o card com a tabela de telas e a de ações.
 */
export default function MatrizDePermissoes() {
  return (
    <Card className="mt-8">
      <CardTitulo titulo="O que cada perfil pode fazer" descricao="Gerado a partir das regras do código (lib/permissoes.ts). Somente leitura: serve para o time e a PROGLOGIC validarem. Regras marcadas TODO(PROGLOGIC) ainda serão confirmadas." />
      <div className="mt-3">
        <Tabela rotulo="Telas que cada perfil pode abrir">
          <thead><tr><Th>Tela</Th>{PERFIS.map((p) => <Th key={p}>{ROTULO_PERFIL[p]}</Th>)}</tr></thead>
          <tbody>
            {Object.keys(ROTAS_POR_PERFIL).map((rota) => (
              <Tr key={rota}>
                <Td><span className="font-semibold">{ROTULO_DAS_ROTAS[rota] ?? rota}</span><span className="block text-[12px] text-tinta-suave">{rota}</span></Td>
                {PERFIS.map((p) => <Td key={p}><Celula valor={ROTAS_POR_PERFIL[rota].includes(p) ? 'sim' : 'nao'} /></Td>)}
              </Tr>
            ))}
          </tbody>
        </Tabela>
        <Tabela rotulo="Ações que cada perfil pode fazer">
          <thead><tr><Th>Ação em projetos</Th>{PERFIS.map((p) => <Th key={p}>{ROTULO_PERFIL[p]}</Th>)}</tr></thead>
          <tbody>
            {TODAS_AS_ACOES.map((a) => (
              <Tr key={a}>
                <Td className="font-semibold">{ROTULO_DAS_ACOES[a]}</Td>
                {PERFIS.map((p) => <Td key={p}><Celula valor={permissaoDaAcao(p, a)} nota={CONDICAO_DA_ACAO[a]} /></Td>)}
              </Tr>
            ))}
          </tbody>
        </Tabela>
      </div>
    </Card>
  );
}
