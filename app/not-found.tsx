/* ============================================================================
   APP/NOT-FOUND.TSX (PÁGINA 404)
   O que é: a tela mostrada quando o endereço digitado não existe.
   Onde é usado: pelo próprio Next.js, automaticamente, em qualquer URL sem
     página correspondente (ex.: /qualquer-coisa). Ninguém importa este arquivo.
   Depende de: next/link, lucide-react (ícone Compass) e components/CaisLogo.tsx.
   Contexto: §8 (Onda 1: páginas de erro e sem permissão) e §13 (estado de erro
     sempre explica o que houve e oferece saída).
   ============================================================================ */

import Link from 'next/link';
import { Compass } from 'lucide-react';
import CaisLogo from '@/components/CaisLogo';

/**
 * Página "não encontrada" (erro 404).
 * Não tem "use client": é Server Component, só mostra texto e um link.
 *
 * @returns mensagem em português com um botão para voltar ao painel.
 */
export default function NaoEncontrado() {
  return (
    // min-h-screen + flex centralizado: a mensagem fica no meio da tela,
    // sem menu lateral (esta página fica fora da casca do sistema).
    <main className="flex min-h-screen flex-col items-center justify-center bg-fundo px-6 text-center">
      <CaisLogo size={30} className="mb-10" />
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primaria-suave text-primaria"><Compass className="h-7 w-7" /></div>
      <h1 className="font-space text-2xl font-semibold text-tinta">Página não encontrada</h1>
      <p className="mt-2 max-w-md text-sm text-tinta-suave">O endereço pode ter mudado ou o item foi removido. Volte ao painel e continue de lá.</p>
      {/* NAVEGA: para /painel. Se a pessoa não estiver logada, o layout de
        * app/(sistema) a manda para o login e depois de volta ao painel. */}
      <Link href="/painel" className="mt-6 inline-flex h-10 items-center rounded-xl bg-botao px-4 text-sm font-semibold text-white hover:bg-botao-hover">Ir para o painel</Link>
    </main>
  );
}
