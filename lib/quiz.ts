/* ============================================================================
   QUIZ (CORREÇÃO E RESULTADO)
   O que é: funções puras que corrigem um quiz, decidem o resultado (aprovado,
     reprovado com ou sem tentativas), embaralham alternativas para uma nova tentativa
     e calculam o progresso novo (concluir etapa, registrar tentativa).
   Onde é usado: app/(sistema)/minhas-trilhas/[id]/etapa/[etapaId]/page.tsx (player)
     e lib/quiz.casos.ts (testes rodados com Node).
   Depende de: os tipos Pergunta e Trilha de lib/tipos.ts e hojeISO de lib/utils.ts (sem React, para rodar em Node).
   Contexto: §4 (quiz com nota mínima e tentativas).
   ============================================================================ */

// ⚠️ ATENÇÃO: import com extensão .ts de propósito: lib/quiz.casos.ts roda este
// arquivo direto no Node, que só acha o módulo com a extensão.
import type { Pergunta, Trilha } from './tipos.ts';
import { hojeISO } from './utils.ts';

/** Como foi uma pergunta na correção. */
export interface CorrecaoPergunta {
  /** true se a marcada é a correta. */
  acertou: boolean;
  /** Índice (original) da alternativa correta. */
  correta: number;
  /** Índice (original) da alternativa marcada; -1 = não respondeu. */
  marcada: number;
}

/** Resultado da correção de um quiz. */
export interface CorrecaoQuiz {
  /** Nota de 0 a 100, arredondada. */
  nota: number;
  acertos: number;
  total: number;
  /** Uma entrada por pergunta, na mesma ordem de `perguntas`. */
  porPergunta: CorrecaoPergunta[];
}

// [PV-1] A CORREÇÃO do quiz: a nota é o percentual de respostas certas. Mudar aqui muda a nota de todos os quizzes.
/**
 * Corrige um quiz.
 * As respostas usam o índice ORIGINAL da alternativa (o de `pergunta.alternativas`),
 * então embaralhar a ordem na tela não muda a correção.
 * @param perguntas - as perguntas da etapa.
 * @param respostas - perguntaId → índice original marcado (pergunta ausente = não respondida).
 * @returns nota, acertos, total e o detalhe de cada pergunta.
 * @example corrigirQuiz([{ id: 'q1', enunciado: '?', alternativas: ['a', 'b'], correta: 1 }], { q1: 1 }).nota // 100
 */
export function corrigirQuiz(perguntas: Pergunta[], respostas: Record<string, number>): CorrecaoQuiz {
  // Para cada pergunta, compara a marcada com a correta.
  const porPergunta = perguntas.map((p) => {
    // ?? -1: pergunta sem resposta conta como "não respondeu" (e, portanto, errada).
    const marcada = respostas[p.id] ?? -1;
    // Acertou só se marcou algo E esse algo é a correta (correta -1 nunca é acerto).
    const acertou = marcada !== -1 && marcada === p.correta;
    return { acertou, correta: p.correta, marcada };
  });
  // Conta os acertos.
  const acertos = porPergunta.filter((r) => r.acertou).length;
  const total = perguntas.length;
  // Nota em porcentagem; quiz sem perguntas vale 0 (evita dividir por zero).
  const nota = total ? Math.round((acertos / total) * 100) : 0;
  return { nota, acertos, total, porPergunta };
}

/** Os três desfechos possíveis de uma tentativa. */
export type ResultadoQuiz = 'aprovado' | 'reprovado_pode_tentar' | 'reprovado_sem_tentativas';

// [PV-2] O MÁXIMO de tentativas de um quiz (10, regra da PROGLOGIC). O editor da trilha e o aluno respeitam este número.
/** Máximo de tentativas que um quiz pode permitir (regra da PROGLOGIC: de 1 a 10). */
export const LIMITE_TENTATIVAS = 10;

