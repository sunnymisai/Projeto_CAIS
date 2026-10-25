/* ============================================================================
   VISAOTAREFAS.TSX
   O que é: a visão geral das tarefas em /projetos?visao=tarefas: quadro, lista e cronograma com as tarefas
   de VÁRIOS projetos juntas, com filtro por projeto (um, vários ou todos), colaborador, prioridade e
   etiqueta, ordenação do quadro e um resumo (total, em aberto, concluídas e atrasadas). Uma legenda de projetos
   (cor + nome + contagem) diferencia os projetos e funciona como filtro.
   Onde é usado: app/(sistema)/projetos/page.tsx (alternativa à grade de projetos).
   Depende de: next/navigation (useSearchParams, useRouter), lib/store (useDados), lib/auth, lib/escopo
   (projetosVisiveis, empresasVisiveis, tarefasVisiveis), lib/tarefas, lib/metricas (rótulos de prioridade),
   ./QuadroGeral, ./Vistas, ./DetalheTarefa, ./ControlesTarefas, ./LegendaProjetos e components/ui/.
   Contexto: §5 (quadro, lista e cronograma) e pedido de 14/10/2026 (visão geral das tarefas para a empresa).
   ============================================================================ */
"use client";

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, FolderKanban, GanttChart, LayoutGrid, List } from 'lucide-react';
import { useDados } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { empresasVisiveis, projetosVisiveis, tarefasVisiveis } from '@/lib/escopo';
import { ROTULO_PRIORIDADE } from '@/lib/metricas';
import { colunaDaTarefa, colunasUnificadas, contarPorProjeto, ehCriterioOrdem, filtrarTarefas, type CriterioOrdem, type Direcao } from '@/lib/tarefas';
import { cx, hojeISO } from '@/lib/utils';
import Button from '@/components/button';
import Menu, { ItemMenu } from '@/components/ui/Menu';
import { Select } from '@/components/ui/form';
import { EstadoVazio, Esqueleto, Etiqueta } from '@/components/ui/basicos';
import QuadroGeral from './QuadroGeral';
import DetalheTarefa from './DetalheTarefa';
import { VistaLista, VistaCronograma } from './Vistas';
import { ControleOrdem, FaixaColaboradores } from './ControlesTarefas';
import LegendaProjetos from './LegendaProjetos';

/** As três formas de ver as tarefas (§5), como em /projetos/[id]. */
type Vista = 'quadro' | 'lista' | 'cronograma';

// [PV-1] OS PARÂMETROS DA URL da visão geral: vista, projeto (ids separados por vírgula), empresa, resp, prior, etiq, ordem, dir e tarefa. Tudo vai na URL (replace, sem encher o histórico) para o link poder ser compartilhado; valor inválido é ignorado.
/**
 * Visão geral das tarefas. Client Component.
 * O estado todo mora na URL (useSearchParams): recarregar ou compartilhar o link mantém vista, filtros e ordem.
 * Estados (§13): carregando (esqueleto), vazio (sem projetos ou tarefas) e com dados.
 *
 * @returns a barra de vistas e filtros, o resumo e a vista escolhida.
 */
