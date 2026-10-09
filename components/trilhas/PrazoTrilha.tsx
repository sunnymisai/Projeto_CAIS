/* ============================================================================
   PRAZOTRILHA.TSX
   O que é: o selo de prazo de uma trilha para a pessoa (concluída, no prazo,
     perto de vencer ou vencida), sempre com ícone e texto, nunca só a cor.
   Onde é usado: app/(sistema)/minhas-trilhas/page.tsx (cards e "Continue de onde
     parou") e app/(sistema)/minhas-trilhas/[id]/page.tsx (cabeçalho).
   Depende de: components/ui/basicos.tsx (Etiqueta), lib/metricas.ts (TrilhaDaPessoa),
     lib/utils.ts (dataBR, diasEntre, hojeISO) e lucide-react.
   Contexto: §4 (o profissional vê o prazo e um aviso quando está perto) e §9 (cor tem significado).
   ============================================================================ */

import { CalendarClock, CircleAlert, CircleCheck, Clock } from 'lucide-react';
import { Etiqueta } from '@/components/ui/basicos';
import type { TrilhaDaPessoa } from '@/lib/metricas';
import { dataBR, diasEntre, hojeISO } from '@/lib/utils';

/** "2026-10-14" → "14/10" (dia e mês, como nos textos do deck). */
const diaMes = (iso: string) => dataBR(iso).slice(0, 5);

// [PV-1] O TEXTO E A COR DO PRAZO DA TRILHA: Concluída, Prazo indeterminado (prazoDias 0), Venceu em dd/mm, Vence hoje, Falta 1 dia, Faltam N dias e Até dd/mm. Quando fica "perto" é definido em lib/metricas.ts (DIAS_PRAZO_PERTO).
/**
 * Texto, tom e ícone do prazo, sem desenhar nada (separado para o painel do D05 reaproveitar).
 * @param t - a trilha vista pela pessoa (de trilhasDaPessoaDetalhadas).
 * @param hoje - data de referência (padrão: hoje).
 * @returns `{ texto, tom, Icone }`.
 * @example textoDoPrazo({ situacaoPrazo: 'perto', prazo: '2026-10-09', ... }, '2026-10-07').texto // 'Faltam 2 dias'
 */
export function textoDoPrazo(t: Pick<TrilhaDaPessoa, 'situacao' | 'prazo' | 'situacaoPrazo'>, hoje = hojeISO()) {
  if (t.situacao === 'concluida') return { texto: 'Concluída', tom: 'sucesso' as const, Icone: CircleCheck };
  // Sem prazo: a trilha tem prazo INDETERMINADO (prazoDias 0, decisão da PROGLOGIC) ou foi publicada antes de ter
  // data de publicação. Nos dois casos não há data limite para mostrar.
  if (!t.prazo || !t.situacaoPrazo) return { texto: 'Prazo indeterminado', tom: 'neutro' as const, Icone: CalendarClock };
  if (t.situacaoPrazo === 'vencido') return { texto: `Venceu em ${diaMes(t.prazo)}`, tom: 'erro' as const, Icone: CircleAlert };
  if (t.situacaoPrazo === 'perto') {
    const faltam = diasEntre(hoje, t.prazo);
    const texto = faltam === 0 ? 'Vence hoje' : faltam === 1 ? 'Falta 1 dia' : `Faltam ${faltam} dias`;
    return { texto, tom: 'aviso' as const, Icone: Clock };
  }
  return { texto: `Até ${diaMes(t.prazo)}`, tom: 'neutro' as const, Icone: CalendarClock };
}

/**
 * Selo de prazo (Etiqueta com ícone + texto).
 * @param props.trilha a trilha vista pela pessoa.
 * @returns a etiqueta.
 * @example <PrazoTrilha trilha={t} />
 */
export default function PrazoTrilha({ trilha }: { trilha: Pick<TrilhaDaPessoa, 'situacao' | 'prazo' | 'situacaoPrazo'> }) {
  const { texto, tom, Icone } = textoDoPrazo(trilha);
  return (
    <Etiqueta tom={tom}>
      <Icone className="h-3.5 w-3.5" aria-hidden />
      {texto}
    </Etiqueta>
  );
}
