/* ============================================================================
   APP/(SISTEMA)/PROJETOS/[ID]/PAGE.TSX (FICHA DO PROJETO)
   O que é: a ficha de um projeto com quatro abas (Visão geral, Equipe,
     Tarefas e Arquivos), as vistas quadro/lista/cronograma e o detalhe da tarefa. A Visão
     geral tem o card "Próximas entregas" (prazo nos próximos 14 dias).
     Projeto fora do escopo do perfil (inclusive digitado na URL) manda para
     /sem-permissao; os botões que o perfil não pode usar são escondidos.
   Onde é usado: rota /projetos/[id] (ex.: /projetos/p1?aba=equipe&tarefa=t3).
     Chegam aqui: os cartões de app/(sistema)/projetos/page.tsx; o painel
     (app/(sistema)/painel/page.tsx, com ?tarefa= nos próximos prazos); a busca
     e os avisos de atraso do topo (components/shell/Topbar.tsx, com ?tarefa=);
     e o FormProjeto ao criar um projeto (com ?aba=equipe).
   Depende de: next/navigation (useParams, useSearchParams, useRouter),
     lib/store.tsx (useDados), lib/auth.tsx (useAuth), lib/escopo.ts
     (podeVerProjeto), lib/permissoes.ts (podeFazer), lib/toast.tsx (useToast), lib/metricas.ts,
     lib/utils.ts e components/projetos/ (Quadro, DetalheTarefa, Vistas,
     Equipe, ArquivosDoProjeto, FormProjeto), além de components/ui/.
   Contexto: §5 (Projetos: quatro níveis, três vistas, tarefa com responsável
     e prazo, detalhe abre por cima do quadro), §12 fluxos 3 e 4, §13 e
     docs/notas-next16.md §2 (params e searchParams).
   ============================================================================ */

// "use client": usa estado, useParams/useSearchParams e useDados.
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Plus, UserPlus, Pencil, Trash2, LayoutGrid, List, GanttChart, FolderX } from 'lucide-react';
import { useDados, Projeto } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { useAuth } from '@/lib/auth';
import { podeVerProjeto } from '@/lib/escopo';
import { podeFazer } from '@/lib/permissoes';
import { progressoProjeto, proximasEntregas, DIAS_PROXIMAS_ENTREGAS, ROTULO_STATUS_PROJETO, TOM_STATUS_PROJETO, ROTULO_PRIORIDADE } from '@/lib/metricas';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import Button from '@/components/button';
import Input from '@/components/input';
import { Select } from '@/components/ui/form';
import { Abas, Card, CardTitulo, Etiqueta, Esqueleto, EstadoVazio, Progresso, Avatar, Aviso } from '@/components/ui/basicos';
import { Colunas, COR_GRAFICO, TONS_COLUNA } from '@/components/ui/Graficos';
import Modal from '@/components/ui/Modal';
import Quadro from '@/components/projetos/Quadro';
import DetalheTarefa from '@/components/projetos/DetalheTarefa';
import { VistaLista, VistaCronograma } from '@/components/projetos/Vistas';
import Equipe from '@/components/projetos/Equipe';
import ArquivosDoProjeto from '@/components/projetos/ArquivosDoProjeto';
import FormProjeto from '@/components/projetos/FormProjeto';
import { cx, dataBR, dataCurta, diasEntre, hojeISO, novoId, somaDias } from '@/lib/utils';
import Link from 'next/link';

// [PV-1] AS ABAS DA FICHA (Visão geral, Equipe, Tarefas, Arquivos): o valor vai na URL como ?aba=. Aba nova entra aqui, nas abas do cabeçalho e no bloco que a mostra.
/** As três abas da ficha; o valor vai na URL como ?aba=. */
type Aba = 'geral' | 'equipe' | 'tarefas' | 'arquivos';
// [PV-2] AS VISTAS DAS TAREFAS: quadro, lista e cronograma. Ficam só no estado: recarregar a página volta ao quadro.
/** As três formas de ver as tarefas (§5): quadro (kanban), lista e cronograma. */
type Vista = 'quadro' | 'lista' | 'cronograma';

/**
 * Página da rota /projetos/[id].
 * Só embrulha a ficha num <Suspense>.
 * ⚠️ ATENÇÃO: a FichaProjeto usa useSearchParams; sem este <Suspense>, o
 * `npm run build` falha com "useSearchParams() should be wrapped in a
 * suspense boundary" (notas-next16 §2).
 *
 * @returns a ficha do projeto.
 */
export default function PaginaProjeto() {
  return <Suspense><FichaProjeto /></Suspense>;
}

