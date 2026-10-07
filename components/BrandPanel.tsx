/* ============================================================================
   BRANDPANEL.TSX — PAINEL DE MARCA DA TELA DE LOGIN
   O que é: o painel escuro do lado esquerdo do login (só em telas grandes),
   com o logo, a frase da marca e o desenho dos três pilares conectados.
   Onde é usado: app/login/page.tsx (tela de login).
   Depende de: ./CaisLogo, ./marca/TresPilares (o desenho dos pilares) e das
   cores --color-noite e --color-pilar-* de app/globals.css.
   Contexto: §1 (os três pilares e suas cores) e §9 (marca).
   ============================================================================ */
import CaisLogo from "./CaisLogo";
import TresPilares from "./marca/TresPilares";

/**
 * Painel de marca (lado esquerdo em telas grandes).
 * Mostra a "Conexão dos Três Pilares" do Design System: a jornada que liga
 * Onboarding → Projetos → Dashboards. O desenho em si mora em
 * components/marca/TresPilares.tsx (um só SVG, usado aqui e na homepage).
 * O painel é sempre escuro, nos dois temas: ele é a "vitrine" da marca.
 * @returns o <aside> do painel (escondido abaixo de lg).
 */
export default function BrandPanel() {
  // "hidden ... lg:flex": o painel só aparece em telas grandes; no celular o
  // login mostra só o formulário (com o logo no topo).
  return (
    <aside className="relative hidden overflow-hidden border-r border-white/[0.06] bg-noite text-white dark:bg-noite-alt lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Textura: arco da marca em escala gigante, quase invisível */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 220"
        className="pointer-events-none absolute -bottom-40 -right-56 w-[720px] opacity-[0.035]"
      >
        <path d="M20 210a180 180 0 0 1 360 0" stroke="white" strokeWidth="36" fill="none" strokeLinecap="round" />
      </svg>
      {/* Brilho roxo desfocado (blur) ao fundo, só decoração. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-pilar-roxo/25 blur-[120px]"
      />

      {/* Versão negativa (tone="claro") porque o painel é sempre escuro. */}
      <CaisLogo size={40} tone="claro" />

      <div className="relative max-w-md">
        <h2 className="font-space text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
          Novo caminho, sua trilha para o futuro.
        </h2>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-white/60">
          Uma jornada contínua e uma só medida: do primeiro dia de onboarding
          aos projetos e aos resultados nos dashboards.
        </p>

        {/* Constelação dos três pilares (mesmo desenho da homepage). */}
        <TresPilares className="mt-10" />
      </div>

      <p className="relative text-sm text-white/40">
        © {new Date().getFullYear()} Projeto CAIS
      </p>
    </aside>
  );
}
