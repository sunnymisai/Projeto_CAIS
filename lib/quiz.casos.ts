/* ============================================================================
   CASOS DE TESTE DO QUIZ
   O que é: script simples (sem biblioteca de testes) que confere corrigirQuiz,
     resultadoDoQuiz, embaralhar, concluirEtapa e registrarTentativa. Cada caso tem
     entrada, esperado e o porquê.
   Onde é usado: rodado à mão no terminal; nenhuma tela importa este arquivo.
   Depende de: lib/quiz.ts e lib/tipos.ts (imports com extensão .ts para o Node achar os módulos).
   Contexto: §4 (quiz com nota mínima e tentativas).
   Como rodar: node --experimental-strip-types lib/quiz.casos.ts
   ============================================================================ */

import { corrigirQuiz, resultadoDoQuiz, embaralhar, concluirEtapa, registrarTentativa, tentativasUsadas } from './quiz.ts';
import type { Pergunta, Trilha } from './tipos.ts';

// Progresso mínimo para os casos de concluirEtapa/registrarTentativa: a Ana fez 2 etapas e tem nota 90 de um quiz anterior.
const trilha: Pick<Trilha, 'progresso'> = { progresso: { ana: { concluidas: 2, nota: 90, tentativas: 1 } } };

// Quiz de 4 perguntas; as corretas são 1, 2, 0 e 1.
const perguntas: Pergunta[] = [
  { id: 'q1', enunciado: 'p1', alternativas: ['a', 'b', 'c'], correta: 1 },
  { id: 'q2', enunciado: 'p2', alternativas: ['a', 'b', 'c'], correta: 2 },
  { id: 'q3', enunciado: 'p3', alternativas: ['a', 'b', 'c'], correta: 0 },
  { id: 'q4', enunciado: 'p4', alternativas: ['a', 'b', 'c'], correta: 1 },
];
const tudoCerto = { q1: 1, q2: 2, q3: 0, q4: 1 };
const tudoErrado = { q1: 0, q2: 0, q3: 1, q4: 0 };
// 3 de 4 = 75; com mínima 75, fica exatamente no limite.
const tresDeQuatro = { q1: 1, q2: 2, q3: 0, q4: 0 };

