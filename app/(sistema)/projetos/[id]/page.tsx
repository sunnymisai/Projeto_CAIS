"use client";

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Plus, UserPlus, Pencil, Trash2, LayoutGrid, List, GanttChart, FolderX } from 'lucide-react';
import { useDados, Projeto } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { progressoProjeto, ROTULO_STATUS_PROJETO, TOM_STATUS_PROJETO, ROTULO_PRIORIDADE } from '@/lib/metricas';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import Button from '@/components/button';
import Input from '@/components/input';
import { Select } from '@/components/ui/form';
import { Abas, Card, CardTitulo, Etiqueta, Esqueleto, EstadoVazio, Progresso, Avatar, Aviso } from '@/components/ui/basicos';
import { Colunas } from '@/components/ui/Graficos';
import Modal from '@/components/ui/Modal';
import Quadro from '@/components/projetos/Quadro';
import DetalheTarefa from '@/components/projetos/DetalheTarefa';
import { VistaLista, VistaCronograma } from '@/components/projetos/Vistas';
import Equipe from '@/components/projetos/Equipe';
import FormProjeto from '@/components/projetos/FormProjeto';
import { cx, dataBR, diasEntre, hojeISO, novoId, somaDias } from '@/lib/utils';

type Aba = 'geral' | 'equipe' | 'tarefas';
type Vista = 'quadro' | 'lista' | 'cronograma';

export default function PaginaProjeto() {
  return <Suspense><FichaProjeto /></Suspense>;
}

