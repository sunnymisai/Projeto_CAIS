"use client";

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/shell/Sidebar';
import Topbar from '@/components/shell/Topbar';
import { useAuth } from '@/lib/auth';
import { CaisMark } from '@/components/CaisLogo';

/**
 * Casca de todas as telas internas.
 * - Protege as rotas: sem sessão volta para o login; sem perfil admin
 *   vai para /sem-permissao.
 * - A página não rola inteira: só a área de conteúdo rola (slide 15).
 */
export default function LayoutSistema({ children }: { children: ReactNode }) {
  const { sessao, pronto } = useAuth();
  const router = useRouter();
  const caminho = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (!pronto) return;
    if (!sessao) router.replace(`/?voltar=${encodeURIComponent(caminho)}`);
    else if (sessao.perfil !== 'admin') router.replace('/sem-permissao');
  }, [pronto, sessao, router, caminho]);

  if (!pronto || !sessao || sessao.perfil !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-fundo" role="status">
        <CaisMark size={40} className="animate-pulse" />
        <span className="sr-only">Verificando acesso…</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-fundo">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-superficie focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-card">
        Pular para o conteúdo
      </a>
      <Sidebar abertoMobile={menuAberto} onFechar={() => setMenuAberto(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onAbrirMenu={() => setMenuAberto(true)} />
        <main id="conteudo" tabIndex={-1} className="rolagem flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