// [PV-3] Quantas tentativas o quiz permite de verdade (1 a 10): sem valor usa o padrão; o antigo "0 = sem limite" vira 10.
/**
 * Quantas tentativas o quiz permite de verdade, sempre entre 1 e LIMITE_TENTATIVAS (10).
 * Sem valor (dados antigos) usa o padrão; o antigo "0 = sem limite" vira o máximo (10); acima de 10 cai para 10.
 * @param tentativasMax - o que a etapa guardou (pode faltar).
 * @param padrao - tentativas quando a etapa não definiu nada (TENTATIVAS_PADRAO de lib/trilhas.ts).
 * @returns um inteiro de 1 a 10.
 * @example tentativasDoQuiz(undefined, 3) // 3
 * @example tentativasDoQuiz(0, 3) // 10 (era "sem limite")
 */
export function tentativasDoQuiz(tentativasMax: number | undefined, padrao: number): number {
  if (tentativasMax === undefined) return Math.min(LIMITE_TENTATIVAS, Math.max(1, Math.floor(padrao)));
  if (tentativasMax === 0) return LIMITE_TENTATIVAS;
  return Math.min(LIMITE_TENTATIVAS, Math.max(1, Math.floor(tentativasMax)));
}

// [PV-4] A REGRA DE APROVAÇÃO: a nota IGUAL à mínima aprova; reprovado ainda pode tentar se sobrar tentativa. Define o aprovado, o pode tentar e o sem tentativas.
/**
 * Decide o resultado de uma tentativa.
 * @param nota - nota desta tentativa (0 a 100).
 * @param notaMinima - nota para aprovar (0 a 100); a nota IGUAL à mínima aprova.
 * @param tentativasUsadas - quantas tentativas a pessoa já usou, CONTANDO esta.
 * @param tentativasMax - limite de tentativas (use tentativasDoQuiz); 0 = sem limite (só dados antigos).
 * @returns 'aprovado', 'reprovado_pode_tentar' ou 'reprovado_sem_tentativas'.
 * @example resultadoDoQuiz(60, 70, 3, 3) // 'reprovado_sem_tentativas' (era a última)
 */
export function resultadoDoQuiz(nota: number, notaMinima: number, tentativasUsadas: number, tentativasMax: number): ResultadoQuiz {
  // Chegou na mínima (>=): aprovado, não importa a tentativa.
  if (nota >= notaMinima) return 'aprovado';
  // Sem limite (0): sempre pode tentar de novo.
  if (tentativasMax === 0) return 'reprovado_pode_tentar';
  // Ainda sobra tentativa se usou menos que o limite.
  return tentativasUsadas < tentativasMax ? 'reprovado_pode_tentar' : 'reprovado_sem_tentativas';
}

// [PV-5] Embaralha as alternativas ao "Tentar de novo" (determinístico, por semente) para a pessoa não decorar a posição da resposta.
/**
 * Embaralha uma lista sem mudar a original (Fisher-Yates com uma semente).
 * A semente deixa o resultado REPETÍVEL: a mesma tentativa mostra a mesma ordem
 * se a tela redesenhar; uma tentativa nova (semente nova) mostra outra ordem.
 * @param lista - o que embaralhar (ex.: os índices das alternativas [0, 1, 2]).
 * @param semente - número qualquer; muda a ordem.
 * @returns uma lista nova, embaralhada.
 * @example embaralhar([0, 1, 2], 7) // ex.: [2, 0, 1]
 */
