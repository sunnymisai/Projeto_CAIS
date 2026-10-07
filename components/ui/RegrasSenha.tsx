/* ============================================================================
   REGRASSENHA.TSX — LISTA DE REGRAS DA SENHA EM TEMPO REAL
   O que é: lista que mostra, enquanto a pessoa digita, quais regras da senha já foram cumpridas (ícone E texto, nunca só cor).
   Onde é usado: components/RecuperarSenhaForm.tsx, components/PrimeiroAcessoForm.tsx, app/(sistema)/perfil (aba Segurança) e a documentação viva app/(sistema)/design-system/page.tsx.
   Depende de: lib/senha.ts (regrasDaSenha) e lucide-react (ícones).
   Contexto: §9 (cor tem significado, sempre com ícone/texto), §13 (acessível) e §12 (fluxo 1: definir senha).
   ============================================================================ */

import { Check, Circle } from 'lucide-react';
import { regrasDaSenha } from '@/lib/senha';
import { cx } from '@/lib/utils';

/**
 * Lista de regras da senha, atualizada a cada tecla.
 * Cada regra mostra um ícone (check verde ou círculo vazio) e um texto de estado
 * escondido visualmente ("cumprida" / "pendente"), para a cor nunca ser a única pista.
 * O contêiner é uma região aria-live educada ("polite"): o leitor de tela anuncia
 * as mudanças sem interromper quem está digitando.
 * @param props.senha - a senha digitada até agora (vazia = tudo pendente).
 * @returns a lista de regras.
 * @example <RegrasSenha senha={novaSenha} />
 */
export default function RegrasSenha({ senha }: { senha: string }) {
  const regras = regrasDaSenha(senha);
  return (
    // aria-live="polite": anuncia as mudanças sem cortar a fala atual do leitor de tela.
    <ul aria-live="polite" aria-label="Regras da senha" className="space-y-1.5 rounded-xl border border-borda bg-superficie-alt/60 px-4 py-3">
      {regras.map((r) => (
        <li key={r.texto} className={cx('flex items-center gap-2 text-[13px]', r.cumprida ? 'text-sucesso' : 'text-tinta-suave')}>
          {r.cumprida
            ? <Check className="h-4 w-4 shrink-0" aria-hidden />
            : <Circle className="h-4 w-4 shrink-0" aria-hidden />}
          <span>{r.texto}</span>
          {/* sr-only: só o leitor de tela ouve o estado; a vista já tem o ícone. */}
          <span className="sr-only">{r.cumprida ? ' (cumprida)' : ' (pendente)'}</span>
        </li>
      ))}
    </ul>
  );
}
