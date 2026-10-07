"use client";

import React, { InputHTMLAttributes, forwardRef, useId, useState } from 'react';
import { CircleAlert, CircleCheck, Eye, EyeOff } from 'lucide-react';

/**
 * Campo de texto do Design System CAIS.
 *
 * Estados (vindos do Design System v1.0):
 *  - padrão  → borda neutra
 *  - foco    → borda + anel Roxo Maré
 *  - sucesso → borda Verde Atracado + ícone de check  (prop "valid")
 *  - erro    → borda vermelha + ícone + mensagem      (prop "error")
 *
 * Campos type="password" ganham automaticamente o botão mostrar/ocultar.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  /** Mensagem de erro. Quando presente, o campo fica no estado de erro. */
  error?: string;
  /** Mostra o estado de sucesso (ex.: e-mail com formato válido). */
  valid?: boolean;
  /** Texto de ajuda exibido abaixo do campo quando não há erro. */
  hint?: string;
  /** Altura menor (40 px) para formulários densos do sistema. */
  compacto?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, icon, error, valid, hint, id, compacto, required, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = `${inputId}-msg`;
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const isPassword = type === 'password';
    const tipoReal = isPassword && mostrarSenha ? 'text' : type;

    const estado = error
      ? 'border-erro focus:border-erro focus:ring-erro/25'
      : valid
        ? 'border-sucesso/70 focus:border-sucesso focus:ring-sucesso/25'
        : 'border-borda hover:border-tinta-fraca/60 focus:border-primaria focus:ring-primaria/25';

    // Espaço à direita para o ícone de status e/ou botão do olho
    const paddingDireita = isPassword ? 'pr-11' : (error || valid) ? 'pr-10' : 'pr-3.5';

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={`${compacto ? 'text-[13px]' : 'text-sm'} font-medium text-tinta`}>
            {label}
            {required && <span className="ml-0.5 text-erro" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span
              className={`pointer-events-none absolute left-3.5 transition-colors ${
                error ? 'text-erro' : 'text-tinta-fraca'
              }`}
            >
              {icon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            type={tipoReal}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? messageId : undefined}
            required={required}
            className={`${compacto ? 'h-10 rounded-lg text-sm' : 'h-12 rounded-xl text-[15px]'} w-full border bg-superficie px-3.5 text-tinta placeholder:text-tinta-fraca transition-[border-color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:bg-superficie-alt disabled:text-tinta-fraca focus:outline-none focus:ring-4 ${estado} ${
              icon ? 'pl-11' : ''
            } ${paddingDireita} ${className ?? ''}`}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={mostrarSenha}
              aria-controls={inputId}
              className="absolute right-1.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-tinta-fraca transition-colors hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50"
            >
              {mostrarSenha ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          ) : error ? (
            <CircleAlert aria-hidden="true" className="pointer-events-none absolute right-3.5 h-[18px] w-[18px] text-erro" />
          ) : valid ? (
            <CircleCheck aria-hidden="true" className="pointer-events-none absolute right-3.5 h-[18px] w-[18px] text-sucesso" />
          ) : null}
        </div>

        {error ? (
          <p id={messageId} className="text-[13px] font-medium text-erro">
            {error}
          </p>
        ) : hint ? (
          <p id={messageId} className="text-[13px] text-tinta-suave">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
