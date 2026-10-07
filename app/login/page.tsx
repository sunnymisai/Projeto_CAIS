/* ============================================================================
   APP/LOGIN/PAGE.TSX (TELA DE LOGIN)
   O que é: a página da rota "/login" — tela de entrada no sistema.
   Onde é usado: rota "/login". Chegam aqui: o link "Entrar" da homepage
     (app/page.tsx), o item "Sair" do menu de perfil (components/shell/Topbar.tsx),
     o link "Entrar com outra conta" de /sem-permissao e o layout protegido
     app/(sistema)/layout.tsx, que manda para "/login?voltar=..." quem não tem sessão.
     Até o bloco B esta tela ficava na raiz "/"; a raiz virou a homepage pública.
   Depende de: components/LoginForm.tsx (formulário e ?voltar=),
     components/BrandPanel.tsx, components/CaisLogo.tsx e
     components/ThemeToggle.tsx.
   Contexto: §8 (Onda 1: login), §15 item 1 (autenticação e shell) e
     docs/notas-next16.md §1 (Server Component) e §2 (useSearchParams + Suspense).
   ============================================================================ */

import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';
import BrandPanel from '@/components/BrandPanel';
import CaisLogo from '@/components/CaisLogo';
import ThemeToggle from '@/components/ThemeToggle';

/*
  Layout:
  - Telas grandes (lg+): duas colunas — painel de marca escuro à esquerda
    e o formulário à direita.
  - Celular/tablet: só o formulário, com o logo no topo.
*/
/**
 * Página de login (rota "/").
 * É Server Component (sem "use client"): só monta a estrutura; a parte que
 * reage ao usuário (digitar, entrar) mora no LoginForm, que é Client.
 *
 * @returns a tela de login em uma ou duas colunas, conforme a largura.
 */
export default function LoginPage() {
  return (
    // lg:grid-cols-[1.05fr_1fr]: a partir de 1024 px, duas colunas quase
    // iguais (a da marca um pouco mais larga). Abaixo disso, uma coluna só.
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* BrandPanel se esconde sozinho no celular (classe interna dele). */}
      <BrandPanel />

      <section className="relative flex flex-col overflow-hidden bg-fundo">
        {/* Brilho sutil atrás do card (pode apagar sem quebrar nada) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-10%] top-[-15%] h-[520px] w-[520px] rounded-full bg-primaria/10 blur-3xl dark:bg-primaria/[0.07]"
        />

        {/* No celular: logo à esquerda e botão de tema à direita.
          * No desktop (lg): o logo some (já aparece no BrandPanel) e o botão
          * de tema vai para a direita (lg:justify-end). */}
        <header className="relative flex items-center justify-between p-5 sm:p-8 lg:justify-end">
          <CaisLogo size={30} className="lg:hidden" />
          <ThemeToggle />
        </header>

        <div className="relative flex flex-1 items-center justify-center px-4 pb-12 sm:px-8">
          {/* ⚠️ ATENÇÃO: o LoginForm lê ?voltar= com useSearchParams. Sem este
            * <Suspense>, o `npm run build` falha com "useSearchParams() should
            * be wrapped in a suspense boundary" (notas-next16 §2). */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
