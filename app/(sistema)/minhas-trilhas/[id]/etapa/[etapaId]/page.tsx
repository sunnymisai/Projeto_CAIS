/* ============================================================================
   APP/(SISTEMA)/MINHAS-TRILHAS/[ID]/ETAPA/[ETAPAID]/PAGE.TSX (PLAYER DE ETAPA)
   O que é: uma etapa da trilha para quem a cumpre: o conteúdo (texto, vídeo,
     áudio, PDF, apresentação, link) ou o quiz, o botão "Marcar como concluída",
     anterior/próxima e, ao terminar a última etapa, a tela de parabéns.
   Onde é usado: rota /minhas-trilhas/[id]/etapa/[etapaId] (lib/trilhas.ts: hrefEtapa).
     Chegam aqui: "Começar"/"Continuar" e as etapas de /minhas-trilhas/[id] e o
     card "Continue de onde parou" de /minhas-trilhas.
   Depende de: next/navigation (useParams, useRouter), lib/auth.tsx (useAuth),
     lib/store.tsx (useDados: salvar), lib/metricas.ts (trilhasDaPessoaDetalhadas),
     lib/quiz.ts (concluirEtapa, registrarTentativa, tentativasDoQuiz, tentativasUsadas), lib/trilhas.ts
     (TIPOS_ETAPA, TENTATIVAS_PADRAO, hrefEtapa), lib/toast.tsx,
     components/trilhas/ConteudoEtapa.tsx, components/trilhas/QuizEtapa.tsx,
     components/button.tsx e components/ui/basicos.tsx.
   Contexto: §4 (etapa, quiz, etapa bloqueada explicada), §12 fluxo 1 (conclui e
     libera o sistema) e §13 (celular, teclado, quatro estados).
   ============================================================================ */

// "use client": lê a sessão e a store e grava o progresso.
"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, CircleCheck, PartyPopper } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { trilhasDaPessoaDetalhadas } from '@/lib/metricas';
import { concluirEtapa, registrarTentativa, tentativasDoQuiz, tentativasUsadas } from '@/lib/quiz';
import { TIPOS_ETAPA, TENTATIVAS_PADRAO, hrefEtapa } from '@/lib/trilhas';
import ConteudoEtapa from '@/components/trilhas/ConteudoEtapa';
import QuizEtapa, { type EnvioQuiz } from '@/components/trilhas/QuizEtapa';
import Button, { classesBotao } from '@/components/button';
import { Card, Progresso, Esqueleto, Etiqueta } from '@/components/ui/basicos';
import { cx } from '@/lib/utils';

// [PV-1] O PLAYER DE UMA ETAPA: mostra o conteúdo (ou o quiz), conclui a etapa e libera a próxima. Terminar a última mostra a tela de parabéns.
/**
 * Player de uma etapa.
 * Acesso: trilha fora do público → /sem-permissao; etapa inexistente → detalhe da trilha;
 * etapa bloqueada (adiante da atual) → detalhe com ?bloqueada=<etapaId>, que explica o motivo.
 * @returns o player, a tela de parabéns ou o esqueleto enquanto carrega/redireciona.
 */
