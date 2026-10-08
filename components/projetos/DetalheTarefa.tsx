/* ============================================================================
   DETALHETAREFA.TSX
   O que é: o painel (modal) com todos os dados de uma tarefa. Admin edita na hora;
                 os outros perfis veem os campos como TEXTO somente leitura (a regra
                 está em lib/permissoes.ts). Comentar fica liberado a quem enxerga o projeto;
                 comentário de quem é do perfil Empresa ganha a etiqueta "Empresa".
   Onde é usado: app/(sistema)/projetos/[id]/page.tsx, aberto ao clicar num
                 cartão do Quadro ou numa linha das vistas Lista/Cronograma.
   Depende de: lib/store (useDados), lib/auth (useAuth, autor do comentário),
               lib/permissoes (podeFazer), lib/escopo (podeVerProjeto), lib/metricas,
               lib/toast (useToast), components/ui/Modal, components/button,
               components/ui/form (Select), components/ui/basicos, components/projetos/AnexosDaTarefa e lib/utils.
   Contexto: §5 Projetos (tarefa com responsável e prazo obrigatórios,
             checklist, etiquetas, anexos, comentários; detalhe abre por cima do quadro).
   ============================================================================ */
"use client";

import { useState } from 'react';
import { X, AlignLeft, CheckSquare, Square, MessageSquare, Tag, Trash2, Plus, CreditCard } from 'lucide-react';
import { useDados, Tarefa } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { podeFazer } from '@/lib/permissoes';
import { podeVerProjeto } from '@/lib/escopo';
import { ROTULO_PRIORIDADE } from '@/lib/metricas';
import Modal from '@/components/ui/Modal';
import AnexosDaTarefa from './AnexosDaTarefa';
import Button from '@/components/button';
import { Select } from '@/components/ui/form';
import { Avatar, Etiqueta, EtiquetaTarefa, Progresso, corEtiqueta } from '@/components/ui/basicos';
import { cx, dataBR, novoId, tempoRelativo, hojeISO } from '@/lib/utils';

// Etiquetas oferecidas como atalho; o usuário pode criar outras no campo "Nova etiqueta".
const ETIQUETAS_SUGERIDAS = ['Front', 'UX', 'API', 'QA', 'Login', 'Gráfico', 'Back'];

/**
 * Detalhe da tarefa (slide 21). Abre por cima do quadro, sem trocar de
 * página. Tudo salva na hora. "Status" é também o "mover para…" do celular.
 *
 * Não há botão "Salvar": cada campo grava assim que muda (onChange).
 *
 * Permissões: quem NÃO pode editar vê os campos como TEXTO (não como inputs
 * desabilitados). Um input desabilitado é pulado pelo Tab e muitos leitores de
 * tela o anunciam como "indisponível" sem dizer o valor; texto comum é lido
 * normalmente, na ordem da página, e o valor aparece junto do rótulo.
 * Status ("mover para…", usado no celular no lugar do arrastar) segue a regra de
 * mover do quadro: Admin sempre, Profissional só nas próprias tarefas.
 *
 * @param tarefaId id da tarefa a mostrar.
 * @param onFechar fecha o painel (a página tira o ?tarefa= da URL).
 * @returns o modal da tarefa, ou null se ela não existir mais.
 */
