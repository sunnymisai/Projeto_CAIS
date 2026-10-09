/* ============================================================================
   ACESSOLAYOUT.TSX — MOLDURA DAS TELAS DE ACESSO
   O que é: o layout de duas colunas (painel de marca + cartão) compartilhado pelas telas públicas de acesso: login, recuperar senha e primeiro acesso.
   Onde é usado: app/login/page.tsx, app/recuperar-senha/page.tsx e app/primeiro-acesso/page.tsx.
   Depende de: components/BrandPanel.tsx, components/CaisLogo.tsx e components/ThemeToggle.tsx.
   Contexto: §15 item 1 (Login, Esqueci a senha e Primeiro acesso) e §13 (celular e teclado).
   ============================================================================ */

import type { ReactNode } from 'react';
import BrandPanel from '@/components/BrandPanel';
import CaisLogo from '@/components/CaisLogo';
import ThemeToggle from '@/components/ThemeToggle';

/**
 * Moldura das telas de acesso. É Server Component (sem "use client"): só monta a
 * estrutura; o que reage ao usuário mora no `children`, que é Client.
 * - Telas grandes (lg+): duas colunas, com o painel de marca escuro à esquerda.
 * - Celular/tablet: só o cartão, com o logo no topo.
 * @param props.children o cartão da tela (LoginForm, RecuperarSenhaForm...).
 * @returns a página em uma ou duas colunas, conforme a largura.
 */
export default function AcessoLayout({ children }: { children: ReactNode }) {
  return (
    // [PV-1] A DIVISÃO DAS TELAS DE ACESSO: duas colunas a partir de 1024 px (marca à esquerda, cartão à direita) e uma só abaixo disso. O ponto de quebra e a proporção estão na classe lg:grid-cols-[1.05fr_1fr].
    // lg:grid-cols-[1.05fr_1fr]: a partir de 1024 px, duas colunas quase iguais
    // (a da marca um pouco mais larga). Abaixo disso, uma coluna só.
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* BrandPanel se esconde sozinho no celular (classe interna dele). */}
      <BrandPanel />

      <section className="relative flex flex-col overflow-hidden bg-fundo">
        {/* Brilho sutil atrás do card (pode apagar sem quebrar nada) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-10%] top-[-15%] h-[520px] w-[520px] rounded-full bg-primaria/10 blur-3xl dark:bg-primaria/[0.07]"
        />

        {/* [PV-2] O topo da coluna do cartão: o logo (só no celular) e o botão de tema. Item novo que deva aparecer em todas as telas de acesso entra aqui. */}
        {/* No celular: logo à esquerda e botão de tema à direita.
          * No desktop (lg): o logo some (já aparece no BrandPanel) e o botão
          * de tema vai para a direita (lg:justify-end). */}
        <header className="relative flex items-center justify-between p-5 sm:p-8 lg:justify-end">
          <CaisLogo size={30} className="lg:hidden" />
          <ThemeToggle />
        </header>

        <div className="relative flex flex-1 items-center justify-center px-4 pb-12 sm:px-8">
          {children}
        </div>
      </section>
    </main>
  );
}
