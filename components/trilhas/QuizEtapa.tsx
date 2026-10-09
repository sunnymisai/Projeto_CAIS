/* ============================================================================
   QUIZETAPA.TSX
   O que é: o quiz de uma etapa para quem cumpre a trilha: responder (uma pergunta
     por vez no celular, todas no desktop), enviar, ver a nota e a revisão de cada
     resposta e, se reprovar com tentativas, tentar de novo com as alternativas embaralhadas.
   Onde é usado: app/(sistema)/minhas-trilhas/[id]/etapa/[etapaId]/page.tsx (player).
   Depende de: lib/quiz.ts (corrigirQuiz, resultadoDoQuiz, embaralhar), lib/tipos.ts
     (Etapa), components/button.tsx, components/ui/basicos.tsx (Aviso, Etiqueta) e lucide-react.
   Contexto: §4 (quiz com nota mínima e tentativas), §13 (teclado, foco, celular).
   ============================================================================ */
"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, ArrowRight, CircleCheck, CircleX, RotateCcw, Send } from 'lucide-react';
import type { Etapa } from '@/lib/tipos';
import { corrigirQuiz, embaralhar, resultadoDoQuiz, type CorrecaoQuiz, type ResultadoQuiz } from '@/lib/quiz';
import Button from '@/components/button';
import { Aviso, Etiqueta } from '@/components/ui/basicos';
import { cx } from '@/lib/utils';

/** Letras das alternativas (só para mostrar). */
const LETRAS = 'ABCDEFGH';

// [PV-1] O PONTO DE QUEBRA DO QUIZ: a partir de 768 px todas as perguntas aparecem juntas; abaixo disso, uma por vez no celular.
/** Largura a partir da qual todas as perguntas aparecem juntas (md do Tailwind). */
const CONSULTA_DESKTOP = '(min-width: 768px)';

/**
 * true em telas de 768 px ou mais. Lê a media query do navegador e redesenha quando ela muda.
 * useSyncExternalStore: o jeito do React de "assinar" algo de fora (aqui, o matchMedia).
 * No servidor não existe janela: começa como celular (celular primeiro).
 * @returns true no desktop/tablet largo.
 */
function useTelaLarga() {
  return useSyncExternalStore(
    (avisar) => { const m = window.matchMedia(CONSULTA_DESKTOP); m.addEventListener('change', avisar); return () => m.removeEventListener('change', avisar); },
    () => window.matchMedia(CONSULTA_DESKTOP).matches,
    () => false,
  );
}

/** O que o quiz devolve ao enviar, para o player gravar. */
export interface EnvioQuiz { correcao: CorrecaoQuiz; resultado: ResultadoQuiz }

// [PV-2] O QUIZ DA ETAPA: não grava nada sozinho; ao enviar, entrega a correção e o resultado ao player, que registra a tentativa (lib/quiz.ts) e conclui a etapa se aprovado.
/**
 * Quiz de uma etapa.
 * Não grava nada sozinho: ao enviar, chama `onEnviar` e quem chama grava a tentativa
 * (lib/quiz.ts: registrarTentativa) e decide o que fazer depois.
 * @param props.etapa a etapa de quiz (perguntas, nota mínima, tentativas).
 * @param props.tentativasUsadas quantas tentativas a pessoa já usou ANTES desta.
 * @param props.tentativasMax limite (0 = sem limite).
 * @param props.jaAprovado true se a pessoa já passou neste quiz (mostra só o resumo).
 * @param props.notaAprovada nota com que passou (para o resumo).
 * @param props.onEnviar recebe a correção e o resultado da tentativa.
 * @returns o quiz.
 */
