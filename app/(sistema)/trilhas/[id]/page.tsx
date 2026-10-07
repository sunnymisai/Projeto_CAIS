"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Check, Send, Undo2, GripVertical, Lock } from 'lucide-react';
import { useDados, Trilha } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { publicoDaTrilha, situacaoNaTrilha } from '@/lib/metricas';
import { TIPOS_ETAPA, ALCANCE } from '@/lib/trilhas';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import Button from '@/components/button';
import Input from '@/components/input';
import Checkbox from '@/components/checkbox';
import { Select, AreaTexto, Segmentado } from '@/components/ui/form';
import { Card, CardTitulo, Etiqueta, Abas, Aviso, Avatar, Progresso, EstadoVazio, Esqueleto } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import Modal from '@/components/ui/Modal';
import { cx, novoId } from '@/lib/utils';
import type { TipoEtapa } from '@/lib/tipos';

export default function EditorTrilha() {
  const { id } = useParams<{ id: string }>();
  const d = useDados();
  const router = useRouter();
  const avisar = useToast();
  const [aba, setAba] = useState<'etapas' | 'publico' | 'progresso'>('etapas');
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [novoTipo, setNovoTipo] = useState<TipoEtapa>('texto');

  const t = d.trilhas.find((x) => x.id === id);
  if (!d.pronto) return <div className="p-8"><Esqueleto className="mb-4 h-10 w-80" /><Esqueleto className="h-96 rounded-2xl" /></div>;
  if (!t) return (
    <div className="p-8"><EstadoVazio icone={<Lock className="h-6 w-6" />} titulo="Trilha não encontrada" descricao="Ela pode ter sido excluída."
      acao={<Button onClick={() => router.push('/trilhas')}>Voltar às trilhas</Button>} /></div>
  );

  // Toda edição salva na hora (sem botão "Salvar")
  const atualizar = (parcial: Partial<Trilha>) => d.salvar('trilhas', { ...t, ...parcial });
  const setEtapa = (i: number, parcial: Partial<Trilha['etapas'][number]>) =>
    atualizar({ etapas: t.etapas.map((e, j) => (j === i ? { ...e, ...parcial } : e)) });
  const mover = (i: number, dir: -1 | 1) => {
    const e = [...t.etapas];
    [e[i], e[i + dir]] = [e[i + dir], e[i]];
    atualizar({ etapas: e });
  };

  const problemas = [
    !t.titulo.trim() && 'Dê um título à trilha.',
    t.etapas.length === 0 && 'Adicione pelo menos uma etapa.',
    t.etapas.some((e) => !e.titulo.trim()) && 'Todas as etapas precisam de título.',
    t.alcance === 'empresa' && !t.empresaId && 'Escolha a empresa que recebe a trilha.',
    t.alcance === 'profissional' && t.pessoaIds.length === 0 && 'Escolha pelo menos uma pessoa.',
  ].filter(Boolean) as string[];

  const publico = publicoDaTrilha(t, d);
  const profissionais = d.pessoas.filter((p) => p.perfil === 'profissional' && p.status !== 'inativo');

  const publicar = () => {
    if (problemas.length) { setAba(problemas.some((p) => p.includes('empresa') || p.includes('pessoa')) ? 'publico' : 'etapas'); avisar('Falta pouco: resolva os pontos indicados para publicar.', 'erro'); return; }
    atualizar({ status: 'publicada' });
    avisar(`Trilha publicada. ${publico.length} pessoa(s) foram avisadas.`);
  };

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina trilha={[{ rotulo: 'Trilhas', href: '/trilhas' }]}
        titulo={<span className="flex flex-wrap items-center gap-3">{t.titulo || 'Sem título'}{t.status === 'rascunho' ? <Etiqueta tom="aviso">Rascunho</Etiqueta> : <Etiqueta tom="sucesso" ponto>Publicada</Etiqueta>}</span>}
        descricao={<span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-sucesso" aria-hidden />Alterações salvas automaticamente</span>}
        acao={<>
          <Button variante="fantasma" onClick={() => setConfirmarExclusao(true)}><Trash2 className="h-4 w-4" aria-hidden />Excluir</Button>
          {t.status === 'publicada'
            ? <Button variante="secundario" onClick={() => { atualizar({ status: 'rascunho' }); avisar('Trilha voltou para rascunho.'); }}><Undo2 className="h-4 w-4" aria-hidden />Despublicar</Button>
            : <Button onClick={publicar}><Send className="h-4 w-4" aria-hidden />Publicar</Button>}
        </>} />

      {t.status === 'rascunho' && problemas.length > 0 && (
        <div className="mb-5"><Aviso tipo="aviso" titulo="Antes de publicar">{problemas.join(' ')}</Aviso></div>
      )}

      <Abas rotulo="Seções da trilha" ativa={aba} onChange={setAba}
        abas={[{ id: 'etapas', rotulo: 'Etapas', contagem: t.etapas.length }, { id: 'publico', rotulo: 'Público e regras', contagem: publico.length }, { id: 'progresso', rotulo: 'Progresso' }]} />

      <div className="mt-6" role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === 'etapas' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <Card className="space-y-4 p-5">
                <Input compacto label="Título da trilha" required value={t.titulo} onChange={(e) => atualizar({ titulo: e.target.value })} />
                <AreaTexto label="Descrição" placeholder="Para que serve esta trilha, em poucas linhas." value={t.descricao} onChange={(e) => atualizar({ descricao: e.target.value })} />
              </Card>

              <Card>
                <CardTitulo titulo="Etapas" descricao="Trilha contém etapas; etapa contém conteúdo e, opcionalmente, um quiz." />
                <ol className="space-y-2 p-4">
                  {t.etapas.map((e, i) => {
                    const T = TIPOS_ETAPA[e.tipo];
                    return (
                      <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-borda bg-fundo/50 p-3 sm:flex-nowrap">
                        <GripVertical className="hidden h-4 w-4 shrink-0 text-tinta-fraca sm:block" aria-hidden />
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primaria-suave text-[13px] font-bold text-primaria">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <input value={e.titulo} onChange={(ev) => setEtapa(i, { titulo: ev.target.value })} placeholder="Título da etapa" aria-label={`Título da etapa ${i + 1}`}
                            className={cx('w-full rounded-md bg-transparent px-1 py-0.5 text-sm font-semibold text-tinta placeholder:text-erro/70 focus:bg-superficie focus:outline-none focus:ring-2 focus:ring-primaria/40')} />
                          <div className="mt-1 flex flex-wrap items-center gap-3 px-1 text-[12px] text-tinta-suave">
                            <span className="flex items-center gap-1"><T.icone className="h-3.5 w-3.5" aria-hidden />
                              <select value={e.tipo} onChange={(ev) => setEtapa(i, { tipo: ev.target.value as TipoEtapa, notaMinima: ev.target.value === 'quiz' ? 70 : 0 })} aria-label="Tipo de conteúdo"
                                className="rounded bg-transparent font-medium text-tinta-suave focus:outline-none focus:ring-2 focus:ring-primaria/40">
                                {Object.entries(TIPOS_ETAPA).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
                              </select>
                            </span>
                            {e.tipo === 'quiz' && (
                              <label className="flex items-center gap-1">Nota mínima
                                <input type="number" min={0} max={100} value={e.notaMinima} onChange={(ev) => setEtapa(i, { notaMinima: Number(ev.target.value) })}
                                  className="w-14 rounded border border-borda bg-superficie px-1.5 py-0.5 text-tinta focus:outline-none focus:ring-2 focus:ring-primaria/40" />%
                              </label>
                            )}
                            <label className="flex cursor-pointer items-center gap-1.5">
                              <input type="checkbox" checked={e.obrigatoria} onChange={(ev) => setEtapa(i, { obrigatoria: ev.target.checked })} className="accent-[var(--primaria)]" />
                              Obrigatória {e.obrigatoria && <Lock className="h-3 w-3" aria-label="trava a próxima etapa" />}
                            </label>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir etapa" className="rounded-lg p-1.5 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                          <button onClick={() => mover(i, 1)} disabled={i === t.etapas.length - 1} aria-label="Descer etapa" className="rounded-lg p-1.5 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                          <button onClick={() => atualizar({ etapas: t.etapas.filter((_, j) => j !== i) })} aria-label="Remover etapa" className="rounded-lg p-1.5 text-tinta-fraca hover:bg-erro/10 hover:text-erro"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </li>
                    );
                  })}
                  {t.etapas.length === 0 && <li className="rounded-xl border border-dashed border-borda px-4 py-8 text-center text-sm text-tinta-suave">Nenhuma etapa ainda. Escolha o tipo abaixo e adicione a primeira.</li>}
                </ol>
                <div className="flex flex-wrap items-end gap-2 border-t border-borda p-4">
                  <div className="w-48"><Select label="Tipo da nova etapa" value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as TipoEtapa)} opcoes={Object.entries(TIPOS_ETAPA).map(([valor, v]) => ({ valor, rotulo: v.rotulo }))} /></div>
                  <Button variante="secundario" onClick={() => atualizar({ etapas: [...t.etapas, { id: novoId('et'), titulo: '', tipo: novoTipo, obrigatoria: true, notaMinima: novoTipo === 'quiz' ? 70 : 0 }] })}>
                    <Plus className="h-4 w-4" aria-hidden />Adicionar etapa
                  </Button>
                </div>
              </Card>
            </div>

            <aside className="space-y-4">
              <Card className="p-5">
                <h2 className="mb-3 font-space text-[15px] font-semibold text-tinta">O que cada etapa aceita</h2>
                <ul className="grid grid-cols-2 gap-2">
                  {Object.entries(TIPOS_ETAPA).map(([k, v]) => (
                    <li key={k} className="flex items-center gap-2 rounded-lg bg-superficie-alt px-2.5 py-2 text-[13px] text-tinta"><v.icone className="h-4 w-4 text-primaria" aria-hidden />{v.rotulo}</li>
                  ))}
                </ul>
                <p className="mt-3 text-[12px] text-tinta-suave">O quiz é opcional por etapa e define a nota mínima para avançar.</p>
              </Card>
              <Card className="p-5">
                <h2 className="mb-3 font-space text-[15px] font-semibold text-tinta">O que o profissional vê</h2>
                <ul className="space-y-2.5 text-[13px] text-tinta-suave">
                  <li><strong className="text-tinta">Barra de progresso:</strong> quanto falta para terminar.</li>
                  <li><strong className="text-tinta">Próximo passo em destaque,</strong> sem precisar procurar.</li>
                  <li><strong className="text-tinta">Etapa bloqueada explicada:</strong> por que ainda não abre.</li>
                  <li><strong className="text-tinta">Prazo visível,</strong> com aviso quando está perto.</li>
                </ul>
              </Card>
            </aside>
          </div>
        )}

        {aba === 'publico' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-[13px] font-medium text-tinta">Quem recebe</p>
                <Segmentado rotulo="Alcance da trilha" valor={t.alcance} onChange={(a) => atualizar({ alcance: a })}
                  opcoes={[{ valor: 'geral', rotulo: 'Geral' }, { valor: 'empresa', rotulo: 'Empresa' }, { valor: 'profissional', rotulo: 'Profissional' }]} />
                <p className="mt-2 flex items-center gap-2 text-[13px] text-tinta-suave"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ALCANCE[t.alcance].cor }} aria-hidden />{ALCANCE[t.alcance].descricao}</p>
              </div>
              {t.alcance === 'empresa' && (
                <Select label="Empresa" required placeholder="Selecione a empresa" value={t.empresaId} onChange={(e) => atualizar({ empresaId: e.target.value })}
                  hint="Recebem a trilha todas as pessoas alocadas em projetos desta empresa."
                  opcoes={d.empresas.filter((e) => e.status !== 'encerrada').map((e) => ({ valor: e.id, rotulo: e.nomeFantasia }))} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input compacto label="Prazo para concluir (dias)" type="number" min={1} value={String(t.prazoDias)} onChange={(e) => atualizar({ prazoDias: Math.max(1, Number(e.target.value)) })} />
                <Select label="Quando abre" value="entrada" onChange={() => {}} opcoes={[{ valor: 'entrada', rotulo: 'Na entrada da pessoa' }]} hint="Data marcada chega com a API." />
              </div>
              <Aviso tipo="info">Uma pessoa pode receber trilhas das três camadas ao mesmo tempo.</Aviso>
            </Card>

            <Card>
              <CardTitulo titulo={t.alcance === 'profissional' ? 'Escolha as pessoas' : 'Quem vai receber'} descricao={`${publico.length} pessoa(s) no público desta trilha.`} />
              <ul className="rolagem max-h-[420px] divide-y divide-borda overflow-y-auto p-2">
                {(t.alcance === 'profissional' ? profissionais : profissionais.filter((p) => publico.includes(p.id))).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                    {t.alcance === 'profissional' ? (
                      <Checkbox id={`p-${p.id}`} label="" checked={t.pessoaIds.includes(p.id)} aria-label={`Incluir ${p.nome}`}
                        onChange={(e) => atualizar({ pessoaIds: e.target.checked ? [...t.pessoaIds, p.id] : t.pessoaIds.filter((x) => x !== p.id) })} />
                    ) : null}
                    <Avatar nome={p.nome} tamanho={30} />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-tinta">{p.nome}</span><span className="block text-[12px] text-tinta-suave">{p.area} · {p.nivel}</span></span>
                  </li>
                ))}
                {publico.length === 0 && t.alcance !== 'profissional' && <li className="px-3 py-8 text-center text-sm text-tinta-suave">{t.alcance === 'empresa' ? 'Escolha uma empresa com pessoas alocadas.' : 'Nenhum profissional ativo.'}</li>}
              </ul>
            </Card>
          </div>
        )}

        {aba === 'progresso' && (
          <Card>
            {t.status === 'rascunho' || publico.length === 0 ? (
              <EstadoVazio icone={<Send className="h-6 w-6" />} titulo="Sem progresso para mostrar" descricao="O progresso aparece quando a trilha é publicada para um público." acao={t.status === 'rascunho' ? <Button onClick={publicar}>Publicar trilha</Button> : undefined} />
            ) : (
              <Tabela rotulo="Progresso por pessoa">
                <thead><tr><Th>Pessoa</Th><Th>Situação</Th><Th className="w-1/3">Progresso</Th><Th>Nota do quiz</Th></tr></thead>
                <tbody>
                  {publico.map((pid) => {
                    const p = d.pessoa(pid); if (!p) return null;
                    const s = situacaoNaTrilha(t, pid);
                    const pr = t.progresso[pid];
                    const pct = ((pr?.concluidas ?? 0) / Math.max(1, t.etapas.length)) * 100;
                    const minimo = Math.max(0, ...t.etapas.filter((e) => e.tipo === 'quiz').map((e) => e.notaMinima));
                    return (
                      <Tr key={pid}>
                        <Td><span className="flex items-center gap-2.5"><Avatar nome={p.nome} tamanho={28} />{p.nome}</span></Td>
                        <Td>{s === 'concluida' ? <Etiqueta tom="sucesso" ponto>Concluída</Etiqueta> : s === 'andamento' ? <Etiqueta tom="primaria" ponto>Em andamento</Etiqueta> : <Etiqueta tom="neutro" ponto>Não iniciada</Etiqueta>}</Td>
                        <Td><span className="flex items-center gap-3"><Progresso valor={pct} tom={s === 'concluida' ? 'sucesso' : 'primaria'} fino rotulo={`Progresso de ${p.nome}`} /><span className="w-16 shrink-0 text-[12px] tabular-nums text-tinta-suave">{pr?.concluidas ?? 0} de {t.etapas.length}</span></span></Td>
                        <Td>{pr?.nota !== undefined ? <span className={cx('font-semibold tabular-nums', pr.nota < minimo ? 'text-erro' : 'text-tinta')}>{pr.nota}%</span> : <span className="text-tinta-fraca">—</span>}</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Tabela>
            )}
          </Card>
        )}
      </div>

      <Modal aberto={confirmarExclusao} onFechar={() => setConfirmarExclusao(false)} tamanho="sm" titulo="Excluir esta trilha?"
        rodape={<><Button variante="secundario" onClick={() => setConfirmarExclusao(false)}>Cancelar</Button>
          <Button variante="perigo" onClick={() => { d.remover('trilhas', t.id); avisar('Trilha excluída.'); router.push('/trilhas'); }}>Excluir trilha</Button></>}>
        <p className="text-sm text-tinta-suave">A trilha <strong className="text-tinta">{t.titulo}</strong> e o progresso de {publico.length} pessoa(s) serão removidos. Não dá para desfazer.</p>
      </Modal>
    </div>
  );
}
