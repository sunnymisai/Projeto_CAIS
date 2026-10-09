/* ============================================================================
   APP/PRIMEIRO-ACESSO/PAGE.TSX (PRIMEIRO ACESSO POR CONVITE)
   O que é: a página da rota "/primeiro-acesso?convite=<pessoaId>" (pública, fora do grupo protegido).
   Onde é usado: rota "/primeiro-acesso". Chega-se pelo link de convite copiado na ficha de pessoa (app/(sistema)/pessoas/page.tsx) ou em Acessos.
   Depende de: components/AcessoLayout.tsx (duas colunas) e components/PrimeiroAcessoForm.tsx (o formulário e seus estados).
   Contexto: §11 (convite leva ao primeiro acesso), §12 fluxo 1, §15 item 1 e
     docs/notas-next16.md §1 (metadata só em Server Component) e §2 (useSearchParams + Suspense).
   ============================================================================ */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import AcessoLayout from '@/components/AcessoLayout';
import PrimeiroAcessoForm from '@/components/PrimeiroAcessoForm';

// [PV-1] O TÍTULO DA ABA da página de primeiro acesso ("Primeiro acesso · CAIS").
/** Título da aba: "Primeiro acesso · CAIS" (o template vem de app/layout.tsx). */
export const metadata: Metadata = { title: 'Primeiro acesso' };

/**
 * Página de primeiro acesso. Server Component: só monta a estrutura; o formulário
 * (que usa estado, a store e a URL) mora no PrimeiroAcessoForm, que é Client.
 * @returns a tela em duas colunas.
 */
export default function PrimeiroAcessoPage() {
  return (
    <AcessoLayout>
      {/* [PV-2] A PÁGINA DE PRIMEIRO ACESSO (/primeiro-acesso?convite=...). O Suspense é obrigatório porque o formulário lê a URL com useSearchParams. */}
      {/* ⚠️ ATENÇÃO: o formulário lê ?convite= com useSearchParams. Sem este
        * <Suspense>, o `npm run build` falha (notas-next16 §2). */}
      <Suspense>
        <PrimeiroAcessoForm />
      </Suspense>
    </AcessoLayout>
  );
}
