/* ============================================================================
   APP/(SISTEMA)/PAINEL/PAGE.TSX (PAINEL POR PERFIL)
   O que é: a tela inicial do sistema. Só escolhe qual painel mostrar conforme o perfil de quem está logado ("o painel muda conforme quem olha", §6).
   Onde é usado: rota /painel. Chegam aqui: o item "Painel" do menu (components/shell/navegacao.ts), o login sem ?voltar= (components/LoginForm.tsx), o botão "Voltar ao painel" de /sem-permissao e o botão "Ir para o painel" da 404.
   Depende de: react (Suspense), lib/auth.tsx (useAuth) e components/paineis/ (PainelAdmin, PainelEmpresa, PainelProfissional).
   Contexto: §6 (Dashboards por perfil) e §15 item 2 (painel por perfil).
   ============================================================================ */

// "use client": usa useAuth, que lê a sessão do navegador.
"use client";

import { Suspense } from 'react';
import { useAuth } from '@/lib/auth';
import PainelAdmin from '@/components/paineis/PainelAdmin';
import PainelEmpresa from '@/components/paineis/PainelEmpresa';
import PainelProfissional from '@/components/paineis/PainelProfissional';

/**
 * Rota /painel: escolhe o painel pelo perfil da sessão.
 * Sem sessão devolve null: o layout do grupo (sistema) já redireciona para /login.
 * @returns o painel do perfil logado.
 */
export default function Painel() {
  const { sessao } = useAuth();
  if (!sessao) return null;
  // [PV-1] QUAL PAINEL CADA PERFIL VÊ: admin, empresa ou profissional (components/paineis/). Os painéis leem o período da URL, por isso o Suspense é obrigatório.
  // Cada perfil tem o seu painel (admin, empresa ou profissional: os três valores de Perfil).
  // ⚠️ ATENÇÃO: os painéis leem o período da URL (?de=&ate=, usePeriodo em FiltroPeriodo) com
  // useSearchParams; sem este <Suspense> o `npm run build` falha (notas-next16 §2).
  const painel = sessao.perfil === 'admin' ? <PainelAdmin /> : sessao.perfil === 'empresa' ? <PainelEmpresa /> : <PainelProfissional />;
  return <Suspense>{painel}</Suspense>;
}
