/* ============================================================================
   HERO.TSX — ABERTURA DA HOMEPAGE
   O que é: a primeira dobra da página: o que é o CAIS em uma frase, os dois
   botões de ação e o diagrama dos três pilares.
   Onde é usado: app/page.tsx.
   Depende de: next/link, ./LinkRolar, components/marca/TresPilares.tsx, components/marca/OndasDeFundo.tsx e das cores
   --color-noite* e --color-pilar-* de app/globals.css.
   Contexto: §1 (produto e tagline) e §15 item 0 (homepage).
   ============================================================================ */
import Link from "next/link";
import LinkRolar from "./LinkRolar";
import TresPilares from "@/components/marca/TresPilares";
import OndasDeFundo from "@/components/marca/OndasDeFundo";

/**
 * Hero da homepage. Server Component: texto, links e um SVG (o botão que rola é o LinkRolar, Client).
 * Os blocos entram em sequência (animate-card-in com atraso crescente).
 * O fundo é sempre escuro ("noite"), nos dois temas, como no painel do login.
 * Contém o único <h1> da página.
 *
 * @returns a <section> de abertura.
 */
export default function Hero() {
  return (
    // pt-28: reserva espaço para o topo fixo (h-16) e ainda deixa respiro.
    <section className="relative overflow-hidden bg-noite pb-16 pt-28 text-white dark:bg-noite-alt sm:pb-24 sm:pt-32">
      {/* Ondas animadas na "superfície", atrás de tudo. */}
      <OndasDeFundo />
      {/* Brilho roxo desfocado ao fundo, só decoração. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-pilar-roxo/25 blur-[120px]"
      />

      {/* Duas colunas a partir de lg; abaixo disso o diagrama fica embaixo do texto. */}
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
        <div>
          <p className="animate-card-in text-sm font-semibold uppercase tracking-widest text-white/70">Uma plataforma para</p>
          {/* [PV-1] A CHAMADA PRINCIPAL da homepage (o único h1) e o texto de apoio logo abaixo. Mude aqui para trocar a mensagem de abertura. */}
          <h1 className="animate-card-in mt-3 font-space text-4xl font-semibold leading-[1.1] tracking-tight [animation-delay:120ms] sm:text-5xl xl:text-6xl">
            formar, alocar e acompanhar.
          </h1>
          <p className="animate-card-in mt-5 max-w-xl text-base leading-relaxed text-white/70 [animation-delay:240ms] sm:text-lg">
            Onboarding por trilhas para empresas e profissionais, gestão dos projetos que essas
            empresas trazem e dashboards que mostram como tudo está andando.
          </p>

          <div className="animate-card-in mt-8 flex flex-col gap-3 [animation-delay:360ms] sm:flex-row">
            {/* [PV-2] OS DOIS BOTÕES da abertura: "Quero trazer minha empresa" rola até #participar (FormularioInteresse) e "Já tenho acesso" vai para /login. */}
            {/* NAVEGA: rola até o formulário de interesse (#participar), TODA vez que clicar (LinkRolar; o Link do Next não rola de novo na mesma âncora). */}
            <LinkRolar
              alvo="participar"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-botao px-5 text-[15px] font-semibold text-white transition-colors hover:bg-botao-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-noite"
            >
              Quero trazer minha empresa
            </LinkRolar>
            {/* NAVEGA: para a tela de login. */}
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-noite"
            >
              Já tenho acesso
            </Link>
          </div>
        </div>

        {/* Diagrama dos três pilares: à direita no desktop, abaixo do texto no celular. */}
        <TresPilares className="mx-auto lg:ml-auto" />
      </div>
    </section>
  );
}
