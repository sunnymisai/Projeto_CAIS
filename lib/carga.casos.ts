/* ============================================================================
   CASOS DE TESTE DO SEMÁFORO DE CARGA
   O que é: script simples (sem biblioteca de testes) que confere as funções de
     lib/carga.ts com datas fixas. Cada caso tem entrada, esperado e o porquê.
   Onde é usado: rodado à mão no terminal; nenhuma tela importa este arquivo.
   Depende de: lib/carga.ts e lib/tipos.ts (imports com extensão .ts para o Node achar os módulos).
   Contexto: §5 (aviso, não bloqueio) e §16 (semáforo de carga por período).
   Como rodar: node --experimental-strip-types lib/carga.casos.ts
   ============================================================================ */

import {
  diasUteisEntre, fimAposDiasUteis, linhaDoTempo, nivelDaOcupacao, ocupacaoNaSemana, ocupacaoNoDia,
  picoNoPeriodo, proximaJanelaLivre, segundaDaSemana, semanasEntre, simularAlocacao,
} from './carga.ts';
import type { Alocacao, Pessoa, Projeto } from './tipos.ts';

// Calendário de referência (outubro de 2026): 9 = sexta, 10 = sábado, 11 = domingo,
// 12 = segunda, 16 = sexta, 19 = segunda.

/**
 * Monta uma pessoa de teste; `extra` troca só o que o caso precisa.
 * @example pessoa('bruno', { cargaMax: 30 })
 */
const pessoa = (id: string, extra: Partial<Pessoa> = {}) => ({ id, cargaMax: 40, status: 'ativo', ...extra }) as Pessoa;
/**
 * Monta uma alocação de teste (projeto 'p' por padrão).
 * @example aloc('a1', 'bruno', '2026-10-12', '2026-10-16', 30)
 */
const aloc = (id: string, pessoaId: string, inicio: string, fim: string, carga: number, projetoId = 'p'): Alocacao =>
  ({ id, projetoId, pessoaId, papel: 'Front-end', inicio, fim, carga, obs: '' });
/** Monta um projeto de teste só com id e status (o que a regra lê). */
const projeto = (id: string, status: Projeto['status']) => ({ id, status }) as Projeto;
const PROJETOS = [projeto('p', 'andamento'), projeto('q', 'andamento'), projeto('fim', 'concluido'), projeto('pausa', 'pausado')];

const bruno = pessoa('bruno');
const diego = pessoa('diego');
const elisa = pessoa('elisa', { cargaMax: 30 });
const inativo = pessoa('inativo', { status: 'inativo' });

const dados = {
  projetos: PROJETOS,
  alocacoes: [
    // Exemplo 1: Bruno com 30 + 15 h/sem no mesmo período → 112,5%.
    aloc('b1', 'bruno', '2026-10-12', '2026-10-30', 30, 'p'),
    aloc('b2', 'bruno', '2026-10-14', '2026-10-30', 15, 'q'),
    // Exemplo 2 (o caso do time): 10 h/sem até o 7º dia e 30 h/sem a partir do 8º, sem se cruzar.
    aloc('d1', 'diego', '2026-10-12', '2026-10-19', 10, 'p'),
    aloc('d2', 'diego', '2026-10-20', '2026-11-30', 30, 'q'),
    // Elisa (limite 30 h): 20 + 10 = 30 h no mesmo dia → exatamente 100%.
    aloc('e1', 'elisa', '2026-10-12', '2026-10-16', 20, 'p'),
    aloc('e2', 'elisa', '2026-10-12', '2026-10-16', 10, 'q'),
    // Alocação de 1 dia (início = fim) numa quarta.
    aloc('um', 'elisa', '2026-10-21', '2026-10-21', 15, 'p'),
    // Projeto concluído não conta; pausado conta.
    aloc('c1', 'diego', '2026-12-07', '2026-12-11', 40, 'fim'),
    aloc('z1', 'diego', '2026-12-14', '2026-12-18', 20, 'pausa'),
    // Pessoa inativa com alocação: fica fora.
    aloc('i1', 'inativo', '2026-10-12', '2026-10-16', 40, 'p'),
  ],
};

/** Ocupação do Diego na semana que começa em `segunda` (atalho para os casos do exemplo 2). */
const semanaDiego = (segunda: string) => ocupacaoNaSemana(diego, segunda, dados);
const linhaDiego = linhaDoTempo(diego, '2026-10-12', 8, dados);
const simBruno = simularAlocacao(bruno, { inicio: '2026-11-02', fim: '2026-11-13', carga: 20 }, dados);
// Bruno: 45 h até 30/10; janela para 30 h/sem durante 10 dias úteis só a partir de 02/11.
const janelaBruno = proximaJanelaLivre(bruno, 30, 10, '2026-10-12', dados);
// Alguém sempre ocupado com 40 h: nunca cabe mais nada em 365 dias.
const cheio = { projetos: PROJETOS, alocacoes: [aloc('x', 'cheio', '2026-01-01', '2028-12-31', 40, 'p')] };
const janelaCheio = proximaJanelaLivre(pessoa('cheio'), 10, 5, '2026-10-12', cheio);

