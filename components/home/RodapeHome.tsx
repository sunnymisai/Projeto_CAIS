/* ============================================================================
   RODAPEHOME.TSX — RODAPÉ DA HOMEPAGE
   O que é: faixa escura no fim da página com a logo, o nome do programa,
   os links das seções e o link "Entrar".
   Onde é usado: app/page.tsx.
   Depende de: next/link, components/CaisLogo.tsx, components/marca/SeloCais.tsx e ./secoes.
   Contexto: §15 item 0 (homepage) e §9 (marca: versão negativa do logo).
   ============================================================================ */
import Link from "next/link";
import CaisLogo from "@/components/CaisLogo";
import SeloCais from "@/components/marca/SeloCais";
import { SECOES_NAV } from "./secoes";

// [PV-1] O VISUAL dos links do rodapé da homepage (sobre fundo escuro, com foco visível).
// Classes dos links do rodapé (sobre fundo escuro, com foco visível).
const LINK_RODAPE =
  "rounded-lg px-2 py-1.5 text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

/**
 * Rodapé da homepage. Server Component (<footer> é o landmark "contentinfo").
 * Sempre escuro, nos dois temas, como o Hero; por isso usa a logo negativa.
 *
 * @returns o <footer> da página.
 */
export default function RodapeHome() {
  return (
    <footer className="bg-noite text-white dark:bg-noite-alt">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
        {/* Logo e nome do programa na MESMA linha (flex-wrap deixa o nome descer só em telas muito estreitas). */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <CaisLogo size={32} tone="claro" />
          {/* [PV-2] O NOME DO PROGRAMA no rodapé, ao lado da logo (PROGLOGIC · Residência Técnica). O traço vertical é só separador visual. */}
          <span aria-hidden="true" className="h-5 w-px bg-white/25" />
          <p className="text-sm text-white/70">PROGLOGIC · Residência Técnica</p>
        </div>

        <nav aria-label="Links do rodapé">
          <ul className="flex flex-wrap gap-x-2 gap-y-1 md:justify-end">
            {/* [PV-3] Os links do rodapé: os mesmos de secoes.ts mais o "Entrar" (/login), que fica por último. */}
            {SECOES_NAV.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={LINK_RODAPE}>
                  {s.rotulo}
                </a>
              </li>
            ))}
            <li>
              {/* NAVEGA: para a tela de login. */}
              <Link href="/login" className={`${LINK_RODAPE} font-semibold text-white`}>
                Entrar
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* [PV-4] A faixa final do rodapé: direitos (o ano vem do relógio do navegador) e o selo fixo do CAIS, que não depende do tema. */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} Projeto CAIS
          </p>
          <SeloCais fundo="escuro" />
        </div>
      </div>
    </footer>
  );
}
