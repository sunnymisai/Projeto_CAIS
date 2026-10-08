/* ============================================================================
   CARGA (SEMÁFORO DE CARGA POR PERÍODO)
   O que é: a regra do semáforo de carga em funções puras: quanto da semana de
     cada pessoa está ocupado, dia a dia, levando em conta QUANDO cada alocação
     acontece (e não só se ela existe).
   Onde é usado: lib/carga.casos.ts (testes com Node) e, nas partes seguintes do
     bloco F, a store (cargaDaPessoa), a tela /carga, o modal de alocação, a aba
     Equipe e os painéis.
   Depende de: lib/utils.ts (somaDias, diasEntre) e dos tipos de lib/tipos.ts.
     Sem React, para rodar em Node (imports com extensão .ts).
   Contexto: §5 (carga acima de 40 h: "é aviso, não bloqueio") e §16 (semáforo
     de carga por período, o exemplo do time).

   O CONCEITO, EM POUCAS PALAVRAS
   - A conta é feita por DIA ÚTIL (segunda a sexta). Sábado e domingo não contam.
     Feriados ainda não entram (TODO abaixo).
   - Uma alocação está ATIVA num dia quando inicio <= dia <= fim (as duas pontas valem).
   - Ocupação do dia = soma das horas SEMANAIS (`carga`) das alocações ativas da
     pessoa naquele dia, dividida pelo limite dela (`cargaMax`), em %.
     Ex. 1: Bruno (limite 40 h) com Portal 30 h/sem e Estoque 15 h/sem no mesmo dia:
       45 ÷ 40 = 112,5% → vermelho.
     Ex. 2 (o caso do time, §16): 10 h/sem de hoje até hoje+7 e outro projeto de
       30 h/sem de hoje+8 em diante. As duas nunca estão ativas no mesmo dia, então
       o máximo é 30 ÷ 40 = 75% → nunca vermelho. É ISSO que a soma antiga errava.
   - Ocupação da semana = o PICO, a maior ocupação entre os dias úteis da semana.
     Usamos o pico (e não a média) porque basta um dia acima do limite para a
     pessoa estar sobrecarregada naquele dia.
     "Horas da semana" (só para exibir) = carga × dias úteis ativos ÷ 5, somado.
   - Níveis (LIMIARES): livre (0%), verde (até 75%), amarelo (até 100%) e vermelho
     (acima de 100%).
   - Projeto concluído não conta; pausado conta (CONTAR_PAUSADOS). Pessoa inativa
     e pessoa com limite 0 ficam fora (ocupação 0, sem semáforo).
   ============================================================================ */

import type { Alocacao, Dados, Pessoa } from './tipos.ts';
import { diasEntre, somaDias } from './utils.ts';

/* ---------------------------------------------------------------------------
   CONSTANTES QUE O TIME PODE AJUSTAR
   --------------------------------------------------------------------------- */

/**
 * Onde cada nível começa, em % da carga máxima da pessoa.
 * - livre: exatamente 0% (nenhuma alocação ativa);
 * - verde ("Com folga"): acima de 0% até `verde`;
 * - amarelo ("No limite"): acima de `verde` até `amarelo`;
 * - vermelho ("Acima do limite"): acima de `amarelo`.
 * ⚠️ ATENÇÃO: mudar estes números muda a cor em todas as telas do semáforo.
 */
export const LIMIARES = { verde: 75, amarelo: 100 } as const;

/** Projeto pausado continua ocupando a agenda da pessoa (a alocação não acabou). */
// TODO(PROGLOGIC): confirmar se projeto pausado deve contar na carga.
export const CONTAR_PAUSADOS = true;

/**
 * false = acima do limite é AVISO, NÃO BLOQUEIO (§5): alocar continua permitido.
 * true faria o modal de alocação recusar quando alguma semana fica vermelha (F04).
 */
export const BLOQUEAR_SOBRECARGA = false;

/** Quantos dias para frente proximaJanelaLivre procura antes de desistir. */
export const DIAS_DE_BUSCA = 365;

/** Os quatro níveis do semáforo. */
export type NivelCarga = 'livre' | 'verde' | 'amarelo' | 'vermelho';

