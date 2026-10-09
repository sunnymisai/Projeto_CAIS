/* ============================================================================
   QUADRO.TSX
   O que é: o quadro kanban de um projeto (listas + cartões com arrastar e soltar), com o
     indicador "Ao vivo" e o destaque do cartão que outra pessoa mexeu (tempo real simulado, G02).
               Respeita o perfil: só quem pode mover arrasta, e os botões de criar
               cartão/lista e de editar lista só existem para quem pode usá-los.
   Onde é usado: app/(sistema)/projetos/[id]/page.tsx, na vista "quadro" da aba Tarefas.
   Depende de: lib/store (useDados: moverTarefa, salvar, alocacoes, pessoa, eventoExterno do tempo real),
               lib/auth (useAuth), lib/permissoes (podeFazer), lib/toast (useToast), lib/utils (cx, hojeISO, novoId, somaDias),
               components/button, components/ui/Menu, ./CartaoTarefa e ./cores.
               Arrastar e soltar é a API nativa do HTML5 (sem biblioteca).
   Contexto: §5 Projetos (kanban, colunas padrão, tarefa com responsável e
             prazo obrigatórios, tempo real via WebSocket).
   ============================================================================ */
"use client";

import { DragEvent, useEffect, useRef, useState } from 'react';
import { Plus, X, MoreHorizontal } from 'lucide-react';
import { useDados, Projeto, Tarefa } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { podeFazer } from '@/lib/permissoes';
import { useToast } from '@/lib/toast';
import Button from '@/components/button';
import Menu, { ItemMenu } from '@/components/ui/Menu';
import CartaoTarefa from './CartaoTarefa';
import { corQuadro } from './cores';
import { cx, hojeISO, novoId, somaDias } from '@/lib/utils';

// [PV-1] O QUADRO KANBAN: listas lado a lado no desktop e abas no celular, arrastar e soltar nativo (HTML5), criar cartão e gerenciar listas.
/**
 * Quadro kanban inspirado no Trello (slide 20).
 * - Arrastar e soltar: repouso, arrastando e soltando. A lista de destino
 *   se destaca e um espaço tracejado mostra onde o cartão vai cair.
 * - Cada lista tem nome, contagem e ação de criar. Lista vazia explica.
 * - No celular as listas viram abas; mover é feito pelo detalhe da tarefa.
 * - Permissões (lib/permissoes.ts): Admin arrasta tudo; Profissional só os cartões
 *   em que é o responsável (os outros mostram cadeado); Empresa não arrasta.
 *   Criar cartão, criar/renomear/excluir lista: só Admin. Esses botões são
 *   ESCONDIDOS (não desabilitados): botão desabilitado sem motivo visível deixa a
 *   pessoa se perguntando o que fazer, e leitor de tela ainda o anuncia como
 *   "indisponível". Se a pessoa nunca poderá usar, o melhor é nem mostrar.
 *
 * Como o arraste funciona (eventos nativos do HTML5, nesta ordem):
 * 1. dragstart (no cartão): guarda o id de quem está sendo arrastado.
 * 2. dragover (na lista, várias vezes por segundo): calcula em que posição
 *    o cartão cairia e desenha o espaço tracejado ali.
 * 3. dragleave (na lista): se o mouse saiu da lista, apaga o destaque.
 * 4. drop (na lista): grava a nova coluna/posição na store.
 * 5. dragend (no cartão): sempre roda no final, soltando ou cancelando
 *    (Esc ou soltar fora), e limpa o estado.
 *
 * @param projeto projeto dono do quadro (listas, cor de fundo).
 * @param tarefas tarefas a exibir (já filtradas pela tela).
 * @param onAbrir abre o detalhe da tarefa pelo id.
 * @returns o quadro com abas no celular e listas lado a lado no desktop.
 */
