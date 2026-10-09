/* ============================================================================
   COMPONENTS/UI/FILTROPERIODO.TSX
   O que é: o filtro de período dos painéis (Últimos 7, 30 e 90 dias, Este mês e
     Personalizado) e o hook usePeriodo, que guarda o período na URL (?de=&ate=)
     para o link poder ser compartilhado e reabrir no mesmo período.
   Onde é usado: components/paineis/ (PainelAdmin, PainelEmpresa, PainelProfissional)
     e a página viva /design-system.
   Depende de: next/navigation (useRouter, usePathname, useSearchParams), lib/metricas.ts
     (Periodo, ultimosDias, esteMes, atalhoDoPeriodo), components/ui/form.tsx (Segmentado),
     components/input.tsx e lib/utils.ts (dataBR).
   Contexto: §6 (dashboards), §8 Onda 4 (filtros por período), §10 (filtros acima do
     conteúdo) e docs/notas-next16.md §2 (useSearchParams precisa de <Suspense>).
   ============================================================================ */
"use client";

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { atalhoDoPeriodo, esteMes, ultimosDias, type AtalhoPeriodo, type Periodo } from '@/lib/metricas';
import { Segmentado } from '@/components/ui/form';
import Input from '@/components/input';
import { dataBR } from '@/lib/utils';

// [PV-1] O período padrão dos painéis quando a URL não traz um válido: 30 dias.
/** Período usado quando a URL não traz um válido. */
export const PERIODO_PADRAO_DIAS = 30;
/** Data AAAA-MM-DD (o mínimo para aceitar o que veio da URL). */
const DATA = /^\d{4}-\d{2}-\d{2}$/;

// [PV-2] A leitura do período na URL (?de=&ate=). URL sem período, com data malformada ou com fim antes do início volta ao padrão. Precisa de <Suspense> na página.
/**
 * Lê o período da URL (?de=&ate=) e devolve a função que troca o período.
 * URL sem período, com data malformada ou com fim antes do início → últimos 30 dias.
 * ⚠️ ATENÇÃO: usa useSearchParams; a página que usa precisa de um <Suspense> em volta
 * (notas-next16 §2), senão o `npm run build` falha.
 * @returns `{ periodo, definir }`.
 * @example const { periodo, definir } = usePeriodo(); trilhasConcluidasNoPeriodo(d, periodo)
 */
export function usePeriodo() {
  const params = useSearchParams();
  const router = useRouter();
  const caminho = usePathname();
  const de = params.get('de') ?? '';
  const ate = params.get('ate') ?? '';
  const valido = DATA.test(de) && DATA.test(ate) && de <= ate;
  const periodo: Periodo = valido ? { de, ate } : ultimosDias(PERIODO_PADRAO_DIAS);

  // [PV-3] Trocar o período grava na URL (replace, não push: o botão Voltar não passa por cada período). É o que faz o link ser compartilhável.
  /**
   * Troca o período e grava na URL.
   * NAVEGA (GRAVA na URL): replace e não push, para o "Voltar" do navegador não passar por
   * cada período escolhido; scroll: false para a tela não pular para o topo.
   */
  const definir = useCallback((p: Periodo) => {
    const q = new URLSearchParams(params.toString());
    q.set('de', p.de);
    q.set('ate', p.ate);
    router.replace(`${caminho}?${q.toString()}`, { scroll: false });
  }, [params, router, caminho]);

  return { periodo, definir };
}

/**
 * O filtro de período: atalhos num controle segmentado e, no "Personalizado", início e fim.
 * O fim não pode vir antes do início: mostra o erro e não aplica até corrigir.
 * @param props.periodo - o período atual (de usePeriodo).
 * @param props.onChange - chamada com o período novo.
 * @returns o filtro.
 * @example const { periodo, definir } = usePeriodo(); <FiltroPeriodo periodo={periodo} onChange={definir} />
 */
export default function FiltroPeriodo({ periodo, onChange }: { periodo: Periodo; onChange: (p: Periodo) => void }) {
  const atalho = atalhoDoPeriodo(periodo);
  // "Personalizado" aberto mesmo quando o período atual bate com um atalho (a pessoa clicou nele).
  const [personalizando, setPersonalizando] = useState(atalho === 'personalizado');
  // Datas digitadas no personalizado (só viram período quando são válidas).
  const [de, setDe] = useState(periodo.de);
  const [ate, setAte] = useState(periodo.ate);
  // [PV-4] A validação do "Personalizado": o fim não pode vir antes do início; com erro, o período não é aplicado.
  const erro = de && ate && ate < de ? 'O fim não pode vir antes do início.' : undefined;
  const marcado: AtalhoPeriodo = personalizando ? 'personalizado' : atalho;

  /** Clique num atalho: aplica na hora; "Personalizado" só abre os campos. */
  const escolher = (a: AtalhoPeriodo) => {
    if (a === 'personalizado') { setPersonalizando(true); setDe(periodo.de); setAte(periodo.ate); return; }
    setPersonalizando(false);
    onChange(a === 'mes' ? esteMes() : ultimosDias(Number(a)));
  };
  /**
   * Muda uma das datas do personalizado e aplica se o par ficou válido.
   * @param novoDe - início digitado.
   * @param novoAte - fim digitado.
   */
  const aplicar = (novoDe: string, novoAte: string) => {
    setDe(novoDe); setAte(novoAte);
    if (DATA.test(novoDe) && DATA.test(novoAte) && novoDe <= novoAte) onChange({ de: novoDe, ate: novoAte });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Segmentado rotulo="Período" valor={marcado} onChange={escolher} opcoes={[
        // [PV-5] Os atalhos do filtro (7, 30 e 90 dias, Este mês, Personalizado) e seus nomes. O significado de cada um está em lib/metricas.ts (ultimosDias, esteMes).
        { valor: '7', rotulo: '7 dias' }, { valor: '30', rotulo: '30 dias' }, { valor: '90', rotulo: '90 dias' },
        { valor: 'mes', rotulo: 'Este mês' }, { valor: 'personalizado', rotulo: 'Personalizado' },
      ]} />
      {personalizando && (
        <div className="flex flex-wrap items-start gap-3">
          <div className="w-40"><Input compacto type="date" label="Início" value={de} max={ate || undefined} onChange={(e) => aplicar(e.target.value, ate)} /></div>
          <div className="w-40"><Input compacto type="date" label="Fim" value={ate} min={de || undefined} error={erro} onChange={(e) => aplicar(de, e.target.value)} /></div>
        </div>
      )}
      {/* O período em texto (aria-live: o leitor de tela ouve quando muda). */}
      <p className="pb-2 text-[13px] text-tinta-suave" aria-live="polite">De {dataBR(periodo.de)} a {dataBR(periodo.ate)}</p>
    </div>
  );
}
