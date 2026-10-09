/* ============================================================================
   CHECKBOX.TSX — CAIXA DE SELEÇÃO DO DESIGN SYSTEM CAIS
   O que é: checkbox com rótulo, feito sobre um <input type="checkbox"> real
   com a aparência desenhada por cima.
   Onde é usado: components/LoginForm.tsx ("Lembrar-me") e telas de
   app/(sistema) (design-system e trilhas/[id]).
   Depende de: react (tipos) e lucide-react (ícone de check).
   Contexto: §9 (design system) e §13 (acessível por teclado e leitor de tela).
   ============================================================================ */
import { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

/**
 * Checkbox do Design System CAIS ("Lembrar-me").
 * Usa um <input type="checkbox"> real (acessível por teclado e leitor de
 * tela) com a aparência desenhada por cima.
 */
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Texto ao lado da caixa; clicar nele também marca/desmarca. */
  label: string;
}

// [PV-1] A CAIXA DE MARCAR: usa um input de verdade (teclado e leitor de tela) com o desenho por cima. Clicar no texto também marca. Cores e tamanho estão nas classes do input.
/**
 * Checkbox do Design System CAIS. Repassa as props de <input> (checked, onChange, disabled...).
 * @param label texto ao lado da caixa.
 * @param id liga o <label> ao <input> (necessário para o clique no texto funcionar).
 * @param className classes extras do <label>.
 * @returns o <label> com a caixa e o texto.
 * @example <Checkbox id="lembrar" label="Lembrar-me" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
 */
export default function Checkbox({ label, id, className = "", ...rest }: CheckboxProps) {
  return (
    <label htmlFor={id} className={`group inline-flex cursor-pointer select-none items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-5 w-5 shrink-0">
        {/* appearance-none esconde a caixa nativa (o desenho é nosso); "peer" deixa o
         * ícone de check reagir ao estado checked deste input. */}
        <input
          id={id}
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-borda bg-superficie transition-colors checked:border-primaria checked:bg-primaria group-hover:border-tinta-fraca checked:group-hover:border-primaria focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie"
          {...rest}
        />
        {/* peer-checked: o check só aparece (e cresce de 50% para 100%) quando o input está marcado. */}
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
