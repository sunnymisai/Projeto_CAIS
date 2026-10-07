/* ============================================================================
   COMPONENTS/PAINEIS/BLOCO.TSX
   O que é: a moldura de um bloco de painel (cartão com título, link no canto e os
     estados carregando e erro) e o link "Ver todas".
   Onde é usado: components/paineis/PainelProfissional.tsx e PainelEmpresa.tsx.
   Depende de: next/link e components/ui/basicos.tsx (Card, CardTitulo, Esqueleto, Aviso).
   Contexto: §6 (dashboards por perfil) e §13 (quatro estados em todo bloco).
   ============================================================================ */
"use client";

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardTitulo, Esqueleto, Aviso } from '@/components/ui/basicos';

/** Estado de um bloco: o vazio e o "com dado" ficam com o conteúdo de cada bloco. */
export type EstadoBloco = 'carregando' | 'erro' | 'pronto';

/**
 * Link "Ver todas" do canto de um bloco.
 * @param props.href a tela completa. NAVEGA: para ela.
 * @param props.rotulo texto do link (padrão "Ver todas").
 * @returns o link.
 */
export function VerTodas({ href, rotulo = 'Ver todas' }: { href: string; rotulo?: string }) {
  return <Link href={href} className="rounded text-[13px] font-semibold text-primaria hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">{rotulo}</Link>;
}

/**
 * Moldura de um bloco de painel com os estados (§13): carregando (esqueleto) e erro
 * (cadastro da sessão não encontrado). O erro de leitura dos dados é tratado pelo layout.
 * @param props.titulo título do bloco.
 * @param props.acao link no canto (ex.: <VerTodas />); só aparece com o bloco pronto.
 * @param props.estado 'carregando', 'erro' ou 'pronto'.
 * @param props.children o conteúdo (só desenhado quando pronto).
 * @returns o cartão.
 * @example <Bloco titulo="Minhas tarefas" estado={estado} acao={<VerTodas href="/minhas-tarefas" />}>…</Bloco>
 */
export default function Bloco({ titulo, acao, estado, children }: { titulo: string; acao?: ReactNode; estado: EstadoBloco; children: ReactNode }) {
  return (
    <Card className="flex flex-col">
      <CardTitulo titulo={titulo} acao={estado === 'pronto' ? acao : undefined} />
      <div className="flex-1 p-4 pt-0 sm:p-5 sm:pt-0">
        {estado === 'carregando' ? <div className="space-y-2"><Esqueleto className="h-5 w-2/3" /><Esqueleto className="h-16 w-full" /><Esqueleto className="h-5 w-1/2" /></div>
          : estado === 'erro' ? <Aviso tipo="erro" titulo="Não encontramos o seu cadastro">Saia e entre de novo. Se continuar, fale com o administrador.</Aviso>
          : children}
      </div>
    </Card>
  );
}
