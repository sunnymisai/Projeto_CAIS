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
  variante?: "primario" | "secundario" | "fantasma" | "perigo";
  tamanho?: "sm" | "md" | "lg";
  larguraTotal?: boolean;
  isLoading?: boolean;
  /** Texto mostrado ao lado do spinner e lido pelo leitor de tela. */
  loadingText?: string;
  children: ReactNode;
}

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

const TAMANHOS = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-5 text-[15px]",
};

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
    type = "button",
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cx(
        "group relative inline-flex shrink-0 items-center justify-center font-archivo font-semibold whitespace-nowrap",
        "transition-[background-color,color,transform,filter] duration-150 active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie",
        VARIANTES[variante],
        TAMANHOS[tamanho],
        larguraTotal && "w-full",
        className
      )}
      {...rest}
    >
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
