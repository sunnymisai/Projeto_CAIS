/* ============================================================================
   APP/SEM-PERMISSAO/PAGE.TSX
   O que é: tela de "acesso negado" para quem entrou com um perfil sem acesso.
   Onde é usado: rota /sem-permissao. Quem manda para cá é o layout protegido
     app/(sistema)/layout.tsx, quando a sessão existe mas o perfil não é admin.
   Depende de: lib/auth.tsx (useAuth → sair), components/CaisLogo.tsx,
     next/link e lucide-react (ícone ShieldOff).
   Contexto: §3 (perfis), §8 (Onda 1: páginas de erro e sem permissão).
   ============================================================================ */

// "use client": precisa do hook useAuth (sessão vive no navegador).
"use client";

import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import CaisLogo from '@/components/CaisLogo';

/**
 * Página "sem permissão".
 * Fica FORA do grupo (sistema) de propósito: se ficasse dentro, o layout
 * protegido mandaria a pessoa para cá de novo, sem fim.
 *
 * @returns aviso em português e um botão para trocar de conta.
 */
export default function SemPermissao() {
  const { sair } = useAuth();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fundo px-6 text-center">
      <CaisLogo size={30} className="mb-10" />
      {/* bg-aviso/12: fundo âmbar com 12% de opacidade (âmbar = atenção, §9). */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-aviso/12 text-aviso"><ShieldOff className="h-7 w-7" /></div>
      <h1 className="font-space text-2xl font-semibold text-tinta">Você não tem permissão para esta área</h1>
      {/* TODO(API): a permissão real por perfil virá do back-end da PROGLOGIC
        * (§7). Hoje só o perfil admin tem telas; quando existirem as de Empresa
        * e Profissional (§16), este texto e a regra do layout mudam. */}
      <p className="mt-2 max-w-md text-sm text-tinta-suave">Esta parte do CAIS é exclusiva do perfil Administrador. Se precisa de acesso, fale com a coordenação do programa.</p>
      {/* APAGA: o clique chama sair(), que remove a sessão salva.
        * NAVEGA: depois o link leva ao login ("/") para entrar com outra conta. */}
      <Link href="/" onClick={sair} className="mt-6 inline-flex h-10 items-center rounded-xl bg-botao px-4 text-sm font-semibold text-white hover:bg-botao-hover">Entrar com outra conta</Link>
    </main>
  );
}