/** Texto de cada nível (a tela junta ícone e cor; aqui fica só o texto, que vale para todo lugar). */
export const ROTULO_NIVEL: Record<NivelCarga, string> = {
  livre: 'Livre',
  verde: 'Com folga',
  amarelo: 'No limite',
  vermelho: 'Acima do limite',
};

/* ---------------------------------------------------------------------------
   DATAS
   --------------------------------------------------------------------------- */

/**
 * Dia da semana de uma data AAAA-MM-DD (0 = domingo ... 6 = sábado).
 * ⚠️ ATENÇÃO: a data é criada ao MEIO-DIA (T12:00:00). `new Date('2026-10-12')`
 * sozinho é lido como meia-noite em UTC, que no Brasil (UTC-3) ainda é domingo
 * à noite: a segunda viraria domingo. Com meio-dia, nenhum fuso troca o dia.
 * @param iso - data AAAA-MM-DD.
 * @returns 0 a 6.
 * @example diaDaSemana('2026-10-12') // 1 (segunda)
 */
function diaDaSemana(iso: string): number {
  return new Date(iso + 'T12:00:00').getDay();
}

/**
 * Diz se a data é dia útil (segunda a sexta).
 * TODO(PROGLOGIC): feriados nacionais e locais ainda contam como dia útil.
 * @param iso - data AAAA-MM-DD.
 * @returns true de segunda a sexta.
 * @example ehDiaUtil('2026-10-10') // false (sábado)
 */
export function ehDiaUtil(iso: string): boolean {
  const d = diaDaSemana(iso);
  return d !== 0 && d !== 6;
}

/**
 * Lista os dias úteis entre duas datas, incluindo as duas pontas.
 * @param inicio - primeira data (AAAA-MM-DD).
 * @param fim - última data (AAAA-MM-DD).
 * @returns os dias úteis em ordem ([] se fim vem antes de inicio).
 * @example diasUteisEntre('2026-10-09', '2026-10-13') // ['2026-10-09', '2026-10-12', '2026-10-13'] (pula sábado e domingo)
 */
export function diasUteisEntre(inicio: string, fim: string): string[] {
  const dias: string[] = [];
  const total = diasEntre(inicio, fim);
  for (let i = 0; i <= total; i++) {
    const dia = somaDias(inicio, i);
    if (ehDiaUtil(dia)) dias.push(dia);
  }
  return dias;
}

/**
 * A segunda-feira da semana de uma data (a semana vai de segunda a domingo).
 * @param dia - qualquer data (AAAA-MM-DD).
 * @returns a segunda daquela semana.
 * @example segundaDaSemana('2026-10-11') // '2026-10-05' (domingo pertence à semana que começou na segunda anterior)
 */
export function segundaDaSemana(dia: string): string {
  // (dia + 6) % 7 = quantos dias voltar até a segunda: segunda 0, terça 1 ... domingo 6.
  return somaDias(dia, -((diaDaSemana(dia) + 6) % 7));
}

/**
 * As segundas-feiras de todas as semanas que tocam o período.
 * @param inicio - primeira data (AAAA-MM-DD).
 * @param fim - última data (AAAA-MM-DD).
 * @returns lista de segundas, em ordem ([] se fim vem antes de inicio).
 * @example semanasEntre('2026-10-09', '2026-10-13') // ['2026-10-05', '2026-10-12']
 */
export function semanasEntre(inicio: string, fim: string): string[] {
  if (fim < inicio) return [];
  const semanas: string[] = [];
  const ultima = segundaDaSemana(fim);
  for (let s = segundaDaSemana(inicio); s <= ultima; s = somaDias(s, 7)) semanas.push(s);
  return semanas;
}

/**
 * Data em que termina um trabalho de N dias úteis começando em `inicio`.
 * Se `inicio` cai no fim de semana, a contagem começa na segunda seguinte.
 * @param inicio - data de início (AAAA-MM-DD).
 * @param diasUteis - duração em dias úteis (1 = só o primeiro dia útil).
 * @returns a data do último dia útil.
 * @example fimAposDiasUteis('2026-10-09', 2) // '2026-10-12' (sexta e segunda)
 */
