"use client";

import { useState } from 'react';
import { X, AlignLeft, CheckSquare, MessageSquare, Tag, Trash2, Plus, CreditCard } from 'lucide-react';
import { useDados, Tarefa } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/button';
import { Select } from '@/components/ui/form';
import { Avatar, EtiquetaTarefa, Progresso, corEtiqueta } from '@/components/ui/basicos';
import { cx, novoId, tempoRelativo, hojeISO } from '@/lib/utils';

const ETIQUETAS_SUGERIDAS = ['Front', 'UX', 'API', 'QA', 'Login', 'Gráfico', 'Back'];

/**
 * Detalhe da tarefa (slide 21). Abre por cima do quadro, sem trocar de
 * página. Tudo salva na hora. "Status" é também o "mover para…" do celular.
 */
export default function DetalheTarefa({ tarefaId, onFechar }: { tarefaId: string; onFechar: () => void }) {
  const d = useDados();
  const { sessao } = useAuth();
  const avisar = useToast();
  const t = d.tarefas.find((x) => x.id === tarefaId);
  const [novoItem, setNovoItem] = useState('');
  const [comentario, setComentario] = useState('');
  const [novaEtiqueta, setNovaEtiqueta] = useState('');
  const [confirmar, setConfirmar] = useState(false);

  if (!t) return null;
  const projeto = d.projeto(t.projetoId)!;
  const coluna = projeto.colunas.find((c) => c.id === t.colunaId);
  const feitos = t.checklist.filter((c) => c.feito).length;
  const equipe = [...new Set([...d.alocacoes.filter((a) => a.projetoId === projeto.id).map((a) => a.pessoaId), t.responsavelId])].map((id) => d.pessoa(id)!).filter(Boolean);
  const atualizar = (p: Partial<Tarefa>) => d.salvar('tarefas', { ...t, ...p });

  const addItem = () => {
    if (!novoItem.trim()) return;
    atualizar({ checklist: [...t.checklist, { id: novoId('ck'), texto: novoItem.trim(), feito: false }] });
    setNovoItem('');
  };
  const addComentario = () => {
    if (!comentario.trim()) return;
    atualizar({ comentarios: [...t.comentarios, { id: novoId('cm'), autorId: sessao!.pessoaId, texto: comentario.trim(), data: new Date().toISOString() }] });
    setComentario('');
  };
  const alternarEtiqueta = (e: string) => atualizar({ etiquetas: t.etiquetas.includes(e) ? t.etiquetas.filter((x) => x !== e) : [...t.etiquetas, e] });

  const secao = 'mb-2 flex items-center gap-2 font-space text-[15px] font-semibold text-tinta';

  return (
    <Modal aberto onFechar={onFechar} tamanho="lg" titulo={t.titulo}
      cabecalho={
        <div className="flex items-start gap-3 border-b border-borda px-6 py-4">
          <CreditCard className="mt-1.5 h-5 w-5 shrink-0 text-tinta-suave" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-tinta-suave">{projeto.nome} › Tarefas</p>
            <input value={t.titulo} onChange={(e) => atualizar({ titulo: e.target.value })} aria-label="Título da tarefa"
              className="-ml-1.5 w-full rounded-md bg-transparent px-1.5 py-0.5 font-space text-xl font-semibold text-tinta focus:bg-superficie-alt focus:outline-none focus:ring-2 focus:ring-primaria/40" />
            <p className="text-[13px] text-tinta-suave">na lista <strong className="text-tinta">{coluna?.titulo}</strong></p>
          </div>
          <button onClick={onFechar} aria-label="Fechar" className="-mr-2 rounded-lg p-2 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta"><X className="h-5 w-5" /></button>
        </div>
      }>
      <div className="grid gap-6 md:grid-cols-[1fr_220px]">
        <div className="min-w-0 space-y-7">
          {t.etiquetas.length > 0 && (
            <div>
              <p className="mb-1.5 text-[12px] font-semibold text-tinta-suave">Etiquetas</p>
              <div className="flex flex-wrap gap-1.5">{t.etiquetas.map((e) => <EtiquetaTarefa key={e} nome={e} />)}</div>
            </div>
          )}

          <section>
            <h3 className={secao}><AlignLeft className="h-4 w-4" aria-hidden />Descrição</h3>
            <textarea value={t.descricao} onChange={(e) => atualizar({ descricao: e.target.value })} rows={3} placeholder="Adicione uma descrição mais detalhada…" aria-label="Descrição"
              className="w-full resize-y rounded-xl border border-borda bg-superficie-alt/50 px-3.5 py-2.5 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:bg-superficie focus:outline-none focus:ring-4 focus:ring-primaria/20" />
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className={secao}><CheckSquare className="h-4 w-4" aria-hidden />Checklist · {feitos} de {t.checklist.length}</h3>
            </div>
            {t.checklist.length > 0 && (
              <div className="mb-3 flex items-center gap-3">
                <span className="w-9 text-[12px] font-semibold tabular-nums text-tinta-suave">{Math.round((feitos / t.checklist.length) * 100)}%</span>
                <Progresso valor={(feitos / t.checklist.length) * 100} tom={feitos === t.checklist.length ? 'sucesso' : 'primaria'} fino rotulo="Progresso do checklist" />
              </div>
            )}
            <ul className="space-y-1">
              {t.checklist.map((c) => (
                <li key={c.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-superficie-alt">
                  <input type="checkbox" checked={c.feito} id={c.id} className="h-4 w-4 accent-[var(--primaria)]"
                    onChange={() => atualizar({ checklist: t.checklist.map((x) => x.id === c.id ? { ...x, feito: !x.feito } : x) })} />
                  <label htmlFor={c.id} className={cx('flex-1 cursor-pointer text-sm', c.feito ? 'text-tinta-suave line-through' : 'text-tinta')}>{c.texto}</label>
                  <button onClick={() => atualizar({ checklist: t.checklist.filter((x) => x.id !== c.id) })} aria-label={`Remover item ${c.texto}`}
                    className="rounded p-1 text-tinta-fraca opacity-0 hover:text-erro focus:opacity-100 group-hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); addItem(); }}>
              <input value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Adicionar um item" aria-label="Novo item do checklist"
                className="h-9 flex-1 rounded-lg border border-borda bg-superficie px-3 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
              <Button type="submit" variante="secundario" tamanho="sm" className="h-9">Adicionar</Button>
            </form>
          </section>

          <section>
            <h3 className={secao}><MessageSquare className="h-4 w-4" aria-hidden />Comentários</h3>
            <form className="mb-4 flex gap-3" onSubmit={(e) => { e.preventDefault(); addComentario(); }}>
              <Avatar nome={sessao?.nome ?? ''} tamanho={32} />
              <div className="flex-1">
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} placeholder="Escreva um comentário…" aria-label="Novo comentário"
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addComentario(); }}
                  className="w-full resize-none rounded-xl border border-borda bg-superficie px-3 py-2 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
                {comentario.trim() && <Button type="submit" tamanho="sm" className="mt-1.5">Comentar</Button>}
              </div>
            </form>
            <ul className="space-y-4">
              {[...t.comentarios].reverse().map((c) => {
                const autor = d.pessoa(c.autorId);
                return (
                  <li key={c.id} className="flex gap-3">
                    <Avatar nome={autor?.nome ?? '?'} tamanho={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px]"><strong className="text-tinta">{autor?.nome}</strong> <span className="text-tinta-suave">{tempoRelativo(c.data)}</span></p>
                      <p className="mt-1 rounded-xl border border-borda bg-superficie px-3 py-2 text-sm text-tinta">{c.texto}</p>
                    </div>
                  </li>
                );
              })}
              {t.comentarios.length === 0 && <li className="text-[13px] text-tinta-suave">Nenhum comentário ainda. A conversa sobre a tarefa fica aqui.</li>}
            </ul>
          </section>
        </div>

        {/* Lateral: campos obrigatórios e opcionais */}
        <aside className="space-y-4">
          <Select label="Status" required value={t.colunaId} hint="Mover para outra lista"
            onChange={(e) => { d.moverTarefa(t.id, e.target.value, 999); avisar(`Movida para ${projeto.colunas.find((c) => c.id === e.target.value)?.titulo}.`); }}
            opcoes={projeto.colunas.map((c) => ({ valor: c.id, rotulo: c.titulo }))} />
          <Select label="Responsável" required value={t.responsavelId} onChange={(e) => atualizar({ responsavelId: e.target.value })}
            opcoes={equipe.map((p) => ({ valor: p.id, rotulo: p.nome }))} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prazo-tarefa" className="text-[13px] font-medium text-tinta">Prazo<span className="ml-0.5 text-erro" aria-hidden>*</span></label>
            <input id="prazo-tarefa" type="date" value={t.prazo} onChange={(e) => e.target.value && atualizar({ prazo: e.target.value })}
              className={cx('h-10 rounded-lg border bg-superficie px-3 text-sm text-tinta focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/25',
                t.prazo < hojeISO() && t.colunaId !== projeto.colunas.at(-1)?.id ? 'border-erro' : 'border-borda')} />
            {t.prazo < hojeISO() && t.colunaId !== projeto.colunas.at(-1)?.id && <p className="text-[12px] font-medium text-erro">Prazo vencido.</p>}
          </div>
          <Select label="Prioridade" value={t.prioridade} onChange={(e) => atualizar({ prioridade: e.target.value as Tarefa['prioridade'] })}
            opcoes={[{ valor: 'baixa', rotulo: 'Baixa' }, { valor: 'media', rotulo: 'Média' }, { valor: 'alta', rotulo: 'Alta' }]} />

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-tinta"><Tag className="h-3.5 w-3.5" aria-hidden />Etiquetas</p>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...ETIQUETAS_SUGERIDAS, ...t.etiquetas])].map((e) => {
                const on = t.etiquetas.includes(e);
                const c = corEtiqueta(e);
                return (
                  <button key={e} type="button" onClick={() => alternarEtiqueta(e)} aria-pressed={on}
                    className={cx('h-6 rounded-md px-2 text-[12px] font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60', !on && 'opacity-35 hover:opacity-70')}
                    style={{ background: c.bg, color: c.fg }}>{e}</button>
                );
              })}
            </div>
            <form className="mt-2 flex gap-1" onSubmit={(e) => { e.preventDefault(); const v = novaEtiqueta.trim(); if (v && !t.etiquetas.includes(v)) atualizar({ etiquetas: [...t.etiquetas, v] }); setNovaEtiqueta(''); }}>
              <input value={novaEtiqueta} onChange={(e) => setNovaEtiqueta(e.target.value)} placeholder="Nova etiqueta" aria-label="Nova etiqueta"
                className="h-8 min-w-0 flex-1 rounded-lg border border-borda bg-superficie px-2 text-[12px] text-tinta focus:border-primaria focus:outline-none" />
              <button type="submit" aria-label="Adicionar etiqueta" className="rounded-lg border border-borda px-2 text-tinta-suave hover:bg-superficie-alt"><Plus className="h-3.5 w-3.5" /></button>
            </form>
          </div>

          <div className="border-t border-borda pt-4">
            {!confirmar ? (
              <Button variante="fantasma" larguraTotal className="justify-start text-erro hover:bg-erro/10 hover:text-erro" onClick={() => setConfirmar(true)}>
                <Trash2 className="h-4 w-4" aria-hidden />Excluir tarefa
              </Button>
            ) : (
              <div className="rounded-xl border border-erro/30 bg-erro/5 p-3">
                <p className="mb-2 text-[13px] text-tinta">Excluir de vez? Não dá para desfazer.</p>
                <div className="flex gap-2">
                  <Button tamanho="sm" variante="perigo" onClick={() => { d.remover('tarefas', t.id); avisar('Tarefa excluída.'); onFechar(); }}>Excluir</Button>
                  <Button tamanho="sm" variante="secundario" onClick={() => setConfirmar(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
