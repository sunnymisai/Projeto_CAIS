/* ============================================================================
   APP/LOGIN/PAGE.TSX (TELA DE LOGIN)
   O que é: a página da rota "/login" — tela de entrada no sistema.
   Onde é usado: rota "/login". Chegam aqui: o link "Entrar" da homepage
     (app/page.tsx), o item "Sair" do menu de perfil (components/shell/Topbar.tsx),
     o link "Entrar com outra conta" de /sem-permissao, o fim da recuperação de
     senha (/recuperar-senha) e o layout protegido app/(sistema)/layout.tsx, que
     manda para "/login?voltar=..." quem não tem sessão.
   Depende de: components/AcessoLayout.tsx (duas colunas, compartilhada com
     recuperar senha e primeiro acesso) e components/LoginForm.tsx (formulário e ?voltar=).
   Contexto: §8 (Onda 1: login), §15 item 1 (autenticação e shell) e
     docs/notas-next16.md §1 (Server Component) e §2 (useSearchParams + Suspense).
   ============================================================================ */

import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';
import AcessoLayout from '@/components/AcessoLayout';

/**
 * Página de login (rota "/login").
 * É Server Component (sem "use client"): só monta a estrutura; a parte que
 * reage ao usuário (digitar, entrar) mora no LoginForm, que é Client.
 *
 * @returns a tela de login em uma ou duas colunas, conforme a largura.
 */
export default function LoginPage() {
  return (
    <AcessoLayout>
      {/* ⚠️ ATENÇÃO: o LoginForm lê ?voltar= com useSearchParams. Sem este
        * <Suspense>, o `npm run build` falha com "useSearchParams() should
        * be wrapped in a suspense boundary" (notas-next16 §2). */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AcessoLayout>
  );
}
