/* ============================================================================
   TABELA.TSX — TABELA DENSA DO DESIGN SYSTEM CAIS
   O que é: peças de tabela (Tabela, Th, Td, Tr) com cabeçalho fixo, linhas
   com destaque ao passar o mouse e rolagem horizontal no celular.
   Onde é usado: telas de empresas, pessoas, trilhas/[id] e design-system;
   components/projetos (Equipe, Vistas).
   Depende de: react (tipos) e lib/utils (cx).
   Contexto: §9 (tabela no design system), §10 (lista com rolagem só no
   conteúdo) e §13 (responsivo).
   ============================================================================ */
import { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cx } from '@/lib/utils';

/* Tabela densa do CAIS. Rola na horizontal dentro do próprio contêiner,
   com cabeçalho fixo e linhas com hover. */

/**
 * Contêiner da tabela. Abaixo de 720 px de largura ela rola na horizontal
 * dentro da própria caixa, em vez de esmagar as colunas ou quebrar a página.
 * @param children <thead> e <tbody> com Th, Tr e Td.
 * @param rotulo nome da tabela lido pelo leitor de tela (aria-label).
 * @returns a tabela dentro de um contêiner rolável.
 * @example
 * <Tabela rotulo="Empresas"><thead><tr><Th>Nome</Th></tr></thead><tbody><Tr><Td>Acme</Td></Tr></tbody></Tabela>
 */
export function Tabela({ children, rotulo }: { children: ReactNode; rotulo: string }) {
  return (
    <div className="rolagem overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm" aria-label={rotulo}>
        {children}
      </table>
    </div>
  );
}

/**
 * Célula de cabeçalho. "sticky top-0" a mantém visível enquanto as linhas rolam.
 * @param className classes extras; o resto das props vai para o <th>.
 * @returns o <th> com scope="col" (o leitor de tela liga cada célula à sua coluna).
 */
export function Th({ className, children, ...r }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cx('sticky top-0 z-10 border-b border-borda bg-superficie px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-tinta-suave', className)} {...r}>
      {children}
    </th>
  );
}

/**
 * Célula comum da tabela.
 * @param className classes extras; o resto das props vai para o <td>.
 * @returns o <td> estilizado.
 */
export function Td({ className, children, ...r }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx('border-b border-borda px-4 py-3 align-middle text-tinta', className)} {...r}>{children}</td>;
}

/**
 * Linha da tabela com destaque ao passar o mouse.
 * @param children células (Td).
 * @param onClick quando passado, a linha inteira fica clicável (cursor de mãozinha).
 * @param className classes extras.
 * @returns o <tr>.
 */
export function Tr({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  // cursor-pointer só quando há onClick: o cursor indica se a linha é clicável.
  return (
    <tr onClick={onClick} className={cx('transition-colors hover:bg-superficie-alt/60', onClick && 'cursor-pointer', className)}>
      {children}
    </tr>
  );
}
