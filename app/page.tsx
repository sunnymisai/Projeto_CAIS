/* ============================================================================
   APP/PAGE.TSX (HOMEPAGE — PROVISÓRIA)
   O que é: página pública da raiz "/". PROVISÓRIA: só título e link "Entrar"
     até a homepage completa ser montada (prompts B02 a B04).
   Onde é usado: rota "/". Chegam aqui visitantes de fora e o link
     "Ir para a página inicial" da página 404 (app/not-found.tsx).
   Depende de: next/link e components/CaisLogo.tsx.
   Contexto: §15 item 0 (homepage como ponto de entrada público) e §16.
   ============================================================================ */

import Link from 'next/link';
import CaisLogo from '@/components/CaisLogo';

/**
 * Homepage provisória.
 * Server Component (sem "use client"): só mostra texto e um link.
 *
 * @returns o nome do produto e um link para a tela de login.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fundo px-6 text-center">
      <CaisLogo size={30} className="mb-10" />
      <h1 className="font-space text-3xl font-semibold text-tinta">CAIS</h1>
      <p className="mt-2 max-w-md text-sm text-tinta-suave">Uma plataforma para formar, alocar e acompanhar.</p>
      {/* NAVEGA: para a tela de login, que saiu da raiz e agora fica em /login. */}
      <Link href="/login" className="mt-6 inline-flex h-10 items-center rounded-xl bg-botao px-4 text-sm font-semibold text-white hover:bg-botao-hover">Entrar</Link>
    </main>
  );
}