const casos: { porque: string; obtido: unknown; esperado: unknown }[] = [
  { porque: 'dias úteis pulam sábado e domingo', obtido: diasUteisEntre('2026-10-09', '2026-10-13').join(','), esperado: '2026-10-09,2026-10-12,2026-10-13' },
  { porque: 'fim de semana inteiro não tem dia útil', obtido: diasUteisEntre('2026-10-10', '2026-10-11').length, esperado: 0 },
  { porque: 'domingo pertence à semana da segunda anterior', obtido: segundaDaSemana('2026-10-11'), esperado: '2026-10-05' },
  { porque: 'segunda é a própria segunda (sem erro de fuso)', obtido: segundaDaSemana('2026-10-12'), esperado: '2026-10-12' },
  { porque: 'semanas que tocam o período (sexta a terça seguinte)', obtido: semanasEntre('2026-10-09', '2026-10-13').join(','), esperado: '2026-10-05,2026-10-12' },
  { porque: 'nível: 0% livre, 75% verde, exatamente 100% amarelo, 100,1% vermelho', obtido: [0, 75, 100, 100.1].map(nivelDaOcupacao).join(','), esperado: 'livre,verde,amarelo,vermelho' },
  { porque: 'exemplo 1: Bruno com 30 + 15 h/sem no mesmo dia = 112,5%', obtido: ocupacaoNoDia(bruno, '2026-10-14', dados).pct, esperado: 112.5 },
  { porque: 'sábado não ocupa ninguém, mesmo com alocação ativa', obtido: ocupacaoNoDia(bruno, '2026-10-17', dados).pct, esperado: 0 },
  { porque: 'sobreposição parcial: a semana do Bruno vale pelo pico (a 2ª alocação começa na quarta)', obtido: `${ocupacaoNaSemana(bruno, '2026-10-12', dados).pct}|${ocupacaoNaSemana(bruno, '2026-10-12', dados).diaDoPico}`, esperado: '112.5|2026-10-14' },
  { porque: 'horas proporcionais: 30 h × 5/5 + 15 h × 3/5 = 39 h na semana', obtido: ocupacaoNaSemana(bruno, '2026-10-12', dados).horasProporcionais, esperado: 39 },
  { porque: 'exemplo 2 (o caso do time): na semana da troca, o pico é 75%, não 100%', obtido: `${semanaDiego('2026-10-19').pct}|${semanaDiego('2026-10-19').nivel}`, esperado: '75|verde' },
  { porque: 'exemplo 2: Diego nunca fica vermelho em 8 semanas', obtido: linhaDiego.some((s) => s.nivel === 'vermelho'), esperado: false },
  { porque: 'exatamente 100% (Elisa, limite 30 h, 20 + 10 h) é amarelo', obtido: ocupacaoNaSemana(elisa, '2026-10-12', dados).nivel, esperado: 'amarelo' },
  { porque: 'cargaMax 30: 15 h num dia = 50%', obtido: ocupacaoNoDia(elisa, '2026-10-21', dados).pct, esperado: 50 },
  { porque: 'alocação de 1 dia (início = fim) ocupa só aquele dia', obtido: `${ocupacaoNoDia(elisa, '2026-10-20', dados).pct}|${ocupacaoNoDia(elisa, '2026-10-22', dados).pct}`, esperado: '0|0' },
  { porque: 'projeto concluído não conta na carga', obtido: ocupacaoNoDia(diego, '2026-12-08', dados).pct, esperado: 0 },
  { porque: 'projeto pausado conta (CONTAR_PAUSADOS)', obtido: ocupacaoNoDia(diego, '2026-12-15', dados).pct, esperado: 50 },
  { porque: 'pessoa inativa fica fora do semáforo', obtido: ocupacaoNoDia(inativo, '2026-10-13', dados).pct, esperado: 0 },
  { porque: 'pico no período do Bruno em outubro é vermelho', obtido: picoNoPeriodo(bruno, '2026-10-12', '2026-10-30', dados).nivel, esperado: 'vermelho' },
  { porque: 'ignorar a alocação editada tira ela da conta (Bruno sem b2 = 75%)', obtido: picoNoPeriodo(bruno, '2026-10-12', '2026-10-30', dados, 'b2').pct, esperado: 75 },
  { porque: 'simular 20 h/sem para o Bruno em novembro (livre): antes livre, depois 50%', obtido: simBruno.map((s) => `${s.antes.nivel}>${s.depois.pct}`).join(','), esperado: 'livre>50,livre>50' },
  { porque: 'proximaJanelaLivre encontra a 1ª segunda depois do fim das alocações do Bruno', obtido: janelaBruno, esperado: '2026-11-02' },
  { porque: 'proximaJanelaLivre devolve null quando a pessoa está cheia por mais de 365 dias', obtido: janelaCheio, esperado: null },
  { porque: 'proximaJanelaLivre devolve null quando a carga sozinha passa do limite', obtido: proximaJanelaLivre(elisa, 31, 1, '2026-10-12', dados), esperado: null },
  { porque: 'fim de um trabalho de 2 dias úteis começando na sexta é a segunda', obtido: fimAposDiasUteis('2026-10-09', 2), esperado: '2026-10-12' },
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
