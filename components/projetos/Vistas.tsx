/* ============================================================================
   VISTAS.TSX
   O que é: as vistas alternativas ao quadro: Lista (tabela) e Cronograma (barras no tempo).
   Onde é usado: app/(sistema)/projetos/[id]/page.tsx (VistaLista e VistaCronograma,
                 trocadas pelo seletor de vista da aba Tarefas).
   Depende de: lib/store (useDados), components/ui/basicos, components/ui/Tabela,
               lib/metricas (rótulos e tons de prioridade) e lib/utils (datas, cx).
   Contexto: §5 Projetos (três vistas: quadro, lista, cronograma).
   ============================================================================ */
"use client";

import { useMemo, useState } from 'react';
import { ArrowUpDown, ListTodo } from 'lucide-react';
import { useDados, Projeto, Tarefa } from '@/lib/store';
import { Avatar, Etiqueta, EtiquetaTarefa, EstadoVazio } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import { ROTULO_PRIORIDADE, TOM_PRIORIDADE } from '@/lib/metricas';
import { cx, dataBR, dataCurta, diasEntre, hojeISO, somaDias } from '@/lib/utils';

// Cor da bolinha de status por posição da lista (cinza, roxo, âmbar...).
const TOM_COLUNA = ['#9CA0B3', '#7C5CFF', '#F5A524', '#10B981', '#2563EB', '#BE185D'];
/**
 * Cor que representa a lista (status) de uma tarefa.
 * A última lista ("Pronto") é sempre verde; as demais usam as 3 primeiras
 * cores de TOM_COLUNA (da 3ª em diante repetem o âmbar, "em andamento").
 * @param p projeto dono das listas.
 * @param colunaId lista da tarefa.
 * @returns cor em hexadecimal.
 * @example corColuna(p, p.colunas[0].id) // '#9CA0B3' (A fazer)
 */
const corColuna = (p: Projeto, colunaId: string) => {
  const i = p.colunas.findIndex((c) => c.id === colunaId);
  return i === p.colunas.length - 1 ? '#10B981' : TOM_COLUNA[Math.min(i, 2)] ?? '#9CA0B3';
};

/**
 * Vista em lista: a mesma tarefa, em tabela ordenável.
 * Clicar na linha (ou no título) abre o detalhe da tarefa.
 * @param projeto projeto das tarefas (listas, para nome e cor do status).
 * @param tarefas tarefas já filtradas pela tela.
 * @param onAbrir abre o detalhe da tarefa pelo id.
 * @returns tabela de tarefas ou estado vazio.
 */
