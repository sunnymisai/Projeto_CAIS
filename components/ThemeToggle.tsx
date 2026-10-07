"use client";

import { useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Alterna entre tema claro e escuro.
 * Salva a escolha em localStorage ("cais-tema") — o script em
 * app/layout.tsx lê esse valor na próxima visita.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  // "null" enquanto não sabemos o tema (evita divergência na hidratação)
  // Tema lido do <html> no navegador; null no servidor (evita divergência na hidratação)
  const temaInicial = useSyncExternalStore(
    () => () => {},
    () => document.documentElement.classList.contains("dark"),
    () => null
  );
  const [escolhido, setEscuro] = useState<boolean | null>(null);
  const escuro = escolhido ?? temaInicial;

  const alternar = () => {
    const proximo = !escuro;
    document.documentElement.classList.toggle("dark", proximo);
    try {
      localStorage.setItem("cais-tema", proximo ? "escuro" : "claro");
    } catch {
      /* navegação privada: apenas não salva */
    }
    setEscuro(proximo);
  };

  const rotulo = escuro ? "Usar tema claro" : "Usar tema escuro";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={rotulo}
      title={rotulo}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-borda bg-superficie text-tinta-suave transition-colors hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 ${className}`}
    >
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
