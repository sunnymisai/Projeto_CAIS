/* ============================================================================
   GRAFICOS.TSX — BIBLIOTECA DE GRÁFICOS (BASE)
   O que é: gráficos simples feitos em SVG/HTML puro (barra empilhada, legenda,
   rosca, barras com limite e colunas), leves e acessíveis: cada gráfico tem
   um resumo em texto para leitor de tela e usa as cores dos tokens do tema.
   Onde é usado: app/(sistema)/painel, projetos/[id], trilhas e design-system.
   Depende de: lib/utils (cx) e das variáveis de cor de app/globals.css.
   Contexto: §6 (dashboards por perfil), §8 (onda 4: biblioteca de gráficos)
   e §13 (acessível).
   ============================================================================ */
"use client";

import { cx } from '@/lib/utils';

/**
 * Um pedaço de um gráfico.
 * - rotulo: nome do pedaço (ex.: "Concluídas").
 * - valor: número absoluto (não percentual).
 * - cor: qualquer cor CSS (ex.: "var(--sucesso)").
 */
export interface Segmento { rotulo: string; valor: number; cor: string }

/**
 * Barra empilhada horizontal (ex.: situação das pessoas numa trilha).
 * @param segmentos pedaços da barra; cada um ocupa sua fração do total.
 * @param altura altura da barra em px (padrão 10).
 * @returns a barra (role="img" com resumo em texto).
 * @example <BarraEmpilhada segmentos={[{ rotulo: 'Concluídas', valor: 3, cor: 'var(--sucesso)' }]} />
 */
export function BarraEmpilhada({ segmentos, altura = 10 }: { segmentos: Segmento[]; altura?: number }) {
  // Soma dos valores. O "|| 1" evita divisão por zero quando tudo é 0.
  const total = segmentos.reduce((s, x) => s + x.valor, 0) || 1;
  // Texto que o leitor de tela lê no lugar do desenho (ex.: "Concluídas: 3, Em atraso: 1").
  const resumo = segmentos.map((s) => `${s.rotulo}: ${s.valor}`).join(', ');
  return (
    <div role="img" aria-label={resumo} className="flex w-full overflow-hidden rounded-full bg-superficie-alt" style={{ height: altura }}>
      {/* Segmentos com valor 0 não são desenhados. first:/last: arredondam só as pontas. */}
      {segmentos.map((s) => s.valor > 0 && (
        <div key={s.rotulo} title={`${s.rotulo}: ${s.valor}`} className="h-full transition-[width] duration-500 first:rounded-l-full last:rounded-r-full"
          style={{ width: `${(s.valor / total) * 100}%`, background: s.cor }} />
      ))}
    </div>
  );
}

/**
 * Legenda com quadradinho de cor, rótulo e valor de cada segmento.
 * @param itens os mesmos segmentos passados ao gráfico.
 * @returns uma lista <ul>.
 */
export function Legenda({ itens }: { itens: Segmento[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-tinta-suave">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.cor }} aria-hidden />
          {i.rotulo} <span className="font-semibold text-tinta">{i.valor}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Rosca (donut) com total no centro.
 * @param segmentos pedaços da rosca.
 * @param tamanho largura/altura em px (padrão 148).
 * @param centro texto grande no meio (ex.: "12").
 * @param subcentro texto pequeno abaixo (ex.: "projetos").
 * @returns um <svg> com resumo em texto.
 */
export function Rosca({ segmentos, tamanho = 148, centro, subcentro }: { segmentos: Segmento[]; tamanho?: number; centro: string; subcentro: string }) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  // Raio do círculo e sua circunferência (c = 2πr), usada para medir cada arco.
  const r = 42, c = 2 * Math.PI * r;
  // Quanto da volta (0 a 1) já foi desenhado; cada segmento começa onde o anterior terminou.
  let acumulado = 0;
  return (
    <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} role="img"
      aria-label={`${centro} ${subcentro}. ` + segmentos.map((s) => `${s.rotulo}: ${s.valor}`).join(', ')}>
      {/* Trilho cinza de fundo (aparece inteiro quando o total é 0). */}
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--superficie-alt)" strokeWidth="12" />
      {/* Truque do traço: strokeDasharray desenha um traço do tamanho da fatia (menos
       * 1,5 de folga, que vira o espaço entre fatias) e strokeDashoffset empurra o
       * início para onde a fatia anterior acabou. rotate(-90) faz começar no topo. */}
      {total > 0 && segmentos.map((s) => {
        const frac = s.valor / total;
        const el = (
          <circle key={s.rotulo} cx="50" cy="50" r={r} fill="none" stroke={s.cor} strokeWidth="12"
            strokeDasharray={`${Math.max(0, frac * c - 1.5)} ${c}`} strokeDashoffset={-acumulado * c}
            transform="rotate(-90 50 50)" strokeLinecap="butt" />
        );
        // Avança o ponto de início da próxima fatia.
        acumulado += frac;
        return el;
      })}
      <text x="50" y="49" textAnchor="middle" className="fill-tinta font-space" fontSize="18" fontWeight="600">{centro}</text>
      <text x="50" y="62" textAnchor="middle" className="fill-tinta-suave" fontSize="7.5">{subcentro}</text>
    </svg>
  );
}

