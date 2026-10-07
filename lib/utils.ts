/* ============================================================================
   UTILS (UTILITÁRIOS)
   O que é: funções pequenas e puras de classes CSS, ids, datas, máscaras e validação usadas em todo o sistema.
   Onde é usado: praticamente todas as telas de app/(sistema)/, components/ui/*, components/shell/*, components/projetos/*, components/button.tsx, components/LoginForm.tsx (EMAIL_REGEX) e lib/metricas.ts, lib/seed.ts, lib/store.tsx.
   Depende de: nada (só JavaScript/TypeScript).
   Contexto: §11 (máscaras de CNPJ, CEP, telefone e validação de e-mail).
   ============================================================================ */

/* Utilitários de formatação, máscara e validação usados em todo o sistema. */

/**
 * Junta classes CSS ignorando as "falsas" (false, null, undefined, '').
 * @param c - classes ou condições.
 * @returns as classes separadas por espaço.
 * @example cx('botao', ativo && 'botao-ativo') // 'botao botao-ativo' ou 'botao'
 */
export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

/**
 * Gera um id único o bastante para o protótipo.
 * @param prefixo - indica o tipo do item (ex.: 'emp', 'pes', 'tar').
 * @returns texto como 'tar_lq2x8k3a9f2'.
 */
// SIMULADO: no back-end real quem gera o id é o banco.
// TODO(API): deixar a API criar o id e usar o que ela devolver.
export function novoId(prefixo = 'id') {
  // Data atual em base 36 + 5 caracteres aleatórios: curto e quase impossível de repetir.
  return `${prefixo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Data de hoje no fuso de quem está usando, no formato AAAA-MM-DD.
 * @returns ex.: '2026-10-07'.
 */
export function hojeISO() {
  const d = new Date();
  // toISOString() usa UTC; descontar o fuso evita que, à noite no Brasil, "hoje" vire amanhã.
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/**
 * Soma (ou subtrai) dias de uma data.
 * @param iso - data AAAA-MM-DD.
 * @param dias - quantos dias somar (negativo volta no tempo).
 * @returns nova data AAAA-MM-DD.
 * @example somaDias('2026-10-07', 3) // '2026-10-10'
 */
export function somaDias(iso: string, dias: number) {
  // Meio-dia (T12:00) evita que a troca de fuso/horário de verão mude o dia.
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Quantos dias de `a` até `b` (negativo se `b` vem antes).
 * @param a - data inicial AAAA-MM-DD.
 * @param b - data final AAAA-MM-DD.
 * @returns número inteiro de dias.
 * @example diasEntre(hojeISO(), tarefa.prazo) // 3 = vence em 3 dias; -2 = atrasada há 2 dias
 */
export function diasEntre(a: string, b: string) {
  // 86400000 ms = 1 dia; Math.round absorve diferenças de horário de verão.
  return Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);
}

// Abreviações dos meses, na ordem (índice 0 = janeiro).
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "2026-10-14" → "14 out" */
export function dataCurta(iso?: string) {
  // Sem data: devolve vazio para a tela não mostrar "undefined".
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1]}`;
}

/** "2026-10-14" → "14/10/2026" */
export function dataBR(iso?: string) {
  // Sem data: mostra um travessão, que em tabela indica "não informado".
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/**
 * Tempo passado em linguagem natural (usado nos comentários das tarefas).
 * @param iso - data-hora ISO completa.
 * @returns 'agora', 'há 5 min', 'há 3 h', 'ontem' ou 'há 4 dias'.
 */
export function tempoRelativo(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  // Escolhe a maior unidade que faz sentido: minutos → horas → dias.
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

/**
 * Iniciais para o avatar: primeira letra do primeiro e do último nome.
 * @param nome - nome completo.
 * @returns ex.: 'Ana Souza' → 'AS'; 'Ana' → 'A'.
 */
export function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/);
  // Só junta a última inicial se houver mais de um nome.
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

/**
 * Remove tudo o que não é dígito.
 * @example soDigitos('11.222.333/0001-81') // '11222333000181'
 */
export const soDigitos = (v: string) => v.replace(/\D/g, '');

/**
 * Máscara de CNPJ enquanto a pessoa digita (§11).
 * @param v - texto digitado.
 * @returns ex.: '11222333000181' → '11.222.333/0001-81'.
 */
export function mascaraCNPJ(v: string) {
  // Limita a 14 dígitos e vai inserindo ponto, ponto, barra e hífen nessa ordem.
  return soDigitos(v).slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Máscara de CEP (§11).
 * @param v - texto digitado.
 * @returns ex.: '50030230' → '50030-230'.
 */
export function mascaraCEP(v: string) {
  return soDigitos(v).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

/**
 * Máscara de telefone fixo ou celular.
 * @param v - texto digitado.
 * @returns '(81) 3333-4444' (10 dígitos) ou '(81) 99876-1122' (11 dígitos).
 */
export function mascaraTelefone(v: string) {
  const d = soDigitos(v).slice(0, 11);
  // Até 10 dígitos é fixo (4 + 4); com 11 é celular (5 + 4).
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Valida os dígitos verificadores do CNPJ.
 * @param v - CNPJ com ou sem máscara.
 * @returns true se os dois últimos dígitos batem com o cálculo oficial.
 * @example cnpjValido('11.222.333/0001-81') // true
 */
export function cnpjValido(v: string) {
  const c = soDigitos(v);
  // Precisa ter 14 dígitos; sequências repetidas (00000000000000) passam na conta, mas não são válidas.
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  // Cálculo oficial: multiplica cada dígito por pesos 5,4,3,2,9,8... (ou 6,5,4... no 2º dígito),
  // soma tudo e usa o resto da divisão por 11.
  const calc = (base: string) => {
    let soma = 0, peso = base.length - 7;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * peso--;
      // Depois do peso 2, recomeça em 9.
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  // 1º dígito usa os 12 primeiros; o 2º usa os 12 primeiros + o 1º dígito calculado.
  const d1 = calc(c.slice(0, 12));
  const d2 = calc(c.slice(0, 12) + d1);
  return d1 === Number(c[12]) && d2 === Number(c[13]);
}

/**
 * Formato básico de e-mail: algo@algo.xx (sem espaços, domínio com 2+ letras no fim).
 * Não garante que o e-mail exista — só que tem o formato certo.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Normaliza texto para busca sem acento e sem caixa.
 * @example normalizar('Vértice') // 'vertice'
 */
export function normalizar(s: string) {
  // NFD separa a letra do acento; a regex apaga os acentos soltos.
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