function FichaProjeto() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const d = useDados();

  const aba = (params.get('aba') as Aba) || 'tarefas';
  const tarefaAberta = params.get('tarefa');
  const [vista, setVista] = useState<Vista>('quadro');
  const [alocando, setAlocando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [novaTarefa, setNovaTarefa] = useState(false);
  const [fResp, setFResp] = useState('');
  const [fPrior, setFPrior] = useState('');
  const [fEtiq, setFEtiq] = useState('');

  const navegar = useCallback((p: { aba?: Aba; tarefa?: string | null }) => {
    const q = new URLSearchParams(params.toString());
    if (p.aba) q.set('aba', p.aba);
    if (p.tarefa === null) q.delete('tarefa'); else if (p.tarefa) q.set('tarefa', p.tarefa);
    router.replace(`/projetos/${id}?${q.toString()}`, { scroll: false });
  }, [params, router, id]);

  const projeto = d.projeto(id);
  const tarefas = useMemo(() => d.tarefas.filter((t) => t.projetoId === id), [d.tarefas, id]);
  const filtradas = tarefas.filter((t) => (!fResp || t.responsavelId === fResp) && (!fPrior || t.prioridade === fPrior) && (!fEtiq || t.etiquetas.includes(fEtiq)));

  if (!d.pronto) return (
    <div className="flex h-full flex-col p-4 sm:p-6 lg:p-8">
      <Esqueleto className="mb-2 h-4 w-24" /><Esqueleto className="mb-6 h-8 w-72" /><Esqueleto className="mb-4 h-10 w-80" />
      <div className="flex flex-1 gap-3">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-full min-h-80 w-72 rounded-2xl" />)}</div>
    </div>
  );
  if (!projeto) return (
    <div className="p-8"><EstadoVazio icone={<FolderX className="h-6 w-6" />} titulo="Projeto não encontrado" descricao="Ele pode ter sido excluído ou o endereço está errado."
      acao={<Button onClick={() => router.push('/projetos')}>Ver projetos</Button>} /></div>
  );

  const empresa = d.empresa(projeto.empresaId);
  const equipe = d.alocacoes.filter((a) => a.projetoId === projeto.id);
  const responsaveis = [...new Set(tarefas.map((t) => t.responsavelId))].map((pid) => d.pessoa(pid)!).filter(Boolean);
  const etiquetas = [...new Set(tarefas.flatMap((t) => t.etiquetas))];
  const temFiltro = fResp || fPrior || fEtiq;

  const acao = aba === 'equipe' ? <Button onClick={() => setAlocando(true)}><UserPlus className="h-4 w-4" aria-hidden />Alocar pessoa</Button>
    : aba === 'tarefas' ? <Button onClick={() => setNovaTarefa(true)}><Plus className="h-4 w-4" aria-hidden />Nova tarefa</Button>
    : <Button variante="secundario" onClick={() => setEditando(true)}><Pencil className="h-4 w-4" aria-hidden />Editar projeto</Button>;

  return (
    <div className={cx('mx-auto flex max-w-[1600px] flex-col p-4 sm:p-6 lg:p-8', aba === 'tarefas' && vista === 'quadro' && 'h-full')}>
      <CabecalhoPagina trilha={[{ rotulo: 'Projetos', href: '/projetos' }]}
        titulo={<span className="flex flex-wrap items-center gap-3">{projeto.nome}<Etiqueta tom={TOM_STATUS_PROJETO[projeto.status]} ponto>{ROTULO_STATUS_PROJETO[projeto.status]}</Etiqueta></span>}
        descricao={<>{empresa?.nomeFantasia} · entrega prevista em {dataBR(projeto.entrega)}</>}
        acao={acao} />

      <Abas rotulo="Seções do projeto" ativa={aba} onChange={(a) => navegar({ aba: a })}
        abas={[{ id: 'geral', rotulo: 'Visão geral' }, { id: 'equipe', rotulo: 'Equipe', contagem: equipe.length }, { id: 'tarefas', rotulo: 'Tarefas', contagem: tarefas.length }]} />

      <div className={cx('mt-5', aba === 'tarefas' && vista === 'quadro' && 'flex min-h-[560px] flex-1 flex-col')} role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === 'geral' && <VisaoGeral projeto={projeto} onEditar={() => setEditando(true)} />}

        {aba === 'equipe' && (
          <>
            {projeto.status === 'planejado' && equipe.length === 0 && (
              <div className="mb-4"><Aviso tipo="info" titulo="Próximo passo: montar a equipe">Aloque as pessoas com papel, período e carga. Depois, crie as tarefas no quadro.</Aviso></div>
            )}
            <Equipe projeto={projeto} alocando={alocando} setAlocando={setAlocando} />
          </>
        )}

        {aba === 'tarefas' && (
          <>
            <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
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
              {temFiltro && <Button variante="fantasma" tamanho="sm" onClick={() => { setFResp(''); setFPrior(''); setFEtiq(''); }}>Limpar · {filtradas.length} de {tarefas.length}</Button>}
            </div>

            {vista === 'quadro' && <div className="min-h-0 flex-1"><Quadro projeto={projeto} tarefas={filtradas} onAbrir={(t) => navegar({ tarefa: t })} /></div>}
            {vista === 'lista' && <VistaLista projeto={projeto} tarefas={filtradas} onAbrir={(t) => navegar({ tarefa: t })} />}
            {vista === 'cronograma' && <VistaCronograma projeto={projeto} tarefas={filtradas} onAbrir={(t) => navegar({ tarefa: t })} />}
          </>
        )}
      </div>

      {tarefaAberta && d.tarefas.some((t) => t.id === tarefaAberta) && <DetalheTarefa tarefaId={tarefaAberta} onFechar={() => navegar({ tarefa: null })} />}
      {editando && <FormProjeto projeto={projeto} onFechar={() => setEditando(false)} />}
      {novaTarefa && <NovaTarefa projeto={projeto} onFechar={() => setNovaTarefa(false)} onCriada={(t) => navegar({ tarefa: t })} />}
    </div>
  );
}

