/* ============================================================================
   TRESPILARES.TSX — DIAGRAMA "CONEXÃO DOS TRÊS PILARES"
   O que é: o desenho em SVG que liga Onboarding → Projetos → Dashboards,
   com as linhas sendo "desenhadas" ao abrir a página.
   Onde é usado: components/BrandPanel.tsx (login) e components/home/Hero.tsx
   (homepage). Existe um único SVG para os dois: mudou aqui, muda nos dois.
   Depende de: classes .trilha-linha e .pilar-no e das cores --color-pilar-*
   de app/globals.css (que já desligam a animação com prefers-reduced-motion).
   Contexto: §1 (os três pilares e suas cores) e §9 (marca).
   ============================================================================ */

// Os três pilares (§1): nome, cor do pilar, posição (x, y) no desenho e
// atraso da animação de entrada em milissegundos (um aparece depois do outro).
const PILARES = [
  { nome: "Onboarding", cor: "var(--color-pilar-roxo)", x: 90, y: 70, delay: 0 },
  { nome: "Projetos", cor: "var(--color-pilar-verde)", x: 300, y: 170, delay: 700 },
  { nome: "Dashboards", cor: "var(--color-pilar-ambar)", x: 120, y: 290, delay: 1400 },
];

/** Props do diagrama dos três pilares. */
export interface TresPilaresProps {
  /** Largura máxima do desenho em px (ele encolhe em telas menores). Padrão 420. */
  tamanho?: number;
  /** false = desenho já pronto, sem a animação de entrada. Padrão true. */
  animado?: boolean;
  /** Classes extras (margens, alinhamento). */
  className?: string;
}

/**
 * Diagrama dos três pilares conectados, sempre em cores claras: foi feito
 * para ficar sobre fundo escuro ("noite"), nos dois temas.
 *
 * A animação usa as classes de app/globals.css. Quem pediu "reduzir
 * movimento" no sistema operacional vê o desenho pronto, sem animação,
 * porque o CSS desliga as classes em @media (prefers-reduced-motion).
 *
 * @param tamanho largura máxima em px.
 * @param animado liga/desliga a animação de entrada.
 * @param className classes extras.
 * @returns um <svg> com role="img" e descrição para leitor de tela.
 * @example <TresPilares tamanho={360} animado={false} />
 */
export default function TresPilares({ tamanho = 420, animado = true, className = "" }: TresPilaresProps) {
  // Separa os três pilares para ligar as linhas: a→b, b→c e c→a.
  const [a, b, c] = PILARES;
  // Sem animação, as classes simplesmente não são aplicadas.
  const linha = animado ? "trilha-linha" : "";
  const no = animado ? "pilar-no" : "";

  return (
    <svg
      viewBox="0 0 420 340"
      // w-full + maxWidth: ocupa a largura disponível, até o tamanho pedido.
      className={`w-full ${className}`}
      style={{ maxWidth: tamanho }}
      role="img"
      aria-label="Jornada CAIS: Onboarding, Projetos e Dashboards conectados"
    >
      {/* Linhas entre os pilares; .trilha-linha "desenha" cada uma com atraso
       * escalonado. A 3ª linha (c→a) é tracejada e mais apagada: o ciclo recomeça. */}
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"
        className={linha} style={{ animationDelay: "350ms" }} />
      <line x1={b.x} y1={b.y} x2={c.x} y2={c.y} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"
        className={linha} style={{ animationDelay: "1050ms" }} />
      <line x1={c.x} y1={c.y} x2={a.x} y2={a.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"
        strokeDasharray="4 6" />

      {/* Cada pilar: halo transparente + círculo cheio + nome. .pilar-no anima a entrada. */}
      {PILARES.map((p) => (
        <g key={p.nome} className={no} style={{ animationDelay: `${p.delay}ms` }}>
          <circle cx={p.x} cy={p.y} r="26" fill={p.cor} opacity="0.16" />
          <circle cx={p.x} cy={p.y} r="15" fill={p.cor} />
          <text
            // "Projetos" fica à direita do desenho: o nome vai embaixo e centralizado.
            // Os outros dois ficam com o nome ao lado do círculo.
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
  );
}