export default function VisaoTarefas() {
  const d = useDados();
  const { sessao } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const visiveis = useMemo(() => (sessao && d.pronto ? projetosVisiveis(sessao, d) : []), [sessao, d]);
  const empresas = useMemo(() => (sessao && d.pronto ? empresasVisiveis(sessao, d) : []), [sessao, d]);
  const doEscopo = useMemo(() => (sessao && d.pronto ? tarefasVisiveis(sessao, d) : []), [sessao, d]);

  // Lê a URL, descartando o que não existe no escopo da pessoa (link antigo ou adulterado).
  const vistaUrl = params.get('vista');
  const vista: Vista = vistaUrl === 'lista' || vistaUrl === 'cronograma' ? vistaUrl : 'quadro';
  const empresaId = empresas.some((e) => e.id === params.get('empresa')) ? params.get('empresa')! : '';
  // Projetos que o filtro de empresa deixa escolher.
  const opcoesProjeto = visiveis.filter((p) => !empresaId || p.empresaId === empresaId);
  const projetoParam = params.get('projeto') ?? '';
  const projetoIds = projetoParam.split(',').filter((id) => opcoesProjeto.some((p) => p.id === id));
  const resp = params.get('resp') ?? '';
  const prior = params.get('prior') ?? '';
  const etiq = params.get('etiq') ?? '';
  const ordem: CriterioOrdem = ehCriterioOrdem(params.get('ordem')) ? (params.get('ordem') as CriterioOrdem) : 'manual';
  const direcao: Direcao = params.get('dir') === 'desc' ? 'desc' : 'asc';
  const tarefaAberta = params.get('tarefa');

  // Projetos que formam o quadro: os escolhidos ou, sem escolha, todos os que o filtro de empresa deixa.
  const projetos = useMemo(() => (projetoIds.length ? opcoesProjeto.filter((p) => projetoIds.includes(p.id)) : opcoesProjeto),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visiveis, empresaId, projetoParam]);
  const idsDosProjetos = useMemo(() => projetos.map((p) => p.id), [projetos]);
  // Tarefas dos projetos escolhidos, ainda sem os filtros de pessoa, prioridade e etiqueta (para montar as opções deles).
  const dosProjetos = useMemo(() => filtrarTarefas(doEscopo, { projetoIds: idsDosProjetos }), [doEscopo, idsDosProjetos]);
  // [PV-2] AS OPÇÕES DOS FILTROS saem das tarefas que existem nos projetos escolhidos: só aparece colaborador e etiqueta que tem tarefa.
  const colaboradores = useMemo(() => [...new Set(dosProjetos.map((t) => t.responsavelId))].map((id) => d.pessoa(id)).filter(Boolean).map((p) => ({ id: p!.id, nome: p!.nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), [dosProjetos, d]);
  const etiquetas = useMemo(() => [...new Set(dosProjetos.flatMap((t) => t.etiquetas))].sort(), [dosProjetos]);
  const filtradas = useMemo(() => filtrarTarefas(dosProjetos, { responsavelId: resp, prioridade: prior, etiqueta: etiq }), [dosProjetos, resp, prior, etiq]);

  // Contagem da legenda: tarefas de cada projeto já com colaborador, prioridade e etiqueta aplicados, mas SEM o filtro de projeto (senão só o projeto escolhido teria número).
  const contagens = useMemo(() => contarPorProjeto(opcoesProjeto, filtrarTarefas(doEscopo, { responsavelId: resp, prioridade: prior, etiqueta: etiq })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doEscopo, visiveis, empresaId, resp, prior, etiq]);

  // Resumo do que está sendo feito e do que está pendente (sobre as tarefas à vista).
  const resumo = useMemo(() => {
    const colunas = colunasUnificadas(projetos);
    const hoje = hojeISO();
    let concluidas = 0, atrasadas = 0;
    for (const t of filtradas) {
      const pronta = !!colunaDaTarefa(colunas, t)?.concluida;
      if (pronta) concluidas++;
      else if (t.prazo < hoje) atrasadas++;
    }
    return { total: filtradas.length, concluidas, abertas: filtradas.length - concluidas, atrasadas };
  }, [filtradas, projetos]);

  /**
   * Muda parâmetros da URL (vista, filtros, ordem, tarefa) sem encher o histórico.
   * GRAVA: a URL (replace). NAVEGA: fica em /projetos, só troca a query.
   * @param patch parâmetros a trocar; valor '' ou null apaga o parâmetro.
   * @example definir({ resp: 'pes_ana' })
   */
  const definir = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    q.set('visao', 'tarefas');
    for (const [k, v] of Object.entries(patch)) { if (v) q.set(k, v); else q.delete(k); }
    router.replace(`/projetos?${q.toString()}`, { scroll: false });
  };

  /** Liga ou desliga um projeto no filtro de projetos. */
  const alternarProjeto = (id: string) => definir({ projeto: (projetoIds.includes(id) ? projetoIds.filter((x) => x !== id) : [...projetoIds, id]).join(',') || null });
  const temFiltro = !!(projetoIds.length || empresaId || resp || prior || etiq);

  if (!d.pronto || !sessao) {
    return <div className="space-y-3"><Esqueleto className="h-10 w-full max-w-xl rounded-xl" /><Esqueleto className="h-[420px] w-full rounded-2xl" /></div>;
  }
  if (visiveis.length === 0) {
    return <div className="rounded-2xl border border-borda bg-superficie"><EstadoVazio icone={<FolderKanban className="h-6 w-6" />} titulo="Nenhum projeto ainda" descricao="Quando houver um projeto para você, as tarefas dele aparecem aqui." /></div>;
  }

  const abrir = (id: string) => definir({ tarefa: id });
  const rotuloProjetos = projetoIds.length === 0 ? 'Todos os projetos' : projetoIds.length === 1 ? opcoesProjeto.find((p) => p.id === projetoIds[0])?.nome ?? '1 projeto' : `${projetoIds.length} projetos`;

  return (
    <div>
      {/* Resumo: o que está feito e o que está pendente. Cor sempre com texto (cor nunca sozinha). */}
      <p className="sr-only" role="status">{resumo.total} tarefas: {resumo.abertas} em aberto, {resumo.concluidas} concluídas, {resumo.atrasadas} atrasadas.</p>
      <ul className="mb-4 flex flex-wrap items-center gap-2" aria-label="Resumo das tarefas">
        <li><Etiqueta tom="neutro">{resumo.total} tarefa{resumo.total !== 1 ? 's' : ''}</Etiqueta></li>
        <li><Etiqueta tom="primaria" ponto>{resumo.abertas} em aberto</Etiqueta></li>
        <li><Etiqueta tom="sucesso" ponto>{resumo.concluidas} concluída{resumo.concluidas !== 1 ? 's' : ''}</Etiqueta></li>
        <li><Etiqueta tom={resumo.atrasadas ? 'erro' : 'neutro'} ponto>{resumo.atrasadas} atrasada{resumo.atrasadas !== 1 ? 's' : ''}</Etiqueta></li>
      </ul>

      {/* Barra de vistas e filtros, sempre acima do conteúdo (§10). */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Vista das tarefas" className="inline-flex rounded-xl border border-borda bg-superficie-alt p-1">
          {([['quadro', 'Quadro', LayoutGrid], ['lista', 'Lista', List], ['cronograma', 'Cronograma', GanttChart]] as const).map(([v, r, I]) => (
            <button key={v} role="radio" aria-checked={vista === v} onClick={() => definir({ vista: v === 'quadro' ? null : v })}
              className={cx('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50',
                vista === v ? 'bg-botao text-sobre-cor shadow-sm' : 'text-tinta-suave hover:text-tinta')}>
              <I className="h-4 w-4" aria-hidden />{r}
            </button>
          ))}
        </div>

        {/* Só o administrador enxerga mais de uma empresa; para os outros o seletor nem aparece. */}
        {empresas.length > 1 && (
          <div className="w-44"><Select aria-label="Filtrar por empresa" value={empresaId} onChange={(e) => definir({ empresa: e.target.value || null, projeto: null })} placeholder="Todas as empresas" opcoes={empresas.map((e) => ({ valor: e.id, rotulo: e.nomeFantasia }))} /></div>
        )}

        {/* Projetos: um, vários ou todos. O menu fica aberto ao marcar, para escolher mais de um. */}
        <Menu alinhar="esquerda" largura="w-72" gatilho={(p) => (
          <Button variante="secundario" onClick={p.alternar} aria-expanded={p['aria-expanded']} aria-haspopup="menu" aria-label={`Filtrar por projeto: ${rotuloProjetos}`}>
            <FolderKanban className="h-4 w-4" aria-hidden /><span className="max-w-[10rem] truncate">{rotuloProjetos}</span>
          </Button>
        )}>
          {() => (<>
            <ItemMenu onClick={() => definir({ projeto: null })} icone={projetoIds.length === 0 ? <Check /> : <span />}>Todos os projetos</ItemMenu>
            {opcoesProjeto.map((p) => <ItemMenu key={p.id} onClick={() => alternarProjeto(p.id)} icone={projetoIds.includes(p.id) ? <Check /> : <span />}>{p.nome}</ItemMenu>)}
          </>)}
        </Menu>

        <div className="w-44"><Select aria-label="Filtrar por colaborador" value={resp} onChange={(e) => definir({ resp: e.target.value || null })} placeholder="Colaborador" opcoes={colaboradores.map((p) => ({ valor: p.id, rotulo: p.nome }))} /></div>
        <div className="w-36"><Select aria-label="Filtrar por prioridade" value={prior} onChange={(e) => definir({ prior: e.target.value || null })} placeholder="Prioridade" opcoes={Object.entries(ROTULO_PRIORIDADE).map(([valor, rotulo]) => ({ valor, rotulo }))} /></div>
        <div className="w-36"><Select aria-label="Filtrar por etiqueta" value={etiq} onChange={(e) => definir({ etiq: e.target.value || null })} placeholder="Etiqueta" opcoes={etiquetas.map((e) => ({ valor: e, rotulo: e }))} /></div>
        {vista === 'quadro' && <ControleOrdem criterio={ordem} direcao={direcao} onChange={(c, dir) => definir({ ordem: c === 'manual' ? null : c, dir: c === 'manual' || dir === 'asc' ? null : dir })} />}
        {temFiltro && <Button variante="fantasma" tamanho="sm" onClick={() => definir({ projeto: null, empresa: null, resp: null, prior: null, etiq: null })}>Limpar · {filtradas.length} de {doEscopo.length}</Button>}
      </div>
      {/* [PV-3] A LEGENDA DOS PROJETOS: só aparece com 2 ou mais projetos para escolher (com um só não há o que diferenciar). Os chips usam a cor do projeto (projeto.cor) e ligam o mesmo filtro ?projeto= do menu "Projetos". */}
      {opcoesProjeto.length > 1 && <div className="mb-3"><LegendaProjetos projetos={opcoesProjeto} contagens={contagens} selecionados={projetoIds} onAlternar={alternarProjeto} /></div>}
      <div className="mb-4"><FaixaColaboradores pessoas={colaboradores} valor={resp} onChange={(id) => definir({ resp: id || null })} /></div>

      {/* As três vistas recebem só as tarefas filtradas. Clicar numa tarefa GRAVA ?tarefa= na URL e o detalhe abre por cima. */}
      {vista === 'quadro' && <div className="h-[72vh] min-h-[520px]"><QuadroGeral projetos={projetos} tarefas={filtradas} onAbrir={abrir} ordem={ordem} direcao={direcao} /></div>}
      {vista === 'lista' && <VistaLista tarefas={filtradas} onAbrir={abrir} mostrarProjeto />}
      {vista === 'cronograma' && <VistaCronograma tarefas={filtradas} onAbrir={abrir} mostrarProjeto />}

      {/* ESCOPO: a tarefa do ?tarefa= precisa estar no escopo da pessoa (um link com tarefa de outro projeto não abre nada). */}
      {tarefaAberta && doEscopo.some((t) => t.id === tarefaAberta) && <DetalheTarefa tarefaId={tarefaAberta} onFechar={() => definir({ tarefa: null })} />}
    </div>
  );
}
