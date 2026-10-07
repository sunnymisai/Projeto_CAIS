"use client";

import { ReactNode, useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/utils';

/**
 * Menu suspenso (dropdown). Fecha com Esc e ao clicar fora.
 * `gatilho` recebe as props de acessibilidade e o controle de abertura.
 */
export default function Menu({ gatilho, children, alinhar = 'direita', largura = 'w-56' }: {
  gatilho: (p: { aberto: boolean; alternar: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu' }) => ReactNode;
  children: (fechar: () => void) => ReactNode;
  alinhar?: 'direita' | 'esquerda';
  largura?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  return (
    <div ref={ref} className="relative">
      {gatilho({ aberto, alternar: () => setAberto((v) => !v), 'aria-expanded': aberto, 'aria-haspopup': 'menu' })}
      {aberto && (
        <div role="menu"
          className={cx('animate-modal-in absolute z-50 mt-2 overflow-hidden rounded-xl border border-borda bg-superficie p-1.5 shadow-card', largura, alinhar === 'direita' ? 'right-0' : 'left-0')}>
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  );
}

export function ItemMenu({ onClick, children, perigo, icone }: { onClick: () => void; children: ReactNode; perigo?: boolean; icone?: ReactNode }) {
  return (
    <button role="menuitem" onClick={onClick}
      className={cx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:bg-superficie-alt',
        perigo ? 'text-erro hover:bg-erro/10' : 'text-tinta hover:bg-superficie-alt')}>
      {icone && <span className="text-tinta-fraca [&>svg]:h-4 [&>svg]:w-4">{icone}</span>}
      {children}
    </button>
  );
}
