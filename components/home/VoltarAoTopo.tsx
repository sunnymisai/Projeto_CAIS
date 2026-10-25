/* ============================================================================
   VOLTARAOTOPO.TSX — BOTÃO "VOLTAR AO TOPO"
   O que é: botão redondo fixo no canto inferior direito que aparece depois de descer a página,
   com um anel que mostra quanto da página já foi lida, e leva de volta ao início.
   Onde é usado: app/page.tsx.
   Depende de: react, lucide-react.
   Contexto: §15 item 0 (homepage como ponto de entrada público).
   ============================================================================ */
"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

// [PV-1] A PARTIR DE QUANTOS PIXELS DE ROLAGEM o botão "Voltar ao topo" aparece (400). Diminua para aparecer mais cedo.
/** Rolagem mínima, em pixels, para o botão aparecer. */
const APARECE_APOS = 400;
/** Circunferência do anel de progresso (o círculo do SVG tem raio 22). */
const CIRCUNFERENCIA = 2 * Math.PI * 22;

/**
 * Botão flutuante "Voltar ao topo". Client Component.
 * Escondido (e fora da ordem do Tab) até a pessoa descer; o anel preenche conforme a rolagem.
 *
 * @returns o botão fixo no canto inferior direito.
 */
export default function VoltarAoTopo() {
  // Quanto da página já rolou (0 a 1) e se o botão está à mostra.
  const [progresso, setProgresso] = useState(0);
  const [visivel, setVisivel] = useState(false);

  // Roda uma vez, ao montar: acompanha a rolagem (um cálculo por quadro, via requestAnimationFrame)
  // e a limpeza remove o ouvinte e cancela o quadro pendente.
  useEffect(() => {
    let quadro = 0;
    /** Lê a rolagem e atualiza o anel de progresso e a visibilidade do botão. */
    const atualizar = () => {
      quadro = 0;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgresso(total > 0 ? Math.min(1, window.scrollY / total) : 0);
      setVisivel(window.scrollY > APARECE_APOS);
    };
    /** Agenda UM cálculo por quadro, por maior que seja o número de eventos de rolagem. */
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    };
    atualizar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, []);

  /** Leva ao início da página (sem animar para quem pediu menos movimento). */
  const subir = () => {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduzido ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={subir}
      aria-label="Voltar ao topo"
      tabIndex={visivel ? 0 : -1}
      aria-hidden={!visivel}
      className={`fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-botao text-sobre-cor shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-botao-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 focus-visible:ring-offset-fundo sm:bottom-6 sm:right-6 ${
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      {/* Anel de progresso: o traço cresce com a rolagem (começa no topo, por isso -rotate-90). */}
      <svg aria-hidden="true" viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - progresso)}
        />
      </svg>
      <ArrowUp className="relative h-5 w-5" aria-hidden="true" />
    </button>
  );
}