function VisaoGeral({ projeto, onEditar }: { projeto: Projeto; onEditar: () => void }) {
  const d = useDados();
  const avisar = useToast();
  const router = useRouter();
  const [excluir, setExcluir] = useState(false);
  const pr = progressoProjeto(projeto.id, d);
  const lider = d.pessoa(projeto.liderId);
  const empresa = d.empresa(projeto.empresaId);
  const hoje = hojeISO();
  const decorrido = Math.max(0, Math.min(100, (diasEntre(projeto.inicio, hoje) / Math.max(1, diasEntre(projeto.inicio, projeto.entrega))) * 100));
  const porColuna = projeto.colunas.map((c, i) => ({
    rotulo: c.titulo, valor: d.tarefas.filter((t) => t.colunaId === c.id && t.projetoId === projeto.id).length,
    cor: i === projeto.colunas.length - 1 ? '#10B981' : ['#9CA0B3', '#7C5CFF', '#F5A524', '#2563EB'][Math.min(i, 3)],
  }));

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
              {pr.pct + 10 < decorrido && pr.total > 0 && <Aviso tipo="aviso">O tempo está andando mais rápido que as entregas.</Aviso>}
            </div>
            <Colunas itens={porColuna} altura={110} />
          </div>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card className="p-5">
          <Select label="Status do projeto" value={projeto.status}
            onChange={(e) => { d.salvar('projetos', { ...projeto, status: e.target.value as Projeto['status'] }); avisar(`Status alterado para ${ROTULO_STATUS_PROJETO[e.target.value as Projeto['status']]}.`); }}
            opcoes={Object.entries(ROTULO_STATUS_PROJETO).map(([valor, rotulo]) => ({ valor, rotulo }))} />
          <dl className="mt-5 space-y-3 text-sm">
            {dados.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4">
                <dt className="text-tinta-suave">{k}</dt><dd className="text-right font-medium text-tinta">{v}</dd>
              </div>
            ))}
          </dl>
          <Button variante="secundario" larguraTotal className="mt-5" onClick={onEditar}><Pencil className="h-4 w-4" aria-hidden />Editar dados</Button>
        </Card>
        <Card className="p-5">
          <h2 className="font-space text-[15px] font-semibold text-tinta">Excluir projeto</h2>
          <p className="mt-1 text-[13px] text-tinta-suave">Remove o quadro, as tarefas e as alocações. Prefira mudar o status para Concluído.</p>
          <Button variante="fantasma" className="mt-3 text-erro hover:bg-erro/10 hover:text-erro" onClick={() => setExcluir(true)}><Trash2 className="h-4 w-4" aria-hidden />Excluir projeto</Button>
        </Card>
      </aside>

      <Modal aberto={excluir} onFechar={() => setExcluir(false)} tamanho="sm" titulo="Excluir este projeto?"
        rodape={<><Button variante="secundario" onClick={() => setExcluir(false)}>Cancelar</Button>
          <Button variante="perigo" onClick={() => { d.remover('projetos', projeto.id); avisar('Projeto excluído.'); router.push('/projetos'); }}>Excluir projeto</Button></>}>
        <p className="text-sm text-tinta-suave"><strong className="text-tinta">{projeto.nome}</strong> e as {pr.total} tarefas do quadro serão removidos. Não dá para desfazer.</p>
      </Modal>
    </div>
  );
}

/** Nova tarefa: título, responsável, prazo e coluna são obrigatórios (slide 21). */
function NovaTarefa({ projeto, onFechar, onCriada }: { projeto: Projeto; onFechar: () => void; onCriada: (id: string) => void }) {
  const d = useDados();
  const avisar = useToast();
  const [v, setV] = useState({ titulo: '', responsavelId: '', prazo: somaDias(hojeISO(), 7), colunaId: projeto.colunas[0].id, prioridade: 'media' as Projeto['prioridade'] });
  const [erros, setErros] = useState<Record<string, string>>({});
  const equipe = d.alocacoes.filter((a) => a.projetoId === projeto.id).map((a) => d.pessoa(a.pessoaId)!).filter(Boolean);

  const criar = () => {
    const e: Record<string, string> = {};
    if (!v.titulo.trim()) e.titulo = 'Dê um título à tarefa.';
    if (!v.responsavelId) e.responsavelId = equipe.length ? 'Escolha o responsável.' : 'Aloque alguém na equipe primeiro.';
    if (!v.prazo) e.prazo = 'Informe o prazo.';
    setErros(e);
    if (Object.keys(e).length) return;
    const id = novoId('tar');
    d.salvar('tarefas', { id, projetoId: projeto.id, colunaId: v.colunaId, titulo: v.titulo.trim(), descricao: '', responsavelId: v.responsavelId, prazo: v.prazo, prioridade: v.prioridade, etiquetas: [], checklist: [], comentarios: [], ordem: d.tarefas.filter((t) => t.colunaId === v.colunaId && t.projetoId === projeto.id).length });
    avisar('Tarefa criada.');
    onFechar();
    onCriada(id);
  };

  return (
    <Modal aberto onFechar={onFechar} tamanho="md" titulo="Nova tarefa" descricao="Responsável e prazo são obrigatórios desde a criação."
      rodape={<><Button variante="secundario" onClick={onFechar}>Cancelar</Button><Button onClick={criar}>Criar tarefa</Button></>}>
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
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
