import { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cx } from '@/lib/utils';

/* Tabela densa do CAIS. Rola na horizontal dentro do próprio contêiner,
   com cabeçalho fixo e linhas com hover. */

export function Tabela({ children, rotulo }: { children: ReactNode; rotulo: string }) {
  return (
    <div className="rolagem overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm" aria-label={rotulo}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, children, ...r }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cx('sticky top-0 z-10 border-b border-borda bg-superficie px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-tinta-suave', className)} {...r}>
      {children}
    </th>
  );
}

export function Td({ className, children, ...r }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx('border-b border-borda px-4 py-3 align-middle text-tinta', className)} {...r}>{children}</td>;
}

export function Tr({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr onClick={onClick} className={cx('transition-colors hover:bg-superficie-alt/60', onClick && 'cursor-pointer', className)}>
      {children}
    </tr>
  );
}
