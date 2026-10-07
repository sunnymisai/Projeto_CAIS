import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

/** Título e ação: o que é a página e o botão principal (slide 15). */
export function CabecalhoPagina({ titulo, descricao, acao, trilha }: {
  titulo: ReactNode; descricao?: ReactNode; acao?: ReactNode; trilha?: { rotulo: string; href: string }[];
}) {
  return (
    <div className="mb-6 shrink-0">
      {trilha && (
        <nav aria-label="Você está em" className="mb-2 flex items-center gap-1 text-[13px] text-tinta-suave">
          {trilha.map((t) => (
            <span key={t.href} className="flex items-center gap-1">
              <Link href={t.href} className="rounded hover:text-tinta hover:underline">{t.rotulo}</Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-space text-[26px] font-semibold leading-tight tracking-tight text-tinta">{titulo}</h1>
          {descricao && <div className="mt-1 text-sm text-tinta-suave">{descricao}</div>}
        </div>
        {acao && <div className="flex flex-wrap items-center gap-2">{acao}</div>}
      </div>
    </div>
  );
}

/** Filtros: sempre acima do conteúdo, nunca escondidos (slide 15). */
export function BarraFiltros({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">{children}</div>;
}
