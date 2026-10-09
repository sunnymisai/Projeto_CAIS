/* ============================================================================
   BUTTON.TSX — BOTÃO DO DESIGN SYSTEM CAIS
   O que é: botão com 4 variantes, 3 tamanhos e os estados repouso, hover,
   pressionado, foco, carregando e desabilitado; e classesBotao(), as mesmas
   classes para um <Link> que navega mas deve parecer botão.
   Onde é usado: components/LoginForm.tsx, telas de app/(sistema) (empresas,
   pessoas, projetos, projetos/[id], trilhas, trilhas/[id], design-system) e
   components/projetos (DetalheTarefa, Equipe, FormProjeto, Quadro); classesBotao
   em app/(sistema)/minhas-trilhas e minhas-trilhas/[id].
   Depende de: react (forwardRef) e lib/utils (cx).
   Contexto: §9 (design system: botão e seus estados) e §13 (foco visível;
   ação dá retorno em menos de 1 s, por isso o estado "carregando").
   ============================================================================ */
"use client";

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { cx } from "@/lib/utils";

/**
 * Botão do Design System CAIS.
 *
 * Variantes:
 *  - primario   → ação principal da tela (uma por tela)
 *  - secundario → ações de apoio (Cancelar, Filtrar)
 *  - fantasma   → ações discretas em listas e cabeçalhos
 *  - perigo     → excluir, remover, encerrar
 *
 * Estados: repouso, hover, pressionado, foco, carregando e desabilitado.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Estilo do botão (padrão "primario"). */
  variante?: "primario" | "secundario" | "fantasma" | "perigo";
  /** Altura: sm 32 px, md 40 px (padrão), lg 48 px. */
  tamanho?: "sm" | "md" | "lg";
  /** Ocupa toda a largura do pai (ex.: botão "Entrar" do login). */
  larguraTotal?: boolean;
  /** Mostra o spinner, troca o texto por `loadingText` e desabilita o botão. */
  isLoading?: boolean;
  /** Texto mostrado ao lado do spinner e lido pelo leitor de tela. */
  loadingText?: string;
  children: ReactNode;
}

// [PV-1] AS CORES DO BOTÃO por variante (primário, secundário, fantasma, perigo). Variante nova entra aqui e no tipo de variante da ButtonProps.
// Classes de cada variante. A sombra do primário imita um leve relevo
// (brilho interno em cima + sombra roxa embaixo).
const VARIANTES = {
  primario:
    "bg-botao text-white hover:bg-botao-hover shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_6px_16px_-8px_rgba(112,82,242,0.8)]",
  secundario:
    "border border-borda bg-superficie text-tinta hover:bg-superficie-alt",
  fantasma:
    "text-tinta-suave hover:bg-superficie-alt hover:text-tinta",
  perigo:
    "bg-erro text-white hover:brightness-110 dark:text-[#14161F]",
};

// [PV-2] AS ALTURAS DO BOTÃO: sm 32 px, md 40 px e lg 48 px, com o espaçamento e a fonte de cada uma.
// Altura, espaçamento e fonte de cada tamanho.
const TAMANHOS = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-5 text-[15px]",
};

// [PV-3] As classes do botão, também usadas em links que parecem botão. Mudar aqui muda o Button e esses links juntos.
/**
 * Classes do botão, para usar também num <Link> que deve PARECER botão.
 * Regra de semântica: se a ação navega para outra página, é <Link> (com estas classes);
 * se faz algo na tela atual, é <Button>.
 * ⚠️ ATENÇÃO: o <Button> abaixo usa esta mesma função; mudar aqui muda os dois.
 * @param op.variante cor (padrão primario).
 * @param op.tamanho altura (padrão md).
 * @param op.larguraTotal ocupa toda a largura do pai.
 * @param op.className classes extras.
 * @returns a string de classes Tailwind.
 * @example <Link href="/minhas-trilhas" className={classesBotao({ tamanho: 'lg' })}>Continuar</Link>
 */
export function classesBotao({ variante = "primario", tamanho = "md", larguraTotal = false, className }: {
  variante?: keyof typeof VARIANTES; tamanho?: keyof typeof TAMANHOS; larguraTotal?: boolean; className?: string;
} = {}) {
  return cx(
    "group relative inline-flex shrink-0 items-center justify-center font-archivo font-semibold whitespace-nowrap",
    // active:scale-[0.98]: o botão "afunda" levemente ao ser pressionado.
    "transition-[background-color,color,transform,filter] duration-150 active:scale-[0.98]",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
    // Anel de foco só na navegação por teclado (focus-visible), com respiro da cor do fundo (ring-offset).
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie",
    VARIANTES[variante],
    TAMANHOS[tamanho],
    larguraTotal && "w-full",
    className
  );
}

// [PV-4] O BOTÃO: com isLoading mostra o spinner, troca o texto por loadingText (padrão "Salvando…") e desabilita. Para mudar o texto padrão, é aqui.
/**
 * Botão do Design System CAIS. Repassa qualquer prop de <button> (onClick, aria-*...).
 * Usa forwardRef para que outros componentes consigam focar o botão.
 * @param props ver ButtonProps.
 * @returns o <button> estilizado.
 * @example
 * <Button variante="perigo" isLoading={salvando} loadingText="Excluindo…" onClick={excluir}>Excluir</Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variante = "primario",
    tamanho = "md",
    larguraTotal = false,
    isLoading = false,
    loadingText = "Salvando…",
    children,
    disabled,
    className,
    // Padrão "button" (e não "submit"): um botão qualquer dentro de <form> não envia o formulário sem querer.
    type = "button",
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      // Carregando também desabilita: evita clique duplo (ex.: salvar duas vezes).
      disabled={disabled || isLoading}
      // aria-busy avisa o leitor de tela que algo está em andamento.
      aria-busy={isLoading || undefined}
      className={classesBotao({ variante, tamanho, larguraTotal, className })}
      {...rest}
    >
      {/* Carregando: spinner (borda girando) + texto no lugar do conteúdo. */}
      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