/**
 * Ficha do projeto: cabeçalho, abas e o conteúdo da aba ativa.
 *
 * Parâmetros lidos da URL:
 * - [id] (pedaço do caminho) → qual projeto mostrar.
 * - ?aba= → qual aba está aberta: "geral", "equipe", "arquivos" ou "tarefas" (padrão).
 * - ?tarefa= → id da tarefa cujo detalhe está aberto por cima do quadro.
 * Guardar aba e tarefa na URL (e não só em useState) permite copiar o link,
 * recarregar a página ou voltar pelo navegador sem perder onde estava, e
 * deixa outras telas abrirem a ficha já numa aba ou tarefa.
 *
 * @returns a ficha, ou o esqueleto (carregando), ou "não encontrado".
 *
 * @example
 * // Abre o projeto p1 na aba Equipe:
 * //   /projetos/p1?aba=equipe
 * // Abre o projeto p1 nas Tarefas, com o detalhe da tarefa t3 por cima:
 * //   /projetos/p1?tarefa=t3
 */
function FichaProjeto() {
  // Num Client Component não dá para usar `await params` (isso é só em
  // Server Component). Aqui se usa o hook useParams, que já devolve o valor
  // pronto: { id: 'p1' } para /projetos/p1 (notas-next16 §2).
  const { id } = useParams<{ id: string }>();
  // useSearchParams lê a parte "?aba=...&tarefa=..." da URL. É só leitura:
  // para mudar, usa-se router.replace (ver navegar, abaixo).
  const params = useSearchParams();
  const router = useRouter();
  const d = useDados();
  const { sessao } = useAuth();

  // [PV-3] A ABA PADRÃO: sem ?aba= na URL a ficha abre em Tarefas, a mais usada no dia a dia.
  // Sem ?aba= na URL, abre na aba Tarefas (a mais usada no dia a dia).
  const aba = (params.get('aba') as Aba) || 'tarefas';
  // null quando não há ?tarefa= (nenhum detalhe aberto).
  const tarefaAberta = params.get('tarefa');
  // A vista (quadro/lista/cronograma) fica só no estado: não vai para a URL,
  // então recarregar a página volta para o quadro.
  const [vista, setVista] = useState<Vista>('quadro');
  // Controlam os modais: alocar pessoa, editar projeto e nova tarefa.
  const [alocando, setAlocando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [novaTarefa, setNovaTarefa] = useState(false);
  // Filtros das tarefas: responsável, prioridade e etiqueta ('' = todos).
  const [fResp, setFResp] = useState('');
  const [fPrior, setFPrior] = useState('');
  const [fEtiq, setFEtiq] = useState('');

  // [PV-4] A URL COMO ESTADO: aba e tarefa aberta vão em ?aba= e ?tarefa= (replace, sem encher o histórico). Outras telas abrem a ficha já numa aba ou tarefa por esses parâmetros.
  /**
   * Troca a aba e/ou abre/fecha o detalhe de uma tarefa mexendo na URL.
   * - `aba`: troca o ?aba=.
   * - `tarefa: 'id'`: abre o detalhe (?tarefa=id).
   * - `tarefa: null`: fecha o detalhe (remove ?tarefa=).
   * - `tarefa` ausente: não mexe no detalhe.
   *
   * @example navegar({ aba: 'equipe' })   // → ?aba=equipe
   * @example navegar({ tarefa: null })    // fecha o detalhe
   */
  const navegar = useCallback((p: { aba?: Aba; tarefa?: string | null }) => {
    // Começa de uma cópia dos parâmetros atuais para não perder os outros
    // (ex.: trocar a aba mantém o ?tarefa= que já estava lá).
    const q = new URLSearchParams(params.toString());
    if (p.aba) q.set('aba', p.aba);
    // null = "fechar" (apaga o parâmetro); texto = "abrir esta tarefa";
    // undefined = não mexe.
    if (p.tarefa === null) q.delete('tarefa'); else if (p.tarefa) q.set('tarefa', p.tarefa);
    // GRAVA: os novos parâmetros na URL. NAVEGA: na mesma página.
    // replace (e não push): abrir/fechar abas e tarefas não enche o
    // histórico do botão "voltar". scroll: false: não pula para o topo.
    router.replace(`/projetos/${id}?${q.toString()}`, { scroll: false });
  }, [params, router, id]);

  // undefined se o id da URL não existe (projeto excluído ou link errado).
  const projeto = d.projeto(id);
  // [PV-5] O ESCOPO DA FICHA: projeto que a pessoa não pode ver leva a /sem-permissao. Conveniência de tela; a segurança real é do back-end.
  // ESCOPO: o projeto existe, mas a sessão não pode vê-lo (ex.: Marcos digitou o id de um projeto da Aurora).
  // Só decide depois que os dados carregaram; antes disso não dá para saber.
  // Conveniência de interface: a segurança real é do back-end (§7, TODO(API)).
  const foraDoEscopo = d.pronto && !!sessao && !!projeto && !podeVerProjeto(sessao, id, d);
  // Roda quando `foraDoEscopo` muda; não há o que limpar.
  // NAVEGA: replace (não push) para o botão "voltar" não cair de novo no projeto proibido.
  useEffect(() => {
    if (foraDoEscopo) router.replace('/sem-permissao');
  }, [foraDoEscopo, router]);
  // [PV-6] AS PERMISSÕES DOS BOTÕES DA FICHA: criar tarefa, alocar (administrador, ou a empresa nos projetos dela) e editar projeto. Cada um fica escondido, não desabilitado, para quem não pode.
  // Permissões de botões da ficha. Esconder (e não desabilitar) é melhor aqui: o botão nunca
  // terá uso para esse perfil, então desabilitado só geraria dúvida e seria anunciado como
  // "indisponível" pelo leitor de tela.
  const podeCriarTarefa = !!sessao && podeFazer(sessao.perfil, 'criar_tarefa');
  // Alocar: o admin em qualquer projeto e a empresa nos DELA (esta página só abre para quem enxerga o projeto,
  // então enxergaProjeto é verdadeiro aqui; quem está fora do escopo já foi mandado para /sem-permissao).
  const podeAlocar = !!sessao && podeFazer(sessao.perfil, 'alocar', { enxergaProjeto: true });
  const podeEditarProjeto = !!sessao && podeFazer(sessao.perfil, 'editar_projeto');
  // Todas as tarefas deste projeto; useMemo evita refiltrar a cada render.
  const tarefas = useMemo(() => d.tarefas.filter((t) => t.projetoId === id), [d.tarefas, id]);
  // [PV-7] OS FILTROS DAS TAREFAS: responsável, prioridade e etiqueta, aplicados juntos.
  // Tarefas que passam nos três filtros ao mesmo tempo (filtro vazio = passa).
  const filtradas = tarefas.filter((t) => (!fResp || t.responsavelId === fResp) && (!fPrior || t.prioridade === fPrior) && (!fEtiq || t.etiquetas.includes(fEtiq)));

  // Estado "carregando" (§13): esqueleto no formato do quadro (4 colunas).
  if (!d.pronto) return (
    <div className="flex h-full flex-col p-4 sm:p-6 lg:p-8">
      <Esqueleto className="mb-2 h-4 w-24" /><Esqueleto className="mb-6 h-8 w-72" /><Esqueleto className="mb-4 h-10 w-80" />
      <div className="flex flex-1 gap-3">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-full min-h-80 w-72 rounded-2xl" />)}</div>
    </div>
  );
  // Fora do escopo: não mostra nada do projeto enquanto o redirecionamento acima acontece.
  if (foraDoEscopo) return <div className="p-8" role="status"><span className="sr-only">Verificando acesso…</span></div>;
  // Estado de erro (§13): o id da URL não corresponde a nenhum projeto.
  // Explica o que houve e oferece a saída (NAVEGA: para /projetos).
  if (!projeto) return (
    <div className="p-8"><EstadoVazio icone={<FolderX className="h-6 w-6" />} titulo="Projeto não encontrado" descricao="Ele pode ter sido excluído ou o endereço está errado."
      acao={<Button onClick={() => router.push('/projetos')}>Ver projetos</Button>} /></div>
  );

  const empresa = d.empresa(projeto.empresaId);
  // Quantos arquivos o projeto tem no total (contagem da aba Arquivos).
  const totalAnexos = tarefas.reduce((n, t) => n + (t.anexos?.length ?? 0), 0);
  // Alocações deste projeto (quem trabalha nele, com papel e carga).
  const equipe = d.alocacoes.filter((a) => a.projetoId === projeto.id);
  // Opções dos filtros, montadas a partir das tarefas existentes.
  // new Set remove repetidos; .filter(Boolean) tira pessoas não encontradas.
  const responsaveis = [...new Set(tarefas.map((t) => t.responsavelId))].map((pid) => d.pessoa(pid)!).filter(Boolean);
  const etiquetas = [...new Set(tarefas.flatMap((t) => t.etiquetas))];
  // Algum filtro preenchido? Mostra o botão "Limpar".
  const temFiltro = fResp || fPrior || fEtiq;

  // [PV-8] O BOTÃO PRINCIPAL DO CABEÇALHO muda com a aba: Equipe mostra "Alocar pessoa", Tarefas mostra "Nova tarefa" e a Visão geral mostra "Editar projeto". Cada um só existe para quem pode usar.
  // O botão principal do cabeçalho muda conforme a aba (§10: título e ação
  // principal): Equipe → "Alocar pessoa"; Tarefas → "Nova tarefa";
  // Visão geral → "Editar projeto".
  // Cada botão só existe para quem pode usá-lo (undefined = sem botão no cabeçalho).
  const acao = aba === 'equipe' ? (podeAlocar ? <Button onClick={() => setAlocando(true)}><UserPlus className="h-4 w-4" aria-hidden />Alocar pessoa</Button> : undefined)
    : aba === 'tarefas' ? (podeCriarTarefa ? <Button onClick={() => setNovaTarefa(true)}><Plus className="h-4 w-4" aria-hidden />Nova tarefa</Button> : undefined)
    : (podeEditarProjeto ? <Button variante="secundario" onClick={() => setEditando(true)}><Pencil className="h-4 w-4" aria-hidden />Editar projeto</Button> : undefined);

  return (
    // Só no quadro a página ganha h-full: o quadro ocupa a altura disponível
    // e cada coluna rola por dentro. Nas outras vistas a altura é a do
    // conteúdo e quem rola é a área do layout (§10).
    <div className={cx('mx-auto flex max-w-[1600px] flex-col p-4 sm:p-6 lg:p-8', aba === 'tarefas' && vista === 'quadro' && 'h-full')}>
      <CabecalhoPagina trilha={[{ rotulo: 'Projetos', href: '/projetos' }]}
        titulo={<span className="flex flex-wrap items-center gap-3">{projeto.nome}<Etiqueta tom={TOM_STATUS_PROJETO[projeto.status]} ponto>{ROTULO_STATUS_PROJETO[projeto.status]}</Etiqueta></span>}
        descricao={<>{empresa?.nomeFantasia} · entrega prevista em {dataBR(projeto.entrega)}</>}
        acao={acao} />

      {/* GRAVA na URL: trocar de aba muda o ?aba= (via navegar). */}
      <Abas rotulo="Seções do projeto" ativa={aba} onChange={(a) => navegar({ aba: a })}
        abas={[{ id: 'geral', rotulo: 'Visão geral' }, { id: 'equipe', rotulo: 'Equipe', contagem: equipe.length }, { id: 'tarefas', rotulo: 'Tarefas', contagem: tarefas.length }, { id: 'arquivos', rotulo: 'Arquivos', contagem: totalAnexos }]} />

      {/* role="tabpanel" + aria-labelledby ligam este painel à aba ativa,
        * para leitores de tela. No quadro: flex-1 ocupa o resto da altura e
        * min-h-[560px] impede que fique baixo demais em telas pequenas. */}
      <div className={cx('mt-5', aba === 'tarefas' && vista === 'quadro' && 'flex min-h-[560px] flex-1 flex-col')} role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === 'geral' && <VisaoGeral projeto={projeto} onEditar={() => setEditando(true)} />}

        {aba === 'equipe' && (
          <>
            {/* Projeto recém-criado (Planejado e sem ninguém): mostra o próximo
              * passo, já que ele nasce nesta aba (§5). */}
            {podeAlocar && projeto.status === 'planejado' && equipe.length === 0 && (
              <div className="mb-4"><Aviso tipo="info" titulo="Próximo passo: montar a equipe">Aloque as pessoas com papel, período e carga. Depois, crie as tarefas no quadro.</Aviso></div>
            )}
            <Equipe projeto={projeto} alocando={alocando} setAlocando={setAlocando} />
          </>
        )}

        {/* Aba Arquivos (G03): todos os anexos das tarefas do projeto, com filtro por tipo. SIMULADO: só metadados. */}
        {aba === 'arquivos' && <ArquivosDoProjeto projetoId={projeto.id} />}

        {aba === 'tarefas' && (
          <>
            {/* Barra de vistas e filtros (sempre acima do conteúdo, §10).
              * shrink-0: não encolhe quando o quadro abaixo ocupa a altura. */}
            <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
              {/* Seletor de vista feito com role="radiogroup"/"radio": para
                * leitores de tela é uma escolha única entre três opções. */}
              <div role="radiogroup" aria-label="Vista das tarefas" className="inline-flex rounded-xl border border-borda bg-superficie-alt p-1">
                {([['quadro', 'Quadro', LayoutGrid], ['lista', 'Lista', List], ['cronograma', 'Cronograma', GanttChart]] as const).map(([v, r, I]) => (
                  <button key={v} role="radio" aria-checked={vista === v} onClick={() => setVista(v)}
                    className={cx('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50',
                      vista === v ? 'bg-botao text-white shadow-sm' : 'text-tinta-suave hover:text-tinta')}>
                    <I className="h-4 w-4" aria-hidden />{r}
                  </button>
                ))}
              </div>
              <div className="w-44"><Select aria-label="Filtrar por responsável" value={fResp} onChange={(e) => setFResp(e.target.value)} placeholder="Responsável" opcoes={responsaveis.map((p) => ({ valor: p.id, rotulo: p.nome }))} /></div>
              <div className="w-36"><Select aria-label="Filtrar por prioridade" value={fPrior} onChange={(e) => setFPrior(e.target.value)} placeholder="Prioridade" opcoes={Object.entries(ROTULO_PRIORIDADE).map(([valor, rotulo]) => ({ valor, rotulo }))} /></div>
              <div className="w-36"><Select aria-label="Filtrar por etiqueta" value={fEtiq} onChange={(e) => setFEtiq(e.target.value)} placeholder="Etiqueta" opcoes={etiquetas.map((e) => ({ valor: e, rotulo: e }))} /></div>
              {/* "Limpar" zera os três filtros e mostra quantas tarefas
                * aparecem do total ("Limpar · 3 de 12"). */}
              {temFiltro && <Button variante="fantasma" tamanho="sm" onClick={() => { setFResp(''); setFPrior(''); setFEtiq(''); }}>Limpar · {filtradas.length} de {tarefas.length}</Button>}
            </div>

            {/* As três vistas recebem só as tarefas filtradas. Clicar numa
              * tarefa chama navegar({ tarefa }) → GRAVA ?tarefa= na URL e o
              * detalhe abre por cima, sem trocar de página (§5).
              * min-h-0: deixa o quadro encolher dentro do flex e rolar por
              * dentro, em vez de esticar a página. */}
            {vista === 'quadro' && <div className="min-h-0 flex-1"><Quadro projeto={projeto} tarefas={filtradas} onAbrir={(t) => navegar({ tarefa: t })} /></div>}
            {vista === 'lista' && <VistaLista projeto={projeto} tarefas={filtradas} onAbrir={(t) => navegar({ tarefa: t })} />}
            {vista === 'cronograma' && <VistaCronograma projeto={projeto} tarefas={filtradas} onAbrir={(t) => navegar({ tarefa: t })} />}
          </>
        )}
      </div>

      {/* Detalhe da tarefa: abre quando há ?tarefa= na URL E a tarefa existe
        * (link antigo de tarefa excluída não abre nada). Fechar chama
        * navegar({ tarefa: null }), que remove o ?tarefa= da URL. */}
      {/* ESCOPO: a tarefa do ?tarefa= precisa ser DESTE projeto (já está no escopo); senão um link
        * com ?tarefa= de outro projeto abriria uma tarefa que a pessoa não pode ver. */}
      {tarefaAberta && tarefas.some((t) => t.id === tarefaAberta) && <DetalheTarefa tarefaId={tarefaAberta} onFechar={() => navegar({ tarefa: null })} />}
      {podeEditarProjeto && editando && <FormProjeto projeto={projeto} onFechar={() => setEditando(false)} />}
      {/* Ao criar, a tarefa nova já abre no detalhe (onCriada → ?tarefa=id). */}
      {podeCriarTarefa && novaTarefa && <NovaTarefa projeto={projeto} onFechar={() => setNovaTarefa(false)} onCriada={(t) => navegar({ tarefa: t })} />}
    </div>
  );
}

