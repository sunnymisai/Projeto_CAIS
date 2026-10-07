/* ============================================================================
   CASOS DE TESTE DAS MÉTRICAS (MINHAS TAREFAS)
   O que é: script simples (sem biblioteca de testes) que confere fimDaSemana e
     agruparMinhasTarefas com uma data fixa. Cada caso tem entrada, esperado e o porquê.
   Onde é usado: rodado à mão no terminal; nenhuma tela importa este arquivo.
   Depende de: lib/metricas.ts e lib/tipos.ts (imports com extensão .ts para o Node achar os módulos).
   Contexto: §12 fluxo 4 (o profissional vê o que é dele hoje).
   Como rodar: node --experimental-strip-types lib/metricas.casos.ts
   ============================================================================ */

import { agruparMinhasTarefas, fimDaSemana } from './metricas.ts';
import type { Projeto, Tarefa } from './tipos.ts';

// Hoje fixo: quarta-feira, 7 de outubro de 2026 (domingo da semana = dia 11).
const HOJE = '2026-10-07';
const projeto = { id: 'p', colunas: [{ id: 'afazer', titulo: 'A fazer' }, { id: 'pronto', titulo: 'Pronto' }] } as Projeto;
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
const ids = (l: Tarefa[]) => l.map((t) => t.id).join(',');

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
