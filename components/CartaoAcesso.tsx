/* ============================================================================
   CARTAOACESSO.TSX — CARTÃO DAS TELAS DE ACESSO
   O que é: o cartão arredondado (selo da marca, título e subtítulo) e o link "Voltar para o login" usados pelos passos de recuperar senha e do primeiro acesso.
   Onde é usado: components/RecuperarSenhaForm.tsx e components/PrimeiroAcessoForm.tsx.
   Depende de: next/link, lucide-react e components/CaisLogo (CaisMark).
   Contexto: §15 item 1 (Login, Esqueci a senha e Primeiro acesso) e §9 (design system: mesmo visual do cartão de login).
   ============================================================================ */

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CaisMark } from './CaisLogo';

// [PV-1] O VISUAL dos links de texto das telas de acesso (cor, sublinhado, foco). O login tem uma cópia própria (linkClass em LoginForm.tsx): mude as duas.
// Classes do link de texto (mesmo visual dos links do login).
export const LINK_CLASS =
  'rounded-sm font-semibold text-primaria underline-offset-4 transition-colors hover:text-primaria-forte hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50';

// [PV-2] O CARTÃO das telas de acesso (recuperar senha e primeiro acesso): selo da marca (só no desktop), título e subtítulo. A largura máxima é 440 px.
/**
 * Casca visual do cartão (a mesma do login): selo da marca, título e subtítulo.
 * @param props.titulo - título (h1).
 * @param props.subtitulo - frase de apoio.
 * @param props.children - o conteúdo do passo.
 * @returns o cartão.
 */
export function Cartao({ titulo, subtitulo, children }: { titulo: string; subtitulo: ReactNode; children: ReactNode }) {
  return (
    <div className="animate-card-in w-full max-w-[440px] rounded-[28px] border border-borda bg-superficie p-7 shadow-card sm:p-10">
      <div className="flex flex-col items-center text-center">
        {/* No celular o logo já aparece no topo da página, então o selo fica só no desktop. */}
        <div className="mb-6 hidden h-16 w-16 items-center justify-center rounded-2xl bg-primaria-suave lg:flex">
          <CaisMark size={32} />
        </div>
        <h1 className="font-space text-[28px] font-semibold leading-tight tracking-tight text-tinta">{titulo}</h1>
        <p className="mt-2 text-[15px] text-tinta-suave">{subtitulo}</p>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

// [PV-3] O link "Voltar para o login" do rodapé dos cartões. Texto e destino (/login) valem para todos os passos.
/**
 * Link "Voltar para o login", repetido no rodapé de todos os passos.
 * @returns o rodapé do cartão com o link.
 */
export function VoltarAoLogin() {
  return (
    <p className="mt-6 border-t border-borda pt-5 text-center text-sm text-tinta-suave">
      {/* NAVEGA: volta para a tela de login. */}
      <Link href="/login" className={`${LINK_CLASS} inline-flex items-center gap-1.5`}>
        <ArrowLeft className="h-4 w-4" aria-hidden />Voltar para o login
      </Link>
    </p>
  );
}
