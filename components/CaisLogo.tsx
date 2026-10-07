/* ============================================================================
   CAISLOGO.TSX — LOGO OFICIAL DO CAIS
   O que é: o símbolo (CaisMark) e o logo completo com o nome (CaisLogo),
   desenhados em SVG inline com os vetores do guia da marca.
   Onde é usado: components/BrandPanel.tsx, components/LoginForm.tsx (CaisMark),
   components/shell/Sidebar.tsx, app/page.tsx, app/(sistema)/layout.tsx,
   app/(sistema)/design-system, app/not-found.tsx e app/sem-permissao.
   Depende de: nada além do React; usa a variável CSS --marca de app/globals.css.
   Contexto: §9 (marca: o arco do "C" é o cais que abraça quem chega; a barra
   é quem atraca).
   ============================================================================ */
/**
 * Logo oficial CAIS — vetores extraídos do deck "PROJETO_CAIS" (slide 14).
 *
 * Este é o ÚNICO lugar do projeto onde o desenho do logo existe.
 * Todas as telas usam estes componentes, então trocar aqui troca em tudo
 * (a lista de quem usa está no cabeçalho acima).
 *
 * O SVG fica "inline" (e não como <img>) de propósito: assim o arco e as
 * letras usam a cor do texto atual e acompanham o dark mode sozinhos.
 */

// Caminhos SVG copiados do guia da marca: ARCO = o "C" e BARRA = o traço do meio (§9).
// ⚠️ ATENÇÃO: não edite estes números à mão; qualquer mudança deforma o logo em todas as telas.
const ARCO = "M 111.91 255.31 C 98.37 264.78 79.79 261.54 70.2 248 C 60.73 234.45 64.09 215.75 77.63 206.29 C 87.94 199.09 101.61 199.09 111.91 206.29 L 105.44 215.52 C 97.05 209.64 85.42 211.68 79.55 220.07 C 73.68 228.58 75.71 240.21 84.11 246.08 C 90.46 250.52 99.09 250.52 105.44 246.08 Z M 111.91 255.31";
const BARRA = "M 83.5 230.86 C 83.5 227.62 86.02 225.1 89.14 225.1 L 113.35 225.1 C 116.59 225.1 119.11 227.62 119.11 230.86 C 119.11 233.97 116.59 236.49 113.35 236.49 L 89.14 236.49 C 86.02 236.49 83.5 233.97 83.5 230.86 Z M 83.5 230.86";

/** "auto" segue o tema claro/escuro; "claro" força a versão negativa (para fundo escuro). */
type Tom = "auto" | "claro";

/**
 * Cores por tom (versões Positiva e Negativa do guia da marca).
 * @param tone "auto" ou "claro".
 * @returns { arco, barra } com as cores do arco/letras e da barra.
 */
function cores(tone: Tom) {
  return tone === "claro"
    ? { arco: "#FFFFFF", barra: "#B9A7FF" }          // Negativa: sobre fundo escuro
    : { arco: "currentColor", barra: "var(--marca)" }; // Positiva: segue o tema
}

/** Props do símbolo CAIS. */
interface CaisMarkProps {
  /** Altura do símbolo em px. */
  size?: number;
  /** "auto" (padrão) segue o tema; "claro" força a versão negativa. */
  tone?: Tom;
  /** Classes extras do <svg>. */
  className?: string;
}

/**
 * Só o símbolo (versão compacta), sem o nome.
 * @param size altura em px (padrão 40).
 * @param tone "auto" (padrão) ou "claro".
 * @param className classes extras.
 * @returns um <svg> decorativo (aria-hidden).
 * @example <CaisMark size={32} />
 */
export function CaisMark({ size = 40, tone = "auto", className = "" }: CaisMarkProps) {
  const c = cores(tone);
  return (
    <svg
      viewBox="60.73 199.09 58.38 65.69"
      height={size}
      // Largura calculada pela proporção original do desenho (58,38 x 65,69), para não deformar.
      width={(size * 58.38) / 65.69}
      // Decorativo: onde o símbolo aparece, o texto em volta já identifica o CAIS.
      aria-hidden="true"
      // No modo "auto", text-tinta define o currentColor, que pinta o arco com a cor do tema.
      className={`${tone === "auto" ? "text-tinta" : ""} ${className}`}
    >
      <path fill={c.arco} fillRule="evenodd" d={ARCO} />
      <path fill={c.barra} fillRule="evenodd" d={BARRA} />
    </svg>
  );
}

/** Props do logo completo. */
interface CaisLogoProps {
  /** Altura do logo inteiro em px. */
  size?: number;
  /** false = mostra só o símbolo (mesmo que usar <CaisMark />). */
  showWordmark?: boolean;
  /** "auto" segue o tema claro/escuro; "claro" força a versão negativa. */
  tone?: Tom;
  /** Classes extras do <svg>. */
  className?: string;
}