export function fimAposDiasUteis(inicio: string, diasUteis: number): string {
  let dia = inicio;
  let contados = 0;
  // Anda dia a dia contando só os úteis; para no último.
  for (;;) {
    if (ehDiaUtil(dia)) contados++;
    if (contados >= Math.max(1, diasUteis)) return dia;
    dia = somaDias(dia, 1);
  }
}

/* ---------------------------------------------------------------------------
   NÍVEL E QUEM CONTA
   --------------------------------------------------------------------------- */

/**
 * Converte uma ocupação (%) no nível do semáforo, usando LIMIARES.
 * @param pct - ocupação em % (pode passar de 100).
 * @returns 'livre', 'verde', 'amarelo' ou 'vermelho'.
 * @example nivelDaOcupacao(100) // 'amarelo' (exatamente no limite ainda não passou)
 */
export function nivelDaOcupacao(pct: number): NivelCarga {
  if (pct <= 0) return 'livre';
  if (pct <= LIMIARES.verde) return 'verde';
  if (pct <= LIMIARES.amarelo) return 'amarelo';
  return 'vermelho';
}

/** O mínimo da pessoa que a regra lê (aceita a Pessoa inteira). */
type PessoaCarga = Pick<Pessoa, 'id' | 'cargaMax' | 'status'>;
/** O mínimo dos dados que a regra lê (aceita o `Dados` inteiro de useDados()). */
type DadosCarga = Pick<Dados, 'alocacoes' | 'projetos'>;

/**
 * A pessoa entra no semáforo? Inativa (fora da operação, §11) e limite 0 ficam fora.
 * @param pessoa - a pessoa.
 * @returns true se a ocupação dela deve ser calculada.
 */
function pessoaConta(pessoa: PessoaCarga): boolean {
  return pessoa.status !== 'inativo' && pessoa.cargaMax > 0;
}

/**
 * Alocações da pessoa que ocupam a agenda: tira a ignorada (edição no modal) e as
 * de projeto concluído (e pausado, se CONTAR_PAUSADOS for false).
 * Alocação de projeto que não existe nos dados CONTA: é o caso da alocação simulada
 * (simularAlocacao), que ainda não tem projeto salvo.
 * @param pessoa - a pessoa.
 * @param dados - alocações e projetos.
 * @param ignorarAlocacaoId - alocação que não deve contar (ex.: a que está sendo editada).
 * @returns as alocações que contam.
 */
function alocacoesQueContam(pessoa: PessoaCarga, dados: DadosCarga, ignorarAlocacaoId?: string): Alocacao[] {
  return dados.alocacoes.filter((a) => {
    if (a.pessoaId !== pessoa.id || a.id === ignorarAlocacaoId) return false;
    const proj = dados.projetos.find((p) => p.id === a.projetoId);
    if (proj?.status === 'concluido') return false;
    if (proj?.status === 'pausado' && !CONTAR_PAUSADOS) return false;
    return true;
  });
}

/* ---------------------------------------------------------------------------
   OCUPAÇÃO
   --------------------------------------------------------------------------- */

/** Contribuição de uma alocação num dia ou numa semana. */
export interface ParteDaCarga {
  projetoId: string;
  alocacaoId: string;
  papel: string;
  /** Horas semanais da alocação (o número cadastrado). */
  carga: number;
}

/**
 * Ocupação da pessoa num dia.
 * Dia não útil (sábado, domingo) e pessoa fora do semáforo dão 0.
 * @param pessoa - a pessoa (id, cargaMax, status).
 * @param dia - a data (AAAA-MM-DD).
 * @param dados - alocações e projetos.
 * @param ignorarAlocacaoId - alocação que não conta (edição no modal).
 * @returns `{ pct, horas, porProjeto }`: horas = soma das cargas semanais ativas no dia.
 * @example ocupacaoNoDia(bruno, '2026-10-13', d) // { pct: 112.5, horas: 45, porProjeto: [Portal 30, Estoque 15] }
 */