export default function DetalheTarefa({ tarefaId, onFechar }: { tarefaId: string; onFechar: () => void }) {
  const d = useDados();
  const { sessao } = useAuth();
  const avisar = useToast();
  const t = d.tarefas.find((x) => x.id === tarefaId);
  // Rascunhos dos campos de "adicionar" (checklist, comentário, etiqueta).
  const [novoItem, setNovoItem] = useState('');
  const [comentario, setComentario] = useState('');
  const [novaEtiqueta, setNovaEtiqueta] = useState('');
  // Exclusão em dois passos: o primeiro clique só pede confirmação.
  const [confirmar, setConfirmar] = useState(false);

  // Tarefa apagada (ou link antigo): não renderiza nada. Os hooks ficam
  // ACIMA deste return porque o React exige que rodem sempre na mesma ordem.
  if (!t) return null;
  const projeto = d.projeto(t.projetoId)!;
  // Permissões desta sessão (lib/permissoes.ts). Sem sessão, nada é permitido.
  // ⚠️ ATENÇÃO: o mesmo 'mover_tarefa' é conferido em components/projetos/Quadro.tsx; as duas
  // telas precisam concordar, senão dá para mover pelo detalhe o que o quadro bloqueia.
  const podeEditar = !!sessao && podeFazer(sessao.perfil, 'editar_tarefa');
  const podeExcluir = !!sessao && podeFazer(sessao.perfil, 'excluir_tarefa');
  const podeMover = !!sessao && podeFazer(sessao.perfil, 'mover_tarefa', { pessoaId: sessao.pessoaId, responsavelId: t.responsavelId });
  // Comentar: qualquer perfil que enxerga o projeto (escopo em lib/escopo.ts).
  const podeComentar = !!sessao && podeFazer(sessao.perfil, 'comentar_tarefa', { enxergaProjeto: podeVerProjeto(sessao, t.projetoId, d) });
  // Anexar e remover arquivo (G03): admin em qualquer tarefa; profissional só nas próprias; Empresa só vê.
  const podeAnexar = !!sessao && podeFazer(sessao.perfil, 'anexar_arquivo', { pessoaId: sessao.pessoaId, responsavelId: t.responsavelId });
  const coluna = projeto.colunas.find((c) => c.id === t.colunaId);
  const feitos = t.checklist.filter((c) => c.feito).length;
  // Opções de responsável: equipe alocada + o responsável atual (mesmo que
  // já tenha saído da equipe, para o select não ficar sem valor).
  const equipe = [...new Set([...d.alocacoes.filter((a) => a.projetoId === projeto.id).map((a) => a.pessoaId), t.responsavelId])].map((id) => d.pessoa(id)!).filter(Boolean);
  /**
   * Salva só os campos alterados, mantendo o resto da tarefa.
   * @param p campos que mudaram.
   * @example atualizar({ prioridade: 'alta' })
   */
  // GRAVA: toda edição deste painel passa por aqui e vai para a store.
  // TODO(API): virar PATCH da tarefa quando a API da PROGLOGIC existir.
  const atualizar = (p: Partial<Tarefa>) => d.salvar('tarefas', { ...t, ...p });

  /** Adiciona um item ao checklist (ignora texto vazio). */
  const addItem = () => {
    if (!novoItem.trim()) return;
    // GRAVA: novo item começa não feito.
    atualizar({ checklist: [...t.checklist, { id: novoId('ck'), texto: novoItem.trim(), feito: false }] });
    setNovoItem('');
  };
  /** Publica um comentário assinado por quem está logado (ignora texto vazio). */
  const addComentario = () => {
    if (!comentario.trim()) return;
    // GRAVA: comentário com autor da sessão e data/hora atual (ISO).
    atualizar({ comentarios: [...t.comentarios, { id: novoId('cm'), autorId: sessao!.pessoaId, texto: comentario.trim(), data: new Date().toISOString() }] });
    setComentario('');
  };
  /**
   * Liga/desliga uma etiqueta: se a tarefa já tem, tira; se não tem, põe.
   * @param e nome da etiqueta.
   */
  const alternarEtiqueta = (e: string) => atualizar({ etiquetas: t.etiquetas.includes(e) ? t.etiquetas.filter((x) => x !== e) : [...t.etiquetas, e] });

  // Estilo comum dos títulos de seção (Descrição, Checklist, Comentários).
  const secao = 'mb-2 flex items-center gap-2 font-space text-[15px] font-semibold text-tinta';

  return (
    // Modal = abre por cima do quadro, sem trocar de página (§5).
    <Modal aberto onFechar={onFechar} tamanho="lg" titulo={t.titulo}
      cabecalho={
        <div className="flex items-start gap-3 border-b border-borda px-6 py-4">
          <CreditCard className="mt-1.5 h-5 w-5 shrink-0 text-tinta-suave" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-tinta-suave">{projeto.nome} › Tarefas</p>
            {/* Título editável no próprio cabeçalho; -ml-1.5 compensa o padding para alinhar o texto. */}
            {podeEditar ? (
              <input value={t.titulo} onChange={(e) => atualizar({ titulo: e.target.value })} aria-label="Título da tarefa"
                className="-ml-1.5 w-full rounded-md bg-transparent px-1.5 py-0.5 font-space text-xl font-semibold text-tinta focus:bg-superficie-alt focus:outline-none focus:ring-2 focus:ring-primaria/40" />
            ) : (
              // Somente leitura: o título aparece como texto (o Modal já nomeia o diálogo com ele).
              <p className="py-0.5 font-space text-xl font-semibold text-tinta">{t.titulo}</p>
            )}
            <p className="text-[13px] text-tinta-suave">na lista <strong className="text-tinta">{coluna?.titulo}</strong></p>
          </div>
          <button onClick={onFechar} aria-label="Fechar" className="-mr-2 rounded-lg p-2 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta"><X className="h-5 w-5" /></button>
        </div>
      }>
      {/* Duas colunas no desktop: conteúdo à esquerda, lateral de 220px à direita. */}
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
            {podeEditar ? (
              <textarea value={t.descricao} onChange={(e) => atualizar({ descricao: e.target.value })} rows={3} placeholder="Adicione uma descrição mais detalhada…" aria-label="Descrição"
                className="w-full resize-y rounded-xl border border-borda bg-superficie-alt/50 px-3.5 py-2.5 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:bg-superficie focus:outline-none focus:ring-4 focus:ring-primaria/20" />
            ) : (
              <p className="whitespace-pre-line text-sm text-tinta">{t.descricao || <span className="text-tinta-suave">Sem descrição.</span>}</p>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className={secao}><CheckSquare className="h-4 w-4" aria-hidden />Checklist · {feitos} de {t.checklist.length}</h3>
            </div>
            {/* Barra de progresso só com itens (evita divisão por zero); fica verde ao completar. */}
            {t.checklist.length > 0 && (
              <div className="mb-3 flex items-center gap-3">
                <span className="w-9 text-[12px] font-semibold tabular-nums text-tinta-suave">{Math.round((feitos / t.checklist.length) * 100)}%</span>
                <Progresso valor={(feitos / t.checklist.length) * 100} tom={feitos === t.checklist.length ? 'sucesso' : 'primaria'} fino rotulo="Progresso do checklist" />
              </div>
            )}
            <ul className="space-y-1">
              {t.checklist.map((c) => !podeEditar ? (
                // Somente leitura: ícone + texto; o estado (feito/pendente) vai também em texto para leitor de tela.
                <li key={c.id} className="flex items-center gap-2.5 px-2 py-1.5 text-sm">
                  {c.feito ? <CheckSquare className="h-4 w-4 text-sucesso" aria-hidden /> : <Square className="h-4 w-4 text-tinta-fraca" aria-hidden />}
                  <span className={cx('flex-1', c.feito ? 'text-tinta-suave line-through' : 'text-tinta')}>{c.texto}</span>
                  <span className="sr-only">{c.feito ? '(feito)' : '(pendente)'}</span>
                </li>
              ) : (
                // "group" permite que o botão de remover apareça só no hover da linha.
                <li key={c.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-superficie-alt">
                  <input type="checkbox" checked={c.feito} id={c.id} className="h-4 w-4 accent-[var(--primaria)]"
                    // GRAVA: inverte o "feito" só deste item.
                    onChange={() => atualizar({ checklist: t.checklist.map((x) => x.id === c.id ? { ...x, feito: !x.feito } : x) })} />
                  <label htmlFor={c.id} className={cx('flex-1 cursor-pointer text-sm', c.feito ? 'text-tinta-suave line-through' : 'text-tinta')}>{c.texto}</label>
                  {/*
                    * APAGA: remove o item do checklist. Invisível (opacity-0) até o
                    * mouse passar na linha ou o botão receber foco pelo teclado.
                    */}
                  <button onClick={() => atualizar({ checklist: t.checklist.filter((x) => x.id !== c.id) })} aria-label={`Remover item ${c.texto}`}
                    className="rounded p-1 text-tinta-fraca opacity-0 hover:text-erro focus:opacity-100 group-hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
            {/* Adicionar item: só para quem edita a tarefa (escondido, não desabilitado, para os demais). */}
            {podeEditar && <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); addItem(); }}>
              <input value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Adicionar um item" aria-label="Novo item do checklist"
                className="h-9 flex-1 rounded-lg border border-borda bg-superficie px-3 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
              <Button type="submit" variante="secundario" tamanho="sm" className="h-9">Adicionar</Button>
            </form>}
            {!podeEditar && t.checklist.length === 0 && <p className="text-[13px] text-tinta-suave">Esta tarefa não tem checklist.</p>}
          </section>

          {/* Anexos (G03, SIMULADO: só metadados) — entre o checklist e os comentários. */}
          <AnexosDaTarefa tarefa={t} podeAnexar={podeAnexar} />

          <section>
            <h3 className={secao}><MessageSquare className="h-4 w-4" aria-hidden />Comentários</h3>
            {/* Comentar: liberado a quem enxerga o projeto (inclui Empresa e Profissional). */}
            {podeComentar && <form className="mb-4 flex gap-3" onSubmit={(e) => { e.preventDefault(); addComentario(); }}>
              <Avatar nome={sessao?.nome ?? ''} tamanho={32} />
              <div className="flex-1">
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} placeholder="Escreva um comentário…" aria-label="Novo comentário"
                  // Ctrl+Enter (ou Cmd+Enter no Mac) envia; Enter sozinho quebra linha.
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addComentario(); }}
                  className="w-full resize-none rounded-xl border border-borda bg-superficie px-3 py-2 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
                {/* Botão "Comentar" só aparece quando há texto. */}
                {comentario.trim() && <Button type="submit" tamanho="sm" className="mt-1.5">Comentar</Button>}
              </div>
            </form>}
            <ul className="space-y-4">
              {/* Mais recentes primeiro; a cópia ([...]) evita inverter o array guardado na store. */}
              {[...t.comentarios].reverse().map((c) => {
                const autor = d.pessoa(c.autorId);
                return (
                  <li key={c.id} className="flex gap-3">
                    <Avatar nome={autor?.nome ?? '?'} tamanho={32} />
                    <div className="min-w-0 flex-1">
                      {/* Comentário do cliente (perfil Empresa) ganha a etiqueta "Empresa" ao lado do nome,
                        * para o time identificar quem é o cliente na conversa (E02). O nome da empresa vai
                        * no title (tooltip); a etiqueta é texto, não só cor. */}
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                        <strong className="text-tinta">{autor?.nome}</strong>
                        {autor?.perfil === 'empresa' && (
                          <span title={d.empresa(autor.empresaId ?? '')?.nomeFantasia}><Etiqueta tom="primaria">Empresa</Etiqueta></span>
                        )}
                        <span className="text-tinta-suave">{tempoRelativo(c.data)}</span>
                      </p>
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
          {/*
            * Status = em que lista a tarefa está. No celular este é o
            * "mover para..." que substitui o arrastar (§5).
            */}
          {podeMover ? <Select label="Status" required value={t.colunaId} hint="Mover para outra lista"
            // GRAVA: índice 999 = "fim da lista"; moverTarefa limita ao tamanho real.
            // TODO(API): mesma chamada de mover do Quadro (com aviso via WebSocket).
            onChange={(e) => { d.moverTarefa(t.id, e.target.value, 999); avisar(`Movida para ${projeto.colunas.find((c) => c.id === e.target.value)?.titulo}.`); }}
            opcoes={projeto.colunas.map((c) => ({ valor: c.id, rotulo: c.titulo }))} />
            : <CampoTexto rotulo="Status" dica={sessao?.perfil === 'profissional' ? 'Só o responsável pode mover' : undefined}>{coluna?.titulo}</CampoTexto>}
          {podeEditar ? <Select label="Responsável" required value={t.responsavelId} onChange={(e) => atualizar({ responsavelId: e.target.value })}
            opcoes={equipe.map((p) => ({ valor: p.id, rotulo: p.nome }))} />
            : <CampoTexto rotulo="Responsável">{d.pessoa(t.responsavelId)?.nome ?? 'Ninguém'}</CampoTexto>}
          {podeEditar ? <div className="flex flex-col gap-1.5">
            <label htmlFor="prazo-tarefa" className="text-[13px] font-medium text-tinta">Prazo<span className="ml-0.5 text-erro" aria-hidden>*</span></label>
            {/*
              * Prazo é obrigatório: só grava se o campo não ficou vazio.
              * Borda vermelha quando já venceu E a tarefa não está na última
              * lista ("Pronto"); concluída não conta como vencida.
              */}
            <input id="prazo-tarefa" type="date" value={t.prazo} onChange={(e) => e.target.value && atualizar({ prazo: e.target.value })}
              className={cx('h-10 rounded-lg border bg-superficie px-3 text-sm text-tinta focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/25',
                t.prazo < hojeISO() && t.colunaId !== projeto.colunas.at(-1)?.id ? 'border-erro' : 'border-borda')} />
            {/* Mensagem em texto junto da cor (cor nunca aparece sozinha). */}
            {t.prazo < hojeISO() && t.colunaId !== projeto.colunas.at(-1)?.id && <p className="text-[12px] font-medium text-erro">Prazo vencido.</p>}
          </div>
            : <CampoTexto rotulo="Prazo">{dataBR(t.prazo)}{t.prazo < hojeISO() && t.colunaId !== projeto.colunas.at(-1)?.id && <span className="ml-2 text-[12px] font-medium text-erro">Prazo vencido.</span>}</CampoTexto>}
          {podeEditar ? <Select label="Prioridade" value={t.prioridade} onChange={(e) => atualizar({ prioridade: e.target.value as Tarefa['prioridade'] })}
            opcoes={[{ valor: 'baixa', rotulo: 'Baixa' }, { valor: 'media', rotulo: 'Média' }, { valor: 'alta', rotulo: 'Alta' }]} />
            : <CampoTexto rotulo="Prioridade">{ROTULO_PRIORIDADE[t.prioridade]}</CampoTexto>}

          {/* Editor de etiquetas: só Admin. Os outros perfis já veem as etiquetas da tarefa no topo. */}
          {podeEditar && <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-tinta"><Tag className="h-3.5 w-3.5" aria-hidden />Etiquetas</p>
            <div className="flex flex-wrap gap-1.5">
              {/* Sugeridas + as que a tarefa já tem, sem repetir (Set). */}
              {[...new Set([...ETIQUETAS_SUGERIDAS, ...t.etiquetas])].map((e) => {
                const on = t.etiquetas.includes(e);
                const c = corEtiqueta(e);
                return (
                  // Botão liga/desliga: aria-pressed informa o estado; desligada fica apagada (opacity-35).
                  <button key={e} type="button" onClick={() => alternarEtiqueta(e)} aria-pressed={on}
                    className={cx('h-6 rounded-md px-2 text-[12px] font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60', !on && 'opacity-35 hover:opacity-70')}
                    style={{ background: c.bg, color: c.fg }}>{e}</button>
                );
              })}
            </div>
            {/* GRAVA: cria etiqueta nova (ignora vazia ou repetida) e limpa o campo. */}
            <form className="mt-2 flex gap-1" onSubmit={(e) => { e.preventDefault(); const v = novaEtiqueta.trim(); if (v && !t.etiquetas.includes(v)) atualizar({ etiquetas: [...t.etiquetas, v] }); setNovaEtiqueta(''); }}>
              <input value={novaEtiqueta} onChange={(e) => setNovaEtiqueta(e.target.value)} placeholder="Nova etiqueta" aria-label="Nova etiqueta"
                className="h-8 min-w-0 flex-1 rounded-lg border border-borda bg-superficie px-2 text-[12px] text-tinta focus:border-primaria focus:outline-none" />
              <button type="submit" aria-label="Adicionar etiqueta" className="rounded-lg border border-borda px-2 text-tinta-suave hover:bg-superficie-alt"><Plus className="h-3.5 w-3.5" /></button>
            </form>
          </div>}

          {/* Exclusão em dois passos para evitar clique acidental. Só quem pode excluir tarefa. */}
          {podeExcluir && <div className="border-t border-borda pt-4">
            {!confirmar ? (
              <Button variante="fantasma" larguraTotal className="justify-start text-erro hover:bg-erro/10 hover:text-erro" onClick={() => setConfirmar(true)}>
                <Trash2 className="h-4 w-4" aria-hidden />Excluir tarefa
              </Button>
            ) : (
              <div className="rounded-xl border border-erro/30 bg-erro/5 p-3">
                <p className="mb-2 text-[13px] text-tinta">Excluir de vez? Não dá para desfazer.</p>
                <div className="flex gap-2">
                  {/*
                    * APAGA: remove a tarefa da store (com checklist e comentários,
                    * que moram dentro dela) e fecha o painel.
                    * TODO(API): trocar por DELETE da tarefa.
                    */}
                  <Button tamanho="sm" variante="perigo" onClick={() => { d.remover('tarefas', t.id); avisar('Tarefa excluída.'); onFechar(); }}>Excluir</Button>
                  <Button tamanho="sm" variante="secundario" onClick={() => setConfirmar(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>}
        </aside>
      </div>
    </Modal>
  );
}

/**
 * Campo somente leitura: rótulo e valor em TEXTO (alternativa a um input desabilitado).
 * @param rotulo - nome do campo (ex.: "Prazo").
 * @param children - o valor já formatado.
 * @param dica - frase curta opcional abaixo do valor (ex.: por que não dá para mover).
 * @returns o par rótulo + valor.
 */
function CampoTexto({ rotulo, children, dica }: { rotulo: string; children: React.ReactNode; dica?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[13px] font-medium text-tinta">{rotulo}</p>
      <p className="text-sm text-tinta">{children}</p>
      {dica && <p className="text-[12px] text-tinta-suave">{dica}</p>}
    </div>
  );
}