// [PV-9] A VISÃO GERAL DO PROJETO: escopo, andamento, próximas entregas, tarefas por lista, status, dados e exclusão.
/**
 * Aba "Visão geral": escopo, andamento (tarefas × tempo), dados do projeto,
 * troca de status e exclusão.
 *
 * @param props.projeto o projeto mostrado.
 * @param props.onEditar abre o modal de edição (FormProjeto) na ficha.
 * @returns o conteúdo da aba em duas colunas (uma no celular).
 */
function VisaoGeral({ projeto, onEditar }: { projeto: Projeto; onEditar: () => void }) {
  const d = useDados();
  const { sessao } = useAuth();
  const avisar = useToast();
  const router = useRouter();
  // Trocar status, editar dados e excluir: só quem pode editar projeto (Admin). Os outros veem o status como texto.
  const podeEditar = !!sessao && podeFazer(sessao.perfil, 'editar_projeto');
  // true = modal "Excluir este projeto?" aberto.
  const [excluir, setExcluir] = useState(false);
  // progressoProjeto (lib/metricas.ts): prontas, total, atrasadas e pct.
  const pr = progressoProjeto(projeto.id, d);
  const lider = d.pessoa(projeto.liderId);
  const empresa = d.empresa(projeto.empresaId);
  const hoje = hojeISO();
  // Tarefas que vencem nos próximos 14 dias e ainda não estão prontas (lib/metricas.ts).
  const proximas = proximasEntregas(projeto.id, d, DIAS_PROXIMAS_ENTREGAS, hoje);
  // [PV-10] O TEMPO DECORRIDO do projeto: dias desde o início sobre a duração total, preso entre 0% e 100%.
  // Tempo decorrido em %: dias desde o início ÷ duração total × 100.
  // Math.max(1, ...) evita divisão por zero (início = entrega) e o
  // Math.max(0, Math.min(100, ...)) prende o resultado entre 0% e 100%
  // (antes do início dá 0; depois da entrega, 100).
  const decorrido = Math.max(0, Math.min(100, (diasEntre(projeto.inicio, hoje) / Math.max(1, diasEntre(projeto.inicio, projeto.entrega))) * 100));
  // Tarefas por coluna deste projeto, para o gráfico de colunas.
  // A última coluna é sempre verde (pronto); as outras usam cinza, roxo,
  // âmbar e azul pela posição (Math.min(i, 3) repete o azul se houver mais).
  const porColuna = projeto.colunas.map((c, i) => ({
    rotulo: c.titulo, valor: d.tarefas.filter((t) => t.colunaId === c.id && t.projetoId === projeto.id).length,
    cor: i === projeto.colunas.length - 1 ? COR_GRAFICO.concluida : TONS_COLUNA[Math.min(i, 3)],
  }));

  // Pares [rótulo, valor] da lista de dados da lateral. "—" indica campo
  // não informado.
  const dados: [string, React.ReactNode][] = [
    ['Empresa', empresa?.nomeFantasia],
    ['Contato', projeto.contatoNome || '—'],
    ['Líder', lider ? <span className="flex items-center gap-2"><Avatar nome={lider.nome} tamanho={22} />{lider.nome}</span> : '—'],
    ['Tipo', projeto.tipo || '—'],
    ['Período', `${dataBR(projeto.inicio)} a ${dataBR(projeto.entrega)}`],
    ['Prioridade', ROTULO_PRIORIDADE[projeto.prioridade]],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="mb-2 font-space text-[17px] font-semibold text-tinta">Escopo</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-tinta-suave">{projeto.descricao || 'Sem descrição. Edite o projeto para descrever o que a empresa precisa.'}</p>
        </Card>
        <Card>
          <CardTitulo titulo="Andamento" descricao={`${pr.prontas} de ${pr.total} tarefas prontas${pr.atrasadas ? ` · ${pr.atrasadas} atrasada(s)` : ''}`} />
          <div className="grid gap-6 p-5 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-[13px]"><span className="text-tinta-suave">Tarefas prontas</span><span className="font-semibold tabular-nums text-tinta">{Math.round(pr.pct)}%</span></div>
                <Progresso valor={pr.pct} tom={pr.atrasadas ? 'aviso' : 'primaria'} rotulo="Tarefas prontas" />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[13px]"><span className="text-tinta-suave">Tempo decorrido</span><span className="font-semibold tabular-nums text-tinta">{Math.round(decorrido)}%</span></div>
                <Progresso valor={decorrido} tom="sucesso" rotulo="Tempo decorrido" />
              </div>
              {/* [PV-11] O ALERTA "tempo andando mais rápido que as entregas": aparece quando o tempo passou mais de 10 pontos à frente do que está pronto e o projeto tem tarefas. */}
              {/* Alerta quando o tempo andou mais de 10 pontos à frente das
                * entregas (ex.: 60% do prazo passou e só 40% está pronto).
                * Só aparece se o projeto já tem tarefas. */}
              {pr.pct + 10 < decorrido && pr.total > 0 && <Aviso tipo="aviso">O tempo está andando mais rápido que as entregas.</Aviso>}
            </div>
            <Colunas itens={porColuna} altura={110} />
          </div>
        </Card>
        {/* Próximas entregas (E02): o que vence nos próximos 14 dias e ainda não está pronto.
          * Útil para a empresa saber o que esperar; vale para todos os perfis. Atrasadas ficam no Andamento. */}
        <Card>
          <CardTitulo titulo="Próximas entregas" descricao={`Tarefas com prazo nos próximos ${DIAS_PROXIMAS_ENTREGAS} dias`} />
          <div className="px-5 pb-5">
            {proximas.length === 0 ? (
              // Estado vazio: diz o que significa e não exige ação.
              <p className="rounded-xl border border-dashed border-borda px-4 py-6 text-center text-sm text-tinta-suave">Nenhuma tarefa vence nos próximos {DIAS_PROXIMAS_ENTREGAS} dias.</p>
            ) : (
              <ul className="divide-y divide-borda">
                {proximas.map((t) => {
                  const resp = d.pessoa(t.responsavelId);
                  const faltam = diasEntre(hoje, t.prazo);
                  return (
                    <li key={t.id}>
                      {/* NAVEGA: abre a tarefa por cima do quadro (aba Tarefas). */}
                      <Link href={`/projetos/${projeto.id}?aba=tarefas&tarefa=${t.id}`}
                        className="flex items-center gap-3 rounded-lg px-1 py-2.5 hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-tinta">{t.titulo}</span>
                          <span className="block truncate text-[12px] text-tinta-suave">{resp?.nome ?? 'Sem responsável'}</span>
                        </span>
                        {/* Faltando 3 dias ou menos fica âmbar, sempre com texto (cor nunca sozinha). */}
                        <span className={cx('shrink-0 text-right text-[12px] tabular-nums', faltam <= 3 ? 'font-semibold text-aviso' : 'text-tinta-suave')}>
                          {dataCurta(t.prazo)}<span className="block">{faltam === 0 ? 'vence hoje' : `em ${faltam} dia${faltam > 1 ? 's' : ''}`}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card className="p-5">
          {/* [PV-12] O STATUS DO PROJETO: só quem edita projeto troca; grava na hora, sem botão Salvar. Os outros perfis veem como texto. */}
          {/* GRAVA: trocar o status salva o projeto na hora (sem botão
            * "Salvar") e mostra um aviso confirmando. */}
          {podeEditar ? (
            <Select label="Status do projeto" value={projeto.status}
              onChange={(e) => { d.salvar('projetos', { ...projeto, status: e.target.value as Projeto['status'] }); avisar(`Status alterado para ${ROTULO_STATUS_PROJETO[e.target.value as Projeto['status']]}.`); }}
              opcoes={Object.entries(ROTULO_STATUS_PROJETO).map(([valor, rotulo]) => ({ valor, rotulo }))} />
          ) : (
            // Somente leitura: texto em vez de select desabilitado (o leitor de tela lê rótulo e valor).
            <div className="flex flex-col gap-1"><p className="text-[13px] font-medium text-tinta">Status do projeto</p><p><Etiqueta tom={TOM_STATUS_PROJETO[projeto.status]} ponto>{ROTULO_STATUS_PROJETO[projeto.status]}</Etiqueta></p></div>
          )}
          <dl className="mt-5 space-y-3 text-sm">
            {dados.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4">
                <dt className="text-tinta-suave">{k}</dt><dd className="text-right font-medium text-tinta">{v}</dd>
              </div>
            ))}
          </dl>
          {podeEditar && <Button variante="secundario" larguraTotal className="mt-5" onClick={onEditar}><Pencil className="h-4 w-4" aria-hidden />Editar dados</Button>}
        </Card>
        {podeEditar && <Card className="p-5">
          <h2 className="font-space text-[15px] font-semibold text-tinta">Excluir projeto</h2>
          <p className="mt-1 text-[13px] text-tinta-suave">Remove o quadro, as tarefas e as alocações. Prefira mudar o status para Concluído.</p>
          <Button variante="fantasma" className="mt-3 text-erro hover:bg-erro/10 hover:text-erro" onClick={() => setExcluir(true)}><Trash2 className="h-4 w-4" aria-hidden />Excluir projeto</Button>
        </Card>}
      </aside>

      {/* [PV-13] A EXCLUSÃO DO PROJETO: apaga também tarefas e alocações, sem desfazer. A tela sugere mudar o status para Concluído. */}
      {/* Confirmação de exclusão. APAGA: d.remover('projetos') remove o
        * projeto e, em cascata (lib/store.tsx), as tarefas e as alocações
        * dele. NAVEGA: depois volta para /projetos.
        * ⚠️ ATENÇÃO: não tem desfazer; por isso a tela sugere mudar o status
        * para Concluído em vez de excluir. */}
      <Modal aberto={podeEditar && excluir} onFechar={() => setExcluir(false)} tamanho="sm" titulo="Excluir este projeto?"
        rodape={<><Button variante="secundario" onClick={() => setExcluir(false)}>Cancelar</Button>
          <Button variante="perigo" onClick={() => { d.remover('projetos', projeto.id); avisar('Projeto excluído.'); router.push('/projetos'); }}>Excluir projeto</Button></>}>
        <p className="text-sm text-tinta-suave"><strong className="text-tinta">{projeto.nome}</strong> e as {pr.total} tarefas do quadro serão removidos. Não dá para desfazer.</p>
      </Modal>
    </div>
  );
}

// [PV-14] A TAREFA NOVA: título, responsável (só quem está alocado), prazo e lista são obrigatórios (§5); prazo sugerido de hoje + 7 dias; entra no fim da lista e o detalhe abre logo depois. TODO(API): POST.
/**
 * Modal "Nova tarefa": título, responsável, prazo e coluna são obrigatórios
 * (§5: tarefa carrega responsável e prazo desde a criação).
 *
 * @param props.projeto projeto onde a tarefa será criada.
 * @param props.onFechar fecha o modal.
 * @param props.onCriada recebe o id da tarefa criada (a ficha usa para
 *   abrir o detalhe dela logo em seguida).
 * @returns o modal com o formulário.
 */
function NovaTarefa({ projeto, onFechar, onCriada }: { projeto: Projeto; onFechar: () => void; onCriada: (id: string) => void }) {
  const d = useDados();
  const avisar = useToast();
  // Valores do formulário. Padrões: prazo daqui a 7 dias, primeira coluna
  // do quadro ("A fazer") e prioridade média.
  const [v, setV] = useState({ titulo: '', responsavelId: '', prazo: somaDias(hojeISO(), 7), colunaId: projeto.colunas[0].id, prioridade: 'media' as Projeto['prioridade'] });
  // Mensagens de erro por campo ({ titulo: 'Dê um título...' }).
  const [erros, setErros] = useState<Record<string, string>>({});
  // Só quem está alocado no projeto pode ser responsável pela tarefa.
  const equipe = d.alocacoes.filter((a) => a.projetoId === projeto.id).map((a) => d.pessoa(a.pessoaId)!).filter(Boolean);

  /**
   * Valida os campos obrigatórios e, se estiver tudo certo, cria a tarefa,
   * fecha o modal e abre o detalhe dela.
   */
  const criar = () => {
    // Junta todos os erros de uma vez, para a pessoa ver tudo que falta.
    const e: Record<string, string> = {};
    if (!v.titulo.trim()) e.titulo = 'Dê um título à tarefa.';
    // Sem equipe não há quem escolher: a mensagem diz o que fazer antes.
    if (!v.responsavelId) e.responsavelId = equipe.length ? 'Escolha o responsável.' : 'Aloque alguém na equipe primeiro.';
    if (!v.prazo) e.prazo = 'Informe o prazo.';
    setErros(e);
    // Algum erro? Para aqui e deixa as mensagens nos campos.
    if (Object.keys(e).length) return;
    const id = novoId('tar');
    // GRAVA: a tarefa nova na store. "ordem" = quantas já existem na coluna
    // escolhida, ou seja, ela entra no fim da coluna.
    // TODO(API): vira um POST de tarefa (a store cuida disso).
    d.salvar('tarefas', { id, projetoId: projeto.id, colunaId: v.colunaId, titulo: v.titulo.trim(), descricao: '', responsavelId: v.responsavelId, prazo: v.prazo, prioridade: v.prioridade, etiquetas: [], checklist: [], comentarios: [], ordem: d.tarefas.filter((t) => t.colunaId === v.colunaId && t.projetoId === projeto.id).length });
    avisar('Tarefa criada.');
    onFechar();
    // GRAVA na URL: ?tarefa=id, abrindo o detalhe para completar o resto.
    onCriada(id);
  };

  return (
    <Modal aberto onFechar={onFechar} tamanho="md" titulo="Nova tarefa" descricao="Responsável e prazo são obrigatórios desde a criação."
      rodape={<><Button variante="secundario" onClick={onFechar}>Cancelar</Button><Button onClick={criar}>Criar tarefa</Button></>}>
      {/* noValidate: desliga os balões de erro do navegador; quem valida e
        * mostra as mensagens em português é a função criar(). */}
      <form onSubmit={(e) => { e.preventDefault(); criar(); }} noValidate className="space-y-4">
        <Input compacto label="Título" required value={v.titulo} error={erros.titulo} placeholder="Ex.: Tela de login" onChange={(e) => setV({ ...v, titulo: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Responsável" required placeholder="Selecione" value={v.responsavelId} error={erros.responsavelId} onChange={(e) => setV({ ...v, responsavelId: e.target.value })}
            opcoes={equipe.map((p) => ({ valor: p.id, rotulo: p.nome }))} />
          <Input compacto label="Prazo" required type="date" value={v.prazo} error={erros.prazo} onChange={(e) => setV({ ...v, prazo: e.target.value })} />
          <Select label="Lista" required value={v.colunaId} onChange={(e) => setV({ ...v, colunaId: e.target.value })} opcoes={projeto.colunas.map((c) => ({ valor: c.id, rotulo: c.titulo }))} />
          <Select label="Prioridade" value={v.prioridade} onChange={(e) => setV({ ...v, prioridade: e.target.value as Projeto['prioridade'] })}
            opcoes={Object.entries(ROTULO_PRIORIDADE).map(([valor, rotulo]) => ({ valor, rotulo }))} />
        </div>
        <p className="text-[12px] text-tinta-suave">Etiquetas, descrição e checklist você completa no detalhe, que abre logo depois de criar.</p>
        {/* Botão invisível: faz o Enter dentro de um campo enviar o
          * formulário, já que o botão "Criar tarefa" fica no rodapé do modal,
          * fora do <form>. */}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
