"use client";

import { DragEvent, useRef, useState } from 'react';
import { Plus, X, MoreHorizontal } from 'lucide-react';
import { useDados, Projeto, Tarefa } from '@/lib/store';
import { useToast } from '@/lib/toast';
import Button from '@/components/button';
import Menu, { ItemMenu } from '@/components/ui/Menu';
import CartaoTarefa from './CartaoTarefa';
import { corQuadro } from './cores';
import { cx, hojeISO, novoId, somaDias } from '@/lib/utils';

/**
 * Quadro kanban inspirado no Trello (slide 20).
 * - Arrastar e soltar: repouso, arrastando e soltando. A lista de destino
 *   se destaca e um espaço tracejado mostra onde o cartão vai cair.
 * - Cada lista tem nome, contagem e ação de criar. Lista vazia explica.
 * - No celular as listas viram abas; mover é feito pelo detalhe da tarefa.
 */
export default function Quadro({ projeto, tarefas, onAbrir }: { projeto: Projeto; tarefas: Tarefa[]; onAbrir: (id: string) => void }) {
  const d = useDados();
  const avisar = useToast();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<{ colunaId: string; indice: number } | null>(null);
  const [colunaMobile, setColunaMobile] = useState(projeto.colunas[0]?.id);
  const [novaLista, setNovaLista] = useState<string | null>(null);
  const [renomeando, setRenomeando] = useState<string | null>(null);
  const ultima = projeto.colunas[projeto.colunas.length - 1]?.id;
  const cor = corQuadro(projeto.cor);

  const daColuna = (id: string) => tarefas.filter((t) => t.colunaId === id).sort((a, b) => a.ordem - b.ordem);

  const onDragOver = (e: DragEvent<HTMLDivElement>, colunaId: string) => {
    if (!arrastando) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const cartoes = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-cartao]')].filter((el) => el.dataset.cartao !== arrastando);
    let indice = cartoes.length;
    for (let i = 0; i < cartoes.length; i++) {
      const r = cartoes[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { indice = i; break; }
    }
    if (alvo?.colunaId !== colunaId || alvo.indice !== indice) setAlvo({ colunaId, indice });
  };

  const onDrop = (e: DragEvent, colunaId: string) => {
    e.preventDefault();
    if (arrastando && alvo) {
      const t = tarefas.find((x) => x.id === arrastando);
      d.moverTarefa(arrastando, colunaId, alvo.indice);
      if (t && t.colunaId !== colunaId) avisar(`“${t.titulo}” movida para ${projeto.colunas.find((c) => c.id === colunaId)?.titulo}.`);
    }
    setArrastando(null); setAlvo(null);
  };

  const salvarColunas = (colunas: Projeto['colunas']) => d.salvar('projetos', { ...projeto, colunas });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl" style={{ background: cor.fundo }}>
      {/* Abas de lista no celular */}
      <div className="rolagem flex gap-1.5 overflow-x-auto p-3 md:hidden" role="tablist" aria-label="Listas do quadro">
        {projeto.colunas.map((c) => (
          <button key={c.id} role="tab" aria-selected={colunaMobile === c.id} onClick={() => setColunaMobile(c.id)}
            className={cx('shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              colunaMobile === c.id ? 'bg-white text-[#14161F]' : 'bg-white/15 text-white hover:bg-white/25')}>
            {c.titulo} <span className="opacity-70">{daColuna(c.id).length}</span>
          </button>
        ))}
      </div>

      <div className="rolagem flex flex-1 items-start gap-3 overflow-x-auto p-3 pt-0 md:pt-3">
        {projeto.colunas.map((col) => {
          const lista = daColuna(col.id);
          const destacada = alvo?.colunaId === col.id;
          const semArrastado = lista.filter((t) => t.id !== arrastando);
          return (
            <section key={col.id} aria-label={`Lista ${col.titulo}`}
              className={cx('flex max-h-full w-full shrink-0 flex-col rounded-2xl bg-fundo/95 shadow-sm backdrop-blur-sm transition-[box-shadow,background-color] duration-150 md:w-[264px]',
                colunaMobile !== col.id && 'hidden md:flex',
                destacada && 'bg-fundo ring-2 ring-white/80')}>
              <header className="flex items-center gap-2 px-3 pb-1 pt-3">
                {renomeando === col.id ? (
                  <input autoFocus defaultValue={col.titulo} aria-label="Nome da lista"
                    onBlur={(e) => { const v = e.target.value.trim(); if (v) salvarColunas(projeto.colunas.map((c) => c.id === col.id ? { ...c, titulo: v } : c)); setRenomeando(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenomeando(null); }}
                    className="h-8 flex-1 rounded-md border border-primaria bg-superficie px-2 text-sm font-semibold text-tinta focus:outline-none" />
                ) : (
                  <h3 className="flex-1 truncate px-1 font-space text-[14px] font-semibold text-tinta" onDoubleClick={() => setRenomeando(col.id)}>{col.titulo}</h3>
                )}
                <span className="rounded-full bg-superficie-alt px-2 py-0.5 text-[12px] font-semibold tabular-nums text-tinta-suave">{lista.length}</span>
                <Menu largura="w-48" gatilho={(p) => (
                  <button onClick={p.alternar} aria-expanded={p['aria-expanded']} aria-haspopup="menu" aria-label={`Ações da lista ${col.titulo}`}
                    className="rounded-lg p-1 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta"><MoreHorizontal className="h-4 w-4" /></button>
                )}>
                  {(fechar) => (<>
                    <ItemMenu onClick={() => { setRenomeando(col.id); fechar(); }}>Renomear lista</ItemMenu>
                    <ItemMenu perigo onClick={() => {
                      fechar();
                      if (lista.length) { avisar('Mova ou exclua os cartões antes de excluir a lista.', 'erro'); return; }
                      if (projeto.colunas.length <= 2) { avisar('O quadro precisa de pelo menos duas listas.', 'erro'); return; }
                      salvarColunas(projeto.colunas.filter((c) => c.id !== col.id));
                    }}>Excluir lista</ItemMenu>
                  </>)}
                </Menu>
              </header>

              <div className="rolagem flex min-h-16 flex-col gap-2 overflow-y-auto px-2 py-2"
                onDragOver={(e) => onDragOver(e, col.id)} onDrop={(e) => onDrop(e, col.id)}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setAlvo(null); }}>
                {lista.map((t) => {
                  const pos = semArrastado.findIndex((x) => x.id === t.id);
                  return (
                    <div key={t.id}>
                      {destacada && pos === alvo!.indice && t.id !== arrastando && <Espaco />}
                      <CartaoTarefa tarefa={t} concluida={col.id === ultima} arrastando={arrastando === t.id}
                        onAbrir={() => onAbrir(t.id)}
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => setArrastando(t.id), 0); }}
                        onDragEnd={() => { setArrastando(null); setAlvo(null); }} />
                    </div>
                  );
                })}
                {destacada && alvo!.indice >= semArrastado.length && <Espaco texto={lista.length === 0 ? 'Solte aqui' : undefined} />}
                {lista.length === 0 && !destacada && (
                  <p className="rounded-xl border border-dashed border-borda px-3 py-5 text-center text-[12px] leading-relaxed text-tinta-suave">
                    Nenhum cartão aqui.{col.id === ultima ? ' Tarefas concluídas aparecem nesta lista.' : ' Arraste um cartão ou crie um novo.'}
                  </p>
                )}
              </div>

              <CriarCartao projeto={projeto} colunaId={col.id} ordem={lista.length} />
            </section>
          );
        })}

        {/* Adicionar lista */}
        <div className="hidden w-[264px] shrink-0 md:block">
          {novaLista === null ? (
            <button onClick={() => setNovaLista('')}
              className="flex w-full items-center gap-2 rounded-2xl bg-white/20 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Plus className="h-4 w-4" aria-hidden />Adicionar outra lista
            </button>
          ) : (
            <form className="rounded-2xl bg-fundo p-2.5" onSubmit={(e) => {
              e.preventDefault();
              if (!novaLista.trim()) return;
              // Nova lista entra antes da última (que representa "Pronto")
              const cols = [...projeto.colunas];
              cols.splice(cols.length - 1, 0, { id: novoId('col'), titulo: novaLista.trim() });
              salvarColunas(cols); setNovaLista(null); avisar('Lista adicionada antes de “Pronto”.');
            }}>
              <input autoFocus value={novaLista} onChange={(e) => setNovaLista(e.target.value)} placeholder="Nome da lista" aria-label="Nome da nova lista"
                onKeyDown={(e) => e.key === 'Escape' && setNovaLista(null)}
                className="h-9 w-full rounded-lg border border-primaria bg-superficie px-3 text-sm text-tinta focus:outline-none focus:ring-4 focus:ring-primaria/20" />
              <div className="mt-2 flex items-center gap-1">
                <Button type="submit" tamanho="sm">Adicionar lista</Button>
                <button type="button" onClick={() => setNovaLista(null)} aria-label="Cancelar" className="rounded-lg p-1.5 text-tinta-suave hover:bg-superficie-alt"><X className="h-4 w-4" /></button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Espaco({ texto }: { texto?: string }) {
  return (
    <div className="mb-2 flex h-16 items-center justify-center rounded-xl border-2 border-dashed border-primaria/50 bg-primaria-suave/60 text-[12px] font-semibold text-primaria" aria-hidden>
      {texto}
    </div>
  );
}

/** Criação rápida de cartão. Responsável e prazo são obrigatórios (slide 21). */
function CriarCartao({ projeto, colunaId, ordem }: { projeto: Projeto; colunaId: string; ordem: number }) {
  const d = useDados();
  const avisar = useToast();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [resp, setResp] = useState('');
  const [prazo, setPrazo] = useState(somaDias(hojeISO(), 7));
  const [erro, setErro] = useState('');
  const campo = useRef<HTMLTextAreaElement>(null);

  const equipe = [...new Set(d.alocacoes.filter((a) => a.projetoId === projeto.id).map((a) => a.pessoaId))].map((id) => d.pessoa(id)!).filter(Boolean);

  const criar = () => {
    if (!titulo.trim()) { setErro('Dê um título ao cartão.'); return; }
    if (!resp) { setErro('Escolha o responsável.'); return; }
    if (!prazo) { setErro('Informe o prazo.'); return; }
    d.salvar('tarefas', { id: novoId('tar'), projetoId: projeto.id, colunaId, titulo: titulo.trim(), descricao: '', responsavelId: resp, prazo, prioridade: 'media', etiquetas: [], checklist: [], comentarios: [], ordem });
    avisar('Cartão criado.');
    setTitulo(''); setErro('');
    campo.current?.focus();
  };

  if (!aberto) return (
    <button onClick={() => setAberto(true)}
      className="m-2 mt-0 flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold text-tinta-suave transition-colors hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
      <Plus className="h-4 w-4" aria-hidden />Adicionar cartão
    </button>
  );

  return (
    <form className="m-2 mt-0 space-y-2" onSubmit={(e) => { e.preventDefault(); criar(); }}>
      <textarea ref={campo} autoFocus rows={2} value={titulo} onChange={(e) => { setTitulo(e.target.value); setErro(''); }} placeholder="Insira um título para este cartão…" aria-label="Título do cartão"
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); criar(); } if (e.key === 'Escape') setAberto(false); }}
        className="w-full resize-none rounded-xl border border-borda bg-superficie px-3 py-2 text-sm text-tinta shadow-sm placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
      <div className="grid grid-cols-2 gap-2">
        <select value={resp} onChange={(e) => { setResp(e.target.value); setErro(''); }} aria-label="Responsável"
          className="h-8 rounded-lg border border-borda bg-superficie px-2 text-[12px] text-tinta focus:border-primaria focus:outline-none">
          <option value="">Responsável…</option>
          {equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} aria-label="Prazo"
          className="h-8 rounded-lg border border-borda bg-superficie px-2 text-[12px] text-tinta focus:border-primaria focus:outline-none" />
      </div>
      {equipe.length === 0 && <p className="text-[12px] text-aviso">Aloque pessoas na aba Equipe para escolher um responsável.</p>}
      {erro && <p role="alert" className="text-[12px] font-medium text-erro">{erro}</p>}
      <div className="flex items-center gap-1">
        <Button type="submit" tamanho="sm">Adicionar cartão</Button>
        <button type="button" onClick={() => { setAberto(false); setErro(''); }} aria-label="Cancelar" className="rounded-lg p-1.5 text-tinta-suave hover:bg-superficie-alt"><X className="h-4 w-4" /></button>
      </div>
    </form>
  );
}
