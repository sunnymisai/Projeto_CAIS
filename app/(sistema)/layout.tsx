/* ============================================================================
   APP/(SISTEMA)/LAYOUT.TSX (CASCA PROTEGIDA)
   O que é: a casca (menu lateral + topo + área de conteúdo) de todas as telas
     internas, e o "porteiro" que barra quem não está logado ou cujo perfil
     não pode abrir a rota (lib/permissoes.ts).
   Onde é usado: pelo Next.js, automaticamente, em toda rota dentro de
     app/(sistema)/: /painel, /trilhas, /trilhas/[id], /projetos,
     /projetos/[id], /empresas, /pessoas, /design-system, /perfil, /carga,
     /acessos, /minhas-trilhas e /minhas-tarefas. Os parênteses em
     "(sistema)" agrupam pastas sem aparecer na URL.
   Depende de: lib/auth.tsx (useAuth → sessao e pronto), next/navigation
     (useRouter, usePathname), lib/permissoes.ts (podeAcessar e a guarda da trilha obrigatória),
     lib/store.tsx (useDados, para saber a trilha pendente), components/shell/Sidebar.tsx,
     components/shell/Topbar.tsx, components/shell/TrilhaPendente.tsx, components/CaisLogo.tsx (CaisMark),
     components/ui/basicos.tsx (EstadoErro, quando a store não lê os dados) e components/button.tsx.
   Contexto: §3 (perfis), §10 (anatomia de toda tela: só o conteúdo rola),
     §12 fluxo 1 (trilha obrigatória libera o sistema), §15 item 1 (shell da
     aplicação) e docs/notas-next16.md §4 (rotas públicas e protegidas).
   ============================================================================ */

// "use client": a sessão fica no localStorage e só existe no navegador.
"use client";

import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/shell/Sidebar';
import Topbar from '@/components/shell/Topbar';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { podeAcessar, temTrilhaObrigatoriaPendente, rotaLiberadaComTrilhaPendente, EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO } from '@/lib/permissoes';
import TrilhaPendente from '@/components/shell/TrilhaPendente';
import { CaisMark } from '@/components/CaisLogo';
import { EstadoErro } from '@/components/ui/basicos';
import Button from '@/components/button';
import { RotateCw } from 'lucide-react';