export function ocupacaoNoDia(pessoa: PessoaCarga, dia: string, dados: DadosCarga, ignorarAlocacaoId?: string) {
  if (!pessoaConta(pessoa) || !ehDiaUtil(dia)) return { pct: 0, horas: 0, porProjeto: [] as ParteDaCarga[] };
  // Ativa no dia: inicio <= dia <= fim (texto AAAA-MM-DD compara na ordem certa).
  const ativas = alocacoesQueContam(pessoa, dados, ignorarAlocacaoId).filter((a) => a.inicio <= dia && dia <= a.fim);
  const horas = ativas.reduce((s, a) => s + a.carga, 0);
  return {
    pct: (horas / pessoa.cargaMax) * 100,
    horas,
    porProjeto: ativas.map((a) => ({ projetoId: a.projetoId, alocacaoId: a.id, papel: a.papel, carga: a.carga })),
  };
}

/**
 * Ocupação da pessoa numa semana (segunda a sexta).
 * @param pessoa - a pessoa.
 * @param segunda - a segunda-feira da semana (use segundaDaSemana).
 * @param dados - alocações e projetos.
 * @param ignorarAlocacaoId - alocação que não conta.
 * @returns `{ segunda, pct, nivel, diaDoPico, horasProporcionais, porProjeto, porDia }`:
 *   pct = pico diário; diaDoPico = primeiro dia com o pico (null se livre);
 *   horasProporcionais = soma de carga × dias úteis ativos ÷ 5;
 *   porProjeto = cada alocação ativa em algum dia da semana, com as horas proporcionais dela.
 * @example ocupacaoNaSemana(diego, '2026-10-12', d).pct // 75 (as duas alocações nunca no mesmo dia)
 */
export function ocupacaoNaSemana(pessoa: PessoaCarga, segunda: string, dados: DadosCarga, ignorarAlocacaoId?: string) {
  const dias = [0, 1, 2, 3, 4].map((i) => somaDias(segunda, i));
  const porDia = dias.map((dia) => ({ dia, ...ocupacaoNoDia(pessoa, dia, dados, ignorarAlocacaoId) }));
  // Pico: a maior ocupação; o primeiro dia que chega nele é o "dia do pico".
  const pico = porDia.reduce((m, x) => (x.pct > m.pct ? x : m), porDia[0]);
  // Quantos dias úteis da semana cada alocação esteve ativa → horas proporcionais.
  const partes = new Map<string, ParteDaCarga & { diasAtivos: number }>();
  for (const d of porDia) {
    for (const p of d.porProjeto) {
      const atual = partes.get(p.alocacaoId) ?? { ...p, diasAtivos: 0 };
      atual.diasAtivos++;
      partes.set(p.alocacaoId, atual);
    }
  }
  const porProjeto = [...partes.values()].map((p) => ({ ...p, horas: (p.carga * p.diasAtivos) / 5 }));
  return {
    segunda,
    pct: pico.pct,
    nivel: nivelDaOcupacao(pico.pct),
    diaDoPico: pico.pct > 0 ? pico.dia : null,
    horasProporcionais: porProjeto.reduce((s, p) => s + p.horas, 0),
    porProjeto,
    porDia,
  };
}

/**
 * Várias semanas seguidas da pessoa, para as linhas do semáforo (tela /carga, painéis).
 * @param pessoa - a pessoa.
 * @param deSegunda - a primeira segunda (use segundaDaSemana(hoje)).
 * @param qtdSemanas - quantas semanas.
 * @param dados - alocações e projetos.
 * @returns uma ocupacaoNaSemana por semana, em ordem.
 * @example linhaDoTempo(bruno, segundaDaSemana(hojeISO()), 8, d).map((s) => s.nivel)
 */
export function linhaDoTempo(pessoa: PessoaCarga, deSegunda: string, qtdSemanas: number, dados: DadosCarga) {
  return Array.from({ length: Math.max(0, qtdSemanas) }, (_, i) => ocupacaoNaSemana(pessoa, somaDias(deSegunda, i * 7), dados));
}

/**
 * Maior ocupação diária da pessoa num período (ex.: o período de um projeto).
 * @param pessoa - a pessoa.
 * @param inicio - primeira data (AAAA-MM-DD).
 * @param fim - última data (AAAA-MM-DD).
 * @param dados - alocações e projetos.
 * @param ignorarAlocacaoId - alocação que não conta.
 * @returns `{ pct, nivel }` (livre se o período não tem dia útil).
 * @example picoNoPeriodo(bruno, projeto.inicio, projeto.entrega, d).nivel // 'vermelho'
 */
