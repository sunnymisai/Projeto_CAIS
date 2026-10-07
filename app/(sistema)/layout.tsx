/* ============================================================================
   APP/(SISTEMA)/LAYOUT.TSX (CASCA PROTEGIDA)
   O que é: a casca (menu lateral + topo + área de conteúdo) de todas as telas
     internas, e o "porteiro" que barra quem não está logado ou não é admin.
   Onde é usado: pelo Next.js, automaticamente, em toda rota dentro de
     app/(sistema)/: /painel, /trilhas, /trilhas/[id], /projetos,
     /projetos/[id], /empresas, /pessoas e /design-system. Os parênteses em
     "(sistema)" agrupam pastas sem aparecer na URL.
   Depende de: lib/auth.tsx (useAuth → sessao e pronto), next/navigation
     (useRouter, usePathname), components/shell/Sidebar.tsx,
     components/shell/Topbar.tsx e components/CaisLogo.tsx (CaisMark).
   Contexto: §3 (perfis), §10 (anatomia de toda tela: só o conteúdo rola),
     §15 item 1 (shell da aplicação) e docs/notas-next16.md §4 (rotas
     públicas e protegidas).
   ============================================================================ */

// "use client": a sessão fica no localStorage e só existe no navegador.
"use client";

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/shell/Sidebar';
import Topbar from '@/components/shell/Topbar';
import { useAuth } from '@/lib/auth';
import { CaisMark } from '@/components/CaisLogo';

/**
 * Casca de todas as telas internas.
 * - Protege as rotas: sem sessão volta para o login (com ?voltar=); sessão
 *   com perfil diferente de admin vai para /sem-permissao.
 * - Enquanto a sessão ainda está sendo lida (`pronto` falso), mostra só o
 *   símbolo do CAIS pulsando ("verificando acesso"), para não piscar a tela
 *   interna para quem não deveria vê-la.
 * - A página não rola inteira: só a área de conteúdo rola (§10).
 *
 * ⚠️ ATENÇÃO: esta proteção roda só no navegador e confia no localStorage.
 * Qualquer pessoa pode editar o localStorage pelo DevTools: isto NÃO é
 * segurança real, é só experiência de uso no protótipo.
 * TODO(API): a segurança de verdade será o token e a permissão por perfil
 * validados no back-end da PROGLOGIC (§7); aqui só redirecionaremos quando a
 * API responder 401/403.
 *
 * @param props.children a página da rota atual (ex.: o painel).
 * @returns a tela de "verificando acesso" ou a casca com a página dentro.
 */
export default function LayoutSistema({ children }: { children: ReactNode }) {
  const { sessao, pronto } = useAuth();
  const router = useRouter();
  const caminho = usePathname();
  // Controla o menu lateral no celular (no desktop ele fica sempre visível).
  const [menuAberto, setMenuAberto] = useState(false);

  // Porteiro das rotas. Roda depois de cada render em que mudar `pronto`,
  // `sessao` ou o `caminho` (trocar de página, sair, entrar). Não tem nada
  // para limpar: só decide se manda a pessoa para outro lugar.
  useEffect(() => {
    // Ainda lendo a sessão do navegador: não decide nada, senão quem está
    // logado seria jogado para o login por uma fração de segundo.
    if (!pronto) return;
    // NAVEGA: sem sessão → login. O ?voltar= guarda a tela pedida (ex.:
    // /?voltar=%2Fprojetos%2Fp1) para o LoginForm trazer a pessoa de volta
    // depois de entrar. encodeURIComponent protege as barras do caminho.
    // replace (e não push) para o botão "voltar" do navegador não cair de
    // novo na tela protegida.
    if (!sessao) router.replace(`/?voltar=${encodeURIComponent(caminho)}`);
    // NAVEGA: logado, mas não é admin → tela de acesso negado.
    else if (sessao.perfil !== 'admin') router.replace('/sem-permissao');
  }, [pronto, sessao, router, caminho]);

  // Enquanto verifica (ou enquanto o redirecionamento acima não acontece),
  // nunca mostra a casca: só o símbolo pulsando no meio da tela.
  // ⚠️ ATENÇÃO: esta condição precisa bater com a do useEffect; se alguém
  // liberar outro perfil lá, precisa liberar aqui também.
  if (!pronto || !sessao || sessao.perfil !== 'admin') {
    return (
      // role="status": leitores de tela anunciam o texto "Verificando acesso…".
      <div className="flex h-screen items-center justify-center bg-fundo" role="status">
        <CaisMark size={40} className="animate-pulse" />
        <span className="sr-only">Verificando acesso…</span>
      </div>
    );
  }

  return (
    // h-screen + overflow-hidden: a casca tem exatamente a altura da janela e
    // não rola. Assim o menu e o topo ficam sempre no lugar (§10).
    <div className="flex h-screen overflow-hidden bg-fundo">
      {/* Link "pular para o conteúdo": invisível (sr-only) até receber foco
        * pelo Tab; aí aparece no canto (focus:not-sr-only). Ajuda quem navega
        * só pelo teclado a não passar por todo o menu (§13). */}
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-superficie focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-card">
        Pular para o conteúdo
      </a>
      <Sidebar abertoMobile={menuAberto} onFechar={() => setMenuAberto(false)} />
      {/* min-w-0: deixa esta coluna encolher; sem isso, tabelas largas
        * empurrariam a tela para os lados. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onAbrirMenu={() => setMenuAberto(true)} />
        {/* Só ESTA área rola (flex-1 overflow-y-auto), como pede o §10.
          * "rolagem" é a barra de rolagem fina definida no globals.css.
          * tabIndex={-1} permite receber foco pelo link "pular para o
          * conteúdo" sem entrar na ordem normal do Tab. */}
        <main id="conteudo" tabIndex={-1} className="rolagem flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
