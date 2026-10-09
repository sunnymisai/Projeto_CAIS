/* ============================================================================
   APP/(SISTEMA)/TRILHAS/[ID]/PAGE.TSX (EDITOR DE TRILHA)
   O que é: o editor de uma trilha: etapas, público e regras, progresso por
     pessoa, publicar/despublicar e excluir.
   Onde é usado: rota /trilhas/[id] (ex.: /trilhas/tri_1). Chegam aqui: os
     cartões e o botão "Nova trilha" de app/(sistema)/trilhas/page.tsx, a lista
     de trilhas do painel (app/(sistema)/painel/page.tsx) e a busca do topo
     (components/shell/Topbar.tsx).
   Depende de: next/navigation (useParams, useRouter), lib/store.tsx
     (useDados: trilhas, pessoas, empresas, salvar, remover), lib/toast.tsx,
     lib/metricas.ts (publicoDaTrilha, situacaoNaTrilha), lib/trilhas.ts
     (TIPOS_ETAPA, ALCANCE, TENTATIVAS_PADRAO, problemasDoQuiz), lib/quiz.ts
     (LIMITE_TENTATIVAS, tentativasDoQuiz), lib/utils.ts
     (cx, hojeISO, novoId), components/trilhas/EditorConteudoEtapa.tsx (conteúdo
     e perguntas da etapa) e componentes de components/ui/.
   Contexto: §4 (Trilhas: alcances, anatomia trilha → etapa → conteúdo/quiz,
     o que o admin define e o que o profissional vê), §12 fluxo 2 (admin
     publica trilha) e docs/notas-next16.md §2 (useParams).
   ============================================================================ */

// "use client": editor com estado, eventos e useDados.
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Check, Send, Undo2, GripVertical, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useDados, Trilha } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { publicoDaTrilha, situacaoNaTrilha } from '@/lib/metricas';
import { TIPOS_ETAPA, ALCANCE, TENTATIVAS_PADRAO, problemasDoQuiz } from '@/lib/trilhas';
import EditorConteudoEtapa from '@/components/trilhas/EditorConteudoEtapa';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import Button from '@/components/button';
import Input from '@/components/input';
import Checkbox from '@/components/checkbox';
import { Select, AreaTexto, Segmentado, Interruptor } from '@/components/ui/form';
import { LIMITE_TENTATIVAS, tentativasDoQuiz } from '@/lib/quiz';
import { Card, CardTitulo, Etiqueta, Abas, Aviso, Avatar, Progresso, EstadoVazio, Esqueleto } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import Modal from '@/components/ui/Modal';
import { cx, hojeISO, novoId } from '@/lib/utils';
import type { TipoEtapa } from '@/lib/tipos';

// [PV-1] O EDITOR DE TRILHA: toda mudança é salva na hora, sem botão Salvar. Publicar só é liberado sem pendências. Abas: Etapas, Público e regras, Progresso.
/**
 * Editor de trilha (rota /trilhas/[id]).
 * Toda mudança é salva na hora, sem botão "Salvar". Publicar só é liberado
 * quando não há pendências (título, etapas e público).
 *
 * @returns o editor, ou o esqueleto (carregando), ou "não encontrada".
 */