export function picoNoPeriodo(pessoa: PessoaCarga, inicio: string, fim: string, dados: DadosCarga, ignorarAlocacaoId?: string) {
  const pct = diasUteisEntre(inicio, fim).reduce((m, dia) => Math.max(m, ocupacaoNoDia(pessoa, dia, dados, ignorarAlocacaoId).pct), 0);
  return { pct, nivel: nivelDaOcupacao(pct) };
}

/** Id da alocação fictícia usada por simularAlocacao (nunca é salva). */
const ID_SIMULADA = '__simulada';

/**
 * Prévia de uma alocação nova (ou editada): como fica cada semana do período antes e depois.
 * "Antes" é a situação de hoje (com a alocação antiga, se for edição); "depois" troca a
 * antiga (ignorarAlocacaoId) pela nova.
 * @param pessoa - a pessoa.
 * @param nova - período e carga semanal da alocação proposta.
 * @param dados - alocações e projetos.
 * @param ignorarAlocacaoId - a alocação que está sendo editada (sai do "depois").
 * @returns por semana do período: `{ segunda, antes: { pct, nivel }, depois: { pct, nivel } }`.
 * @example simularAlocacao(bruno, { inicio: '2026-10-12', fim: '2026-10-23', carga: 20 }, d)[0].depois.nivel // 'vermelho'
 */
export function simularAlocacao(pessoa: PessoaCarga, nova: { inicio: string; fim: string; carga: number }, dados: DadosCarga, ignorarAlocacaoId?: string) {
  const simulada: Alocacao = { id: ID_SIMULADA, projetoId: ID_SIMULADA, pessoaId: pessoa.id, papel: '', inicio: nova.inicio, fim: nova.fim, carga: nova.carga, obs: '' };
  const comNova: DadosCarga = { ...dados, alocacoes: [...dados.alocacoes, simulada] };
  return semanasEntre(nova.inicio, nova.fim).map((segunda) => {
    const antes = ocupacaoNaSemana(pessoa, segunda, dados);
    const depois = ocupacaoNaSemana(pessoa, segunda, comNova, ignorarAlocacaoId);
    return { segunda, antes: { pct: antes.pct, nivel: antes.nivel }, depois: { pct: depois.pct, nivel: depois.nivel } };
  });
}

/**
 * Primeira data em que uma alocação nova cabe sem passar de 100% em NENHUM dia útil.
 * Testa cada dia a partir de `aPartirDe` (até DIAS_DE_BUSCA dias): a janela são os
 * `duracaoDiasUteis` dias úteis seguintes, e em cada um as horas atuais + `carga`
 * precisam caber no limite da pessoa.
 * @param pessoa - a pessoa.
 * @param carga - horas semanais da alocação nova.
 * @param duracaoDiasUteis - duração da alocação em dias úteis.
 * @param aPartirDe - primeira data possível (AAAA-MM-DD).
 * @param dados - alocações e projetos.
 * @param ignorarAlocacaoId - alocação que não conta (edição).
 * @returns a data de início (um dia útil) ou null se não couber em 365 dias
 *   (ou se a carga sozinha já passa do limite, ou a pessoa está fora do semáforo).
 * @example proximaJanelaLivre(bruno, 30, 10, '2026-10-12', d) // '2026-11-02': antes disso algum dia passaria de 100%
 */
export function proximaJanelaLivre(pessoa: PessoaCarga, carga: number, duracaoDiasUteis: number, aPartirDe: string, dados: DadosCarga, ignorarAlocacaoId?: string): string | null {
  if (!pessoaConta(pessoa) || carga > pessoa.cargaMax) return null;
  // Cabe num dia = as horas que já estão lá + a nova não passam do limite.
  const cabe = (dia: string) => ocupacaoNoDia(pessoa, dia, dados, ignorarAlocacaoId).horas + carga <= pessoa.cargaMax;
  for (let i = 0; i <= DIAS_DE_BUSCA; i++) {
    const inicio = somaDias(aPartirDe, i);
    // Só começa em dia útil (começar num sábado é o mesmo que começar na segunda).
    if (!ehDiaUtil(inicio)) continue;
    const fim = fimAposDiasUteis(inicio, duracaoDiasUteis);
    if (diasUteisEntre(inicio, fim).every(cabe)) return inicio;
  }
  return null;
}
