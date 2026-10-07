/* ============================================================================
   SIDEBAR.TSX — MENU LATERAL DO SHELL
   O que é: o menu de navegação à esquerda, que marca a tela atual; no
   celular vira uma gaveta que abre por cima do conteúdo. Mostra só os itens
   do perfil da sessão.
   Onde é usado: app/(sistema)/layout.tsx (em todas as telas logadas).
   Depende de: next/link, next/navigation (usePathname), lucide-react,
   components/CaisLogo, ./navegacao (lista de itens), lib/auth (useAuth) e lib/utils (cx).
   Contexto: §10 (anatomia: menu sempre no mesmo lugar, marca onde você está)
   e §15 (organograma: shell da aplicação).
   ============================================================================ */
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import CaisLogo from '@/components/CaisLogo';
import { NAVEGACAO } from './navegacao';
import { useAuth } from '@/lib/auth';
import { cx } from '@/lib/utils';

/** Nome de cada perfil, em português, para o rodapé do menu. */
const NOME_PERFIL = { admin: 'Administrador', empresa: 'Empresa', profissional: 'Profissional' } as const;

/**
 * Menu lateral: sempre no mesmo lugar e marca onde você está (§10).
 * No desktop (lg+) fica fixo; abaixo disso só aparece quando `abertoMobile` é true.
 * ⚠️ ATENÇÃO: os itens vêm de ./navegacao.ts. Tela nova que não for registrada
 * lá não aparece no menu.
 * @param abertoMobile se a gaveta do celular está aberta (controlado pelo layout).
 * @param onFechar fecha a gaveta (botão ×, clique no fundo ou ao escolher um link).
 * @returns o menu para desktop e, se aberto, a gaveta do celular.
 */
export default function Sidebar({ abertoMobile, onFechar }: { abertoMobile: boolean; onFechar: () => void }) {
  // Endereço atual (ex.: "/projetos/p1"), usado para destacar o item ativo.
  const caminho = usePathname();
  const { sessao } = useAuth();
  // Filtra o menu pelo perfil: tira os itens que o perfil não enxerga e os grupos que ficaram vazios.
  // Sem sessão (só por um instante, antes do layout redirecionar) o menu fica vazio.
  const grupos = NAVEGACAO
    .map((g) => ({ ...g, itens: g.itens.filter((i) => !!sessao && i.perfis.includes(sessao.perfil)) }))
    .filter((g) => g.itens.length > 0);

  // O conteúdo do menu é montado uma vez nesta variável e reaproveitado nas duas
  // versões (desktop e gaveta do celular), para não duplicar código.
  const conteudo = (
    <nav aria-label="Menu principal" className="flex h-full flex-col bg-noite text-white dark:bg-noite-alt">
      <div className="flex h-16 items-center justify-between px-5">
        {/* NAVEGA: o logo leva ao painel (home do sistema). */}
        <Link href="/painel" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50" onClick={onFechar}>
          <CaisLogo size={30} tone="claro" />
        </Link>
        {/* Botão × só existe no celular (lg:hidden): no desktop o menu não fecha. */}
        <button onClick={onFechar} aria-label="Fechar menu" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="rolagem flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {/* ⚠️ ATENÇÃO: lista vinda de navegacao.ts; uma tela nova precisa ser registrada lá. */}
        {grupos.map((g) => (
          <div key={g.grupo}>
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{g.grupo}</p>
            <ul className="space-y-0.5">
              {g.itens.map(({ href, rotulo, icone: Icone }) => {
                // Ativo se o endereço é o do item ou uma subpágina dele
                // (ex.: "/projetos/p1" mantém "Projetos" destacado).
                const ativo = caminho === href || caminho.startsWith(href + '/');
                return (
                  <li key={href}>
                    {/* NAVEGA: vai para a tela do item; onFechar fecha a gaveta no celular.
                     * aria-current="page" avisa o leitor de tela qual é a página atual. */}
                    <Link href={href} onClick={onFechar} aria-current={ativo ? 'page' : undefined}
                      className={cx('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                        ativo ? 'bg-white/[0.09] text-white' : 'text-white/65 hover:bg-white/[0.05] hover:text-white')}>
                      {/* Barrinha lilás à esquerda do item ativo (marca "onde você está"). */}
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

      {/* Perfil da sessão no rodapé (vem de lib/auth). */}
      <div className="border-t border-white/[0.07] px-5 py-4 text-[12px] leading-relaxed text-white/40">
        <p className="font-semibold text-white/60">Perfil {sessao ? NOME_PERFIL[sessao.perfil] : ''}</p>
        <p>Versão de demonstração · dados fictícios</p>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop: menu fixo de 256 px, escondido abaixo de lg. */}
      <aside className="hidden w-64 shrink-0 lg:block">{conteudo}</aside>
      {/* Celular/tablet: gaveta por cima do conteúdo, com fundo escuro clicável para fechar.
       * z-[60] fica acima da página e abaixo dos modais (z-[70]). */}
      {abertoMobile && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-black/50" onClick={onFechar} aria-hidden />
          <aside className="animate-card-in absolute inset-y-0 left-0 w-72 shadow-2xl">{conteudo}</aside>
        </div>
      )}
    </>
  );
}
