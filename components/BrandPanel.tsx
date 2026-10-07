import CaisLogo from "./CaisLogo";

/**
 * Painel de marca (lado esquerdo em telas grandes).
 * Mostra a "Conexão dos Três Pilares" do Design System: a jornada que
 * liga Onboarding → Projetos → Dashboards. As linhas são desenhadas
 * uma vez ao abrir a página (veja .trilha-linha em globals.css).
 *
 * O painel é sempre escuro, nos dois temas — ele é a "vitrine" da marca.
 */
const PILARES = [
  { nome: "Onboarding", cor: "var(--color-pilar-roxo)", x: 90, y: 70, delay: 0 },
  { nome: "Projetos", cor: "var(--color-pilar-verde)", x: 300, y: 170, delay: 700 },
  { nome: "Dashboards", cor: "var(--color-pilar-ambar)", x: 120, y: 290, delay: 1400 },
];

export default function BrandPanel() {
  const [a, b, c] = PILARES;

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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-pilar-roxo/25 blur-[120px]"
      />

      <CaisLogo size={40} tone="claro" />

      <div className="relative max-w-md">
        <h2 className="font-space text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
          Novo caminho, sua trilha para o futuro.
        </h2>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-white/60">
          Uma jornada contínua e uma só medida: do primeiro dia de onboarding
          aos projetos e aos resultados nos dashboards.
        </p>

        {/* Constelação dos três pilares */}
        <svg
          viewBox="0 0 420 340"
          className="mt-10 w-full max-w-[420px]"
          role="img"
          aria-label="Jornada CAIS: Onboarding, Projetos e Dashboards conectados"
        >
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"
            className="trilha-linha" style={{ animationDelay: "350ms" }} />
          <line x1={b.x} y1={b.y} x2={c.x} y2={c.y} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"
            className="trilha-linha" style={{ animationDelay: "1050ms" }} />
          <line x1={c.x} y1={c.y} x2={a.x} y2={a.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"
            strokeDasharray="4 6" />

          {PILARES.map((p) => (
            <g key={p.nome} className="pilar-no" style={{ animationDelay: `${p.delay}ms` }}>
              <circle cx={p.x} cy={p.y} r="26" fill={p.cor} opacity="0.16" />
              <circle cx={p.x} cy={p.y} r="15" fill={p.cor} />
              <text
                x={p.x + (p.nome === "Projetos" ? 0 : 38)}
                y={p.y + (p.nome === "Projetos" ? 48 : 5)}
                textAnchor={p.nome === "Projetos" ? "middle" : "start"}
                fill="rgba(255,255,255,0.85)"
                fontSize="15"
                fontFamily="var(--font-archivo)"
                fontWeight="500"
              >
                {p.nome}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="relative text-sm text-white/40">
        © {new Date().getFullYear()} Projeto CAIS
      </p>
    </aside>
  );
}