export default function EditorTrilha() {
  // Client Component não pode usar `await params`; o hook useParams devolve
  // o [id] do caminho já pronto (notas-next16 §2).
  const { id } = useParams<{ id: string }>();
  const d = useDados();
  const router = useRouter();
  const avisar = useToast();
  // Aba ativa. Aqui fica só no estado (não vai para a URL, diferente da
  // ficha de projeto): recarregar volta para "Etapas".
  const [aba, setAba] = useState<'etapas' | 'publico' | 'progresso'>('etapas');
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  // Tipo escolhido no seletor "Tipo da nova etapa".
  const [novoTipo, setNovoTipo] = useState<TipoEtapa>('texto');
  // Arrastar e soltar das etapas (HTML5 nativo, como o Quadro):
  // - pegaPelaAlca: id da etapa cuja alça (⋮⋮) foi apertada. Só ela fica draggable,
  //   para o arrastar não atrapalhar quem seleciona texto nos campos da linha.
  // - arrastando: índice da etapa que está sendo arrastada (null = nenhuma).
  // - alvo: posição onde ela vai entrar (0 = antes da primeira; length = depois da última).
  const [pegaPelaAlca, setPegaPelaAlca] = useState<string | null>(null);
  // Id da etapa com o painel de conteúdo aberto (um por vez, para a lista não ficar enorme).
  const [aberta, setAberta] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [alvo, setAlvo] = useState<number | null>(null);

  const t = d.trilhas.find((x) => x.id === id);
  // Estado "carregando" (§13): esqueleto enquanto a store lê os dados.
  if (!d.pronto) return <div className="p-8"><Esqueleto className="mb-4 h-10 w-80" /><Esqueleto className="h-96 rounded-2xl" /></div>;
  // Estado de erro (§13): id inexistente. NAVEGA: botão volta para /trilhas.
  if (!t) return (
    <div className="p-8"><EstadoVazio icone={<Lock className="h-6 w-6" />} titulo="Trilha não encontrada" descricao="Ela pode ter sido excluída."
      acao={<Button onClick={() => router.push('/trilhas')}>Voltar às trilhas</Button>} /></div>
  );

  // [PV-2] O SALVAR AUTOMÁTICO: toda mudança grava na hora (cada tecla do título, inclusive). TODO(API): vira PATCH e talvez precise esperar a pessoa parar de digitar.
  // Toda edição salva na hora (sem botão "Salvar")
  /**
   * Junta as mudanças com a trilha atual e salva.
   * GRAVA: a trilha na store a cada chamada (cada tecla no título, inclusive).
   * TODO(API): vira um PATCH na API; talvez precise esperar a pessoa parar de
   * digitar para não mandar uma requisição por tecla.
   *
   * @param parcial só os campos que mudaram.
   * @example atualizar({ titulo: 'LGPD' })
   */
  const atualizar = (parcial: Partial<Trilha>) => d.salvar('trilhas', { ...t, ...parcial });
  /**
   * Altera campos de UMA etapa (a de índice i) e salva a trilha.
   * Como o estado não pode ser mudado direto, cria uma lista nova trocando
   * só a etapa i.
   *
   * @param i posição da etapa (0 = primeira).
   * @param parcial campos da etapa que mudaram.
   * @example setEtapa(0, { obrigatoria: false })
   */
  const setEtapa = (i: number, parcial: Partial<Trilha['etapas'][number]>) =>
    atualizar({ etapas: t.etapas.map((e, j) => (j === i ? { ...e, ...parcial } : e)) });
  /**
   * Troca a etapa i de lugar com a vizinha de cima (-1) ou de baixo (+1).
   * Os botões de subir/descer ficam desabilitados nas pontas, então i + dir
   * sempre existe.
   *
   * @param i posição da etapa.
   * @param dir -1 sobe, 1 desce.
   */
  const mover = (i: number, dir: -1 | 1) => {
    // Copia a lista e troca as duas posições (desestruturação em array).
    const e = [...t.etapas];
    [e[i], e[i + dir]] = [e[i + dir], e[i]];
    atualizar({ etapas: e });
  };
  // [PV-3] A REORDENAÇÃO DAS ETAPAS por arrastar: leva a etapa para a posição de soltura e não grava se ficou no mesmo lugar. Os botões de subir e descer fazem a mesma troca de uma posição.
  /**
   * Leva a etapa da posição `origem` para a posição de inserção `destino` (usado ao soltar).
   * `destino` conta as posições ENTRE as etapas da lista original: 0 = antes da primeira,
   * length = depois da última. Como a etapa sai da lista antes de entrar, destino depois
   * da origem perde 1.
   * GRAVA: a nova ordem na trilha.
   * @param origem índice da etapa arrastada.
   * @param destino posição de inserção na lista original.
   * @example moverPara(0, 3) // 1ª etapa vai para depois da 3ª
   */
  const moverPara = (origem: number, destino: number) => {
    const final = destino > origem ? destino - 1 : destino;
    // Soltou no mesmo lugar: não grava nada.
    if (final === origem) return;
    const e = [...t.etapas];
    const [movida] = e.splice(origem, 1);
    e.splice(final, 0, movida);
    atualizar({ etapas: e });
  };
  /** Limpa o estado do arrastar (no fim de qualquer arrasto, solto ou cancelado com Esc). */
  const fimDoArrasto = () => { setArrastando(null); setAlvo(null); setPegaPelaAlca(null); };

  // [PV-4] AS PENDÊNCIAS QUE IMPEDEM PUBLICAR: título, ao menos uma etapa, todas com título, empresa (alcance Empresa), pessoas (alcance Profissional) e as regras de cada quiz (lib/trilhas.ts).
  // Pendências que impedem publicar. Cada linha vira o texto do problema
  // quando a condição é verdadeira, ou `false` quando está tudo certo; o
  // .filter(Boolean) final deixa só os textos.
  const problemas = [
    !t.titulo.trim() && 'Dê um título à trilha.',
    t.etapas.length === 0 && 'Adicione pelo menos uma etapa.',
    t.etapas.some((e) => !e.titulo.trim()) && 'Todas as etapas precisam de título.',
    t.alcance === 'empresa' && !t.empresaId && 'Escolha a empresa que recebe a trilha.',
    t.alcance === 'profissional' && t.pessoaIds.length === 0 && 'Escolha pelo menos uma pessoa.',
    // Quiz: pelo menos uma pergunta, cada uma com enunciado, 2+ alternativas e a correta (lib/trilhas.ts).
    ...t.etapas.flatMap((e, i) => problemasDoQuiz(e, i + 1)),
  ].filter(Boolean) as string[];

  // Ids de quem recebe a trilha, conforme o alcance (publicoDaTrilha em
  // lib/metricas.ts): geral = todos os profissionais ativos; empresa = quem
  // está alocado em projetos daquela empresa; profissional = os escolhidos.
  const publico = publicoDaTrilha(t, d);
  // Profissionais ativos: opções da escolha "a dedo" (alcance profissional).
  const profissionais = d.pessoas.filter((p) => p.perfil === 'profissional' && p.status !== 'inativo');

  // [PV-5] A PUBLICAÇÃO: com pendência leva à aba do problema (procura "empresa" ou "pessoa" nas mensagens: reescrever sem essas palavras abre a aba errada); sem pendência grava a data da PRIMEIRA publicação, que não muda ao despublicar e republicar. O aviso às pessoas é SIMULADO. TODO(API).
  /**
   * Tenta publicar a trilha.
   * Com pendências: leva para a aba onde está o problema (Público e regras
   * se for empresa/pessoa; senão Etapas) e mostra um aviso de erro.
   * Sem pendências: muda o status para "publicada".
   */
  const publicar = () => {
    // A aba é escolhida procurando as palavras "empresa"/"pessoa" no texto do
    // problema. ⚠️ ATENÇÃO: se reescrever as mensagens de `problemas` sem
    // essas palavras, o botão passa a abrir a aba errada.
    if (problemas.length) {
      setAba(problemas.some((p) => p.includes('empresa') || p.includes('pessoa')) ? 'publico' : 'etapas');
      // Abre o painel do primeiro quiz com pendência, para a pessoa ver direto o que falta.
      const quizComProblema = t.etapas.find((e, i) => problemasDoQuiz(e, i + 1).length > 0);
      if (quizComProblema) setAberta(quizComProblema.id);
      avisar('Falta pouco: resolva os pontos indicados para publicar.', 'erro');
      return;
    }
    // GRAVA: status "publicada" e a data da PRIMEIRA publicação (publicadaEm). Despublicar e
    // publicar de novo mantém a data antiga, para não reiniciar o prazo de quem já recebeu.
    atualizar({ status: 'publicada', publicadaEm: t.publicadaEm ?? hojeISO() });
    // SIMULADO: ninguém recebe aviso de verdade; a mensagem só conta o público.
    // TODO(API): a notificação às pessoas será feita pelo back-end (§12, fluxo 2).
    avisar(`Trilha publicada. ${publico.length} pessoa(s) foram avisadas.`);
  };

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina trilha={[{ rotulo: 'Trilhas', href: '/trilhas' }]}
        titulo={<span className="flex flex-wrap items-center gap-3">{t.titulo || 'Sem título'}{t.status === 'rascunho' ? <Etiqueta tom="aviso">Rascunho</Etiqueta> : <Etiqueta tom="sucesso" ponto>Publicada</Etiqueta>}</span>}
        descricao={<span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-sucesso" aria-hidden />Alterações salvas automaticamente</span>}
        acao={<>
          <Button variante="fantasma" onClick={() => setConfirmarExclusao(true)}><Trash2 className="h-4 w-4" aria-hidden />Excluir</Button>
          {/* Publicada → botão "Despublicar" (GRAVA: volta para rascunho).
            * Rascunho → botão "Publicar" (função publicar, acima). */}
          {t.status === 'publicada'
            ? <Button variante="secundario" onClick={() => { atualizar({ status: 'rascunho' }); avisar('Trilha voltou para rascunho.'); }}><Undo2 className="h-4 w-4" aria-hidden />Despublicar</Button>
            : <Button onClick={publicar}><Send className="h-4 w-4" aria-hidden />Publicar</Button>}
        </>} />

      {/* Em rascunho, lista as pendências antes da pessoa tentar publicar. */}
      {t.status === 'rascunho' && problemas.length > 0 && (
        <div className="mb-5"><Aviso tipo="aviso" titulo="Antes de publicar">{problemas.join(' ')}</Aviso></div>
      )}

      <Abas rotulo="Seções da trilha" ativa={aba} onChange={setAba}
        abas={[{ id: 'etapas', rotulo: 'Etapas', contagem: t.etapas.length }, { id: 'publico', rotulo: 'Público e regras', contagem: publico.length }, { id: 'progresso', rotulo: 'Progresso' }]} />

      <div className="mt-6" role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {/* ABA ETAPAS: título/descrição, lista de etapas e ajuda lateral.
          * lg:grid-cols-[1fr_300px]: no desktop, conteúdo + coluna fixa de
          * 300 px; no celular, uma coluna só. */}
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
                    // Rótulo e ícone do tipo da etapa (texto, vídeo, PDF, quiz...).
                    // Nome com maiúscula (T) para poder usar <T.icone /> como tag.
                    const T = TIPOS_ETAPA[e.tipo];
                    return (
                      <li key={e.id}
                        // Só fica arrastável enquanto a alça está apertada (ver pegaPelaAlca).
                        draggable={pegaPelaAlca === e.id}
                        // dragstart: guarda o id no dataTransfer (o Firefox exige algum dado) e permite só "mover".
                        onDragStart={(ev) => { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', e.id); setArrastando(i); }}
                        // dragover: preventDefault libera o soltar aqui. Metade de cima da linha = entra
                        // antes desta etapa; metade de baixo = entra depois.
                        onDragOver={(ev) => {
                          if (arrastando === null) return;
                          ev.preventDefault();
                          ev.dataTransfer.dropEffect = 'move';
                          const r = ev.currentTarget.getBoundingClientRect();
                          setAlvo(ev.clientY < r.top + r.height / 2 ? i : i + 1);
                        }}
                        // drop: GRAVA a nova ordem (moverPara) e limpa o estado.
                        onDrop={(ev) => { ev.preventDefault(); if (arrastando !== null && alvo !== null) moverPara(arrastando, alvo); fimDoArrasto(); }}
                        // dragend: roda sempre no fim, inclusive se soltou fora da lista ou apertou Esc.
                        onDragEnd={fimDoArrasto}
                        // relative: referência da linha roxa de "vai entrar aqui"; opacity-50: a etapa
                        // arrastada fica apagada no lugar de origem enquanto se move.
                        className={cx('relative flex flex-wrap items-center gap-3 rounded-xl border border-borda bg-fundo/50 p-3', arrastando === i && 'opacity-50')}>
                        {/* Linha roxa onde a etapa vai entrar: antes desta (alvo === i) ou, na
                          * última, depois dela (alvo === length). -top/-bottom-[5px] centraliza a
                          * linha no espaço de 8 px (space-y-2) entre as etapas. */}
                        {arrastando !== null && alvo === i && <span aria-hidden className="pointer-events-none absolute -top-[5px] left-2 right-2 h-0.5 rounded-full bg-primaria" />}
                        {arrastando !== null && i === t.etapas.length - 1 && alvo === t.etapas.length && <span aria-hidden className="pointer-events-none absolute -bottom-[5px] left-2 right-2 h-0.5 rounded-full bg-primaria" />}
                        {/* Alça de arrastar (mouse). Apertar libera o arrastar da linha; soltar sem
                          * arrastar desfaz. Teclado e celular usam as setas ↑↓ à direita (o arrastar
                          * nativo do HTML5 não funciona no toque), por isso a alça some no celular
                          * (hidden sm:flex) e fica fora da ordem do Tab (aria-hidden). */}
                        <span aria-hidden title="Arraste para mudar a ordem"
                          onPointerDown={() => setPegaPelaAlca(e.id)} onPointerUp={() => setPegaPelaAlca(null)}
                          className="hidden shrink-0 cursor-grab items-center rounded p-0.5 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta active:cursor-grabbing sm:flex">
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primaria-suave text-[13px] font-bold text-primaria">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          {/* Título editável "no lugar": parece texto e vira
                            * campo ao focar (focus:bg-superficie). O placeholder
                            * em vermelho (placeholder:text-erro/70) lembra que
                            * etapa sem título impede publicar. */}
                          <input value={e.titulo} onChange={(ev) => setEtapa(i, { titulo: ev.target.value })} placeholder="Título da etapa" aria-label={`Título da etapa ${i + 1}`}
                            className={cx('w-full rounded-md bg-transparent px-1 py-0.5 text-sm font-semibold text-tinta placeholder:text-erro/70 focus:bg-superficie focus:outline-none focus:ring-2 focus:ring-primaria/40')} />
                          <div className="mt-1 flex flex-wrap items-center gap-3 px-1 text-[12px] text-tinta-suave">
                            <span className="flex items-center gap-1"><T.icone className="h-3.5 w-3.5" aria-hidden />
                              {/* Trocar o tipo ajusta a nota mínima (70% se virou quiz, 0 nos
                                * outros) e, no quiz, as tentativas padrão. */}
                              <select value={e.tipo} onChange={(ev) => setEtapa(i, { tipo: ev.target.value as TipoEtapa, notaMinima: ev.target.value === 'quiz' ? 70 : 0, ...(ev.target.value === 'quiz' && e.tentativasMax === undefined ? { tentativasMax: TENTATIVAS_PADRAO } : {}) })} aria-label="Tipo de conteúdo"
                                className="rounded bg-transparent font-medium text-tinta-suave focus:outline-none focus:ring-2 focus:ring-primaria/40">
                                {Object.entries(TIPOS_ETAPA).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
                              </select>
                            </span>
                            {/* Nota mínima só existe para quiz (§4). */}
                            {e.tipo === 'quiz' && (
                              <label className="flex items-center gap-1">Nota mínima
                                <input type="number" min={0} max={100} value={e.notaMinima} onChange={(ev) => setEtapa(i, { notaMinima: Number(ev.target.value) })}
                                  className="w-14 rounded border border-borda bg-superficie px-1.5 py-0.5 text-tinta focus:outline-none focus:ring-2 focus:ring-primaria/40" />%
                              </label>
                            )}
                            {/* Tentativas do quiz (§4): de 1 a 10 (regra da PROGLOGIC). Sem valor salvo, mostra o padrão;
                              * o antigo "0 = sem limite" aparece como 10. */}
                            {e.tipo === 'quiz' && (
                              <label className="flex items-center gap-1" title={`De 1 a ${LIMITE_TENTATIVAS} tentativas`}>Tentativas
                                <input type="number" min={1} max={LIMITE_TENTATIVAS} value={tentativasDoQuiz(e.tentativasMax, TENTATIVAS_PADRAO)}
                                  // Math.floor/min/max: não aceita fração, zero, negativo nem mais que 10.
                                  onChange={(ev) => setEtapa(i, { tentativasMax: Math.min(LIMITE_TENTATIVAS, Math.max(1, Math.floor(Number(ev.target.value) || 1))) })}
                                  className="w-12 rounded border border-borda bg-superficie px-1.5 py-0.5 text-tinta focus:outline-none focus:ring-2 focus:ring-primaria/40" />
                              </label>
                            )}
                            {/* Etapa obrigatória trava a próxima até ser
                              * concluída (§4). accent-[var(--primaria)] pinta o
                              * checkbox nativo com a cor do tema. */}
                            <label className="flex cursor-pointer items-center gap-1.5">
                              <input type="checkbox" checked={e.obrigatoria} onChange={(ev) => setEtapa(i, { obrigatoria: ev.target.checked })} className="accent-[var(--primaria)]" />
                              Obrigatória {e.obrigatoria && <Lock className="h-3 w-3" aria-label="trava a próxima etapa" />}
                            </label>
                          </div>
                        </div>
                        {/* Subir/descer (desabilitados na primeira/última) e
                          * remover. APAGA: remover tira a etapa da trilha na
                          * hora, sem confirmação. */}
                        <div className="flex shrink-0 items-center gap-0.5">
                          {/* Abre/fecha o painel de conteúdo (e perguntas, no quiz) desta etapa.
                            * aria-expanded + aria-controls: o leitor de tela sabe que abre um painel e qual.
                            * Quiz com pendência ganha um ponto de atenção (com texto escondido para o leitor de tela). */}
                          <Button variante={aberta === e.id ? 'secundario' : 'fantasma'} tamanho="sm" aria-expanded={aberta === e.id} aria-controls={`conteudo-${e.id}`}
                            onClick={() => setAberta(aberta === e.id ? null : e.id)}>
                            {aberta === e.id ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
                            {e.tipo === 'quiz' ? `Perguntas (${e.perguntas?.length ?? 0})` : 'Conteúdo'}
                            {problemasDoQuiz(e, i + 1).length > 0 && <><span className="h-2 w-2 rounded-full bg-aviso" aria-hidden /><span className="sr-only">(com pendências)</span></>}
                          </Button>
                          <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir etapa" className="rounded-lg p-1.5 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                          <button onClick={() => mover(i, 1)} disabled={i === t.etapas.length - 1} aria-label="Descer etapa" className="rounded-lg p-1.5 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                          <button onClick={() => atualizar({ etapas: t.etapas.filter((_, j) => j !== i) })} aria-label="Remover etapa" className="rounded-lg p-1.5 text-tinta-fraca hover:bg-erro/10 hover:text-erro"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        {/* Painel de conteúdo: basis-full faz ele ocupar a linha inteira embaixo da etapa
                          * (a <li> é flex-wrap). GRAVA: cada mudança salva a etapa (setEtapa). */}
                        {aberta === e.id && (
                          <div className="basis-full">
                            <EditorConteudoEtapa id={`conteudo-${e.id}`} etapa={e} numero={i + 1} onChange={(parcial) => setEtapa(i, parcial)} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {/* Estado vazio da lista: explica e indica a próxima ação. */}
                  {t.etapas.length === 0 && <li className="rounded-xl border border-dashed border-borda px-4 py-8 text-center text-sm text-tinta-suave">Nenhuma etapa ainda. Escolha o tipo abaixo e adicione a primeira.</li>}
                </ol>
                <div className="flex flex-wrap items-end gap-2 border-t border-borda p-4">
                  <div className="w-48"><Select label="Tipo da nova etapa" value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as TipoEtapa)} opcoes={Object.entries(TIPOS_ETAPA).map(([valor, v]) => ({ valor, rotulo: v.rotulo }))} /></div>
                  {/* GRAVA: adiciona uma etapa no fim, sem título (a pessoa
                    * digita direto na lista), obrigatória por padrão e com
                    * nota mínima 70% e as tentativas padrão se for quiz. */}
                  <Button variante="secundario" onClick={() => atualizar({ etapas: [...t.etapas, { id: novoId('et'), titulo: '', tipo: novoTipo, obrigatoria: true, notaMinima: novoTipo === 'quiz' ? 70 : 0, ...(novoTipo === 'quiz' ? { tentativasMax: TENTATIVAS_PADRAO, perguntas: [] } : {}) }] })}>
                    <Plus className="h-4 w-4" aria-hidden />Adicionar etapa
                  </Button>
                </div>
              </Card>
            </div>

            {/* Coluna de ajuda: o que cada etapa aceita e o que o
              * profissional vê (textos do §4). */}
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

        {/* ABA PÚBLICO E REGRAS: alcance, empresa, prazo e a lista de quem
          * recebe (§4: o admin define quem recebe, quando abre e até quando). */}
        {aba === 'publico' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-[13px] font-medium text-tinta">Quem recebe</p>
                {/* [PV-6] O ALCANCE DA TRILHA (Geral, Empresa ou Profissional): as cores e descrições vêm de ALCANCE (lib/trilhas.ts) e quem recebe vem de publicoDaTrilha (lib/metricas.ts). */}
                <Segmentado rotulo="Alcance da trilha" valor={t.alcance} onChange={(a) => atualizar({ alcance: a })}
                  opcoes={[{ valor: 'geral', rotulo: 'Geral' }, { valor: 'empresa', rotulo: 'Empresa' }, { valor: 'profissional', rotulo: 'Profissional' }]} />
                <p className="mt-2 flex items-center gap-2 text-[13px] text-tinta-suave"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ALCANCE[t.alcance].cor }} aria-hidden />{ALCANCE[t.alcance].descricao}</p>
              </div>
              {/* Só no alcance "empresa". Empresas encerradas não aparecem
                * como opção (não recebem trilha nova). */}
              {t.alcance === 'empresa' && (
                <Select label="Empresa" required placeholder="Selecione a empresa" value={t.empresaId} onChange={(e) => atualizar({ empresaId: e.target.value })}
                  hint="Recebem a trilha todas as pessoas alocadas em projetos desta empresa."
                  opcoes={d.empresas.filter((e) => e.status !== 'encerrada').map((e) => ({ valor: e.id, rotulo: e.nomeFantasia }))} />
              )}
              {/* [PV-7] O PRAZO DA TRILHA (decisão da PROGLOGIC, 09/10/2026): indeterminado (prazoDias 0) ou os dias que o administrador definir; ao desligar o interruptor começa em 14 dias. O campo "Quando abre" é SIMULADO. TODO(API). */}
              {/* Prazo (decisão da PROGLOGIC, 09/10/2026): indeterminado ou com os dias definidos pelo administrador,
                * em geral a pedido da empresa. prazoDias 0 = indeterminado (a trilha não vence para ninguém).
                * SIMULADO: "Quando abre" tem uma opção só e não faz nada (onChange vazio).
                * TODO(API): "data marcada" chega com a API. */}
              <Interruptor ligado={t.prazoDias === 0} onChange={(sem) => atualizar({ prazoDias: sem ? 0 : 14 })} rotulo="Prazo indeterminado"
                descricao="A trilha não tem data limite. Desligue para definir os dias, por exemplo quando a empresa pedir um prazo." />
              <div className="grid grid-cols-2 gap-4">
                {t.prazoDias > 0 && <Input compacto label="Prazo para concluir (dias)" type="number" min={1} value={String(t.prazoDias)} onChange={(e) => atualizar({ prazoDias: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} />}
                <Select label="Quando abre" value="entrada" onChange={() => {}} opcoes={[{ valor: 'entrada', rotulo: 'Na entrada da pessoa' }]} hint="Data marcada chega com a API." />
              </div>
              <Aviso tipo="info">Uma pessoa pode receber trilhas das três camadas ao mesmo tempo.</Aviso>
            </Card>

            <Card>
              <CardTitulo titulo={t.alcance === 'profissional' ? 'Escolha as pessoas' : 'Quem vai receber'} descricao={`${publico.length} pessoa(s) no público desta trilha.`} />
              {/* Lista com altura máxima (max-h-[420px]) que rola por dentro,
                * para não esticar o cartão com muitas pessoas.
                * Alcance "profissional": mostra TODOS os profissionais com
                * checkbox para escolher. Outros alcances: só quem já está no
                * público, sem checkbox (a regra decide, não o admin). */}
              <ul className="rolagem max-h-[420px] divide-y divide-borda overflow-y-auto p-2">
                {(t.alcance === 'profissional' ? profissionais : profissionais.filter((p) => publico.includes(p.id))).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                    {t.alcance === 'profissional' ? (
                      // GRAVA: marcar adiciona o id em pessoaIds; desmarcar
                      // tira (filter). label vazio + aria-label: o nome já
                      // aparece ao lado, mas o leitor de tela precisa do rótulo.
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

        {/* ABA PROGRESSO: tabela por pessoa do público. Rascunho ou público
          * vazio → estado vazio explicando por que não há o que mostrar. */}
        {aba === 'progresso' && (
          <Card>
            {t.status === 'rascunho' || publico.length === 0 ? (
              <EstadoVazio icone={<Send className="h-6 w-6" />} titulo="Sem progresso para mostrar" descricao="O progresso aparece quando a trilha é publicada para um público." acao={t.status === 'rascunho' ? <Button onClick={publicar}>Publicar trilha</Button> : undefined} />
            ) : (
              <Tabela rotulo="Progresso por pessoa">
                <thead><tr><Th>Pessoa</Th><Th>Situação</Th><Th className="w-1/3">Progresso</Th><Th>Nota do quiz</Th></tr></thead>
                <tbody>
                  {publico.map((pid) => {
                    // Pessoa removida da store não gera linha.
                    const p = d.pessoa(pid); if (!p) return null;
                    // Situação (situacaoNaTrilha em lib/metricas.ts):
                    // nenhuma etapa = não iniciada; todas = concluída; senão
                    // em andamento.
                    const s = situacaoNaTrilha(t, pid);
                    // Progresso salvo desta pessoa (etapas concluídas e nota);
                    // undefined se ela nunca abriu a trilha.
                    const pr = t.progresso[pid];
                    // % de etapas concluídas. Math.max(1, ...) evita dividir
                    // por zero numa trilha sem etapas.
                    const pct = ((pr?.concluidas ?? 0) / Math.max(1, t.etapas.length)) * 100;
                    // [PV-8] A NOTA EM VERMELHO na aba Progresso: nota abaixo da maior nota mínima entre os quizzes da trilha.
                    // Nota mínima mais alta entre os quizzes da trilha (0 se
                    // não houver quiz). Nota abaixo dela aparece em vermelho.
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

      {/* [PV-9] A EXCLUSÃO DA TRILHA: apaga junto o progresso de todas as pessoas, sem desfazer. */}
      {/* Confirmação de exclusão. APAGA: d.remover('trilhas') remove a trilha
        * e, junto, o progresso das pessoas (que fica dentro dela).
        * NAVEGA: depois volta para /trilhas. Não tem desfazer. */}
      <Modal aberto={confirmarExclusao} onFechar={() => setConfirmarExclusao(false)} tamanho="sm" titulo="Excluir esta trilha?"
        rodape={<><Button variante="secundario" onClick={() => setConfirmarExclusao(false)}>Cancelar</Button>
          <Button variante="perigo" onClick={() => { d.remover('trilhas', t.id); avisar('Trilha excluída.'); router.push('/trilhas'); }}>Excluir trilha</Button></>}>
        <p className="text-sm text-tinta-suave">A trilha <strong className="text-tinta">{t.titulo}</strong> e o progresso de {publico.length} pessoa(s) serão removidos. Não dá para desfazer.</p>
      </Modal>
    </div>
  );
}
