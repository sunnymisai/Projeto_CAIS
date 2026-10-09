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

// [PV-1] AS CORES DOS GRÁFICOS (concluída, andamento, revisão, a fazer, não iniciada...) como variáveis CSS que trocam com o tema. Os valores ficam em app/globals.css (--grafico-*).
/**
 * Cores dos gráficos, como referência às variáveis de app/globals.css (--grafico-*).
 * São var(...) e não hex: assim a cor troca sozinha entre o tema claro e o escuro.
 * ⚠️ ATENÇÃO: o painel do admin, /trilhas, /projetos/[id] e a lista de tarefas (Vistas)
 * usam estas cores com o MESMO significado; trocar aqui muda as legendas de todos.
 * @example <BarraEmpilhada segmentos={[{ rotulo: 'Concluídas', valor: 3, cor: COR_GRAFICO.concluida }]} />
 */
export const COR_GRAFICO = {
  concluida: 'var(--grafico-concluida)',
  andamento: 'var(--grafico-andamento)',
  revisao: 'var(--grafico-revisao)',
  aFazer: 'var(--grafico-a-fazer)',
  naoIniciada: 'var(--grafico-nao-iniciada)',
  extra: 'var(--grafico-extra)',
  extra2: 'var(--grafico-extra-2)',
} as const;

// [PV-2] A cor de cada lista do quadro por POSIÇÃO (A fazer, Fazendo, Revisão, azul, rosa). A última lista ("Pronto") usa COR_GRAFICO.concluida.
/**
 * Cores das colunas do quadro pela POSIÇÃO (1ª, 2ª, 3ª...): A fazer, Fazendo,
 * Revisão, depois azul e rosa. A última coluna ("Pronto") não usa esta lista:
 * quem desenha pinta de COR_GRAFICO.concluida.
 */
export const TONS_COLUNA = [COR_GRAFICO.aFazer, COR_GRAFICO.andamento, COR_GRAFICO.revisao, COR_GRAFICO.extra, COR_GRAFICO.extra2];

// [PV-3] A barra horizontal dividida em segmentos (trilhas, entregas). Tem resumo em texto para leitor de tela.
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

// [PV-4] A legenda dos gráficos: bolinha de cor, nome e número. Cor nunca aparece sozinha.
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

// [PV-5] O gráfico de rosca (SVG próprio, sem biblioteca) com número no centro.
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
          // stroke em style (e não no atributo): atributo de SVG não entende var(--...) em todo navegador.
          <circle key={s.rotulo} cx="50" cy="50" r={r} fill="none" style={{ stroke: s.cor }} strokeWidth="12"
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

// [PV-6] Barras com linha de limite (a carga de cada pessoa do painel do admin). Aceita o nível do semáforo (texto e cor) ao lado do número.
/**
 * Barras horizontais com linha de limite (ex.: carga semanal x 40 h, §5).
 * Passar do limite pinta a barra de âmbar: "é aviso, não bloqueio".
 * @param itens lista de { rotulo, valor, limite, sub?, nivel? }. `nivel` (semáforo de carga) troca a cor
 *   pela do nível e escreve o texto dele ao lado do número (ex.: "45 / 40 h · Acima do limite").
 * @param maximoEscala valor que corresponde a 100% da largura (ex.: 60 h).
 * @returns lista de barras.
 * @example <BarrasComLimite maximoEscala={60} itens={[{ rotulo: 'Ana', valor: 44, limite: 40 }]} />
 */
export function BarrasComLimite({ itens, maximoEscala }: {
  itens: { rotulo: string; valor: number; limite: number; sub?: string; nivel?: { rotulo: string; tom: 'neutro' | 'sucesso' | 'aviso' | 'erro' } }[]; maximoEscala: number;
}) {
  // Classes por tom do nível (semáforo de carga): texto e barra com a mesma cor semântica.
  const TEXTO = { neutro: 'text-tinta-suave', sucesso: 'text-sucesso', aviso: 'text-aviso', erro: 'text-erro' } as const;
  const BARRA = { neutro: 'bg-tinta-fraca', sucesso: 'bg-sucesso', aviso: 'bg-aviso', erro: 'bg-erro' } as const;
  return (
    <ul className="space-y-3">
      {itens.map((i) => {
        // Sem nível (uso antigo): acima do limite → âmbar. Com nível (semáforo): a cor vem do nível
        // e o texto dele aparece ao lado do número (cor nunca sozinha, §9).
        const acima = i.valor > i.limite;
        const tom = i.nivel?.tom ?? (acima ? 'aviso' : undefined);
        return (
          <li key={i.rotulo}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
              <span className="truncate font-medium text-tinta">{i.rotulo}{i.sub && <span className="ml-1.5 font-normal text-tinta-suave">{i.sub}</span>}</span>
              <span className={cx('shrink-0 font-semibold tabular-nums', tom ? TEXTO[tom] : 'text-tinta-suave')}>
                {i.valor} / {i.limite} h{i.nivel && <span className="font-medium"> · {i.nivel.rotulo}</span>}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-superficie-alt" role="img" aria-label={`${i.rotulo}: ${i.valor} de ${i.limite} horas${i.nivel ? `, ${i.nivel.rotulo.toLowerCase()}` : acima ? ', acima do limite' : ''}`}>
              {/* Largura limitada a 100% para a barra não vazar da caixa. */}
              <div className={cx('h-full rounded-full transition-[width] duration-500', tom ? BARRA[tom] : 'bg-primaria')}
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

// [PV-7] As colunas verticais simples (tarefas por lista, entregas por semana). A altura máxima vem do parâmetro altura.
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
