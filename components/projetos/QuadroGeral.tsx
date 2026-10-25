/* ============================================================================
   QUADROGERAL.TSX
   O que é: o quadro kanban da VISÃO GERAL: junta as tarefas de vários projetos, com as listas de mesmo
   nome (A fazer, Fazendo, Revisão, Pronto...) numa coluna só. Cada cartão mostra o projeto dele.
   Arrasta e solta como o quadro de um projeto; o cartão vai para a lista de MESMO NOME do projeto dele.
   Onde é usado: components/projetos/VisaoTarefas.tsx (vista "Quadro" da visão geral).
   Depende de: lib/store (useDados: moverTarefa, projeto, pessoa), lib/auth, lib/permissoes (podeFazer),
   lib/toast, lib/tarefas (colunasUnificadas, ordenarTarefas), ./CartaoTarefa e lib/utils (cx).
   Contexto: §5 Projetos (kanban) e pedido de 14/10/2026 (visão geral das tarefas).
   ============================================================================ */
"use client";

import { DragEvent, useMemo, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useDados, Projeto, Tarefa } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { podeFazer } from '@/lib/permissoes';
import { useToast } from '@/lib/toast';
import { colunaDaTarefa, colunasUnificadas, ordenarTarefas, ROTULO_ORDEM, type CriterioOrdem, type Direcao } from '@/lib/tarefas';
import { EstadoVazio } from '@/components/ui/basicos';
import CartaoTarefa from './CartaoTarefa';
import { cx } from '@/lib/utils';

// [PV-1] O QUADRO GERAL: as listas dos projetos se juntam pelo NOME. Não cria, renomeia nem exclui lista (isso é no quadro de cada projeto). Arrastar para uma lista que o projeto do cartão não tem é recusado com aviso.
/**
 * Quadro kanban com tarefas de vários projetos.
 * - Colunas: as listas dos projetos unidas pelo nome (lib/tarefas.ts, colunasUnificadas).
 * - Mover: só quem pode (lib/permissoes.ts, mover_tarefa). O cartão vai para a lista de mesmo nome do
 *   projeto dele; se o projeto não tem essa lista, avisa e não move.
 * - Ordem: com um critério automático (prazo, prioridade...) os cartões se organizam sozinhos em cada lista;
 *   então reordenar dentro da mesma lista fica desligado, mas mover entre listas continua (o cartão vai para o fim).
 * - No celular as listas viram abas, como no quadro de um projeto.
 *
 * @param projetos projetos que formam as colunas.
 * @param tarefas tarefas a exibir (já filtradas pela tela).
 * @param onAbrir abre o detalhe da tarefa pelo id.
 * @param ordem critério de ordem dos cartões em cada lista.
 * @param direcao sentido da ordem.
 * @returns o quadro, ou o estado vazio quando não há tarefas.
 */
