/* ============================================================================
   APP/RECUPERAR-SENHA/PAGE.TSX (RECUPERAÇÃO DE SENHA)
   O que é: a página da rota "/recuperar-senha" (pública, fora do grupo protegido).
   Onde é usado: rota "/recuperar-senha". Chega-se pelo link "Esqueceu a senha?" do
     components/LoginForm.tsx e pelo "link recebido" da própria tela (?token=demo&email=...).
   Depende de: components/AcessoLayout.tsx (duas colunas) e components/RecuperarSenhaForm.tsx (os 3 passos).
   Contexto: §15 item 1 (Login → Esqueci a senha → Recuperação de senha) e
     docs/notas-next16.md §1 (metadata só em Server Component) e §2 (useSearchParams + Suspense).
   ============================================================================ */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import AcessoLayout from '@/components/AcessoLayout';
import RecuperarSenhaForm from '@/components/RecuperarSenhaForm';

// [PV-1] O TÍTULO DA ABA da recuperação de senha ("Recuperar senha · CAIS").
/** Título da aba: "Recuperar senha · CAIS" (o template vem de app/layout.tsx). */
export const metadata: Metadata = { title: 'Recuperar senha' };

/**
 * Página de recuperação de senha. Server Component: só monta a estrutura; os passos
 * (que usam estado e a URL) moram no RecuperarSenhaForm, que é Client.
 * @returns a tela em duas colunas.
 */
export default function RecuperarSenhaPage() {
  return (
    <AcessoLayout>
      {/* [PV-2] A PÁGINA DE RECUPERAÇÃO DE SENHA (/recuperar-senha). O Suspense é obrigatório porque o formulário lê ?token= e ?email= com useSearchParams. */}
      {/* ⚠️ ATENÇÃO: o formulário lê ?token= e ?email= com useSearchParams. Sem este
        * <Suspense>, o `npm run build` falha (notas-next16 §2). */}
      <Suspense>
        <RecuperarSenhaForm />
      </Suspense>
    </AcessoLayout>
  );
}
