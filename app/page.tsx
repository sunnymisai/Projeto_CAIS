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
export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <section className="relative flex flex-col overflow-hidden bg-fundo">
        {/* Brilho sutil atrás do card (pode apagar sem quebrar nada) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-10%] top-[-15%] h-[520px] w-[520px] rounded-full bg-primaria/10 blur-3xl dark:bg-primaria/[0.07]"
        />

        <header className="relative flex items-center justify-between p-5 sm:p-8 lg:justify-end">
          <CaisLogo size={30} className="lg:hidden" />
          <ThemeToggle />
        </header>

        <div className="relative flex flex-1 items-center justify-center px-4 pb-12 sm:px-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