export default function QuizEtapa({ etapa, tentativasUsadas, tentativasMax, jaAprovado, notaAprovada, onEnviar }: {
  etapa: Etapa; tentativasUsadas: number; tentativasMax: number; jaAprovado: boolean; notaAprovada?: number;
  onEnviar: (envio: EnvioQuiz) => void;
}) {
  const perguntas = useMemo(() => etapa.perguntas ?? [], [etapa.perguntas]);
  const telaLarga = useTelaLarga();
  // perguntaId → índice ORIGINAL marcado (a correção usa o original; a tela pode mostrar embaralhado).
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  // Qual pergunta aparece no celular (uma por vez).
  const [atual, setAtual] = useState(0);
  // Resultado da última tentativa NESTA visita (null = respondendo).
  // `usadas` é guardado no envio: depois de gravar, a prop tentativasUsadas já vem somada
  // e não pode ser somada de novo na tela de resultado.
  const [envio, setEnvio] = useState<(EnvioQuiz & { usadas: number }) | null>(null);
  // Muda a cada "Tentar de novo"; 0 = primeira vez nesta visita (ordem original).
  const [rodada, setRodada] = useState(0);
  // Para levar o foco ao topo do resultado (leitor de tela anuncia; teclado começa dali).
  const refResultado = useRef<HTMLDivElement>(null);
  const refPergunta = useRef<HTMLFieldSetElement>(null);

  // [PV-3] A ORDEM DAS ALTERNATIVAS: na primeira rodada, a original; nas tentativas seguintes, embaralhada com uma semente por pergunta (a ordem não pula ao redesenhar).
  // Ordem das alternativas de cada pergunta nesta rodada. Na 1ª rodada, a original; depois,
  // embaralhada com uma semente por pergunta (a ordem não "pula" quando a tela redesenha).
  const ordens = useMemo(() => perguntas.map((p, i) => {
    const indices = p.alternativas.map((_, k) => k);
    return rodada === 0 ? indices : embaralhar(indices, rodada * 97 + i * 13 + tentativasUsadas);
  }), [perguntas, rodada, tentativasUsadas]);

  const faltam = perguntas.filter((p) => respostas[p.id] === undefined).length;
  // [PV-4] O LIMITE DE TENTATIVAS vem da etapa (tentativasMax, 0 = sem limite; a PROGLOGIC permite até 10, LIMITE_TENTATIVAS em lib/quiz.ts). Esgotadas, só a coordenação libera uma nova.
  const semTentativas = tentativasMax > 0 && tentativasUsadas >= tentativasMax && !jaAprovado;

  // Já aprovado antes (revendo a etapa): só o resumo; refazer não muda a nota.
  if (jaAprovado && !envio) {
    return <Aviso tipo="sucesso" titulo="Você já foi aprovado neste quiz">{notaAprovada !== undefined ? `Sua nota foi ${notaAprovada}.` : ''} A nota mínima era {etapa.notaMinima}%.</Aviso>;
  }
  // Chegou sem tentativas sobrando (gastou todas numa visita anterior).
  if (semTentativas && !envio) {
    return <Aviso tipo="erro" titulo="Você usou todas as tentativas">Este quiz permite {tentativasMax} tentativa{tentativasMax > 1 ? 's' : ''}. Fale com a coordenação do programa para liberar uma nova tentativa.</Aviso>;
  }
  // Quiz sem perguntas (não deveria ser publicado, mas dados antigos podem ter).
  if (perguntas.length === 0) {
    return <Aviso tipo="aviso" titulo="Este quiz ainda não tem perguntas">Avise a coordenação do programa. Enquanto isso, não é possível concluir esta etapa.</Aviso>;
  }

  /** Corrige, decide o resultado, avisa o player e mostra o resultado (com o foco nele). */
  const enviar = () => {
    const correcao = corrigirQuiz(perguntas, respostas);
    // [PV-5] O RESULTADO DA TENTATIVA: aprovado, reprovado com tentativas sobrando ou reprovado sem tentativas, pela nota mínima da etapa (resultadoDoQuiz, lib/quiz.ts).
    // +1: esta tentativa conta.
    const resultado = resultadoDoQuiz(correcao.nota, etapa.notaMinima, tentativasUsadas + 1, tentativasMax);
    const novo = { correcao, resultado };
    setEnvio({ ...novo, usadas: tentativasUsadas + 1 });
    // GRAVA (no player): registra a tentativa e, se aprovado, conclui a etapa.
    onEnviar(novo);
    // Espera o React desenhar o resultado e leva o foco para ele.
    requestAnimationFrame(() => refResultado.current?.focus());
  };

  /** Nova tentativa: limpa as respostas, volta à 1ª pergunta e embaralha as alternativas. */
  const tentarDeNovo = () => {
    setRespostas({});
    setAtual(0);
    setEnvio(null);
    setRodada((r) => r + 1);
    requestAnimationFrame(() => refPergunta.current?.querySelector('input')?.focus());
  };

  // ---------- Resultado ----------
  if (envio) {
    const { correcao, resultado, usadas } = envio;
    const aprovado = resultado === 'aprovado';
    // [PV-6] QUANDO O GABARITO APARECE: só quando não há mais o que tentar (aprovado ou sem tentativas); com tentativas sobrando ele tornaria a próxima tentativa decoreba.
    // A resposta certa só aparece quando não há mais nada a tentar (aprovado ou sem tentativas);
    // com tentativas sobrando, mostrar o gabarito tornaria a próxima tentativa decoreba.
    const mostrarGabarito = resultado !== 'reprovado_pode_tentar';
    return (
      // tabIndex={-1}: recebe o foco por código (para anunciar o resultado), sem entrar no Tab.
      <div ref={refResultado} tabIndex={-1} className="space-y-5 focus:outline-none" aria-live="polite">
        <div className={cx('rounded-2xl border p-5', aprovado ? 'border-sucesso/40 bg-sucesso/5' : 'border-erro/40 bg-erro/5')}>
          <p className={cx('flex items-center gap-2 font-space text-lg font-semibold', aprovado ? 'text-sucesso' : 'text-erro')}>
            {aprovado ? <CircleCheck className="h-5 w-5" aria-hidden /> : <CircleX className="h-5 w-5" aria-hidden />}
            {aprovado ? 'Aprovado!' : 'Ainda não foi desta vez'}
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div><dt className="text-[12px] text-tinta-suave">Sua nota</dt><dd className="font-space text-2xl font-semibold text-tinta">{correcao.nota}</dd></div>
            <div><dt className="text-[12px] text-tinta-suave">Nota mínima</dt><dd className="font-space text-2xl font-semibold text-tinta">{etapa.notaMinima}</dd></div>
            <div><dt className="text-[12px] text-tinta-suave">Tentativas</dt><dd className="font-space text-2xl font-semibold text-tinta">{usadas}{tentativasMax > 0 ? `/${tentativasMax}` : ''}</dd></div>
          </dl>
          <p className="mt-3 text-sm text-tinta-suave">Você acertou {correcao.acertos} de {correcao.total} perguntas.</p>
        </div>

        {resultado === 'reprovado_pode_tentar' && (
          <Aviso tipo="aviso" titulo="Você pode tentar de novo"
            acao={<Button onClick={tentarDeNovo}><RotateCcw className="h-4 w-4" aria-hidden />Tentar de novo</Button>}>
            {tentativasMax > 0 ? `Restam ${tentativasMax - usadas} tentativa${tentativasMax - usadas > 1 ? 's' : ''}. ` : ''}
            Na nova tentativa, a ordem das alternativas muda: assim você relê cada uma, em vez de lembrar da posição.
          </Aviso>
        )}
        {resultado === 'reprovado_sem_tentativas' && (
          <Aviso tipo="erro" titulo="Você usou todas as tentativas">Fale com a coordenação do programa para liberar uma nova tentativa.</Aviso>
        )}

        {/* Revisão de cada resposta: ícone + texto (cor nunca sozinha). */}
        <section aria-labelledby="revisao-titulo">
          <h3 id="revisao-titulo" className="mb-2 font-space text-base font-semibold text-tinta">Revisão das respostas</h3>
          <ol className="space-y-2">
            {perguntas.map((p, i) => {
              const r = correcao.porPergunta[i];
              return (
                <li key={p.id} className="rounded-xl border border-borda bg-superficie p-3">
                  <p className="flex items-start gap-2 text-sm font-semibold text-tinta">
                    {r.acertou ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-sucesso" aria-hidden /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-erro" aria-hidden />}
                    <span>{i + 1}. {p.enunciado}</span>
                  </p>
                  <p className="mt-1 pl-6 text-[13px] text-tinta-suave">
                    <span className={cx('font-semibold', r.acertou ? 'text-sucesso' : 'text-erro')}>{r.acertou ? 'Certa' : 'Errada'}</span>
                    {' · '}Sua resposta: {r.marcada >= 0 ? p.alternativas[r.marcada] : 'não respondida'}
                  </p>
                  {!r.acertou && mostrarGabarito && <p className="mt-0.5 pl-6 text-[13px] text-tinta-suave">Resposta certa: {p.alternativas[r.correta]}</p>}
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    );
  }

  // ---------- Respondendo ----------
  /**
   * Uma pergunta como grupo de rádio: fieldset + legend dão o nome do grupo; os <input type="radio">
   * nativos com o mesmo `name` já andam pelas setas do teclado (o navegador cuida).
   */
  const pergunta = (i: number) => {
    const p = perguntas[i];
    return (
      <fieldset key={p.id} ref={!telaLarga && i === atual ? refPergunta : undefined} className="space-y-2">
        <legend className="mb-3 font-space text-base font-semibold leading-snug text-tinta">
          {/* No celular o número já aparece em "Pergunta 2 de 5"; no desktop, junto do enunciado. */}
          {telaLarga && <span className="text-primaria">{i + 1}. </span>}{p.enunciado}
        </legend>
        {ordens[i].map((original, pos) => {
          const marcada = respostas[p.id] === original;
          return (
            // O <label> inteiro é clicável (alvo grande, min-h 44 px); has-[:focus-visible] mostra o anel
            // de foco no cartão quando o rádio de dentro recebe foco pelo teclado.
            <label key={original}
              className={cx('flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primaria/60',
                marcada ? 'border-primaria bg-primaria-suave text-tinta' : 'border-borda bg-superficie text-tinta hover:bg-superficie-alt')}>
              <input type="radio" name={`resposta-${p.id}-${rodada}`} checked={marcada}
                onChange={() => setRespostas((r) => ({ ...r, [p.id]: original }))}
                className="h-4 w-4 shrink-0 accent-[var(--primaria)] focus:outline-none" />
              <span className="w-4 shrink-0 text-[12px] font-bold text-tinta-suave" aria-hidden>{LETRAS[pos]}</span>
              <span>{p.alternativas[original]}</span>
            </label>
          );
        })}
      </fieldset>
    );
  };

  const rodapeEnviar = (
    <div className="space-y-2">
      {/* Enviar só com tudo respondido; o motivo fica escrito ao lado (não só o botão apagado). */}
      <Button tamanho="lg" larguraTotal onClick={enviar} disabled={faltam > 0} className="sm:w-auto">
        <Send className="h-4 w-4" aria-hidden />Enviar respostas
      </Button>
      {faltam > 0 && <p className="text-[13px] text-tinta-suave">Responda todas as perguntas para enviar (falta{faltam > 1 ? 'm' : ''} {faltam}).</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <p className="flex flex-wrap gap-2 text-[13px] text-tinta-suave">
        <Etiqueta>Nota mínima {etapa.notaMinima}%</Etiqueta>
        <Etiqueta>{tentativasMax === 0 ? 'Tentativas sem limite' : `Tentativa ${tentativasUsadas + 1} de ${tentativasMax}`}</Etiqueta>
        {rodada > 0 && <Etiqueta tom="primaria">Alternativas em nova ordem</Etiqueta>}
      </p>

      {telaLarga ? (
        // Desktop: todas as perguntas de uma vez.
        <div className="space-y-6">
          {perguntas.map((_, i) => <div key={perguntas[i].id} className="rounded-2xl border border-borda bg-superficie p-4">{pergunta(i)}</div>)}
          {rodapeEnviar}
        </div>
      ) : (
        // Celular: uma pergunta por vez, com "Pergunta 2 de 5" e anterior/próxima.
        <div className="space-y-4">
          <p className="text-[13px] font-semibold text-primaria" aria-live="polite">Pergunta {atual + 1} de {perguntas.length}</p>
          {pergunta(atual)}
          <div className="flex gap-2">
            <Button variante="secundario" tamanho="lg" onClick={() => setAtual((a) => a - 1)} disabled={atual === 0} className="flex-1">
              <ArrowLeft className="h-4 w-4" aria-hidden />Anterior
            </Button>
            {atual < perguntas.length - 1 && (
              <Button variante="secundario" tamanho="lg" onClick={() => setAtual((a) => a + 1)} className="flex-1">
                Próxima<ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>
          {/* O enviar aparece na última pergunta (ou quando tudo já foi respondido). */}
          {(atual === perguntas.length - 1 || faltam === 0) && rodapeEnviar}
        </div>
      )}
    </div>
  );
}
