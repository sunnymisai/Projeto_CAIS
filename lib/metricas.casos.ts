/* ============================================================================
   CASOS DE TESTE DAS MÉTRICAS (MINHAS TAREFAS E PAINEL DO PROFISSIONAL)
   O que é: script simples (sem biblioteca de testes) que confere fimDaSemana,
     inicioDaSemana, agruparMinhasTarefas, cargaDaSemana e entregasPorSemana com uma
     data fixa. Cada caso tem entrada, esperado e o porquê.
   Onde é usado: rodado à mão no terminal; nenhuma tela importa este arquivo.
   Depende de: lib/metricas.ts e lib/tipos.ts (imports com extensão .ts para o Node achar os módulos).
   Contexto: §12 fluxo 4 (o profissional vê o que é dele hoje).
   Como rodar: node --experimental-strip-types lib/metricas.casos.ts
   ============================================================================ */

import { agruparMinhasTarefas, cargaDaSemana, entregasPorSemana, fimDaSemana, inicioDaSemana } from './metricas.ts';
import type { Dados, Projeto, Tarefa } from './tipos.ts';

// Hoje fixo: quarta-feira, 7 de outubro de 2026 (domingo da semana = dia 11).
const HOJE = '2026-10-07';
const projeto = { id: 'p', colunas: [{ id: 'afazer', titulo: 'A fazer' }, { id: 'pronto', titulo: 'Pronto' }] } as Projeto;
/**
 * Monta uma tarefa de teste com valores padrão; `extra` troca só o que o caso precisa.
 * @example tarefa('x', '2026-10-07', { prioridade: 'alta' })
 */
const tarefa = (id: string, prazo: string, extra: Partial<Tarefa> = {}): Tarefa => ({
  id, projetoId: 'p', colunaId: 'afazer', titulo: id, descricao: '', responsavelId: 'ana', prazo, prioridade: 'media',
  etiquetas: [], checklist: [], comentarios: [], ordem: 0, ...extra,
});
const g = agruparMinhasTarefas([
  tarefa('atrasada', '2026-10-05'),
  tarefa('hoje-baixa', HOJE, { prioridade: 'baixa' }),
  tarefa('hoje-alta', HOJE, { prioridade: 'alta' }),
  tarefa('domingo', '2026-10-11'),
  tarefa('segunda', '2026-10-12'),
  tarefa('pronta-recente', '2026-10-01', { colunaId: 'pronto', concluidaEm: '2026-10-05' }),
  tarefa('pronta-antiga', '2026-09-01', { colunaId: 'pronto', concluidaEm: '2026-09-02' }),
  tarefa('sem-projeto', HOJE, { projetoId: 'apagado' }),
], [projeto], HOJE);
/** Junta os ids de uma lista de tarefas ('a,b,c'), para comparar a ordem num caso. */
const ids = (l: Tarefa[]) => l.map((t) => t.id).join(',');

// Dados mínimos para carga e entregas (Ana, semana de 5 a 11/10/2026).
const alocacao = (id: string, inicio: string, fim: string, carga: number) => ({ id, projetoId: 'p', pessoaId: 'ana', papel: 'Front', inicio, fim, carga, obs: '' });
const dadosPainel = {
  empresas: [], trilhas: [], projetos: [projeto],
  pessoas: [{ id: 'ana', cargaMax: 40 }],
  alocacoes: [alocacao('a1', '2026-09-01', '2026-12-01', 20), alocacao('a2', '2026-09-01', '2026-10-05', 10), alocacao('a3', '2026-10-12', '2026-11-01', 15)],
  tarefas: [
    tarefa('e1', '2026-10-06', { colunaId: 'pronto', concluidaEm: '2026-10-06' }),
    tarefa('e2', '2026-10-07', { colunaId: 'pronto', concluidaEm: '2026-10-07' }),
    tarefa('e3', '2026-09-30', { colunaId: 'pronto', concluidaEm: '2026-09-30' }),
    tarefa('voltou', '2026-10-01', { colunaId: 'afazer', concluidaEm: '2026-10-01' }),
  ],
} as unknown as Dados;
const carga = cargaDaSemana('ana', dadosPainel, HOJE);
const entregas = entregasPorSemana('ana', dadosPainel, 8, HOJE);

const casos: { porque: string; obtido: unknown; esperado: unknown }[] = [
  { porque: 'quarta → domingo da mesma semana', obtido: fimDaSemana('2026-10-07'), esperado: '2026-10-11' },
  { porque: 'domingo → ele mesmo', obtido: fimDaSemana('2026-10-11'), esperado: '2026-10-11' },
  { porque: 'segunda → domingo seguinte', obtido: fimDaSemana('2026-10-12'), esperado: '2026-10-18' },
  { porque: 'prazo antes de hoje: atrasada', obtido: ids(g.atrasadas), esperado: 'atrasada' },
  { porque: 'prazo hoje, prioridade alta antes da baixa', obtido: ids(g.hoje), esperado: 'hoje-alta,hoje-baixa' },
  { porque: 'domingo ainda é "Esta semana"', obtido: ids(g.semana), esperado: 'domingo' },
  { porque: 'segunda seguinte é "Depois"', obtido: ids(g.depois), esperado: 'segunda' },
  { porque: 'na última coluna e concluída há 2 dias: concluída recente', obtido: ids(g.concluidas), esperado: 'pronta-recente' },
  { porque: 'tarefa de projeto apagado não aparece em nenhum grupo', obtido: [g.atrasadas, g.hoje, g.semana, g.depois, g.concluidas].flat().some((t) => t.id === 'sem-projeto'), esperado: false },
  // inicioDaSemana
  { porque: 'quarta → segunda da mesma semana', obtido: inicioDaSemana('2026-10-07'), esperado: '2026-10-05' },
  { porque: 'segunda → ela mesma', obtido: inicioDaSemana('2026-10-05'), esperado: '2026-10-05' },
  { porque: 'domingo → segunda anterior (a semana vai até domingo)', obtido: inicioDaSemana('2026-10-11'), esperado: '2026-10-05' },
  // cargaDaSemana (semana de 5 a 11/10)
  { porque: 'carga soma só as alocações que cruzam a semana (20 + 10)', obtido: carga.total, esperado: 30 },
  { porque: 'alocação que termina na segunda ainda conta; a que começa depois de domingo não', obtido: carga.itens.map((i) => i.alocacao.id).sort().join(','), esperado: 'a1,a2' },
  { porque: 'limite vem do cargaMax da pessoa', obtido: carga.limite, esperado: 40 },
  // entregasPorSemana
  { porque: '8 semanas, a última é a atual', obtido: `${entregas.length}|${entregas.at(-1)?.inicio}`, esperado: '8|2026-10-05' },
  { porque: 'rótulo da semana é dia/mês da segunda', obtido: entregas.at(-1)?.rotulo, esperado: '5/10' },
  { porque: 'conta por semana do concluidaEm (2 na semana atual, 1 na anterior)', obtido: entregas.slice(-2).map((e) => e.valor).join(','), esperado: '1,2' },
  { porque: 'tarefa concluída que voltou para outra coluna não conta como entrega', obtido: entregas.reduce((s, e) => s + e.valor, 0), esperado: 3 },
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