export default function Quadro({ projeto, tarefas, onAbrir }: { projeto: Projeto; tarefas: Tarefa[]; onAbrir: (id: string) => void }) {
  const d = useDados();
  const { sessao } = useAuth();
  const avisar = useToast();
  // [PV-2] AS PERMISSÕES DO QUADRO: tudo passa por podeFazer (lib/permissoes.ts). Os botões de criar cartão e de editar lista só aparecem para quem tem a permissão; o detalhe da tarefa precisa concordar com esta regra.
  /**
   * Pergunta a lib/permissoes se a sessão pode a ação. Sem sessão, nada é permitido.
   * @param acao - ação de projeto.
   * @param responsavelId - responsável da tarefa, quando a ação é sobre uma tarefa.
   */
  const pode = (acao: Parameters<typeof podeFazer>[1], responsavelId?: string) =>
    !!sessao && podeFazer(sessao.perfil, acao, { pessoaId: sessao.pessoaId, responsavelId });
  // Botões de criar/editar lista e criar cartão: só aparecem para quem pode (ver nota acima).
  const podeEditarLista = pode('editar_lista');
  const podeCriar = pode('criar_tarefa');
  // Id do cartão sendo arrastado (null = estado de repouso).
  const [arrastando, setArrastando] = useState<string | null>(null);
  // Onde o cartão cairia se fosse solto agora: lista e posição dentro dela.
  const [alvo, setAlvo] = useState<{ colunaId: string; indice: number } | null>(null);
  // TEMPO REAL (G02): cartão que outra pessoa acabou de mexer (destaque) e a frase do aviso.
  const [destaque, setDestaque] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState('');
  // [PV-3] O TEMPO REAL: quando OUTRA aba mexe numa tarefa deste projeto, o cartão fica destacado por 2,5 s e o aviso "Fulano moveu... para ..." aparece ao lado de "Ao vivo". SIMULADO entre abas.
  // Roda quando chega um evento de outra aba (d.eventoExterno muda). Só reage aos deste projeto.
  // Limpeza: cancela o timer que apaga o destaque, se outro evento chegar antes dos 2,5 s.
  useEffect(() => {
    const e = d.eventoExterno;
    if (!e || e.projetoId !== projeto.id) return;
    const quem = e.autorNome?.split(' ')[0] ?? 'Alguém';
    const coluna = projeto.colunas.find((c) => c.id === e.colunaId)?.titulo ?? 'outra lista';
    const frase = e.tipo === 'tarefa_movida' ? `${quem} moveu '${e.titulo}' para ${coluna}`
      : e.tipo === 'comentario_novo' ? `${quem} comentou em '${e.titulo}'`
      : e.tipo === 'tarefa_removida' ? `${quem} removeu '${e.titulo}'`
      : `${quem} atualizou '${e.titulo}'`;
    // O efeito existe para isto: reagir a algo de FORA do React (o canal entre abas).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDestaque(e.tipo === 'tarefa_removida' ? null : e.tarefaId);
    setAnuncio(frase);
    const t = setTimeout(() => setDestaque(null), 2500);
    return () => clearTimeout(t);
  }, [d.eventoExterno, projeto.id, projeto.colunas]);

  // No celular só uma lista aparece por vez; esta é a aba escolhida.
  const [colunaMobile, setColunaMobile] = useState(projeto.colunas[0]?.id);
  // Texto da nova lista; null = formulário de "Adicionar lista" fechado.
  const [novaLista, setNovaLista] = useState<string | null>(null);
  // Id da lista com o nome em edição (duplo clique no título).
  const [renomeando, setRenomeando] = useState<string | null>(null);
  // [PV-4] A ÚLTIMA LISTA É "PRONTO" (tarefa concluída). Isso vale também para o selo do cartão, o prazo do detalhe e a data de conclusão gravada ao mover (lib/store.tsx).
  // ⚠️ ATENÇÃO: a ÚLTIMA lista é tratada como "Pronto" (tarefa concluída).
  // Mudar isso afeta CartaoTarefa (selo verde), DetalheTarefa (prazo vencido)
  // e moverTarefa na store (preenche concluidaEm).
  const ultima = projeto.colunas[projeto.colunas.length - 1]?.id;
  const cor = corQuadro(projeto.cor);

  /**
   * Tarefas de uma lista, na ordem em que aparecem (campo `ordem`).
   * @param id id da coluna.
   * @returns tarefas daquela coluna, ordenadas.
   */
  const daColuna = (id: string) => tarefas.filter((t) => t.colunaId === id).sort((a, b) => a.ordem - b.ordem);

  // [PV-5] O CÁLCULO DA POSIÇÃO ao arrastar: o cartão cai antes do primeiro cartão cujo meio está abaixo do mouse; se nenhum, vai para o fim da lista.
  /**
   * Evento dragover: dispara sem parar enquanto um cartão passa por cima
   * da área de cartões de uma lista. Decide ONDE o cartão cairia.
   * @param e evento de arraste do React.
   * @param colunaId lista sob o mouse.
   */
  const onDragOver = (e: DragEvent<HTMLDivElement>, colunaId: string) => {
    // Ignora arrastes que não começaram num cartão deste quadro
    // (ex.: um arquivo arrastado do computador).
    if (!arrastando) return;
    // Por padrão o navegador NÃO deixa soltar nada num elemento. Chamar
    // preventDefault no dragover é o jeito de dizer "aqui pode soltar";
    // sem isso o evento drop nunca dispara.
    e.preventDefault();
    // Mostra o cursor de "mover" (e não o de "copiar").
    e.dataTransfer.dropEffect = 'move';
    // Pega os cartões desta lista pelo atributo data-cartao, MENOS o que
    // está sendo arrastado: ele não pode contar como vizinho de si mesmo.
    const cartoes = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-cartao]')].filter((el) => el.dataset.cartao !== arrastando);
    /*
     * Cálculo da posição de soltura, pelo meio de cada cartão:
     * - Começa supondo "no fim da lista" (indice = quantidade de cartões).
     * - Percorre os cartões de cima para baixo. getBoundingClientRect()
     *   devolve a posição do cartão na tela (top) e a altura (height).
     * - O centro vertical do cartão é top + height / 2. Se o mouse
     *   (e.clientY) está ACIMA desse centro, o cartão arrastado entra
     *   antes dele: guarda o índice e para (break).
     * Exemplo: mouse na metade de cima do 2º cartão => indice = 1.
     */
    let indice = cartoes.length;
    for (let i = 0; i < cartoes.length; i++) {
      const r = cartoes[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { indice = i; break; }
    }
    // Só atualiza o estado se o alvo mudou; dragover dispara dezenas de
    // vezes por segundo e re-renderizar sempre deixaria o quadro lento.
    if (alvo?.colunaId !== colunaId || alvo.indice !== indice) setAlvo({ colunaId, indice });
  };

  // [PV-6] A SOLTURA: confere de novo a permissão mover_tarefa e grava com moverTarefa (renumera a lista). Só avisa quando troca de lista. TODO(API).
  /**
   * Evento drop: o usuário soltou o cartão sobre uma lista.
   * @param e evento de arraste do React.
   * @param colunaId lista onde o cartão foi solto.
   */
  const onDrop = (e: DragEvent, colunaId: string) => {
    // Evita o comportamento padrão do navegador (ex.: abrir o texto
    // arrastado como se fosse um link).
    e.preventDefault();
    // Só move se havia um cartão sendo arrastado e um alvo calculado no dragover.
    const t = tarefas.find((x) => x.id === arrastando);
    // Confere a permissão de novo na hora de soltar (o dragstart já filtra, mas aqui é a gravação).
    if (arrastando && alvo && t && pode('mover_tarefa', t.responsavelId)) {
      // GRAVA: muda coluna e ordem da tarefa na store (localStorage) e
      // renumera os vizinhos da lista de destino.
      // TODO(API): trocar por chamada à API e avisar os colegas pelo
      // WebSocket de tempo real, para o cartão mover na tela deles (§5).
      d.moverTarefa(arrastando, colunaId, alvo.indice);
      // Só avisa quando trocou de lista; reordenar na mesma lista é silencioso.
      if (t.colunaId !== colunaId) avisar(`“${t.titulo}” movida para ${projeto.colunas.find((c) => c.id === colunaId)?.titulo}.`);
    }
    // Volta ao estado de repouso.
    setArrastando(null); setAlvo(null);
  };

  /**
   * Salva o projeto com uma nova lista de colunas (criar, renomear, excluir lista).
   * @param colunas novas colunas do quadro.
   */
  // GRAVA: atualiza o projeto inteiro na store.
  const salvarColunas = (colunas: Projeto['colunas']) => d.salvar('projetos', { ...projeto, colunas });

  return (
    // O fundo do quadro vem da cor escolhida no projeto (gradiente de ./cores).
    <div className="flex h-full flex-col overflow-hidden rounded-2xl" style={{ background: cor.fundo }}>
      {/* "Ao vivo" (G02): o quadro se atualiza sozinho quando alguém mexe em outra aba (SIMULADO entre abas;
        * TODO(API): com o WebSocket, entre pessoas). A frase do último movimento aparece ao lado e é
        * anunciada pelo leitor de tela sem interromper (aria-live="polite"). */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pt-3 text-[12px] font-semibold text-white/90">
        <span className="inline-flex items-center gap-1.5" title="Atualiza sozinho quando alguém mexe no quadro em outra aba (simulado)">
          <span className="h-2 w-2 rounded-full bg-sucesso motion-safe:animate-pulse" aria-hidden />Ao vivo
        </span>
        <span role="status" aria-live="polite" className="font-medium text-white/80">{anuncio}</span>
      </div>
      {/* Abas de lista no celular (md:hidden some no desktop). §5: no celular colunas viram abas. */}
      <div className="rolagem flex gap-1.5 overflow-x-auto p-3 md:hidden" role="tablist" aria-label="Listas do quadro">
        {projeto.colunas.map((c) => (
          // A aba ativa fica branca; as outras, translúcidas sobre o fundo colorido.
          <button key={c.id} role="tab" aria-selected={colunaMobile === c.id} onClick={() => setColunaMobile(c.id)}
            className={cx('shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              colunaMobile === c.id ? 'bg-white text-[#14161F]' : 'bg-white/15 text-white hover:bg-white/25')}>
            {c.titulo} <span className="opacity-70">{daColuna(c.id).length}</span>
          </button>
        ))}
      </div>

      {/* items-start: cada lista tem a altura do próprio conteúdo, como no Trello. */}
      <div className="rolagem flex flex-1 items-start gap-3 overflow-x-auto p-3 pt-0 md:pt-3">
        {projeto.colunas.map((col) => {
          const lista = daColuna(col.id);
          // Lista destacada = é a que está sob o cartão arrastado agora.
          const destacada = alvo?.colunaId === col.id;
          // Mesma lista sem o cartão arrastado: os índices do alvo foram
          // calculados assim no dragover, então a comparação precisa bater.
          const semArrastado = lista.filter((t) => t.id !== arrastando);
          return (
            <section key={col.id} aria-label={`Lista ${col.titulo}`}
              /*
               * No celular só a aba escolhida aparece ('hidden md:flex').
               * Durante o arraste a lista de destino ganha anel branco
               * (ring-2): é o "coluna de destino se destaca" da §5.
               */
              className={cx('flex max-h-full w-full shrink-0 flex-col rounded-2xl bg-fundo/95 shadow-sm backdrop-blur-sm transition-[box-shadow,background-color] duration-150 md:w-[264px]',
                colunaMobile !== col.id && 'hidden md:flex',
                destacada && 'bg-fundo ring-2 ring-white/80')}>
              <header className="flex items-center gap-2 px-3 pb-1 pt-3">
                {/* Título vira campo de texto enquanto a lista está sendo renomeada. */}
                {renomeando === col.id ? (
                  <input autoFocus defaultValue={col.titulo} aria-label="Nome da lista"
                    // Ao sair do campo: se o nome não ficou vazio, GRAVA o novo título.
                    onBlur={(e) => { const v = e.target.value.trim(); if (v) salvarColunas(projeto.colunas.map((c) => c.id === col.id ? { ...c, titulo: v } : c)); setRenomeando(null); }}
                    // Enter confirma (forçando o blur acima); Esc cancela sem salvar.
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenomeando(null); }}
                    className="h-8 flex-1 rounded-md border border-primaria bg-superficie px-2 text-sm font-semibold text-tinta focus:outline-none" />
                ) : (
                  <h3 className="flex-1 truncate px-1 font-space text-[14px] font-semibold text-tinta" onDoubleClick={() => podeEditarLista && setRenomeando(col.id)}>{col.titulo}</h3>
                )}
                <span className="rounded-full bg-superficie-alt px-2 py-0.5 text-[12px] font-semibold tabular-nums text-tinta-suave">{lista.length}</span>
                {/* Menu "..." da lista: renomear e excluir. Escondido de quem não pode editar lista. */}
                {podeEditarLista && <Menu largura="w-48" gatilho={(p) => (
                  <button onClick={p.alternar} aria-expanded={p['aria-expanded']} aria-haspopup="menu" aria-label={`Ações da lista ${col.titulo}`}
                    className="rounded-lg p-1 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta"><MoreHorizontal className="h-4 w-4" /></button>
                )}>
                  {(fechar) => (<>
                    <ItemMenu onClick={() => { setRenomeando(col.id); fechar(); }}>Renomear lista</ItemMenu>
                    <ItemMenu perigo onClick={() => {
                      fechar();
                      // [PV-7] AS REGRAS DE EXCLUIR LISTA: só lista vazia e o quadro precisa ficar com pelo menos duas listas (uma de trabalho e a última, "Pronto").
                      // Não deixa excluir lista com cartões: as tarefas sumiriam junto.
                      if (lista.length) { avisar('Mova ou exclua os cartões antes de excluir a lista.', 'erro'); return; }
                      // Mínimo de duas listas: uma de trabalho e a última ("Pronto").
                      if (projeto.colunas.length <= 2) { avisar('O quadro precisa de pelo menos duas listas.', 'erro'); return; }
                      // APAGA: remove a lista (vazia) do projeto.
                      salvarColunas(projeto.colunas.filter((c) => c.id !== col.id));
                    }}>Excluir lista</ItemMenu>
                  </>)}
                </Menu>}
              </header>

              {/* Área que recebe os cartões soltos (é nela que ficam os eventos de arraste). */}
              <div className="rolagem flex min-h-16 flex-col gap-2 overflow-y-auto px-2 py-2"
                // dragover calcula a posição; drop grava a mudança (ver funções acima).
                onDragOver={(e) => onDragOver(e, col.id)} onDrop={(e) => onDrop(e, col.id)}
                /*
                 * dragleave também dispara ao passar de um filho para outro
                 * DENTRO da lista. Por isso só limpa o alvo se o elemento de
                 * destino (relatedTarget) estiver FORA desta área.
                 */
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setAlvo(null); }}>
                {lista.map((t) => {
                  // Posição deste cartão na lista sem o arrastado (mesma régua do alvo).
                  const pos = semArrastado.findIndex((x) => x.id === t.id);
                  return (
                    <div key={t.id}>
                      {/* Espaço tracejado ANTES do cartão cuja posição é o alvo (estado "soltando"). */}
                      {destacada && pos === alvo!.indice && t.id !== arrastando && <Espaco />}
                      <CartaoTarefa tarefa={t} concluida={col.id === ultima} arrastando={arrastando === t.id} destaque={destaque === t.id}
                        // arrastavel: Admin sempre; Profissional só o próprio. cadeado: só quando é
                        // Profissional olhando tarefa alheia (Empresa não arrasta e não precisa de cadeado:
                        // a regra dela é geral, não "só o responsável").
                        arrastavel={pode('mover_tarefa', t.responsavelId)}
                        cadeado={sessao?.perfil === 'profissional' && !pode('mover_tarefa', t.responsavelId)}
                        onAbrir={() => onAbrir(t.id)}
                        /*
                         * dragstart: guarda o id no dataTransfer e permite só "mover".
                         * O setTimeout(0) adia a marcação de "arrastando" para depois
                         * que o navegador tira a "foto" do cartão; se marcasse antes,
                         * a imagem que segue o mouse já sairia transparente.
                         */
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; setTimeout(() => setArrastando(t.id), 0); }}
                        // dragend: roda sempre no fim (soltou ou cancelou) e volta ao repouso.
                        onDragEnd={() => { setArrastando(null); setAlvo(null); }} />
                    </div>
                  );
                })}
                {/* Alvo no fim da lista (ou lista vazia): espaço tracejado depois do último cartão. */}
                {destacada && alvo!.indice >= semArrastado.length && <Espaco texto={lista.length === 0 ? 'Solte aqui' : undefined} />}
                {/* Estado vazio: explica a lista e sugere a próxima ação (some durante o arraste). */}
                {lista.length === 0 && !destacada && (
                  <p className="rounded-xl border border-dashed border-borda px-3 py-5 text-center text-[12px] leading-relaxed text-tinta-suave">
                    Nenhum cartão aqui.{col.id === ultima ? ' Tarefas concluídas aparecem nesta lista.' : podeCriar ? ' Arraste um cartão ou crie um novo.' : ''}
                  </p>
                )}
              </div>

              {/* Novo cartão entra no fim da lista (ordem = quantidade atual). Só para quem pode criar tarefa. */}
              {podeCriar && <CriarCartao projeto={projeto} colunaId={col.id} ordem={lista.length} />}
            </section>
          );
        })}

        {/* Adicionar lista (só no desktop: hidden md:block; e só para quem pode editar lista) */}
        {podeEditarLista && <div className="hidden w-[264px] shrink-0 md:block">
          {novaLista === null ? (
            <button onClick={() => setNovaLista('')}
              className="flex w-full items-center gap-2 rounded-2xl bg-white/20 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Plus className="h-4 w-4" aria-hidden />Adicionar outra lista
            </button>
          ) : (
            <form className="rounded-2xl bg-fundo p-2.5" onSubmit={(e) => {
              e.preventDefault();
              // Nome vazio não cria lista.
              if (!novaLista.trim()) return;
              // [PV-8] ONDE ENTRA UMA LISTA NOVA: antes da última, para "Pronto" continuar sendo a última.
              // Nova lista entra antes da última (que representa "Pronto"),
              // para "Pronto" continuar sendo a última e significar concluída.
              const cols = [...projeto.colunas];
              cols.splice(cols.length - 1, 0, { id: novoId('col'), titulo: novaLista.trim() });
              // GRAVA: salva as colunas e fecha o formulário.
              salvarColunas(cols); setNovaLista(null); avisar('Lista adicionada antes de “Pronto”.');
            }}>
              <input autoFocus value={novaLista} onChange={(e) => setNovaLista(e.target.value)} placeholder="Nome da lista" aria-label="Nome da nova lista"
                // Esc fecha o formulário sem criar.
                onKeyDown={(e) => e.key === 'Escape' && setNovaLista(null)}
                className="h-9 w-full rounded-lg border border-primaria bg-superficie px-3 text-sm text-tinta focus:outline-none focus:ring-4 focus:ring-primaria/20" />
              <div className="mt-2 flex items-center gap-1">
                <Button type="submit" tamanho="sm">Adicionar lista</Button>
                <button type="button" onClick={() => setNovaLista(null)} aria-label="Cancelar" className="rounded-lg p-1.5 text-tinta-suave hover:bg-superficie-alt"><X className="h-4 w-4" /></button>
              </div>
            </form>
          )}
        </div>}
      </div>
    </div>
  );
}

