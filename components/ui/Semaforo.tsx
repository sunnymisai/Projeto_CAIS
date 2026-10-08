/* ============================================================================
   COMPONENTS/UI/SEMAFORO.TSX
   O que é: as peças visuais do semáforo de carga: o indicador de um nível
     (pílula com ícone e %), a fileira de semanas e a legenda dos quatro níveis.
   Onde é usado: app/(sistema)/carga/page.tsx (matriz e cards), a página viva
     /design-system e, no F04, o modal de alocação, a aba Equipe, os painéis e a
     ficha de pessoa.
   Depende de: lib/carga.ts (NivelCarga, ROTULO_NIVEL, TOM_NIVEL, LIMIARES),
     lib/utils.ts (cx, dataBR) e lucide-react.
   Contexto: §9 (cor tem significado e nunca aparece sozinha), §13 (acessível) e
     §16 (semáforo de carga por período).
   ============================================================================ */
"use client";

import { Circle, CircleCheck, CircleAlert, TriangleAlert } from 'lucide-react';
import { LIMIARES, ROTULO_NIVEL, TOM_NIVEL, type NivelCarga } from '@/lib/carga';
import { cx, dataBR } from '@/lib/utils';

/** Ícone de cada nível: a forma muda junto com a cor, para quem não distingue cores. */
const ICONE: Record<NivelCarga, typeof Circle> = { livre: Circle, verde: CircleCheck, amarelo: CircleAlert, vermelho: TriangleAlert };
// Tom → classes (mesmas cores suaves da Etiqueta do design system).
const TONS = {
  neutro: 'bg-superficie-alt text-tinta-suave',
  sucesso: 'bg-sucesso/12 text-sucesso',
  aviso: 'bg-aviso/12 text-aviso',
  erro: 'bg-erro/12 text-erro',
} as const;

/**
 * Texto completo de um nível para leitor de tela e tooltip.
 * @param pct - ocupação em %.
 * @param nivel - nível do semáforo.
 * @returns ex.: "113%, acima do limite".
 * @example descreverCarga(112.5, 'vermelho') // '113%, acima do limite'
 */
export function descreverCarga(pct: number, nivel: NivelCarga): string {
  return `${Math.round(pct)}%, ${ROTULO_NIVEL[nivel].toLowerCase()}`;
}

/**
 * Data curta da segunda-feira de uma semana ("13/10"), usada nos cabeçalhos.
 * @param segunda - data AAAA-MM-DD.
 * @returns "dd/mm".
 */
export function rotuloSemana(segunda: string): string {
  return dataBR(segunda).slice(0, 5);
}

/**
 * Pílula de um nível: ícone + "85%" (compacto) ou ícone + "85% · No limite".
 * O texto do nível aparece por extenso no modo normal; no compacto ele vai no aria-label e no title.
 * @param props.nivel - nível do semáforo.
 * @param props.pct - ocupação em %.
 * @param props.compacto - só o ícone e o % (para tabelas e fileiras).
 * @param props.rotulo - aria-label completo; padrão "85%, no limite". Use para dizer de quem e quando.
 * @param props.decorativo - true quando quem envolve (ex.: um botão) já tem o aria-label: a pílula some do leitor de tela.
 * @returns a pílula.
 * @example <IndicadorCarga nivel="vermelho" pct={112.5} compacto rotulo="Bruno Lima, semana de 13/10: 113%, acima do limite" />
 */
export function IndicadorCarga({ nivel, pct, compacto, rotulo, decorativo }: { nivel: NivelCarga; pct: number; compacto?: boolean; rotulo?: string; decorativo?: boolean }) {
  const Icone = ICONE[nivel];
  const texto = rotulo ?? descreverCarga(pct, nivel);
  return (
    <span role={decorativo ? undefined : 'img'} aria-label={decorativo ? undefined : texto} aria-hidden={decorativo || undefined} title={texto}
      className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums', TONS[TOM_NIVEL[nivel]])}>
      <Icone className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {Math.round(pct)}%
      {!compacto && <span className="font-medium">· {ROTULO_NIVEL[nivel]}</span>}
    </span>
  );
}

/** Uma semana da fileira: a segunda-feira, a ocupação (pico) e o nível. */
export interface SemanaCarga { segunda: string; pct: number; nivel: NivelCarga }

/**
 * Fileira de semanas: a data da segunda acima de cada indicador ("13/10").
 * Com `onSelecionar`, cada semana vira um botão (teclado: Tab e Enter).
 * @param props.semanas - as semanas em ordem.
 * @param props.onSelecionar - chamada com a segunda clicada (opcional).
 * @param props.rotulo - nome do grupo para o leitor de tela (ex.: "Carga de Bruno nas próximas semanas").
 * @param props.quem - nome da pessoa, para o aria-label de cada semana ("Bruno, semana de 13/10: ...").
 * @returns a lista de semanas.
 * @example <LinhaDeSemanas semanas={linha} rotulo="Minha carga nas próximas 8 semanas" />
 */
export function LinhaDeSemanas({ semanas, onSelecionar, rotulo = 'Carga por semana', quem }: { semanas: SemanaCarga[]; onSelecionar?: (segunda: string) => void; rotulo?: string; quem?: string }) {
  return (
    // flex-wrap: no celular as semanas descem de linha em vez de criar rolagem lateral.
    <ol aria-label={rotulo} className="flex flex-wrap gap-x-2 gap-y-2">
      {semanas.map((s) => {
        const texto = `${quem ? `${quem}, s` : 'S'}emana de ${rotuloSemana(s.segunda)}: ${descreverCarga(s.pct, s.nivel)}`;
        const conteudo = (
          <>
            <span className="block text-center text-[11px] font-medium text-tinta-suave" aria-hidden>{rotuloSemana(s.segunda)}</span>
            <IndicadorCarga nivel={s.nivel} pct={s.pct} compacto rotulo={texto} decorativo={!!onSelecionar} />
          </>
        );
        return (
          <li key={s.segunda} className="flex flex-col items-center gap-0.5">
            {onSelecionar ? (
              <button type="button" onClick={() => onSelecionar(s.segunda)} aria-label={texto}
                className="flex flex-col items-center gap-0.5 rounded-lg p-0.5 hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
                {conteudo}
              </button>
            ) : conteudo}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Legenda dos quatro níveis, com o ícone, o nome e a faixa de % (lida de LIMIARES).
 * @returns a legenda.
 * @example <LegendaSemaforo />
 */
export function LegendaSemaforo() {
  const faixas: Record<NivelCarga, string> = {
    livre: '0%',
    verde: `até ${LIMIARES.verde}%`,
    amarelo: `até ${LIMIARES.amarelo}%`,
    vermelho: `acima de ${LIMIARES.amarelo}%`,
  };
  return (
    <ul aria-label="Legenda do semáforo de carga" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-tinta-suave">
      {(Object.keys(faixas) as NivelCarga[]).map((n) => {
        const Icone = ICONE[n];
        return (
          <li key={n} className="inline-flex items-center gap-1.5">
            <span className={cx('inline-flex h-5 w-5 items-center justify-center rounded-full', TONS[TOM_NIVEL[n]])} aria-hidden><Icone className="h-3.5 w-3.5" /></span>
            <span><strong className="font-semibold text-tinta">{ROTULO_NIVEL[n]}</strong> · {faixas[n]}</span>
          </li>
        );
      })}
    </ul>
  );
}