/**
 * Símbolo + nome CAIS (versão principal do logo).
 * @param size altura em px (padrão 32).
 * @param showWordmark false mostra só o símbolo (padrão true).
 * @param tone "auto" (padrão) ou "claro" (sobre fundo escuro, ex.: menu lateral).
 * @param className classes extras.
 * @returns um <svg role="img"> lido como "CAIS".
 * @example <CaisLogo size={30} tone="claro" />
 */
export default function CaisLogo({
  size = 32,
  showWordmark = true,
  tone = "auto",
  className = "",
}: CaisLogoProps) {
  // Sem o nome: reaproveita o CaisMark (um só desenho do símbolo no projeto).
  if (!showWordmark) return <CaisMark size={size} tone={tone} className={className} />;

  const c = cores(tone);
  return (
    <svg
      viewBox="60.73 199.09 162.63 65.69"
      height={size}
      width={(size * 162.63) / 65.69}
      // role="img" + aria-label: o leitor de tela lê "CAIS" em vez de ignorar o desenho.
      role="img"
      aria-label="CAIS"
      className={`${tone === "auto" ? "text-tinta" : ""} ${className}`}
    >
      <path fill={c.arco} fillRule="evenodd" d={ARCO} />
      <path fill={c.barra} fillRule="evenodd" d={BARRA} />
      {/* Letras C, A, I e S do nome, na mesma cor do arco. */}
      <g fill={c.arco}>
          <path transform="translate(137.93 244.16)" d="M 25.98 -20.72 L 22.62 -17.52 C 20.34 -19.92 17.78 -21.12 14.94 -21.12 C 12.53 -21.12 10.5 -20.3 8.86 -18.66 C 7.21 -17.02 6.39 -15 6.39 -12.59 C 6.39 -10.91 6.75 -9.43 7.48 -8.12 C 8.21 -6.83 9.24 -5.82 10.58 -5.08 C 11.91 -4.34 13.39 -3.97 15.02 -3.97 C 16.41 -3.97 17.68 -4.22 18.83 -4.73 C 19.98 -5.25 21.25 -6.2 22.62 -7.58 L 25.88 -4.19 C 24.02 -2.38 22.27 -1.12 20.61 -0.42 C 18.95 0.27 17.07 0.62 14.95 0.62 C 11.05 0.62 7.85 -0.61 5.36 -3.08 C 2.87 -5.55 1.62 -8.73 1.62 -12.61 C 1.62 -15.12 2.19 -17.35 3.33 -19.3 C 4.46 -21.24 6.08 -22.8 8.19 -23.98 C 10.3 -25.17 12.58 -25.77 15.02 -25.77 C 17.09 -25.77 19.08 -25.33 21 -24.45 C 22.93 -23.58 24.59 -22.33 25.98 -20.72 Z M 25.98 -20.72" />
          <path transform="translate(167.33 244.16)" d="M 10.53 -25.14 L 15.38 -25.14 L 25.05 0 L 20.08 0 L 18.11 -5.17 L 7.86 -5.17 L 5.81 0 L 0.84 0 Z M 12.98 -18.47 L 9.64 -9.84 L 16.33 -9.84 Z M 12.98 -18.47" />
          <path transform="translate(194.98 244.16)" d="M 2.53 -25.14 L 7.28 -25.14 L 7.28 0 L 2.53 0 Z M 2.53 -25.14" />
          <path transform="translate(206.88 244.16)" d="M 16.05 -21.72 L 12.52 -18.59 C 11.27 -20.32 10 -21.19 8.72 -21.19 C 8.09 -21.19 7.58 -21.02 7.17 -20.69 C 6.77 -20.35 6.58 -19.97 6.58 -19.55 C 6.58 -19.13 6.72 -18.73 7 -18.36 C 7.39 -17.86 8.57 -16.78 10.52 -15.12 C 12.34 -13.59 13.44 -12.63 13.83 -12.23 C 14.8 -11.25 15.48 -10.32 15.88 -9.42 C 16.28 -8.52 16.48 -7.55 16.48 -6.5 C 16.48 -4.44 15.77 -2.73 14.34 -1.39 C 12.93 -0.05 11.07 0.62 8.78 0.62 C 6.99 0.62 5.43 0.19 4.11 -0.69 C 2.79 -1.56 1.65 -2.94 0.7 -4.81 L 4.72 -7.25 C 5.93 -5.02 7.32 -3.91 8.89 -3.91 C 9.71 -3.91 10.4 -4.14 10.95 -4.62 C 11.52 -5.1 11.8 -5.66 11.8 -6.3 C 11.8 -6.86 11.58 -7.43 11.16 -8 C 10.74 -8.57 9.81 -9.44 8.38 -10.61 C 5.63 -12.85 3.86 -14.57 3.06 -15.78 C 2.27 -17 1.88 -18.21 1.88 -19.42 C 1.88 -21.16 2.54 -22.65 3.86 -23.89 C 5.19 -25.14 6.83 -25.77 8.78 -25.77 C 10.04 -25.77 11.23 -25.47 12.36 -24.89 C 13.49 -24.32 14.72 -23.26 16.05 -21.72 Z M 16.05 -21.72" />
      </g>
    </svg>
  );
}
