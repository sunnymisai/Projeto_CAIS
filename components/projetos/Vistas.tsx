/* ============================================================================
   VISTAS.TSX
   O que é: as vistas alternativas ao quadro: Lista (tabela) e Cronograma (barras no tempo).
   Onde é usado: app/(sistema)/projetos/[id]/page.tsx (VistaLista e VistaCronograma,
                 trocadas pelo seletor de vista da aba Tarefas) e components/projetos/VisaoTarefas.tsx
                 (as mesmas vistas com tarefas de VÁRIOS projetos, com a coluna Projeto).
   Depende de: lib/store (useDados), components/ui/basicos, components/ui/Tabela,
               lib/metricas (rótulos e tons de prioridade), lib/utils (datas, cx) e
               components/ui/Graficos (COR_GRAFICO e TONS_COLUNA) e
               ./MarcadorProjeto (cor de identidade do projeto, na visão geral).
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
import { COR_GRAFICO, TONS_COLUNA } from '@/components/ui/Graficos';
import { CLASSE_COR_PROJETO, MarcadorProjeto, estiloProjeto } from './MarcadorProjeto';

// [PV-1] A COR DO STATUS nas vistas: a última lista é sempre verde; as demais usam as 3 primeiras cores de TONS_COLUNA (components/ui/Graficos.tsx).
/**
 * Cor que representa a lista (status) de uma tarefa (bolinha e barra do cronograma).
 * A última lista ("Pronto") é sempre verde; as demais usam as 3 primeiras
 * cores de TONS_COLUNA (da 3ª em diante repetem o âmbar, "em andamento").
 * As cores são tokens --grafico-* e trocam com o tema claro/escuro.
 * @param p projeto dono das listas.
 * @param colunaId lista da tarefa.
 * @returns a cor como var(--grafico-...).
 * @example corColuna(p, p.colunas[0].id) // 'var(--grafico-a-fazer)' (A fazer)
 */
const corColuna = (p: Projeto, colunaId: string) => {
  const i = p.colunas.findIndex((c) => c.id === colunaId);
  // i === -1 (lista apagada): cai no cinza de "A fazer".
  return i === p.colunas.length - 1 ? COR_GRAFICO.concluida : TONS_COLUNA[Math.min(i, 2)] ?? COR_GRAFICO.aFazer;
};

// [PV-2] A VISTA EM LISTA: a mesma tarefa em tabela, ordenável por prazo (padrão), prioridade e status. Clicar na linha abre o detalhe.
/**
 * Vista em lista: a mesma tarefa, em tabela ordenável.
 * Clicar na linha (ou no título) abre o detalhe da tarefa.
 * @param projeto projeto das tarefas (listas, para nome e cor do status); omitido na visão geral, em que cada
 *   tarefa usa o projeto dela.
 * @param tarefas tarefas já filtradas pela tela.
 * @param onAbrir abre o detalhe da tarefa pelo id.
 * @param mostrarProjeto true na visão geral: acrescenta a coluna "Projeto".
 * @returns tabela de tarefas ou estado vazio.
 */
