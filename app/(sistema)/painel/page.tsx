/* ============================================================================
   APP/(SISTEMA)/PAINEL/PAGE.TSX (PAINEL POR PERFIL)
   O que é: a tela inicial do sistema. Só escolhe qual painel mostrar conforme o perfil de quem está logado ("o painel muda conforme quem olha", §6).
   Onde é usado: rota /painel. Chegam aqui: o item "Painel" do menu (components/shell/navegacao.ts), o login sem ?voltar= (components/LoginForm.tsx), o botão "Voltar ao painel" de /sem-permissao e o botão "Ir para o painel" da 404.
   Depende de: lib/auth.tsx (useAuth) e components/paineis/ (PainelAdmin, PainelEmpresa, PainelProfissional).
   Contexto: §6 (Dashboards por perfil) e §15 item 2 (painel por perfil).
   ============================================================================ */

// "use client": usa useAuth, que lê a sessão do navegador.
"use client";

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
  // Cada perfil tem o seu painel; o switch cobre os três valores de Perfil.
  switch (sessao.perfil) {
    case 'admin': return <PainelAdmin />;
    case 'empresa': return <PainelEmpresa />;
    case 'profissional': return <PainelProfissional />;
  }
}
