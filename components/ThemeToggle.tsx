/* ============================================================================
   THEMETOGGLE.TSX — BOTÃO DE TEMA CLARO/ESCURO
   O que é: botão redondo (sol/lua) que alterna o tema e lembra a escolha.
   Onde é usado: components/AcessoLayout.tsx (login, recuperar senha e primeiro acesso), components/home/TopoHome.tsx e components/shell/Topbar.tsx.
   Depende de: lib/tema.ts (useTema: a lógica do tema mora lá), lucide-react (ícones) e do script de tema em app/layout.tsx.
   Contexto: §9 (design system) e §13 (qualidade: tema claro e escuro).
   ============================================================================ */
"use client";

import { Moon, Sun } from "lucide-react";
import { useTema } from "@/lib/tema";

/**
 * Alterna entre tema claro e escuro.
 * Toda a lógica (ler, aplicar e gravar "cais-tema") fica em lib/tema.ts; este botão
 * só chama `definir`. Como o hook sincroniza todos os usuários, trocar o tema em
 * /perfil (Preferências) também muda o ícone daqui, e vice-versa.
 * @param className classes extras do botão.
 * @returns o botão com os ícones de sol e lua.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { escuro, definir } = useTema();

  // Clique: escolhe o tema oposto ao que está valendo. Quem estava em "seguir o sistema"
  // passa a ter uma escolha explícita (claro ou escuro).
  // GRAVA: lib/tema.ts guarda a escolha em localStorage["cais-tema"].
  const alternar = () => definir(escuro ? "claro" : "escuro");

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
