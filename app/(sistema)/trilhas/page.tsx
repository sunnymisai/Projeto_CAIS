/* ============================================================================
   APP/(SISTEMA)/TRILHAS/PAGE.TSX (LISTA DE TRILHAS)
   O que é: a lista de trilhas de onboarding em cartões, com filtro por
     alcance/rascunho e o botão "Nova trilha".
   Onde é usado: rota /trilhas. Chegam aqui: o item "Trilhas" do menu
     (components/shell/navegacao.ts), o link "Ver trilhas" do painel
     (app/(sistema)/painel/page.tsx) e a trilha de navegação, o estado
     "não encontrada" e a exclusão em app/(sistema)/trilhas/[id]/page.tsx.
   Depende de: lib/store.tsx (useDados: trilhas, salvar), lib/metricas.ts
     (resumoTrilha), lib/trilhas.ts (ALCANCE: rótulo e cor de cada alcance),
     lib/utils.ts (novoId), lib/tipos.ts (Trilha) e componentes de
     components/ui/ e components/shell/Pagina.tsx.
   Contexto: §4 (Trilhas, Pilar 1: alcances geral, empresa e profissional),
     §8 (Onda 2), §12 fluxo 2 (admin publica trilha) e §13 (quatro estados).
   ============================================================================ */

// "use client": tem estado (filtro) e usa useDados/useRouter.
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Plus, GraduationCap, Layers, Users, Clock } from 'lucide-react';
import { useDados } from '@/lib/store';
import { resumoTrilha } from '@/lib/metricas';
import { ALCANCE } from '@/lib/trilhas';
import { CabecalhoPagina, BarraFiltros } from '@/components/shell/Pagina';
import Button from '@/components/button';
import { Segmentado } from '@/components/ui/form';
import { Etiqueta, EstadoVazio, Esqueleto } from '@/components/ui/basicos';
import { BarraEmpilhada, COR_GRAFICO } from '@/components/ui/Graficos';
import { novoId } from '@/lib/utils';
import type { Trilha } from '@/lib/tipos';

/**
 * Lista de trilhas (rota /trilhas).
 * Cada cartão mostra o alcance (faixa colorida à esquerda), status, título,
 * número de etapas, público, prazo e, se publicada, a barra de progresso.
 *
 * @returns a página com o filtro e a grade de cartões (ou esqueleto/vazio).
 */
