/* ============================================================================
   THEMETOGGLE.TSX — BOTÃO DE TEMA CLARO/ESCURO
   O que é: botão redondo (sol/lua) que alterna o tema e lembra a escolha.
   Onde é usado: app/page.tsx (tela de login) e components/shell/Topbar.tsx.
   Depende de: react (useState, useSyncExternalStore), lucide-react (ícones),
   localStorage e do script de tema em app/layout.tsx.
   Contexto: §9 (design system) e §13 (qualidade: tema claro e escuro).
   ============================================================================ */
"use client";

import { useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Alterna entre tema claro e escuro.
 * Salva a escolha em localStorage ("cais-tema"); o script em app/layout.tsx
 * lê esse valor na próxima visita, antes de a página aparecer.
 * @param className classes extras do botão.
 * @returns o botão com os ícones de sol e lua.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  // Tema lido do <html> no navegador; null no servidor (evita divergência na hidratação)
  const temaInicial = useSyncExternalStore(
    () => () => {},
    () => document.documentElement.classList.contains("dark"),
    () => null
  );
  // Tema escolhido por clique; null enquanto a pessoa não clicou.
  const [escolhido, setEscuro] = useState<boolean | null>(null);
  // Vale o escolhido; se não houver, o tema que a página já tinha.
  const escuro = escolhido ?? temaInicial;

  // Clique no botão: inverte o tema, aplica na página e salva a escolha.
  const alternar = () => {
    const proximo = !escuro;
    // A classe "dark" no <html> liga as cores escuras definidas em app/globals.css.
    document.documentElement.classList.toggle("dark", proximo);
    // GRAVA: salva "escuro" ou "claro" no localStorage, chave "cais-tema".
    // ⚠️ ATENÇÃO: a chave e os valores precisam bater com o script de app/layout.tsx;
    // se mudar aqui sem mudar lá, o tema escolhido não é restaurado na próxima visita.
    // O try/catch existe porque o localStorage pode falhar (ex.: navegação privada).
    try {
      localStorage.setItem("cais-tema", proximo ? "escuro" : "claro");
    } catch {
      /* navegação privada: apenas não salva */
    }
    // Atualiza o estado para trocar o ícone e o rótulo.
    setEscuro(proximo);
  };

  // O rótulo descreve a AÇÃO do clique ("Usar tema claro"), não o tema atual.
  const rotulo = escuro ? "Usar tema claro" : "Usar tema escuro";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={rotulo}
      title={rotulo}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-borda bg-superficie text-tinta-suave transition-colors hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 ${className}`}
    >
      {/* Sol e lua ficam empilhados (absolute): um gira e some enquanto o outro aparece. */}
      <Sun
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          escuro ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
        }`}
      />
      <Moon
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          escuro ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
    </button>
  );
}