export function embaralhar<T>(lista: T[], semente: number): T[] {
  // Cópia: nunca altera a lista recebida.
  const copia = [...lista];
  // Gerador simples de números "aleatórios" a partir da semente (mulberry32).
  let s = semente >>> 0;
  const aleatorio = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Fisher-Yates: de trás para a frente, troca cada item com um sorteado antes dele.
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/* ---------------- Progresso (funções puras que devolvem a trilha nova) ---------------- */

/** Só os campos da trilha que estas funções leem e escrevem. */
type TrilhaComProgresso = Pick<Trilha, 'progresso'>;

/**
 * Tentativas que a pessoa já usou num quiz (0 se nunca tentou).
 * @param trilha - a trilha.
 * @param pessoaId - quem responde.
 * @param etapaId - a etapa de quiz.
 * @returns número de tentativas usadas.
 */
export function tentativasUsadas(trilha: TrilhaComProgresso, pessoaId: string, etapaId: string): number {
  return trilha.progresso[pessoaId]?.quizzes?.[etapaId]?.tentativas ?? 0;
}

// [PV-6] AVANÇO NA TRILHA: só a etapa atual avança, em ordem. Ao terminar a última, grava concluidaEm (alimenta os filtros de período e a evolução da turma).
/**
 * Conclui a etapa de índice `indice`, se ela for a ATUAL (as etapas são feitas em ordem).
 * Rever uma etapa já concluída, ou tentar concluir uma adiante, não muda nada.
 * Se era a ÚLTIMA etapa (a trilha tem `etapas`), grava também `concluidaEm` = hoje (G01: trilhas
 * concluídas no período e a evolução da turma).
 * @param trilha - a trilha.
 * @param pessoaId - quem concluiu.
 * @param indice - posição da etapa (0 = primeira).
 * @param hoje - data da conclusão (padrão: hoje); existe para facilitar teste.
 * @returns a trilha com o progresso novo (o mesmo objeto se nada mudou).
 * @example concluirEtapa(t, 'pes_ana', 2) // concluidas: 2 → 3
 */
export function concluirEtapa<T extends TrilhaComProgresso & { etapas?: unknown[] }>(trilha: T, pessoaId: string, indice: number, hoje: string = hojeISO()): T {
  const atual = trilha.progresso[pessoaId] ?? { concluidas: 0 };
  // Só a etapa atual (índice === concluídas) avança o progresso.
  if (indice !== atual.concluidas) return trilha;
  const concluidas = atual.concluidas + 1;
  // Terminou a trilha agora: guarda a data (só na primeira vez que chega ao fim).
  const terminou = !!trilha.etapas && concluidas >= trilha.etapas.length && !atual.concluidaEm;
  return { ...trilha, progresso: { ...trilha.progresso, [pessoaId]: { ...atual, concluidas, ...(terminou ? { concluidaEm: hoje } : {}) } } };
}

// [PV-7] Guarda a tentativa e a nota POR QUIZ; se aprovou, já conclui a etapa. É onde a nota entra no progresso da pessoa.
/**
 * Registra uma tentativa de quiz: soma 1 tentativa e guarda a nota daquele quiz.
 * Aprovado: também grava o resumo da trilha (nota e tentativas) e conclui a etapa.
 * @param trilha - a trilha.
 * @param pessoaId - quem respondeu.
 * @param etapaId - a etapa de quiz.
 * @param indice - posição da etapa (para concluir, se aprovado).
 * @param nota - nota desta tentativa.
 * @param aprovado - resultado desta tentativa.
 * @returns a trilha com o progresso novo.
 * @example registrarTentativa(t, 'pes_ana', 'et_n5', 4, 80, true)
 */
export function registrarTentativa<T extends TrilhaComProgresso>(trilha: T, pessoaId: string, etapaId: string, indice: number, nota: number, aprovado: boolean): T {
  const atual = trilha.progresso[pessoaId] ?? { concluidas: 0 };
  const usadas = (atual.quizzes?.[etapaId]?.tentativas ?? 0) + 1;
  // Registro deste quiz (as tentativas de um quiz não contam no outro).
  const quizzes = { ...atual.quizzes, [etapaId]: { tentativas: usadas, nota, aprovado } };
  // Aprovado: o resumo da trilha passa a ser este quiz (é o que o admin vê).
  const progresso = aprovado ? { ...atual, quizzes, nota, tentativas: usadas } : { ...atual, quizzes };
  const comTentativa = { ...trilha, progresso: { ...trilha.progresso, [pessoaId]: progresso } };
  // Aprovado também conclui a etapa (se for a atual).
  return aprovado ? concluirEtapa(comTentativa, pessoaId, indice) : comTentativa;
}
