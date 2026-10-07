"use client";

import { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/utils';

/* Select, Área de texto, Controle segmentado e Interruptor.
   Seguem as mesmas regras de estado do Campo (components/input.tsx). */

const base = 'w-full border bg-superficie text-sm text-tinta transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-superficie-alt disabled:text-tinta-fraca';
const estado = (erro?: string) => erro
  ? 'border-erro focus:border-erro focus:ring-erro/25'
  : 'border-borda hover:border-tinta-fraca/60 focus:border-primaria focus:ring-primaria/25';

function Rotulo({ htmlFor, children, required }: { htmlFor: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-tinta">
      {children}{required && <span className="ml-0.5 text-erro" aria-hidden>*</span>}
    </label>
  );
}

function Mensagem({ id, erro, dica }: { id: string; erro?: string; dica?: string }) {
  if (erro) return <p id={id} className="text-[12px] font-medium text-erro">{erro}</p>;
  if (dica) return <p id={id} className="text-[12px] text-tinta-suave">{dica}</p>;
  return null;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  opcoes: { valor: string; rotulo: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, opcoes, placeholder, id, className, required, ...rest }, ref) {
  const auto = useId();
  const sid = id ?? auto;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && <Rotulo htmlFor={sid} required={required}>{label}</Rotulo>}
      <div className="relative">
        <select ref={ref} id={sid} required={required} aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${sid}-msg` : undefined}
          className={cx(base, estado(error), 'h-10 appearance-none rounded-lg pl-3.5 pr-9', className)} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-fraca" aria-hidden />
      </div>
      <Mensagem id={`${sid}-msg`} erro={error} dica={hint} />
    </div>
  );
});

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const AreaTexto = forwardRef<HTMLTextAreaElement, AreaProps>(function AreaTexto(
  { label, error, hint, id, className, required, rows = 3, ...rest }, ref) {
  const auto = useId();
  const tid = id ?? auto;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && <Rotulo htmlFor={tid} required={required}>{label}</Rotulo>}
      <textarea ref={ref} id={tid} rows={rows} required={required} aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${tid}-msg` : undefined}
        className={cx(base, estado(error), 'resize-y rounded-lg px-3.5 py-2.5 placeholder:text-tinta-fraca', className)} {...rest} />
      <Mensagem id={`${tid}-msg`} erro={error} dica={hint} />
    </div>
  );
});

/** Controle segmentado: escolha única entre poucas opções (ex.: perfil de acesso). */
export function Segmentado<T extends string>({ opcoes, valor, onChange, rotulo }: {
  opcoes: { valor: T; rotulo: string }[]; valor: T; onChange: (v: T) => void; rotulo: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex flex-wrap rounded-xl border border-borda bg-superficie-alt p-1">
      {opcoes.map((o) => {
        const sel = o.valor === valor;
        return (
          <button key={o.valor} type="button" role="radio" aria-checked={sel} onClick={() => onChange(o.valor)}
            className={cx('rounded-lg px-4 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50',
              sel ? 'bg-superficie text-tinta shadow-sm' : 'text-tinta-suave hover:text-tinta')}>
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}

/** Interruptor liga/desliga, acessível como switch. */
export function Interruptor({ ligado, onChange, rotulo, descricao }: { ligado: boolean; onChange: (v: boolean) => void; rotulo: string; descricao?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p id={id} className="text-sm font-medium text-tinta">{rotulo}</p>
        {descricao && <p className="text-[12px] text-tinta-suave">{descricao}</p>}
      </div>
      <button type="button" role="switch" aria-checked={ligado} aria-labelledby={id} onClick={() => onChange(!ligado)}
        className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie',
          ligado ? 'bg-primaria' : 'bg-borda')}>
        <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', ligado ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

/** Título de seção dentro de formulários (como no deck: "DADOS DA EMPRESA"). */
export function SecaoForm({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cx('space-y-4', className)}>
      <legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-tinta-suave">{titulo}</legend>
      {children}
    </fieldset>
  );
}