/**
 * Espaço tracejado que mostra onde o cartão vai cair (estado "soltando").
 * Tem a altura de um cartão (h-16) para a lista "abrir espaço" de verdade.
 * É decorativo (aria-hidden): leitores de tela não precisam dele.
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

// [PV-9] A CRIAÇÃO RÁPIDA DE CARTÃO: título, responsável e prazo são obrigatórios (§5); prazo sugerido = hoje + 7 dias; nasce com prioridade média; o responsável é escolhido entre os alocados no projeto.
/**
 * Criação rápida de cartão. Responsável e prazo são obrigatórios (slide 21).
 * Fechado, é só um botão "Adicionar cartão"; aberto, vira um mini formulário.
 * Depois de criar, o campo continua aberto e focado para criar o próximo.
 * @param projeto projeto da tarefa (define quem pode ser responsável).
 * @param colunaId lista onde o cartão nasce.
 * @param ordem posição do novo cartão (fim da lista).
 * @returns botão ou formulário de criação.
 */
function CriarCartao({ projeto, colunaId, ordem }: { projeto: Projeto; colunaId: string; ordem: number }) {
  const d = useDados();
  const avisar = useToast();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [resp, setResp] = useState('');
  // Prazo sugerido: uma semana a partir de hoje.
  const [prazo, setPrazo] = useState(somaDias(hojeISO(), 7));
  const [erro, setErro] = useState('');
  // Referência ao campo de título, para devolver o foco depois de criar.
  const campo = useRef<HTMLTextAreaElement>(null);

  // Quem pode ser responsável: pessoas alocadas no projeto, sem repetir
  // (Set) quem tem mais de uma alocação; filter(Boolean) tira ids órfãos.
  const equipe = [...new Set(d.alocacoes.filter((a) => a.projetoId === projeto.id).map((a) => a.pessoaId))].map((id) => d.pessoa(id)!).filter(Boolean);

  /** Valida e cria o cartão. Mostra um erro por vez, na ordem dos campos. */
  const criar = () => {
    // §5: tarefa só nasce com título, responsável e prazo.
    if (!titulo.trim()) { setErro('Dê um título ao cartão.'); return; }
    if (!resp) { setErro('Escolha o responsável.'); return; }
    if (!prazo) { setErro('Informe o prazo.'); return; }
    // GRAVA: cria a tarefa na store com prioridade média e listas vazias.
    // TODO(API): trocar por POST de tarefa quando a API da PROGLOGIC existir.
    d.salvar('tarefas', { id: novoId('tar'), projetoId: projeto.id, colunaId, titulo: titulo.trim(), descricao: '', responsavelId: resp, prazo, prioridade: 'media', etiquetas: [], checklist: [], comentarios: [], ordem });
    avisar('Cartão criado.');
    // Limpa só o título: responsável e prazo ficam para agilizar o próximo cartão.
    setTitulo(''); setErro('');
    campo.current?.focus();
  };

  // Fechado: só o botão de abrir o formulário.
  if (!aberto) return (
    <button onClick={() => setAberto(true)}
      className="m-2 mt-0 flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold text-tinta-suave transition-colors hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
      <Plus className="h-4 w-4" aria-hidden />Adicionar cartão
    </button>
  );

  return (
    <form className="m-2 mt-0 space-y-2" onSubmit={(e) => { e.preventDefault(); criar(); }}>
      <textarea ref={campo} autoFocus rows={2} value={titulo} onChange={(e) => { setTitulo(e.target.value); setErro(''); }} placeholder="Insira um título para este cartão…" aria-label="Título do cartão"
        // Enter cria (Shift+Enter quebra linha); Esc fecha o formulário.
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); criar(); } if (e.key === 'Escape') setAberto(false); }}
        className="w-full resize-none rounded-xl border border-borda bg-superficie px-3 py-2 text-sm text-tinta shadow-sm placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
      <div className="grid grid-cols-2 gap-2">
        {/* Mexer em qualquer campo apaga a mensagem de erro anterior. */}
        <select value={resp} onChange={(e) => { setResp(e.target.value); setErro(''); }} aria-label="Responsável"
          className="h-8 rounded-lg border border-borda bg-superficie px-2 text-[12px] text-tinta focus:border-primaria focus:outline-none">
          <option value="">Responsável…</option>
          {equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} aria-label="Prazo"
          className="h-8 rounded-lg border border-borda bg-superficie px-2 text-[12px] text-tinta focus:border-primaria focus:outline-none" />
      </div>
      {/* Sem equipe não há responsável possível: orienta o próximo passo. */}
      {equipe.length === 0 && <p className="text-[12px] text-aviso">Aloque pessoas na aba Equipe para escolher um responsável.</p>}
      {/* role="alert" faz o leitor de tela anunciar o erro assim que aparece. */}
      {erro && <p role="alert" className="text-[12px] font-medium text-erro">{erro}</p>}
      <div className="flex items-center gap-1">
        <Button type="submit" tamanho="sm">Adicionar cartão</Button>
        <button type="button" onClick={() => { setAberto(false); setErro(''); }} aria-label="Cancelar" className="rounded-lg p-1.5 text-tinta-suave hover:bg-superficie-alt"><X className="h-4 w-4" /></button>
      </div>
    </form>
  );
}