export default function QuadroGeral({ projetos, tarefas, onAbrir, ordem, direcao }: { projetos: Projeto[]; tarefas: Tarefa[]; onAbrir: (id: string) => void; ordem: CriterioOrdem; direcao: Direcao }) {
  const d = useDados();
  const { sessao } = useAuth();
  const avisar = useToast();
  // Cartão sendo arrastado e onde ele cairia (lista e posição entre os cartões mostrados).
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<{ chave: string; indice: number } | null>(null);
  // No celular só uma lista aparece por vez; esta é a aba escolhida (chave da coluna).
  const [colunaMobile, setColunaMobile] = useState<string | null>(null);

  const colunas = useMemo(() => colunasUnificadas(projetos), [projetos]);
  const nomeDe = (id: string) => d.pessoa(id)?.nome ?? '';
  const manual = ordem === 'manual';
  /** A sessão pode mover esta tarefa? (mesma regra do quadro de um projeto; sem sessão, nada é permitido.) */
  const pode = (responsavelId: string) => !!sessao && podeFazer(sessao.perfil, 'mover_tarefa', { pessoaId: sessao.pessoaId, responsavelId });

  /**
   * Cartões de uma coluna, na ordem escolhida.
   * No manual, a ordem é a do arrastar (campo `ordem`) dentro de cada projeto, projeto por projeto na ordem dos projetos.
   * @param chave chave da coluna unificada.
   */
  const daColuna = (chave: string) => {
    const col = colunas.find((c) => c.chave === chave)!;
    const dela = tarefas.filter((t) => colunaDaTarefa(colunas, t) === col);
    if (manual) {
      const ordemProjeto = new Map(projetos.map((p, i) => [p.id, i]));
      return dela.sort((a, b) => (ordemProjeto.get(a.projetoId) ?? 0) - (ordemProjeto.get(b.projetoId) ?? 0) || a.ordem - b.ordem);
    }
    return ordenarTarefas(dela, ordem, direcao, nomeDe);
  };

  /**
   * Evento dragover: decide onde o cartão cairia (pelo meio dos cartões). Com ordem automática o destino é sempre o fim.
   * @param e evento de arraste.
   * @param chave coluna sob o mouse.
   */
  const onDragOver = (e: DragEvent<HTMLDivElement>, chave: string) => {
    if (!arrastando) return;
    // preventDefault no dragover é o que libera o soltar aqui (sem ele o drop nunca dispara).
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const cartoes = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-cartao]')].filter((el) => el.dataset.cartao !== arrastando);
    let indice = cartoes.length;
    if (manual) {
      for (let i = 0; i < cartoes.length; i++) {
        const r = cartoes[i].getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) { indice = i; break; }
      }
    }
    if (alvo?.chave !== chave || alvo.indice !== indice) setAlvo({ chave, indice });
  };

  // [PV-2] A SOLTURA NO QUADRO GERAL: confere a permissão, acha a lista de mesmo nome no projeto do cartão (se não existir, avisa e não move) e grava com moverTarefa. Na ordem automática, soltar na mesma lista não faz nada.
  /**
   * Evento drop: o cartão foi solto sobre uma coluna.
   * @param e evento de arraste.
   * @param chave coluna de destino.
   */
  const onDrop = (e: DragEvent, chave: string) => {
    e.preventDefault();
    const t = tarefas.find((x) => x.id === arrastando);
    const col = colunas.find((c) => c.chave === chave);
    if (arrastando && alvo && t && col && pode(t.responsavelId)) {
      const destino = col.porProjeto[t.projetoId];
      const mesmaColuna = destino === t.colunaId;
      if (!destino) {
        avisar(`O projeto “${d.projeto(t.projetoId)?.nome}” não tem a lista “${col.titulo}”.`, 'erro');
      } else if (!(mesmaColuna && !manual)) {
        // Posição entre os cartões DESTE projeto que estão à vista na coluna (a ordem é por projeto).
        const vistos = daColuna(chave).filter((x) => x.id !== t.id);
        const indice = manual ? vistos.slice(0, alvo.indice).filter((x) => x.projetoId === t.projetoId).length : vistos.filter((x) => x.projetoId === t.projetoId).length;
        // GRAVA: muda coluna e ordem da tarefa na store (localStorage) e renumera os vizinhos do destino.
        // TODO(API): trocar por chamada à API (e o tempo real avisa os colegas).
        d.moverTarefa(t.id, destino, indice);
        if (!mesmaColuna) avisar(`“${t.titulo}” movida para ${col.titulo}.`);
      }
    }
    setArrastando(null); setAlvo(null);
  };

  if (tarefas.length === 0) {
    return <div className="rounded-2xl border border-borda bg-superficie"><EstadoVazio icone={<LayoutGrid className="h-6 w-6" aria-hidden />} titulo="Nenhuma tarefa" descricao="Nada corresponde aos filtros, ou os projetos ainda não têm tarefas." /></div>;
  }

  const ativaMobile = colunaMobile && colunas.some((c) => c.chave === colunaMobile) ? colunaMobile : colunas[0]?.chave;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-superficie-alt">
      {!manual && <p className="px-3 pt-3 text-[12px] font-semibold text-tinta-suave">Ordenado por {ROTULO_ORDEM[ordem].toLowerCase()} ({direcao === 'asc' ? 'crescente' : 'decrescente'}). Reordenar dentro da lista fica desligado; mover entre listas continua.</p>}
      {/* Abas de lista no celular (md:hidden some no desktop). */}
      <div className="rolagem flex gap-1.5 overflow-x-auto p-3 md:hidden" role="tablist" aria-label="Listas do quadro">
        {colunas.map((c) => (
          <button key={c.chave} role="tab" aria-selected={ativaMobile === c.chave} onClick={() => setColunaMobile(c.chave)}
            className={cx('shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors', ativaMobile === c.chave ? 'bg-botao text-sobre-cor' : 'bg-superficie text-tinta-suave hover:text-tinta')}>
            {c.titulo} <span className="opacity-70">{daColuna(c.chave).length}</span>
          </button>
        ))}
      </div>

      <div className="rolagem flex flex-1 items-start gap-3 overflow-x-auto p-3 pt-0 md:pt-3">
        {colunas.map((col) => {
          const lista = daColuna(col.chave);
          const destacada = alvo?.chave === col.chave;
          // Mesma lista sem o cartão arrastado: os índices do alvo foram calculados assim no dragover.
          const semArrastado = lista.filter((t) => t.id !== arrastando);
          return (
            <section key={col.chave} aria-label={`Lista ${col.titulo}`}
              className={cx('flex max-h-full w-full shrink-0 flex-col rounded-2xl bg-fundo/95 shadow-sm transition-[box-shadow,background-color] duration-150 md:w-[264px]',
                ativaMobile !== col.chave && 'hidden md:flex', destacada && 'bg-fundo ring-2 ring-primaria')}>
              <header className="flex items-center gap-2 px-3 pb-1 pt-3">
                <h3 className="flex-1 truncate px-1 font-space text-[14px] font-semibold text-tinta">{col.titulo}</h3>
                <span className="rounded-full bg-superficie-alt px-2 py-0.5 text-[12px] font-semibold tabular-nums text-tinta-suave">{lista.length}</span>
              </header>
              <div className="rolagem flex min-h-16 flex-col gap-2 overflow-y-auto px-2 py-2"
                onDragOver={(e) => onDragOver(e, col.chave)} onDrop={(e) => onDrop(e, col.chave)}
                // dragleave também dispara entre filhos: só limpa se o destino saiu desta área.
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setAlvo(null); }}>
                {lista.map((t) => {
                  const pos = semArrastado.findIndex((x) => x.id === t.id);
                  return (
                    <div key={t.id}>
                      {destacada && pos === alvo!.indice && t.id !== arrastando && <Espaco />}
                      <CartaoTarefa tarefa={t} concluida={col.concluida} arrastando={arrastando === t.id} projetoNome={d.projeto(t.projetoId)?.nome} projetoCor={d.projeto(t.projetoId)?.cor}
                        arrastavel={pode(t.responsavelId)} cadeado={sessao?.perfil === 'profissional' && !pode(t.responsavelId)}
                        onAbrir={() => onAbrir(t.id)}
                        // dragstart: guarda o id; o setTimeout(0) deixa o navegador tirar a "foto" do cartão antes de apagá-lo.
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => setArrastando(t.id), 0); }}
                        onDragEnd={() => { setArrastando(null); setAlvo(null); }} />
                    </div>
                  );
                })}
                {destacada && alvo!.indice >= semArrastado.length && <Espaco texto={lista.length === 0 ? 'Solte aqui' : undefined} />}
                {lista.length === 0 && !destacada && (
                  <p className="rounded-xl border border-dashed border-borda px-3 py-5 text-center text-[12px] leading-relaxed text-tinta-suave">Nenhum cartão aqui.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Espaço tracejado que mostra onde o cartão vai cair. Decorativo (aria-hidden).
 * @param texto texto opcional no meio (ex.: "Solte aqui" em lista vazia).
 * @returns o marcador visual.
 */
function Espaco({ texto }: { texto?: string }) {
  return (
    <div className="mb-2 flex h-16 items-center justify-center rounded-xl border-2 border-dashed border-primaria/50 bg-primaria-suave/60 text-[12px] font-semibold text-primaria" aria-hidden>
      {texto}
    </div>
  );
}
