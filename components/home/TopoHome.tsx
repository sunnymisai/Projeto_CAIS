/* ============================================================================
   TOPOHOME.TSX — TOPO FIXO DA HOMEPAGE
   O que é: a barra fixa no alto da homepage: logo, âncoras das seções, botão
   de tema e botão "Entrar" (ou "Ir para o sistema" se já houver sessão).
   No celular as âncoras viram um menu que abre e fecha.
   Onde é usado: app/page.tsx.
   Depende de: next/link, lucide-react, components/CaisLogo.tsx,
   components/ThemeToggle.tsx, lib/auth.tsx (useAuth), ./secoes.
   Contexto: §15 item 0 (homepage) e §13 (teclado e foco visível).
   ============================================================================ */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import CaisLogo from "@/components/CaisLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { SECOES_NAV } from "./secoes";

// Classes do botão de entrada (um link com cara de botão primário).
const BOTAO_ENTRAR =
  "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl bg-botao px-4 text-sm font-semibold text-white transition-colors hover:bg-botao-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

// Classes dos links de âncora (desktop e menu do celular).
const LINK_ANCORA =
  "rounded-lg px-3 py-2 text-sm font-medium text-tinta-suave transition-colors hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50";

/**
 * Topo fixo da homepage.
 * É Client Component porque precisa de estado (menu aberto/fechado), de
 * eventos de teclado e da sessão (useAuth).
 *
 * Não redireciona quem já está logado: a home continua visível e o botão
 * apenas troca de "Entrar" para "Ir para o sistema".
 *
 * @returns o <header> fixo com os dois <nav> (desktop e menu do celular).
 */
export default function TopoHome() {
  const { sessao, pronto } = useAuth();
  // Menu do celular aberto ou fechado.
  const [aberto, setAberto] = useState(false);
  // Referência do botão do menu: devolvemos o foco a ele ao fechar.
  const botaoMenu = useRef<HTMLButtonElement>(null);

  // Só troca o botão depois que a sessão foi lida do localStorage (pronto):
  // assim o servidor e o navegador mostram o mesmo "Entrar" no 1º desenho.
  const logado = pronto && !!sessao;
  const destino = logado ? "/painel" : "/login";
  const textoEntrar = logado ? "Ir para o sistema" : "Entrar";

  /**
   * Fecha o menu do celular e devolve o foco ao botão que o abriu.
   * preventScroll: focar o botão não deve mexer na rolagem da página.
   */
  const fechar = () => {
    setAberto(false);
    botaoMenu.current?.focus({ preventScroll: true });
  };

  // Efeito: enquanto o menu está aberto, a tecla Esc o fecha.
  // Roda quando `aberto` muda; ao fechar (ou desmontar) remove o ouvinte.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setAberto(false);
        botaoMenu.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    // fixed + z-40: fica sempre no alto. backdrop-blur suaviza o que passa por baixo.
    <header className="fixed inset-x-0 top-0 z-40 border-b border-borda bg-superficie/90 backdrop-blur">
      {/* Link para pular direto ao conteúdo: aparece só quando recebe foco do teclado. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded-lg focus:bg-botao focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* NAVEGA: para o início da própria página. */}
        <Link
          href="/"
          aria-label="CAIS, página inicial"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50"
        >
          <CaisLogo size={28} />
        </Link>

        {/* Âncoras no desktop (md+). No celular este <nav> some (display: none). */}
        <nav aria-label="Seções da página" className="hidden items-center gap-1 md:flex">
          {SECOES_NAV.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={LINK_ANCORA}>
              {s.rotulo}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* NAVEGA: para o login ou, com sessão, para o painel. */}
          <Link href={destino} className={BOTAO_ENTRAR}>
            {textoEntrar}
          </Link>
          {/* Botão do menu: só no celular. aria-expanded diz se está aberto e
            * aria-controls aponta para o painel que ele abre. */}
          <button
            ref={botaoMenu}
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-home"
            aria-label={aberto ? "Fechar menu de seções" : "Abrir menu de seções"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-borda bg-superficie text-tinta-suave transition-colors hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 md:hidden"
          >
            {aberto ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Painel do menu do celular. Só existe no DOM enquanto está aberto
        * (assim o leitor de tela não o lê fechado) e some em md+. */}
      {aberto && (
        <nav id="menu-home" aria-label="Seções da página, menu" className="border-t border-borda bg-superficie px-4 pb-3 pt-2 md:hidden">
          <ul className="flex flex-col">
            {SECOES_NAV.map((s) => (
              <li key={s.id}>
                {/* NAVEGA: rola até a seção; ao escolher, o menu fecha e o foco volta ao botão. */}
                <a href={`#${s.id}`} onClick={fechar} className={`block ${LINK_ANCORA} py-3`}>
                  {s.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
