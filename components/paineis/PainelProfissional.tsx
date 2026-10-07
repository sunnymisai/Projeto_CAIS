/* ============================================================================
   COMPONENTS/PAINEIS/PAINELPROFISSIONAL.TSX (PAINEL DO PROFISSIONAL)
   O que é: esqueleto do painel do perfil Profissional (minhas trilhas, tarefas, carga da semana e histórico).
   Onde é usado: app/(sistema)/painel/page.tsx, quando o perfil da sessão é profissional.
   Depende de: components/shell/Pagina.tsx (CabecalhoPagina), components/shell/EmConstrucao.tsx (EstadoConstrucao) e lib/auth.tsx (useAuth).
   Contexto: §6 (Dashboards: painel do profissional), §3 (funciona no celular) e §15 item 2.
   ============================================================================ */
"use client";

import { CabecalhoPagina } from '@/components/shell/Pagina';
import { EstadoConstrucao } from '@/components/shell/EmConstrucao';
import { useAuth } from '@/lib/auth';

/**
 * Painel do Profissional (esqueleto). O conteúdo real chega no bloco E.
 * Precisa funcionar no celular (§3): manter o layout em uma coluna que cresce com a tela.
 * @returns cabeçalho com saudação e o estado "Em construção".
 */
export default function PainelProfissional() {
  const { sessao } = useAuth();
  // Primeiro nome para a saudação ("Olá, Ana").
  const primeiroNome = sessao?.nome.split(' ')[0] ?? '';
  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo={`Olá, ${primeiroNome}`} descricao="Suas trilhas, tarefas e prazos da semana." />
      <EstadoConstrucao descricao="O painel do profissional mostrará suas trilhas e progresso, suas tarefas e prazos, a carga da semana e o histórico de entregas." />
    </div>
  );
}