/**
 * Barras horizontais com linha de limite (ex.: carga semanal x 40 h, §5).
 * Passar do limite pinta a barra de âmbar: "é aviso, não bloqueio".
 * @param itens lista de { rotulo, valor, limite, sub? }.
 * @param maximoEscala valor que corresponde a 100% da largura (ex.: 60 h).
 * @returns lista de barras.
 * @example <BarrasComLimite maximoEscala={60} itens={[{ rotulo: 'Ana', valor: 44, limite: 40 }]} />
 */
export function BarrasComLimite({ itens, maximoEscala }: {
  itens: { rotulo: string; valor: number; limite: number; sub?: string }[]; maximoEscala: number;
}) {
  return (
    <ul className="space-y-3">
      {itens.map((i) => {
        // Acima do limite → cor de aviso (âmbar) e texto extra para o leitor de tela.
        const acima = i.valor > i.limite;
        return (
          <li key={i.rotulo}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
              <span className="truncate font-medium text-tinta">{i.rotulo}{i.sub && <span className="ml-1.5 font-normal text-tinta-suave">{i.sub}</span>}</span>
              <span className={cx('shrink-0 font-semibold tabular-nums', acima ? 'text-aviso' : 'text-tinta-suave')}>{i.valor} / {i.limite} h</span>
            </div>
            <div className="relative h-2 rounded-full bg-superficie-alt" role="img" aria-label={`${i.rotulo}: ${i.valor} de ${i.limite} horas${acima ? ', acima do limite' : ''}`}>
              {/* Largura limitada a 100% para a barra não vazar da caixa. */}
              <div className={cx('h-full rounded-full transition-[width] duration-500', acima ? 'bg-aviso' : 'bg-primaria')}
                style={{ width: `${Math.min(100, (i.valor / maximoEscala) * 100)}%` }} />
              {/* Risquinho vertical que marca onde fica o limite na escala. */}
              <span className="absolute -top-1 h-4 w-0.5 rounded bg-tinta/40" style={{ left: `${(i.limite / maximoEscala) * 100}%` }} aria-hidden />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Colunas verticais simples (ex.: tarefas por etapa do quadro).
 * @param itens lista de { rotulo, valor, cor }.
 * @param altura altura máxima das colunas em px (padrão 140).
 * @returns o gráfico (role="img" com resumo em texto).
 */
export function Colunas({ itens, altura = 140 }: { itens: { rotulo: string; valor: number; cor: string }[]; altura?: number }) {
  // Maior valor (no mínimo 1, para não dividir por zero) vira a coluna mais alta.
  const max = Math.max(1, ...itens.map((i) => i.valor));
  // Altura total = colunas + 36 px reservados para o número e o rótulo.
  return (
    <div className="flex items-end gap-3" style={{ height: altura + 36 }} role="img" aria-label={itens.map((i) => `${i.rotulo}: ${i.valor}`).join(', ')}>
      {itens.map((i) => (
        <div key={i.rotulo} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[13px] font-semibold tabular-nums text-tinta">{i.valor}</span>
          {/* Altura proporcional ao maior valor; mínimo de 4 px para o zero continuar visível. */}
          <div className="w-full max-w-14 rounded-t-lg transition-[height] duration-500" style={{ height: Math.max(4, (i.valor / max) * altura), background: i.cor }} />
          <span className="truncate text-[12px] text-tinta-suave">{i.rotulo}</span>
        </div>
      ))}
    </div>
  );
}
