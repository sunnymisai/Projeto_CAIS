"use client";

import { cx } from '@/lib/utils';

/* ============================================================================
   BIBLIOTECA DE GRÁFICOS (base)
   Feitos em SVG/HTML puro: leves, acessíveis (cada gráfico tem um resumo
   em texto para leitor de tela) e com as cores dos tokens do tema.
   ============================================================================ */

export interface Segmento { rotulo: string; valor: number; cor: string }

/** Barra empilhada horizontal (ex.: situação das pessoas numa trilha). */
export function BarraEmpilhada({ segmentos, altura = 10 }: { segmentos: Segmento[]; altura?: number }) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0) || 1;
  const resumo = segmentos.map((s) => `${s.rotulo}: ${s.valor}`).join(', ');
  return (
    <div role="img" aria-label={resumo} className="flex w-full overflow-hidden rounded-full bg-superficie-alt" style={{ height: altura }}>
      {segmentos.map((s) => s.valor > 0 && (
        <div key={s.rotulo} title={`${s.rotulo}: ${s.valor}`} className="h-full transition-[width] duration-500 first:rounded-l-full last:rounded-r-full"
          style={{ width: `${(s.valor / total) * 100}%`, background: s.cor }} />
      ))}
    </div>
  );
}

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

/** Rosca (donut) com total no centro. */
export function Rosca({ segmentos, tamanho = 148, centro, subcentro }: { segmentos: Segmento[]; tamanho?: number; centro: string; subcentro: string }) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  const r = 42, c = 2 * Math.PI * r;
  let acumulado = 0;
  return (
    <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} role="img"
      aria-label={`${centro} ${subcentro}. ` + segmentos.map((s) => `${s.rotulo}: ${s.valor}`).join(', ')}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--superficie-alt)" strokeWidth="12" />
      {total > 0 && segmentos.map((s) => {
        const frac = s.valor / total;
        const el = (
          <circle key={s.rotulo} cx="50" cy="50" r={r} fill="none" stroke={s.cor} strokeWidth="12"
            strokeDasharray={`${Math.max(0, frac * c - 1.5)} ${c}`} strokeDashoffset={-acumulado * c}
            transform="rotate(-90 50 50)" strokeLinecap="butt" />
        );
        acumulado += frac;
        return el;
      })}
      <text x="50" y="49" textAnchor="middle" className="fill-tinta font-space" fontSize="18" fontWeight="600">{centro}</text>
      <text x="50" y="62" textAnchor="middle" className="fill-tinta-suave" fontSize="7.5">{subcentro}</text>
    </svg>
  );
}

/** Barras horizontais com linha de limite (ex.: carga semanal x 40 h). */
export function BarrasComLimite({ itens, maximoEscala }: {
  itens: { rotulo: string; valor: number; limite: number; sub?: string }[]; maximoEscala: number;
}) {
  return (
    <ul className="space-y-3">
      {itens.map((i) => {
        const acima = i.valor > i.limite;
        return (
          <li key={i.rotulo}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
              <span className="truncate font-medium text-tinta">{i.rotulo}{i.sub && <span className="ml-1.5 font-normal text-tinta-suave">{i.sub}</span>}</span>
              <span className={cx('shrink-0 font-semibold tabular-nums', acima ? 'text-aviso' : 'text-tinta-suave')}>{i.valor} / {i.limite} h</span>
            </div>
            <div className="relative h-2 rounded-full bg-superficie-alt" role="img" aria-label={`${i.rotulo}: ${i.valor} de ${i.limite} horas${acima ? ', acima do limite' : ''}`}>
              <div className={cx('h-full rounded-full transition-[width] duration-500', acima ? 'bg-aviso' : 'bg-primaria')}
                style={{ width: `${Math.min(100, (i.valor / maximoEscala) * 100)}%` }} />
              <span className="absolute -top-1 h-4 w-0.5 rounded bg-tinta/40" style={{ left: `${(i.limite / maximoEscala) * 100}%` }} aria-hidden />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Colunas verticais simples (ex.: tarefas por etapa do quadro). */
export function Colunas({ itens, altura = 140 }: { itens: { rotulo: string; valor: number; cor: string }[]; altura?: number }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="flex items-end gap-3" style={{ height: altura + 36 }} role="img" aria-label={itens.map((i) => `${i.rotulo}: ${i.valor}`).join(', ')}>
      {itens.map((i) => (
        <div key={i.rotulo} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[13px] font-semibold tabular-nums text-tinta">{i.valor}</span>
          <div className="w-full max-w-14 rounded-t-lg transition-[height] duration-500" style={{ height: Math.max(4, (i.valor / max) * altura), background: i.cor }} />
          <span className="truncate text-[12px] text-tinta-suave">{i.rotulo}</span>
        </div>
      ))}
    </div>
  );
}