/**
 * Casca de todas as telas internas.
 * - Protege as rotas: sem sessão volta para o login (com ?voltar=); sessão
 *   cujo perfil não pode abrir a rota (podeAcessar) vai para /sem-permissao.
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
  const { sessao, pronto, sair, atualizarSessao } = useAuth();
  const dados = useDados();
  const router = useRouter();
  const caminho = usePathname();
  // Controla o menu lateral no celular (no desktop ele fica sempre visível).
  const [menuAberto, setMenuAberto] = useState(false);
  // Lembra que a sessão foi encerrada porque a conta foi inativada: o porteiro abaixo usa isto
  // para mandar ao login COM a mensagem, em vez do redirecionamento comum.
  const encerradaPorInativa = useRef(false);

  // Conta de quem está logado mudou no cadastro (feito em /acessos ou /pessoas)? Roda quando os dados
  // carregam ou mudam; não tem limpeza.
  // - Inativa: encerra a sessão (a pessoa que já estava com o sistema aberto é barrada na hora).
  //   O login em si já recusa conta inativa (lib/auth.tsx); aqui cobrimos a sessão ABERTA.
  // - Perfil, nome ou e-mail diferentes: copia para a sessão, que guarda só uma cópia.
  // Escolha: o layout tem acesso a useDados() e o AuthProvider não (fica fora do DadosProvider).
  // APAGA: sair() remove a sessão do navegador.
  // TODO(API): a API responde 401/403 na próxima chamada e a tela reage a isso.
  useEffect(() => {
    // Com erro de leitura (dados.erro), a store está com a demonstração, não com o cadastro
    // real: comparar com ela poderia encerrar ou alterar a sessão por engano.
    if (!pronto || !sessao || !dados.pronto || dados.erro) return;
    const p = dados.pessoa(sessao.pessoaId);
    // Cadastro não encontrado: não mexe (a tela de perfil explica o erro).
    if (!p) return;
    if (p.status === 'inativo') {
      encerradaPorInativa.current = true;
      sair();
      return;
    }
    if (p.perfil !== sessao.perfil || p.nome !== sessao.nome || p.email !== sessao.email) {
      // GRAVA: atualiza a cópia na sessão.
      atualizarSessao({ perfil: p.perfil, nome: p.nome, email: p.email });
    }
  }, [pronto, sessao, dados, sair, atualizarSessao]);

  // Porteiro das rotas. Roda depois de cada render em que mudar `pronto`,
  // `sessao` ou o `caminho` (trocar de página, sair, entrar). Não tem nada
  // para limpar: só decide se manda a pessoa para outro lugar.
  useEffect(() => {
    // Ainda lendo a sessão do navegador: não decide nada, senão quem está
    // logado seria jogado para o login por uma fração de segundo.
    if (!pronto) return;
    // NAVEGA: sem sessão → /login (a raiz "/" agora é a homepage pública).
    // O ?voltar= guarda a tela pedida (ex.: /login?voltar=%2Fprojetos%2Fp1)
    // para o LoginForm trazer a pessoa de volta depois de entrar.
    // encodeURIComponent protege as barras do caminho.
    // replace (e não push) para o botão "voltar" do navegador não cair de
    // novo na tela protegida.
    if (!sessao) router.replace(encerradaPorInativa.current ? '/login?aviso=inativa' : `/login?voltar=${encodeURIComponent(caminho)}`);
    // NAVEGA: logado, mas o perfil não pode abrir esta rota → tela de acesso negado.
    else if (!podeAcessar(sessao.perfil, caminho)) router.replace('/sem-permissao');
  }, [pronto, sessao, router, caminho]);

  // Enquanto verifica (ou enquanto o redirecionamento acima não acontece),
  // nunca mostra a casca: só o símbolo pulsando no meio da tela.
  // ⚠️ ATENÇÃO: esta condição precisa bater com a do useEffect (mesma regra
  // podeAcessar); senão a tela proibida piscaria antes do redirecionamento.
  if (!pronto || !sessao || !podeAcessar(sessao.perfil, caminho)) {
    return (
      // role="status": leitores de tela anunciam o texto "Verificando acesso…".
      <div className="flex h-screen items-center justify-center bg-fundo" role="status">
        <CaisMark size={40} className="animate-pulse" />
        <span className="sr-only">Verificando acesso…</span>
      </div>
    );
  }

  // Guarda da trilha obrigatória (§12): profissional com trilha pendente só abre /painel e /minhas-trilhas*.
  // Só vale com EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO ligada (hoje false: o bloco D liga) e depois que a store
  // carregou (dados.pronto), senão a tela piscaria o bloqueio antes de saber se há pendência.
  const trilhaBloqueia = EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO
    && dados.pronto
    && sessao.perfil === 'profissional'
    && !rotaLiberadaComTrilhaPendente(caminho)
    && temTrilhaObrigatoriaPendente(sessao.pessoaId, dados);

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
          {/* Estado de erro (§13) de TODAS as telas internas: se a store não conseguiu ler os dados,
            * mostra o EstadoErro no lugar da página (que estaria com dados errados).
            * Bloqueio da trilha pendente: também no lugar da página.
            * Nos dois casos o menu e o topo continuam à mostra para a pessoa se mover. */}
          {dados.erro ? (
            <EstadoErro
              titulo="Não foi possível carregar os dados"
              descricao={`${dados.erro} Tente de novo; se continuar, volte aos dados de demonstração (o que estava salvo neste navegador se perde).`}
              acoes={<>
                {/* isLoading: enquanto relê, o botão mostra o spinner e não aceita outro clique. */}
                <Button onClick={dados.tentarDeNovo} isLoading={!dados.pronto} loadingText="Tentando…">
                  <RotateCw className="h-4 w-4" aria-hidden />
                  Tentar de novo
                </Button>
                {/* APAGA: troca os dados danificados pela demonstração (lib/store.tsx). */}
                <Button variante="secundario" onClick={dados.restaurarDemonstracao} disabled={!dados.pronto}>
                  Voltar aos dados de demonstração
                </Button>
              </>}
            />
          ) : trilhaBloqueia ? <TrilhaPendente /> : children}
        </main>
      </div>
    </div>
  );
}
