import { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

/**
 * Checkbox do Design System CAIS ("Lembrar-me").
 * Usa um <input type="checkbox"> real (acessível por teclado e leitor de
 * tela) com a aparência desenhada por cima.
 */
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export default function Checkbox({ label, id, className = "", ...rest }: CheckboxProps) {
  return (
    <label htmlFor={id} className={`group inline-flex cursor-pointer select-none items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-5 w-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-borda bg-superficie transition-colors checked:border-primaria checked:bg-primaria group-hover:border-tinta-fraca checked:group-hover:border-primaria focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie"
          {...rest}
        />
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 scale-50 text-white opacity-0 transition-all peer-checked:scale-100 peer-checked:opacity-100"
        />
      </span>
      <span className="text-sm text-tinta-suave">{label}</span>
    </label>
  );
}