export function VistaLista({ projeto, tarefas, onAbrir }: { projeto: Projeto; tarefas: Tarefa[]; onAbrir: (id: string) => void }) {
  const d = useDados();
  // Coluna pela qual a tabela está ordenada (começa por prazo).
  const [ordem, setOrdem] = useState<'prazo' | 'prioridade' | 'status'>('prazo');
  // Peso numérico para ordenar prioridade: alta vem primeiro.
  const peso = { alta: 0, media: 1, baixa: 2 };
  const ultima = projeto.colunas.at(-1)?.id;
  /*
   * Ordena uma CÓPIA das tarefas ([...tarefas]) para não mexer no array
   * recebido. Prazo compara texto ISO (AAAA-MM-DD ordena certo como texto);
   * status usa a posição da lista no quadro. useMemo só refaz a ordenação
   * quando tarefas, ordem ou colunas mudam.
   */
  const lista = useMemo(() => [...tarefas].sort((a, b) =>
    ordem === 'prazo' ? a.prazo.localeCompare(b.prazo)
      : ordem === 'prioridade' ? peso[a.prioridade] - peso[b.prioridade]
      : projeto.colunas.findIndex((c) => c.id === a.colunaId) - projeto.colunas.findIndex((c) => c.id === b.colunaId)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [tarefas, ordem, projeto.colunas]);

  // Estado vazio: nenhuma tarefa (ou o filtro escondeu todas).
  if (!tarefas.length) return <EstadoVazio icone={<ListTodo className="h-6 w-6" />} titulo="Nenhuma tarefa" descricao="Nada corresponde aos filtros, ou o quadro ainda está vazio." />;


  return (
    <div className="rounded-2xl border border-borda bg-superficie">
      <Tabela rotulo="Tarefas em lista">
        {/* Status, Prazo e Prioridade têm cabeçalho clicável para ordenar. */}
        <thead><tr><Th>Tarefa</Th><Th><Ordenar campo="status" ordem={ordem} setOrdem={setOrdem}>Status</Ordenar></Th><Th>Responsável</Th><Th><Ordenar campo="prazo" ordem={ordem} setOrdem={setOrdem}>Prazo</Ordenar></Th><Th><Ordenar campo="prioridade" ordem={ordem} setOrdem={setOrdem}>Prioridade</Ordenar></Th><Th>Checklist</Th></tr></thead>
        <tbody>
          {lista.map((t) => {
            const resp = d.pessoa(t.responsavelId);
            const col = projeto.colunas.find((c) => c.id === t.colunaId);
            // Atrasada = prazo já passou e a tarefa não está em "Pronto".
            const atrasada = t.colunaId !== ultima && t.prazo < hojeISO();
            return (
              <Tr key={t.id} onClick={() => onAbrir(t.id)}>
                <Td>
                  {/*
                    * Botão de verdade para o teclado alcançar a tarefa.
                    * stopPropagation evita abrir duas vezes (botão + clique da linha).
                    */}
                  <button onClick={(e) => { e.stopPropagation(); onAbrir(t.id); }} className="text-left font-medium hover:text-primaria focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 rounded">{t.titulo}</button>
                  {t.etiquetas.length > 0 && <div className="mt-1 flex gap-1">{t.etiquetas.map((e) => <EtiquetaTarefa key={e} nome={e} compacta />)}</div>}
                </Td>
                {/* Bolinha colorida é decorativa (aria-hidden): o nome da lista vem ao lado. */}
                <Td><span className="inline-flex items-center gap-2 text-[13px]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: corColuna(projeto, t.colunaId) }} aria-hidden />{col?.titulo}</span></Td>
                <Td>{resp && <span className="flex items-center gap-2"><Avatar nome={resp.nome} tamanho={24} /><span className="text-[13px]">{resp.nome}</span></span>}</Td>
                {/* Atrasada: vermelho E o texto "atrasada" (cor nunca sozinha). */}
                <Td><span className={cx('text-[13px] tabular-nums', atrasada ? 'font-semibold text-erro' : 'text-tinta')}>{dataBR(t.prazo)}{atrasada && ' · atrasada'}</span></Td>
                <Td><Etiqueta tom={TOM_PRIORIDADE[t.prioridade]}>{ROTULO_PRIORIDADE[t.prioridade]}</Etiqueta></Td>
                {/* Checklist como "feitos/total"; travessão quando não há itens. */}
                <Td className="text-[13px] tabular-nums text-tinta-suave">{t.checklist.length ? `${t.checklist.filter((c) => c.feito).length}/${t.checklist.length}` : '—'}</Td>
              </Tr>
            );
          })}
        </tbody>
      </Tabela>
    </div>
  );
}

/** Campos pelos quais a VistaLista sabe ordenar. */
type Ordem = 'prazo' | 'prioridade' | 'status';
/**
 * Botão de cabeçalho que escolhe a ordenação da tabela.
 * Fica roxo e com aria-pressed=true quando é o critério ativo.
 * @param campo critério que este botão aplica.
 * @param ordem critério ativo agora.
 * @param setOrdem troca o critério ativo.
 * @param children texto do cabeçalho.
 * @returns o botão de ordenar.
 */
function Ordenar({ campo, ordem, setOrdem, children }: { campo: Ordem; ordem: Ordem; setOrdem: (o: Ordem) => void; children: string }) {
  return (
    <button onClick={() => setOrdem(campo)} className={cx('inline-flex items-center gap-1 uppercase', ordem === campo && 'text-primaria')} aria-pressed={ordem === campo}>
      {children}<ArrowUpDown className="h-3 w-3" aria-hidden />
    </button>
  );
}

/**
 * Cronograma: cada tarefa é uma barra do início estimado até o prazo,
 * sobre a janela do projeto. A linha vertical marca hoje.
 * (Sem data de início na tarefa, a barra estima 1 dia por item de checklist, mínimo 3.)
 *
 * @param projeto projeto (início e entrega definem a janela mínima).
 * @param tarefas tarefas já filtradas pela tela.
 * @param onAbrir abre o detalhe da tarefa pelo id.
 * @returns linha do tempo com uma barra por tarefa, ou estado vazio.
 * @example
 * Tarefa com prazo 20/05 e 5 itens de checklist: barra de 15/05 a 20/05.
 */
export function VistaCronograma({ projeto, tarefas, onAbrir }: { projeto: Projeto; tarefas: Tarefa[]; onAbrir: (id: string) => void }) {
  const d = useDados();
  const hoje = hojeISO();
  // Tarefas em ordem de prazo: as que vencem antes ficam no topo.
  const itens = [...tarefas].sort((a, b) => a.prazo.localeCompare(b.prazo));
  /*
   * Janela do gráfico: começa no MENOR entre o início do projeto e o início
   * estimado de cada tarefa; termina no MAIOR entre a entrega e os prazos.
   * Datas ISO ordenam certo como texto, por isso sort() basta.
   */
  const inicio = [projeto.inicio, ...itens.map((t) => somaDias(t.prazo, -Math.max(3, t.checklist.length)))].sort()[0];
  const fim = [projeto.entrega, ...itens.map((t) => t.prazo)].sort().at(-1)!;
  // Total de dias da janela (+1 para incluir o último dia; mínimo 1 evita dividir por zero).
  const total = Math.max(1, diasEntre(inicio, fim) + 1);
  /**
   * Converte uma data em posição horizontal (% da largura da janela).
   * @param iso data AAAA-MM-DD.
   * @returns porcentagem para usar em `left`/`width`.
   * @example x(inicio) // 0
   */
  const x = (iso: string) => (diasEntre(inicio, iso) / total) * 100;

  // marcas semanais: uma data a cada 7 dias, do início ao fim da janela.
  const semanas: string[] = [];
  for (let s = inicio; s <= fim; s = somaDias(s, 7)) semanas.push(s);

  // Estado vazio: sem tarefas não há o que desenhar.
  if (!tarefas.length) return <EstadoVazio icone={<ListTodo className="h-6 w-6" />} titulo="Nada no cronograma" descricao="Crie tarefas com prazo para vê-las na linha do tempo." />;

  return (
    <div className="rounded-2xl border border-borda bg-superficie p-4">
      {/* Largura mínima de 760px: no celular o cronograma rola na horizontal em vez de esmagar. */}
      <div className="rolagem overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Régua de datas; ml-[220px] pula a coluna de nomes das tarefas. */}
          <div className="relative ml-[220px] h-7 border-b border-borda text-[11px] text-tinta-suave">
            {/* -translate-x-1/2 centraliza o rótulo sobre a marca. */}
            {semanas.map((s) => <span key={s} className="absolute top-1 -translate-x-1/2 whitespace-nowrap" style={{ left: `${x(s)}%` }}>{dataCurta(s)}</span>)}
          </div>
          <div className="relative">
            {/* grade e hoje: camada por trás das barras; pointer-events-none deixa o clique passar. */}
            <div className="pointer-events-none absolute inset-y-0 left-[220px] right-0">
              {semanas.map((s) => <span key={s} className="absolute inset-y-0 w-px bg-borda/70" style={{ left: `${x(s)}%` }} />)}
              {/* Linha vermelha de "hoje", só se hoje cair dentro da janela. */}
              {hoje >= inicio && hoje <= fim && (
                <span className="absolute inset-y-0 w-0.5 bg-erro/70" style={{ left: `${x(hoje)}%` }}>
                  <span className="absolute -top-0.5 left-1 rounded bg-erro px-1 text-[10px] font-bold text-white dark:text-[#14161F]">hoje</span>
                </span>
              )}
              {/* Linha roxa da entrega prevista do projeto. */}
              <span className="absolute inset-y-0 w-0.5 bg-primaria/60" style={{ left: `${x(projeto.entrega)}%` }} title="Entrega prevista" />
            </div>
            <ul>
              {itens.map((t) => {
                // SIMULADO: tarefa não tem data de início; estima 1 dia por item
                // do checklist (mínimo 3) antes do prazo.
                const ini = somaDias(t.prazo, -Math.max(3, t.checklist.length));
                const resp = d.pessoa(t.responsavelId);
                const cor = corColuna(projeto, t.colunaId);
                // Fração do checklist concluída (0 a 1), para pintar dentro da barra.
                const pct = t.checklist.length ? t.checklist.filter((c) => c.feito).length / t.checklist.length : 0;
                return (
                  <li key={t.id} className="flex h-11 items-center border-b border-borda/60 last:border-0">
                    <button onClick={() => onAbrir(t.id)} className="flex w-[220px] shrink-0 items-center gap-2 pr-3 text-left hover:text-primaria">
                      {resp && <Avatar nome={resp.nome} tamanho={22} />}
                      <span className="truncate text-[13px] font-medium text-tinta">{t.titulo}</span>
                    </button>
                    <div className="relative h-full flex-1">
                      <button onClick={() => onAbrir(t.id)} title={`${t.titulo}: até ${dataBR(t.prazo)}`}
                        className="absolute top-1/2 h-6 -translate-y-1/2 overflow-hidden rounded-md text-left shadow-sm transition-transform hover:scale-y-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
                        /*
                         * left = início estimado; width vai até o fim do dia do prazo
                         * (prazo + 1). Mínimo de 1,5% para barra curta continuar clicável.
                         * Fundo = cor do status com transparência (sufixo hex "33" ≈ 20%).
                         */
                        style={{ left: `${x(ini)}%`, width: `${Math.max(1.5, x(somaDias(t.prazo, 1)) - x(ini))}%`, background: `${cor}33`, border: `1px solid ${cor}` }}>
                        {/* Preenchimento proporcional ao checklist concluído. */}
                        <span className="absolute inset-y-0 left-0" style={{ width: `${pct * 100}%`, background: cor, opacity: 0.55 }} />
                        <span className="relative truncate px-1.5 text-[11px] font-semibold leading-6 text-tinta">{dataCurta(t.prazo)}</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      {/* Legenda em texto: o gráfico sempre tem resumo legível (acessibilidade). */}
      <p className="mt-3 text-[12px] text-tinta-suave">A barra vai do início estimado ao prazo; o preenchimento mostra o checklist concluído. A linha roxa marca a entrega prevista do projeto.</p>
    </div>
  );
}
