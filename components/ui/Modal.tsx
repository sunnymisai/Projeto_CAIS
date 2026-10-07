"use client";

import { ReactNode, useEffect, useRef, useId, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '@/lib/utils';

/**
 * Modal do Design System CAIS.
 * - Fecha com Esc, com o botão × e clicando fora.
 * - Prende o foco do teclado dentro do modal e devolve ao fechar.
 * - Trava a rolagem da página por trás.
 */
export default function Modal({ aberto, onFechar, titulo, descricao, children, rodape, tamanho = 'md', cabecalho }: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  rodape?: ReactNode;
  tamanho?: 'sm' | 'md' | 'lg' | 'xl';
  /** Substitui o cabeçalho padrão (usado no detalhe da tarefa). */
  cabecalho?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idTitulo = useId();
  // true só no navegador (o portal precisa de document.body)
  const montado = useSyncExternalStore(() => () => {}, () => true, () => false);
  // Guarda a função em ref: assim o efeito abaixo roda só ao abrir/fechar,
  // e não a cada renderização (o que roubaria o foco de quem está digitando).
  const fecharRef = useRef(onFechar);
  const cabecalhoProprio = useRef(!!cabecalho);
  useEffect(() => { fecharRef.current = onFechar; });

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foca o primeiro campo, ou o próprio modal
    requestAnimationFrame(() => {
      // Com cabeçalho próprio (detalhe da tarefa) o foco vai para o diálogo,
      // para não abrir já editando o título. Nos formulários, vai ao 1º campo.
      const primeiro = cabecalhoProprio.current ? null : ref.current?.querySelector<HTMLElement>('[data-autofocus], input, select, textarea');
      (primeiro ?? ref.current)?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); fecharRef.current(); }
      if (e.key !== 'Tab' || !ref.current) return;
      const focaveis = ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focaveis.length) return;
      const [pri, ult] = [focaveis[0], focaveis[focaveis.length - 1]];
      if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
      else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [aberto]);

  if (!aberto || !montado) return null;

  const largura = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[tamanho];

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="animate-fade-in absolute inset-0 bg-[#0B0C12]/55 backdrop-blur-[2px]" onClick={onFechar} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={idTitulo} tabIndex={-1}
        className={cx('animate-modal-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-borda bg-superficie shadow-card focus:outline-none sm:rounded-3xl', largura)}>
        {cabecalho ?? (
          <div className="flex items-start justify-between gap-4 border-b border-borda px-6 py-4">
            <div>
              <h2 id={idTitulo} className="font-space text-lg font-semibold text-tinta">{titulo}</h2>
              {descricao && <p className="mt-0.5 text-[13px] text-tinta-suave">{descricao}</p>}
            </div>
            <button onClick={onFechar} aria-label="Fechar" className="-mr-2 rounded-lg p-2 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {cabecalho && <h2 id={idTitulo} className="sr-only">{titulo}</h2>}
        <div className="rolagem flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {rodape && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-borda bg-superficie-alt/50 px-6 py-3">{rodape}</div>}
      </div>
    </div>,
    document.body
  );
}
