/* ============================================================================
   PAGINA.TSX — PEÇAS DE ESTRUTURA DA PÁGINA
   O que é: cabeçalho da página (trilha de navegação, título, descrição e ação
   principal) e a barra de filtros que fica acima do conteúdo.
   Onde é usado: todas as telas de app/(sistema) (painel, empresas, pessoas,
   projetos, projetos/[id], trilhas, trilhas/[id] e design-system).
   Depende de: react (tipos), next/link e lucide-react (ícone da seta).
   Contexto: §10 (anatomia de toda tela: título e ação principal; filtros
   sempre acima do conteúdo, nunca escondidos).
   ============================================================================ */
import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// [PV-1] O CABEÇALHO PADRÃO de toda tela interna: título (o único h1), descrição, ação principal à direita e caminho de volta (breadcrumb). Mude aqui para mudar todas as telas.
/**
 * Título e ação: o que é a página e o botão principal (§10, slide 15 do deck).
 * @param titulo título da página (vira o <h1>; deve existir só um por tela).
 * @param descricao linha de apoio abaixo do título (opcional).
 * @param acao botão principal à direita, ex.: "Nova empresa" (opcional).
 * @param trilha caminho de volta (breadcrumb), ex.: Projetos › (opcional).
 * @returns o bloco de cabeçalho.
 * @example
 * <CabecalhoPagina titulo="Portal Acme" trilha={[{ rotulo: 'Projetos', href: '/projetos' }]} acao={<Button>Nova tarefa</Button>} />
 */
export function CabecalhoPagina({ titulo, descricao, acao, trilha }: {
  titulo: ReactNode; descricao?: ReactNode; acao?: ReactNode; trilha?: { rotulo: string; href: string }[];
}) {
  return (
    // shrink-0: o cabeçalho não encolhe; quem rola é só o conteúdo abaixo (§10).
    <div className="mb-6 shrink-0">
      {/* Trilha de navegação (breadcrumb): só aparece em telas de detalhe. */}
      {trilha && (
        <nav aria-label="Você está em" className="mb-2 flex items-center gap-1 text-[13px] text-tinta-suave">
          {trilha.map((t) => (
            <span key={t.href} className="flex items-center gap-1">
              {/* NAVEGA: volta para a tela daquele nível. */}
              <Link href={t.href} className="rounded hover:text-tinta hover:underline">{t.rotulo}</Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          ))}
        </nav>
      )}
      {/* flex-wrap: no celular a ação desce para baixo do título em vez de espremer o texto. */}
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

// [PV-2] Onde ficam os filtros de uma lista: sempre acima do conteúdo e quebrando linha no celular (§10).
/**
 * Filtros: sempre acima do conteúdo, nunca escondidos (§10).
 * @param children os filtros (busca, selects, segmentados).
 * @returns a barra que quebra linha no celular.
 */
export function BarraFiltros({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">{children}</div>;
}
