"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import CaisLogo from '@/components/CaisLogo';
import { NAVEGACAO } from './navegacao';
import { cx } from '@/lib/utils';

/** Menu lateral: sempre no mesmo lugar e marca onde você está (slide 15). */
export default function Sidebar({ abertoMobile, onFechar }: { abertoMobile: boolean; onFechar: () => void }) {
  const caminho = usePathname();

  const conteudo = (
    <nav aria-label="Menu principal" className="flex h-full flex-col bg-noite text-white dark:bg-noite-alt">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/painel" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50" onClick={onFechar}>
          <CaisLogo size={30} tone="claro" />
        </Link>
        <button onClick={onFechar} aria-label="Fechar menu" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="rolagem flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAVEGACAO.map((g) => (
          <div key={g.grupo}>
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{g.grupo}</p>
            <ul className="space-y-0.5">
              {g.itens.map(({ href, rotulo, icone: Icone }) => {
                const ativo = caminho === href || caminho.startsWith(href + '/');
                return (
                  <li key={href}>
                    <Link href={href} onClick={onFechar} aria-current={ativo ? 'page' : undefined}
                      className={cx('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                        ativo ? 'bg-white/[0.09] text-white' : 'text-white/65 hover:bg-white/[0.05] hover:text-white')}>
                      {ativo && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#B9A7FF]" aria-hidden />}
                      <Icone className={cx('h-[18px] w-[18px]', ativo ? 'text-[#B9A7FF]' : 'text-white/50 group-hover:text-white/80')} aria-hidden />
                      {rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.07] px-5 py-4 text-[12px] leading-relaxed text-white/40">
        <p className="font-semibold text-white/60">Perfil Administrador</p>
        <p>Versão de demonstração · dados fictícios</p>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">{conteudo}</aside>
      {abertoMobile && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-black/50" onClick={onFechar} aria-hidden />
          <aside className="animate-card-in absolute inset-y-0 left-0 w-72 shadow-2xl">{conteudo}</aside>
        </div>
      )}
    </>
  );
}
