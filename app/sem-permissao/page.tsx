/* ============================================================================
   APP/SEM-PERMISSAO/PAGE.TSX
   O que é: tela de "acesso negado" para quem está logado, mas o perfil não pode abrir a página pedida.
   Onde é usado: rota /sem-permissao. Quem manda para cá é o layout protegido
     app/(sistema)/layout.tsx, quando a sessão existe mas podeAcessar (lib/permissoes.ts) nega a rota
     ao perfil, e (C04) app/(sistema)/projetos/[id] quando o projeto está fora do escopo.
   Depende de: lib/auth.tsx (useAuth → sessao e sair), components/CaisLogo.tsx,
     next/link e lucide-react (ícone ShieldOff).
   Contexto: §3 (perfis), §8 (Onda 1: páginas de erro e sem permissão).
   ============================================================================ */

// "use client": precisa do hook useAuth (sessão vive no navegador).
"use client";

import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import CaisLogo from '@/components/CaisLogo';

/** Nome de cada perfil para a mensagem (o texto da interface é em português). */
const NOME_PERFIL = { admin: "Administrador", empresa: "Empresa", profissional: "Profissional" } as const;

/**
 * Página "sem permissão".
 * Fica FORA do grupo (sistema) de propósito: se ficasse dentro, o layout
 * protegido mandaria a pessoa para cá de novo, sem fim.
 *
 * @returns aviso em português com o motivo, o botão "Voltar ao painel" e o de trocar de conta.
 */
export default function SemPermissao() {
  const { sair, sessao } = useAuth();
  // Nome do perfil em português, só para explicar por que a página foi negada.
  const nomePerfil = sessao ? NOME_PERFIL[sessao.perfil] : null;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fundo px-6 text-center">
      <CaisLogo size={30} className="mb-10" />
      {/* bg-aviso/12: fundo âmbar com 12% de opacidade (âmbar = atenção, §9). */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-aviso/12 text-aviso"><ShieldOff className="h-7 w-7" /></div>
      <h1 className="font-space text-2xl font-semibold text-tinta">Você não tem permissão para esta área</h1>
      {/* TODO(API): a permissão real por perfil virá do back-end da PROGLOGIC
        * (§7); aqui só explicamos o que a regra local de lib/permissoes.ts decidiu. */}
      <p className="mt-2 max-w-md text-sm text-tinta-suave">
        {nomePerfil ? `Sua conta tem o perfil ${nomePerfil}, e esta página não faz parte dele.` : "Esta página não faz parte do perfil da sua conta."}{" "}
        Cada perfil enxerga só o que precisa para o seu trabalho. Se acha que deveria ter acesso, fale com a coordenação do programa.
      </p>
      {/* NAVEGA: "Voltar ao painel" leva ao /painel, que existe para os três perfis.
        * APAGA: o segundo botão chama sair(), que remove a sessão salva, e depois leva ao
        * login ("/login"; a raiz "/" é a homepage pública) para entrar com outra conta. */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/painel" className="inline-flex h-10 items-center rounded-xl bg-botao px-4 text-sm font-semibold text-white hover:bg-botao-hover">Voltar ao painel</Link>
        <Link href="/login" onClick={sair} className="inline-flex h-10 items-center rounded-xl border border-borda px-4 text-sm font-semibold text-tinta hover:bg-superficie-alt">Entrar com outra conta</Link>
      </div>
    </main>
  );
}
