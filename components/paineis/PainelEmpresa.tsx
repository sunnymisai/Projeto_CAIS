/* ============================================================================
   COMPONENTS/PAINEIS/PAINELEMPRESA.TSX (PAINEL DA EMPRESA)
   O que é: esqueleto do painel do perfil Empresa (projetos próprios, quem está alocado, entregas e trilha do time).
   Onde é usado: app/(sistema)/painel/page.tsx, quando o perfil da sessão é empresa.
   Depende de: components/shell/Pagina.tsx (CabecalhoPagina), components/shell/EmConstrucao.tsx (EstadoConstrucao) e lib/auth.tsx (useAuth).
   Contexto: §6 (Dashboards: painel da empresa) e §15 item 2.
   ============================================================================ */
"use client";

import { CabecalhoPagina } from '@/components/shell/Pagina';
import { EstadoConstrucao } from '@/components/shell/EmConstrucao';
import { useAuth } from '@/lib/auth';

/**
 * Painel da Empresa (esqueleto). O conteúdo real chega no bloco D.
 * Dados deste painel devem sair SEMPRE de lib/escopo.ts, para a empresa só ver o portfólio dela.
 * @returns cabeçalho com saudação e o estado "Em construção".
 */
export default function PainelEmpresa() {
  const { sessao } = useAuth();
  // Primeiro nome para a saudação ("Olá, Marcos").
  const primeiroNome = sessao?.nome.split(' ')[0] ?? '';
  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo={`Olá, ${primeiroNome}`} descricao="O andamento dos projetos da sua empresa, em um só lugar." />
      <EstadoConstrucao descricao="O painel da empresa mostrará o andamento dos projetos, quem está alocado, as entregas e o progresso da trilha do seu time." />
    </div>
  );
}