export default function PlayerEtapa() {
  // Client Component: useParams devolve os parâmetros já prontos (notas-next16 §2).
  const { id, etapaId } = useParams<{ id: string; etapaId: string }>();
  const { sessao } = useAuth();
  const d = useDados();
  const router = useRouter();
  const avisar = useToast();
  // true depois que a pessoa conclui a ÚLTIMA etapa nesta visita: mostra a tela de parabéns.
  const [terminou, setTerminou] = useState(false);

  // A trilha só existe para a pessoa se estiver na lista dela (publicada e no público).
  const t = useMemo(
    () => (sessao && d.pronto ? trilhasDaPessoaDetalhadas(sessao.pessoaId, d).find((x) => x.trilha.id === id) : undefined),
    [sessao, d, id],
  );
  const indice = t ? t.trilha.etapas.findIndex((e) => e.id === etapaId) : -1;

  // [PV-2] O PORTEIRO DA ETAPA: fora do público vai para /sem-permissao; etapa inexistente volta ao detalhe da trilha; etapa adiante da atual vai ao detalhe com ?bloqueada= (que explica o motivo).
  // Porteiro da etapa. Roda quando os dados carregam ou mudam; não há o que limpar.
  // NAVEGA (replace: o "voltar" não cai de novo numa página que redireciona):
  // - fora do público → /sem-permissao;
  // - etapa que não existe nesta trilha → detalhe da trilha;
  // - etapa adiante da atual (bloqueada) → detalhe com ?bloqueada=, que explica (§4).
  // Depois de concluir a última etapa (terminou), não redireciona: mostra os parabéns.
  useEffect(() => {
    if (!d.pronto || !sessao || terminou) return;
    if (!t) { router.replace('/sem-permissao'); return; }
    if (indice === -1) { router.replace(`/minhas-trilhas/${id}`); return; }
    // NAVEGA: etapa adiante da atual → detalhe com ?bloqueada=, que explica o motivo.
    if (indice > t.concluidas) router.replace(`/minhas-trilhas/${id}?bloqueada=${encodeURIComponent(etapaId)}`);
  }, [d.pronto, sessao, t, indice, id, etapaId, router, terminou]);

  // Estado carregando (ou redirecionando): esqueleto no formato do player.
  if (!t || indice === -1 || (indice > t.concluidas && !terminou)) {
    return (
      <div className="mx-auto max-w-[760px] p-4 sm:p-6 lg:p-8">
        <Esqueleto className="mb-2 h-4 w-40" /><Esqueleto className="mb-6 h-8 w-80 max-w-full" />
        <Esqueleto className="mb-6 aspect-video w-full rounded-2xl" />
        <Esqueleto className="h-12 w-48" />
      </div>
    );
  }

  const { trilha } = t;
  const etapa = trilha.etapas[indice];
  const pessoaId = sessao!.pessoaId;
  const { icone: Icone, rotulo } = TIPOS_ETAPA[etapa.tipo];
  const concluida = indice < t.concluidas;
  const ehUltima = indice === trilha.etapas.length - 1;
  const anterior = indice > 0 ? trilha.etapas[indice - 1] : undefined;
  const proxima = !ehUltima ? trilha.etapas[indice + 1] : undefined;
  const registroQuiz = trilha.progresso[pessoaId]?.quizzes?.[etapa.id];

  // ---------- Parabéns (última etapa concluída nesta visita) ----------
  if (terminou) {
    return (
      <div className="mx-auto max-w-[640px] p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-col items-center px-6 py-10 text-center" role="status">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sucesso/12 text-sucesso"><PartyPopper className="h-8 w-8" aria-hidden /></span>
          <h1 className="font-space text-2xl font-semibold text-tinta">Parabéns, trilha concluída!</h1>
          <p className="mt-2 max-w-sm text-sm text-tinta-suave">
            Você terminou “{trilha.titulo}”{t.nota !== undefined ? ` com nota ${t.nota} no quiz` : ''}. O seu progresso já aparece para a coordenação.
          </p>
          {/* NAVEGA: volta para a lista de trilhas (a concluída passa para o fim, em verde). */}
          <Link href="/minhas-trilhas" className={classesBotao({ tamanho: 'lg', className: 'mt-6 w-full sm:w-auto' })}>
            Voltar para Minhas trilhas<ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>
      </div>
    );
  }

  // [PV-3] A CONCLUSÃO DE ETAPA SEM QUIZ: grava o progresso (concluirEtapa só avança se for a etapa atual). Na última etapa abre os parabéns.
  /**
   * Conclui a etapa atual (só texto/vídeo/etc.; o quiz conclui ao ser aprovado).
   * GRAVA: o progresso da trilha na store (concluirEtapa só avança se for a etapa atual).
   */
  const marcarConcluida = () => {
    d.salvar('trilhas', concluirEtapa(trilha, pessoaId, indice));
    if (ehUltima) setTerminou(true);
    else avisar('Etapa concluída. A próxima foi liberada.');
  };

  // [PV-4] O ENVIO DO QUIZ: grava as tentativas e a nota (registrarTentativa, lib/quiz.ts); se aprovado, conclui a etapa e libera a próxima.
  /**
   * Recebe o envio do quiz e grava a tentativa.
   * GRAVA: tentativas e nota deste quiz; se aprovado, também o resumo da trilha e a conclusão da etapa.
   * @param envio correção e resultado da tentativa.
   */
  const aoEnviarQuiz = ({ correcao, resultado }: EnvioQuiz) => {
    const aprovado = resultado === 'aprovado';
    d.salvar('trilhas', registrarTentativa(trilha, pessoaId, etapa.id, indice, correcao.nota, aprovado));
    if (aprovado && ehUltima) setTerminou(true);
    else if (aprovado) avisar('Quiz aprovado. A próxima etapa foi liberada.');
  };

  // Próxima liberada = a etapa atual já está concluída (as etapas são feitas em ordem).
  const proximaLiberada = !!proxima && concluida;

  return (
    <div className="mx-auto max-w-[760px] p-4 sm:p-6 lg:p-8">
      {/* Caminho de volta: Minhas trilhas › trilha. */}
      <nav aria-label="Você está em" className="mb-2 flex flex-wrap items-center gap-1 text-[13px] text-tinta-suave">
        {/* NAVEGA: volta para a lista ou para o detalhe da trilha. */}
        <Link href="/minhas-trilhas" className="rounded hover:text-tinta hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">Minhas trilhas</Link>
        <span aria-hidden>/</span>
        <Link href={`/minhas-trilhas/${trilha.id}`} className="rounded hover:text-tinta hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">{trilha.titulo}</Link>
      </nav>

      <header className="mb-6 space-y-3">
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-tinta-suave">
          <span className="inline-flex items-center gap-1"><Icone className="h-4 w-4" aria-hidden />{rotulo}</span>
          <span aria-hidden>·</span>
          <span>Etapa {indice + 1} de {trilha.etapas.length}</span>
          {!etapa.obrigatoria && <Etiqueta>Opcional</Etiqueta>}
          {concluida && <Etiqueta tom="sucesso"><CircleCheck className="h-3.5 w-3.5" aria-hidden />Concluída</Etiqueta>}
        </p>
        <h1 className="font-space text-2xl font-semibold leading-tight tracking-tight text-tinta sm:text-[28px]">{etapa.titulo}</h1>
        <Progresso valor={t.pct} fino rotulo={`Progresso na trilha: ${t.concluidas} de ${t.total} etapas`} />
      </header>

      <div className="space-y-6">
        <ConteudoEtapa etapa={etapa} />

        {etapa.tipo === 'quiz' ? (
          // key: trocar de etapa recria o quiz do zero (respostas e rodada não vazam de um quiz para outro).
          <QuizEtapa key={etapa.id} etapa={etapa}
            tentativasUsadas={tentativasUsadas(trilha, pessoaId, etapa.id)}
            tentativasMax={tentativasDoQuiz(etapa.tentativasMax, TENTATIVAS_PADRAO)}
            // Concluída por um quiz = já aprovado (inclusive dados do seed, que não têm o registro por quiz).
            jaAprovado={concluida || !!registroQuiz?.aprovado}
            notaAprovada={registroQuiz?.aprovado ? registroQuiz.nota : t.nota}
            onEnviar={aoEnviarQuiz} />
        ) : !concluida && (
          // Etapa atual (não quiz): concluir à mão. tamanho lg = 48 px, alvo de toque confortável.
          <Button tamanho="lg" onClick={marcarConcluida} className="w-full sm:w-auto">
            <Check className="h-4 w-4" aria-hidden />{ehUltima ? 'Concluir a trilha' : 'Marcar como concluída'}
          </Button>
        )}
      </div>

      {/* Anterior / próxima. A próxima só abre depois de concluir esta (§4: etapas em ordem). */}
      <nav aria-label="Etapas" className="mt-10 grid grid-cols-2 gap-2 border-t border-borda pt-5">
        {anterior ? (
          // NAVEGA: etapa anterior (sempre liberada: já foi concluída).
          <Link href={hrefEtapa(trilha.id, anterior.id)} className={classesBotao({ variante: 'secundario', tamanho: 'lg', className: 'justify-start' })}>
            <ArrowLeft className="h-4 w-4" aria-hidden /><span className="truncate">Anterior</span>
          </Link>
        ) : <span />}
        {proxima && (proximaLiberada ? (
          // NAVEGA: próxima etapa.
          <Link href={hrefEtapa(trilha.id, proxima.id)} className={classesBotao({ variante: 'secundario', tamanho: 'lg', className: 'justify-end' })}>
            <span className="truncate">Próxima</span><ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          // Bloqueada: botão desabilitado + o motivo escrito embaixo (não só "apagado").
          <div className="text-right">
            <button type="button" disabled aria-describedby="motivo-proxima" className={classesBotao({ variante: 'secundario', tamanho: 'lg', className: 'w-full justify-end' })}>
              <span className="truncate">Próxima</span><ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <p id="motivo-proxima" className={cx('mt-1.5 text-[12px] text-tinta-suave')}>
              {etapa.tipo === 'quiz' ? 'Seja aprovado no quiz para liberar' : 'Conclua esta etapa para liberar'}
            </p>
          </div>
        ))}
        {/* Última etapa já concluída: volta ao detalhe. */}
        {!proxima && concluida && (
          <Link href={`/minhas-trilhas/${trilha.id}`} className={classesBotao({ variante: 'secundario', tamanho: 'lg', className: 'justify-end' })}>
            <span className="truncate">Voltar à trilha</span><ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </nav>
    </div>
  );
}