export function VistaLista({ projeto, tarefas, onAbrir, mostrarProjeto = false }: { projeto?: Projeto; tarefas: Tarefa[]; onAbrir: (id: string) => void; mostrarProjeto?: boolean }) {
  const d = useDados();
  /** Projeto da tarefa: o da própria tarefa (visão geral) ou o recebido por prop. */
  const projDe = (t: Tarefa) => d.projeto(t.projetoId) ?? projeto;
  // Coluna pela qual a tabela está ordenada (começa por prazo).
  const [ordem, setOrdem] = useState<'prazo' | 'prioridade' | 'status'>('prazo');
  // [PV-3] A ORDEM DE PRIORIDADE ao ordenar: alta primeiro, depois média e baixa.
  // Peso numérico para ordenar prioridade: alta vem primeiro.
  const peso = { alta: 0, media: 1, baixa: 2 };
  /*
   * Ordena uma CÓPIA das tarefas ([...tarefas]) para não mexer no array
   * recebido. Prazo compara texto ISO (AAAA-MM-DD ordena certo como texto);
   * status usa a posição da lista no quadro. useMemo só refaz a ordenação
   * quando tarefas, ordem ou colunas mudam.
   */
  const lista = useMemo(() => [...tarefas].sort((a, b) =>
    ordem === 'prazo' ? a.prazo.localeCompare(b.prazo)
      : ordem === 'prioridade' ? peso[a.prioridade] - peso[b.prioridade]
      : (projDe(a)?.colunas.findIndex((c) => c.id === a.colunaId) ?? 0) - (projDe(b)?.colunas.findIndex((c) => c.id === b.colunaId) ?? 0)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [tarefas, ordem, projeto?.colunas, d.projetos]);

  // Estado vazio: nenhuma tarefa (ou o filtro escondeu todas).
  if (!tarefas.length) return <EstadoVazio icone={<ListTodo className="h-6 w-6" />} titulo="Nenhuma tarefa" descricao="Nada corresponde aos filtros, ou o quadro ainda está vazio." />;


  return (
    <div className="rounded-2xl border border-borda bg-superficie">
      <Tabela rotulo="Tarefas em lista">
        {/* Status, Prazo e Prioridade têm cabeçalho clicável para ordenar. */}
        <thead><tr><Th>Tarefa</Th>{mostrarProjeto && <Th>Projeto</Th>}<Th><Ordenar campo="status" ordem={ordem} setOrdem={setOrdem}>Status</Ordenar></Th><Th>Responsável</Th><Th><Ordenar campo="prazo" ordem={ordem} setOrdem={setOrdem}>Prazo</Ordenar></Th><Th><Ordenar campo="prioridade" ordem={ordem} setOrdem={setOrdem}>Prioridade</Ordenar></Th><Th>Checklist</Th></tr></thead>
        <tbody>
          {lista.map((t) => {
            const resp = d.pessoa(t.responsavelId);
            const proj = projDe(t);
            const col = proj?.colunas.find((c) => c.id === t.colunaId);
            // Atrasada = prazo já passou e a tarefa não está em "Pronto" (a última lista do projeto da tarefa).
            const atrasada = t.colunaId !== proj?.colunas.at(-1)?.id && t.prazo < hojeISO();
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
                {/* [PV-4] A IDENTIDADE DO PROJETO NA LISTA: bolinha na cor do projeto + nome escrito. A bolinha é decorativa (aria-hidden); o nome desambigua projetos de mesma cor. */}
                {mostrarProjeto && <Td className="text-[13px] text-tinta-suave"><span className="inline-flex items-center gap-2">{proj && <MarcadorProjeto cor={proj.cor} />}{proj?.nome}</span></Td>}
                {/* Bolinha colorida é decorativa (aria-hidden): o nome da lista vem ao lado. */}
                <Td><span className="inline-flex items-center gap-2 text-[13px]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: proj ? corColuna(proj, t.colunaId) : COR_GRAFICO.aFazer }} aria-hidden />{col?.titulo}</span></Td>
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

// [PV-5] O CRONOGRAMA: uma barra por tarefa sobre a janela do projeto, com a linha de "hoje" e a da entrega prevista. Rola na horizontal no celular.
/**
 * Cronograma: cada tarefa é uma barra do início estimado até o prazo,
 * sobre a janela do projeto. A linha vertical marca hoje.
 * (Sem data de início na tarefa, a barra estima 1 dia por item de checklist, mínimo 3.)
 *
 * @param projeto projeto (início e entrega definem a janela mínima); omitido na visão geral, em que a janela
 *   cobre todos os projetos das tarefas e cada um ganha a sua linha de entrega.
 * @param tarefas tarefas já filtradas pela tela.
 * @param onAbrir abre o detalhe da tarefa pelo id.
 * @param mostrarProjeto true na visão geral: o nome do projeto aparece ao lado do título da tarefa.
 * @returns linha do tempo com uma barra por tarefa, ou estado vazio.
 * @example
 * Tarefa com prazo 20/05 e 5 itens de checklist: barra de 15/05 a 20/05.
 */
export function VistaCronograma({ projeto, tarefas, onAbrir, mostrarProjeto = false }: { projeto?: Projeto; tarefas: Tarefa[]; onAbrir: (id: string) => void; mostrarProjeto?: boolean }) {
  const d = useDados();
  const hoje = hojeISO();
  // Estado vazio: sem tarefas não há o que desenhar (checado antes de calcular a janela, que precisa de ao menos uma data).
  if (!tarefas.length) return <EstadoVazio icone={<ListTodo className="h-6 w-6" />} titulo="Nada no cronograma" descricao="Crie tarefas com prazo para vê-las na linha do tempo." />;
  // Projetos que entram na janela: o recebido ou, na visão geral, os das tarefas (sem repetir).
  const projetos = projeto ? [projeto] : ([...new Set(tarefas.map((t) => t.projetoId))].map((id) => d.projeto(id)).filter(Boolean) as Projeto[]);
  /** Projeto da tarefa: o da própria tarefa (visão geral) ou o recebido por prop. */
  const projDe = (t: Tarefa) => d.projeto(t.projetoId) ?? projeto;
  // Tarefas em ordem de prazo: as que vencem antes ficam no topo.
  const itens = [...tarefas].sort((a, b) => a.prazo.localeCompare(b.prazo));
  // [PV-6] A JANELA DO CRONOGRAMA: começa no menor entre o início do projeto e o início estimado das tarefas e termina no maior entre a entrega e os prazos.
  /*
   * Janela do gráfico: começa no MENOR entre o início do projeto e o início
   * estimado de cada tarefa; termina no MAIOR entre a entrega e os prazos.
   * Datas ISO ordenam certo como texto, por isso sort() basta.
   */
  const inicio = [...projetos.map((p) => p.inicio), ...itens.map((t) => somaDias(t.prazo, -Math.max(3, t.checklist.length)))].sort()[0];
  const fim = [...projetos.map((p) => p.entrega), ...itens.map((t) => t.prazo)].sort().at(-1)!;
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
                  <span className="absolute -top-0.5 left-1 rounded bg-erro px-1 text-[10px] font-bold text-sobre-estado">hoje</span>
                </span>
              )}
              {/* [PV-7] A LINHA DE ENTREGA: roxa na ficha de um projeto; na visão geral cada projeto ganha a sua, na cor dele, com uma etiqueta "Entrega" + nome (cor nunca sozinha). */}
              {projetos.map((p) => mostrarProjeto ? (
                <span key={p.id} className={cx(CLASSE_COR_PROJETO, 'absolute inset-y-0 w-0.5 bg-(--cor-vis)')} style={{ left: `${x(p.entrega)}%`, ...estiloProjeto(p.cor) }} title={`Entrega prevista de ${p.nome}`}>
                  {/* Etiqueta à esquerda da linha, no pé do gráfico; texto escuro sobre a cor clareada no tema escuro (como o "hoje"). */}
                  <span className="absolute bottom-0.5 right-1 max-w-[9rem] truncate whitespace-nowrap rounded bg-(--cor-vis) px-1 text-[10px] font-bold text-sobre-estado">Entrega · {p.nome}</span>
                </span>
              ) : (
                <span key={p.id} className="absolute inset-y-0 w-0.5 bg-primaria/60" style={{ left: `${x(p.entrega)}%` }} title="Entrega prevista" />
              ))}
            </div>
            <ul>
              {itens.map((t) => {
                // [PV-8] O INÍCIO ESTIMADO DA BARRA (SIMULADO): a tarefa não tem data de início, então conta 1 dia por item do checklist, no mínimo 3, antes do prazo.
                // SIMULADO: tarefa não tem data de início; estima 1 dia por item
                // do checklist (mínimo 3) antes do prazo.
                const ini = somaDias(t.prazo, -Math.max(3, t.checklist.length));
                const resp = d.pessoa(t.responsavelId);
                const proj = projDe(t);
                const cor = proj ? corColuna(proj, t.colunaId) : COR_GRAFICO.aFazer;
                // Fração do checklist concluída (0 a 1), para pintar dentro da barra.
                const pct = t.checklist.length ? t.checklist.filter((c) => c.feito).length / t.checklist.length : 0;
                return (
                  <li key={t.id} className="flex h-11 items-center border-b border-borda/60 last:border-0">
                    <button onClick={() => onAbrir(t.id)} className="flex w-[220px] shrink-0 items-center gap-2 pr-3 text-left hover:text-primaria">
                      {resp && <Avatar nome={resp.nome} tamanho={22} />}
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-tinta">{t.titulo}</span>
                        {/* Na visão geral: bolinha do projeto + nome escrito abaixo do título (a barra continua na cor do STATUS). */}
                        {mostrarProjeto && proj && <span className="flex items-center gap-1.5 text-[11px] text-tinta-suave"><MarcadorProjeto cor={proj.cor} className="h-2 w-2" /><span className="min-w-0 truncate">{proj.nome}</span></span>}
                      </span>
                    </button>
                    <div className="relative h-full flex-1">
                      <button onClick={() => onAbrir(t.id)} title={`${t.titulo}: até ${dataBR(t.prazo)}`}
                        className="absolute top-1/2 h-6 -translate-y-1/2 overflow-hidden rounded-md text-left shadow-sm transition-transform hover:scale-y-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
                        /*
                         * left = início estimado; width vai até o fim do dia do prazo
                         * (prazo + 1). Mínimo de 1,5% para barra curta continuar clicável.
                         * Fundo = cor do status a 20% (color-mix, porque a cor é var(--...) e não hex).
                         */
                        style={{ left: `${x(ini)}%`, width: `${Math.max(1.5, x(somaDias(t.prazo, 1)) - x(ini))}%`, background: `color-mix(in srgb, ${cor} 20%, transparent)`, border: `1px solid ${cor}` }}>
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
      <p className="mt-3 text-[12px] text-tinta-suave">A barra vai do início estimado ao prazo; o preenchimento mostra o checklist concluído. {mostrarProjeto ? 'A cor da barra é a do status; a bolinha ao lado do título e a linha vertical de entrega usam a cor de cada projeto.' : 'A linha roxa marca a entrega prevista do projeto.'}</p>
    </div>
  );
}