const casos: { porque: string; obtido: unknown; esperado: unknown }[] = [
  // corrigirQuiz
  { porque: 'tudo certo: nota 100', obtido: corrigirQuiz(perguntas, tudoCerto).nota, esperado: 100 },
  { porque: 'tudo certo: 4 acertos de 4', obtido: `${corrigirQuiz(perguntas, tudoCerto).acertos}/${corrigirQuiz(perguntas, tudoCerto).total}`, esperado: '4/4' },
  { porque: 'tudo errado: nota 0', obtido: corrigirQuiz(perguntas, tudoErrado).nota, esperado: 0 },
  { porque: '3 de 4: nota 75', obtido: corrigirQuiz(perguntas, tresDeQuatro).nota, esperado: 75 },
  { porque: 'porPergunta mostra a marcada e a correta da que errou', obtido: JSON.stringify(corrigirQuiz(perguntas, tresDeQuatro).porPergunta[3]), esperado: JSON.stringify({ acertou: false, correta: 1, marcada: 0 }) },
  { porque: 'pergunta sem resposta conta como errada e marcada = -1', obtido: JSON.stringify(corrigirQuiz(perguntas, { q1: 1 }).porPergunta[1]), esperado: JSON.stringify({ acertou: false, correta: 2, marcada: -1 }) },
  { porque: 'nota arredondada: 2 de 3 = 67', obtido: corrigirQuiz(perguntas.slice(0, 3), { q1: 1, q2: 2, q3: 2 }).nota, esperado: 67 },
  { porque: 'quiz sem perguntas: nota 0 (sem dividir por zero)', obtido: corrigirQuiz([], {}).nota, esperado: 0 },
  { porque: 'pergunta sem correta marcada (-1) nunca é acerto', obtido: corrigirQuiz([{ id: 'x', enunciado: '', alternativas: ['a'], correta: -1 }], { x: -1 }).acertos, esperado: 0 },
  // resultadoDoQuiz
  { porque: 'nota no limite (75 com mínima 75): aprovado', obtido: resultadoDoQuiz(75, 75, 1, 3), esperado: 'aprovado' },
  { porque: 'nota 1 ponto abaixo da mínima: reprovado, pode tentar', obtido: resultadoDoQuiz(69, 70, 1, 3), esperado: 'reprovado_pode_tentar' },
  { porque: 'reprovado na última tentativa (3 de 3): sem tentativas', obtido: resultadoDoQuiz(50, 70, 3, 3), esperado: 'reprovado_sem_tentativas' },
  { porque: 'reprovado na penúltima (2 de 3): ainda pode tentar', obtido: resultadoDoQuiz(50, 70, 2, 3), esperado: 'reprovado_pode_tentar' },
  { porque: 'aprovado na última tentativa continua aprovado', obtido: resultadoDoQuiz(80, 70, 3, 3), esperado: 'aprovado' },
  { porque: 'tentativas sem limite (0): sempre pode tentar', obtido: resultadoDoQuiz(0, 70, 50, 0), esperado: 'reprovado_pode_tentar' },
  // embaralhar
  { porque: 'embaralhar mantém os mesmos itens', obtido: JSON.stringify([...embaralhar([0, 1, 2, 3], 42)].sort()), esperado: JSON.stringify([0, 1, 2, 3]) },
  { porque: 'embaralhar não altera a lista original', obtido: (() => { const l = [0, 1, 2]; embaralhar(l, 9); return JSON.stringify(l); })(), esperado: JSON.stringify([0, 1, 2]) },
  { porque: 'mesma semente: mesma ordem (a tela não "pula" ao redesenhar)', obtido: JSON.stringify(embaralhar([0, 1, 2, 3, 4], 7)) === JSON.stringify(embaralhar([0, 1, 2, 3, 4], 7)), esperado: true },
  { porque: 'sementes diferentes mudam a ordem em pelo menos um de 5 casos', obtido: [1, 2, 3, 4, 5].some((s) => JSON.stringify(embaralhar([0, 1, 2, 3], s)) !== JSON.stringify(embaralhar([0, 1, 2, 3], s + 100))), esperado: true },
  // concluirEtapa (Ana está com 2 etapas feitas: a atual é a de índice 2)
  { porque: 'concluir a etapa atual avança 2 → 3', obtido: concluirEtapa(trilha, 'ana', 2).progresso.ana.concluidas, esperado: 3 },
  { porque: 'rever uma etapa já feita não muda nada', obtido: concluirEtapa(trilha, 'ana', 0) === trilha, esperado: true },
  { porque: 'pular para uma etapa adiante não conclui', obtido: concluirEtapa(trilha, 'ana', 4).progresso.ana.concluidas, esperado: 2 },
  { porque: 'pessoa sem progresso começa do zero e conclui a 1ª', obtido: concluirEtapa(trilha, 'novo', 0).progresso.novo.concluidas, esperado: 1 },
  // registrarTentativa / tentativasUsadas
  { porque: 'reprovar soma 1 tentativa e não conclui', obtido: (() => { const t = registrarTentativa(trilha, 'ana', 'quiz', 2, 50, false); return `${tentativasUsadas(t, 'ana', 'quiz')}|${t.progresso.ana.concluidas}`; })(), esperado: '1|2' },
  { porque: 'reprovar e depois aprovar: 2 tentativas, etapa concluída, resumo da trilha gravado', obtido: (() => { const t = registrarTentativa(registrarTentativa(trilha, 'ana', 'quiz', 2, 50, false), 'ana', 'quiz', 2, 80, true); const p = t.progresso.ana; return `${p.quizzes?.quiz?.tentativas}|${p.concluidas}|${p.nota}|${p.tentativas}`; })(), esperado: '2|3|80|2' },
  { porque: 'reprovar não muda a nota-resumo da trilha (é só do último aprovado)', obtido: registrarTentativa(trilha, 'ana', 'quiz', 2, 10, false).progresso.ana.nota, esperado: 90 },
  { porque: 'tentativas de um quiz não contam no outro', obtido: tentativasUsadas(registrarTentativa(trilha, 'ana', 'quiz', 2, 50, false), 'ana', 'outro_quiz'), esperado: 0 },
];

// Roda os casos e imprime OK/FALHOU com o porquê (mesmo formato de permissoes.casos.ts).
let falhas = 0;
for (const c of casos) {
  const ok = c.obtido === c.esperado;
  if (!ok) falhas++;
  console.log(`${ok ? 'OK    ' : 'FALHOU'} ${c.porque}${ok ? '' : ` (obtido: ${String(c.obtido)}, esperado: ${String(c.esperado)})`}`);
}
console.log(`\n${casos.length - falhas} de ${casos.length} casos passaram.`);
if (falhas > 0) process.exit(1);