export default function Trilhas() {
  const d = useDados();
  const router = useRouter();
  // Filtro escolhido no seletor: todas, um dos três alcances ou só rascunhos.
  const [filtro, setFiltro] = useState<'todas' | Trilha['alcance'] | 'rascunho'>('todas');

  // [PV-1] O FILTRO DA LISTA: Todas, Gerais, Da empresa, Do profissional (pelo alcance) ou Rascunhos (pelo status).
  // "todas" deixa passar tudo; "rascunho" olha o status; os demais valores
  // ("geral", "empresa", "profissional") comparam com o alcance da trilha.
  const lista = useMemo(() => d.trilhas.filter((t) =>
    filtro === 'todas' ? true : filtro === 'rascunho' ? t.status === 'rascunho' : t.alcance === filtro), [d.trilhas, filtro]);

  // [PV-2] A TRILHA NOVA: nasce como rascunho, alcance geral e prazo de 7 dias; abre o editor, que salva sozinho. TODO(API): POST.
  /**
   * Cria uma trilha em branco e abre o editor dela.
   * Nasce como rascunho, alcance geral e prazo de 7 dias; o admin ajusta tudo
   * no editor, que salva sozinho a cada mudança.
   */
  const nova = () => {
    // novoId('tri') gera um id único com prefixo (ex.: "tri_x8k2...").
    const t: Trilha = { id: novoId('tri'), titulo: 'Nova trilha', descricao: '', alcance: 'geral', empresaId: '', pessoaIds: [], status: 'rascunho', prazoDias: 7, etapas: [], progresso: {} };
    // GRAVA: a nova trilha na store (e no localStorage, pela store).
    // TODO(API): vira um POST para a API da PROGLOGIC (a store cuida disso).
    d.salvar('trilhas', t);
    // NAVEGA: abre o editor da trilha recém-criada.
    router.push(`/trilhas/${t.id}`);
  };

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Trilhas" descricao="Uma trilha, três formas de atribuir. Quem decide o alcance é o administrador, na hora de publicar."
        acao={<Button onClick={nova}><Plus className="h-4 w-4" aria-hidden />Nova trilha</Button>} />

      {/* Filtro sempre acima do conteúdo (§10). */}
      <BarraFiltros>
        <Segmentado rotulo="Filtrar trilhas" valor={filtro} onChange={setFiltro}
          opcoes={[{ valor: 'todas', rotulo: 'Todas' }, { valor: 'geral', rotulo: 'Gerais' }, { valor: 'empresa', rotulo: 'Da empresa' }, { valor: 'profissional', rotulo: 'Do profissional' }, { valor: 'rascunho', rotulo: 'Rascunhos' }]} />
      </BarraFiltros>

      {/* Estados da tela (§13): carregando → esqueletos; vazio → explica e
        * oferece "Nova trilha"; com dado → grade de cartões. */}
      {!d.pronto ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-56 rounded-2xl" />)}</div>
      ) : lista.length === 0 ? (
        <div className="rounded-2xl border border-borda bg-superficie">
          <EstadoVazio icone={<GraduationCap className="h-6 w-6" />} titulo="Nenhuma trilha aqui" descricao="Crie uma trilha, monte as etapas e escolha o público na hora de publicar."
            acao={<Button onClick={nova}><Plus className="h-4 w-4" />Nova trilha</Button>} />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((t) => {
            // resumoTrilha (lib/metricas.ts): tamanho do público e quantos
            // concluíram, estão em andamento ou nunca começaram.
            const r = resumoTrilha(t, d);
            // Rótulo e cor do alcance (roxo geral, verde empresa, âmbar
            // profissional — §4).
            const a = ALCANCE[t.alcance];
            // [PV-3] O TEXTO "QUEM RECEBE" do cartão: o nome da empresa, "N pessoa(s)" ou "Todos", conforme o alcance.
            // Texto "quem recebe": nome da empresa, "N pessoa(s)" ou "Todos".
            const alvo = t.alcance === 'empresa' ? d.empresa(t.empresaId)?.nomeFantasia : t.alcance === 'profissional' ? `${t.pessoaIds.length} pessoa(s)` : 'Todos';
            return (
              <li key={t.id}>
                {/* NAVEGA: o cartão inteiro abre o editor (/trilhas/[id]).
                  * h-full + flex-col: cartões da mesma linha ficam com a mesma
                  * altura; a descrição (flex-1) empurra o rodapé para baixo. */}
                <Link href={`/trilhas/${t.id}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-borda bg-superficie p-5 pl-6 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
                  {/* Faixa colorida do alcance colada na borda esquerda
                    * (absolute inset-y-0 left-0). Cor vem do ALCANCE, por isso
                    * style. O rótulo em texto logo abaixo repete a informação. */}
                  <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: a.cor }} aria-hidden />
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-tinta-suave">{a.rotulo}</span>
                    {t.status === 'rascunho' ? <Etiqueta tom="aviso">Rascunho</Etiqueta> : <Etiqueta tom="sucesso" ponto>Publicada</Etiqueta>}
                  </div>
                  <h2 className="font-space text-lg font-semibold text-tinta group-hover:text-primaria">{t.titulo}</h2>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-tinta-suave">{t.descricao || 'Sem descrição.'}</p>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-tinta-suave">
                    <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" aria-hidden />{t.etapas.length} etapas</span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden />{alvo}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden />{t.prazoDias > 0 ? `${t.prazoDias} dias` : 'Sem prazo'}</span>
                  </div>
                  {/* Barra de progresso só faz sentido em trilha publicada e com
                    * alguém no público. ⚠️ ATENÇÃO: as cores são as mesmas do
                    * COR em painel/page.tsx; mude nos dois lugares juntos. */}
                  {t.status === 'publicada' && r.publico > 0 && (
                    <div className="mt-4">
                      <BarraEmpilhada altura={8} segmentos={[{ rotulo: 'Concluídas', valor: r.concluida, cor: COR_GRAFICO.concluida }, { rotulo: 'Em andamento', valor: r.andamento, cor: COR_GRAFICO.andamento }, { rotulo: 'Não iniciadas', valor: r.nao_iniciada, cor: COR_GRAFICO.naoIniciada }]} />
                      <p className="mt-1.5 text-[12px] text-tinta-suave">{r.concluida} de {r.publico} concluíram · {r.nao_iniciada} não iniciaram</p>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
