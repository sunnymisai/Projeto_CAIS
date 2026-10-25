/* ============================================================================
   BOTAOENTRAR.TSX — BOTÃO "ENTRAR" ANIMADO DA TELA DE LOGIN
   O que é: o botão de envio do login. Em repouso mostra "Entrar →"; quando o login começa, o texto
   some, a seta vira um barquinho que navega até o "C" do logo e atraca, e o símbolo desliza ao centro.
   Onde é usado: components/LoginForm.tsx (botão de envio do formulário).
   Depende de: react, lucide-react (ArrowRight) e lib/utils (cx). As cores vêm dos tokens bg-botao e
   bg-botao-hover de app/globals.css.
   Contexto: §9 (botão e seus estados) e §13 (ação dá retorno em menos de 1 s; movimento respeita
   prefers-reduced-motion). Animação vinda do protótipo botao-login-cais.html, refeita com tokens.
   ============================================================================ */
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cx } from "@/lib/utils";

// [PV-1] A LINHA DO TEMPO da animação, em milissegundos: quando o texto some, o barco nasce, navega, atraca e o símbolo vai ao centro. TOTAL é a duração toda (o login só segue depois dela). Mude aqui para deixar mais rápida ou mais lenta.
/** Trechos da animação [início, fim] em ms. */
const T = {
  dobra: [0, 320], // texto some e a seta se fecha
  nasce: [150, 450], // o barquinho nasce onde estava a seta
  entraC: [300, 800], // o "C" aparece à direita
  navega: [450, 1450], // o barco navega até o C
  atraca: [1450, 1650], // o casco vira a barra do logo
  batida: [1450, 1700], // leve batida do barco no cais
  centro: [1800, 2800], // C + barco deslizam ao centro e giram 180°
} as const;
/** Duração total da animação em ms. */
const TOTAL = 2900;

// [PV-2] O TAMANHO do símbolo dentro do botão (ESCALA) e as medidas do casco do barquinho e da barra do logo. O botão tem 56 px de altura (h-14); se mudar a altura, ajuste ESCALA na mesma proporção.
/** Escala do símbolo (C + barra) dentro do botão de 56 px de altura. */
const ESCALA = 0.55;
/** Centro do símbolo original do logo (coordenadas do desenho do "C"). */
const ORIGEM = { x: 89.925, y: 231.935 };
/** Onde fica o centro da barra do logo em relação ao centro do símbolo, já em px. */
const CAIS_REL = { x: (101.3 - ORIGEM.x) * ESCALA, y: (230.8 - ORIGEM.y) * ESCALA };
/** Barra do logo (destino do casco): largura, altura e canto. */
const BARRA = { w: 35.6 * ESCALA, bw: 35.6 * ESCALA, h: 11.4 * ESCALA, dip: 0, rr: 5.7 * ESCALA };
/** Casco do barquinho: largura (topo e fundo), altura, curvatura do fundo e canto. */
const CASCO = { w: 21, bw: 14, h: 6.5, dip: 3, rr: 1.6 };

/** O "C" do símbolo CAIS, nas coordenadas do desenho original (o mesmo de components/CaisLogo.tsx). */
const CAMINHO_C =
  "M 111.914062 255.308594 C 98.367188 264.777344 79.789062 261.542969 70.199219 247.996094 C 60.730469 234.453125 64.085938 215.753906 77.632812 206.285156 C 87.941406 199.09375 101.605469 199.09375 111.914062 206.285156 L 105.441406 215.515625 C 97.050781 209.640625 85.421875 211.679688 79.550781 220.070312 C 73.675781 228.578125 75.714844 240.207031 84.105469 246.078125 C 90.457031 250.515625 99.085938 250.515625 105.441406 246.078125 Z M 111.914062 255.308594";

/** Mantém `v` entre 0 e 1. */
const limitar = (v: number) => Math.min(1, Math.max(0, v));
/** Quanto do trecho [a, b] já passou no instante t (0 a 1). */
const trecho = (t: number, [a, b]: readonly [number, number]) => limitar((t - a) / (b - a));
/** Interpolação linear entre a e b. */
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Começa rápido e termina devagar. */
const saiSuave = (t: number) => 1 - Math.pow(1 - t, 3);
/** Começa e termina devagar. */
const suaveNasPontas = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Passa um pouco do alvo e volta (o barquinho "nasce" com leve salto). */
const comSalto = (t: number) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
/** Gira o vetor v em `graus`. */
const girar = (v: { x: number; y: number }, graus: number) => {
  const a = (graus * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
};

/** Medidas do casco num instante: centro, larguras, altura, curvatura do fundo e canto. */
type Casco = { cx: number; cy: number; w: number; bw: number; h: number; dip: number; rr: number };

/**
 * Contorno do casco: retângulo de cantos arredondados com o fundo curvo (que no fim vira a barra do logo).
 * @param c medidas do casco naquele instante.
 * @returns o atributo `d` do <path>.
 */
function caminhoCasco({ cx, cy, w, bw, h, dip, rr }: Casco): string {
  const t = cy - h / 2;
  const b = cy + h / 2;
  const l = cx - w / 2;
  const r = cx + w / 2;
  const l2 = cx - bw / 2;
  const r2 = cx + bw / 2;
  return (
    `M${l + rr} ${t} L${r - rr} ${t} Q${r} ${t} ${r} ${t + rr} ` +
    `L${r2} ${b - rr} Q${r2} ${b} ${r2 - rr} ${b} ` +
    `Q${cx} ${b + 2 * dip} ${l2 + rr} ${b} Q${l2} ${b} ${l2} ${b - rr} ` +
    `L${l} ${t + rr} Q${l} ${t} ${l + rr} ${t} Z`
  );
}

/**
 * Vela triangular do barco.
 * @param cx centro do barco.
 * @param topo altura do topo do casco.
 * @param k tamanho da vela (0 = sumiu, 1 = inteira).
 * @returns o atributo `d` do <path>.
 */
const caminhoVela = (cx: number, topo: number, k: number) =>
  `M${cx - 1} ${topo + 0.5} L${cx - 1} ${topo - 9 * k} L${cx + 6.5 * k} ${topo + 0.5} Z`;

/** Propriedades do botão. */
export interface BotaoEntrarProps {
  /** true enquanto o login está em andamento: dispara a animação; voltar a false a reinicia (login recusado). */
  executando: boolean;
  /** Chamado uma vez quando a animação chega ao fim (o formulário só navega se o login também foi aceito). */
  aoTerminar: () => void;
  /** Texto do botão em repouso, ex.: "Entrar". */
  children: ReactNode;
  /** Texto lido pelo leitor de tela enquanto executa, ex.: "Entrando…". */
  textoExecutando: string;
}

/**
 * Botão de envio do login com a animação do barquinho.
 * É um <button type="submit"> comum: o clique envia o formulário, que valida e chama a autenticação.
 * A animação é guiada de fora pela prop `executando` (não pelo clique), para só rodar quando o login
 * de fato começou (campos válidos) e voltar ao início se for recusado.
 * Com prefers-reduced-motion o desenho vai direto ao quadro final e `aoTerminar` é chamado na hora.
 *
 * @param props ver BotaoEntrarProps.
 * @returns o botão.
 * @example <BotaoEntrar executando={loading} aoTerminar={() => ...} textoExecutando="Entrando…">Entrar</BotaoEntrar>
 */
export default function BotaoEntrar({ executando, aoTerminar, children, textoExecutando }: BotaoEntrarProps) {
  // Elementos que a animação mexe direto (a cada quadro), sem passar pelo React.
  const botao = useRef<HTMLButtonElement>(null);
  const palco = useRef<SVGSVGElement>(null);
  const texto = useRef<HTMLSpanElement>(null);
  const seta = useRef<SVGSVGElement>(null);
  const gC = useRef<SVGGElement>(null);
  const gBarco = useRef<SVGGElement>(null);
  const casco = useRef<SVGPathElement>(null);
  const vela = useRef<SVGPathElement>(null);
  // Sempre a versão mais nova de aoTerminar, para o efeito da animação não reiniciar quando o pai re-renderiza.
  const aoTerminarRef = useRef(aoTerminar);
  useEffect(() => {
    aoTerminarRef.current = aoTerminar;
  });

  // Roda quando `executando` muda. Ligou: mede o botão e toca a animação. Desligou: volta ao quadro inicial.
  // Limpa: cancela o requestAnimationFrame pendente (troca de página ou novo ciclo).
  useEffect(() => {
    const el = botao.current;
    const svg = palco.current;
    if (!el || !svg || !texto.current || !seta.current || !gC.current || !gBarco.current || !casco.current || !vela.current) return;
    const eTexto = texto.current;
    const eSeta = seta.current;
    const eC = gC.current;
    const eBarco = gBarco.current;
    const eCasco = casco.current;
    const eVela = vela.current;

    // Medidas do botão neste momento (a largura muda com a tela, por isso medimos a cada ciclo).
    const W = el.offsetWidth;
    const H = el.offsetHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    // Onde o "C" espera (à direita) e onde fica no fim (centro).
    const C0 = { x: W - 42, y: H / 2 };
    const C1 = { x: W / 2 - 1, y: H / 2 };
    // Onde a seta está (início do barquinho), em coordenadas do botão; medido ao ligar.
    let P0 = { x: W * 0.62, y: H / 2 };

    /** Desenha um quadro da animação no instante t (ms). */
    const desenhar = (t: number) => {
      // 1. O texto some e a seta gira e encolhe, "fechando" como um barquinho.
      const kTexto = saiSuave(trecho(t, [0, 220]));
      eTexto.style.opacity = String(1 - kTexto);
      eTexto.style.transform = `translateY(${-8 * kTexto}px)`;
      const kSeta = saiSuave(trecho(t, T.dobra));
      eSeta.style.opacity = String(1 - kSeta);
      eSeta.style.transform = `rotate(${90 * kSeta}deg) scale(${1 - 0.6 * kSeta})`;

      // 2. O barquinho nasce no lugar da seta.
      const k = Math.max(comSalto(trecho(t, T.nasce)), 0);
      eBarco.setAttribute("opacity", limitar(k * 4).toFixed(3));

      // 3. O "C" aparece à direita.
      eC.setAttribute("opacity", saiSuave(trecho(t, T.entraC)).toFixed(3));

      // 4. Posição e giro do símbolo: espera à direita, bate de leve quando o barco atraca e depois vai ao centro girando 180° → 0°.
      const batida = 1.6 * Math.sin(Math.PI * trecho(t, T.batida));
      const s = suaveNasPontas(trecho(t, T.centro));
      const giro = 180 * (1 - s);
      const L = { x: lerp(C0.x + batida, C1.x, s), y: lerp(C0.y, C1.y, s) };
      eC.setAttribute("transform", `translate(${L.x} ${L.y}) rotate(${giro}) scale(${ESCALA}) translate(${-ORIGEM.x} ${-ORIGEM.y})`);

      // 5. Onde está a barra do logo agora (acompanha o giro do símbolo).
      const d = girar(CAIS_REL, giro);
      const cais = { x: L.x + d.x, y: L.y + d.y };

      // 6. O barco navega em linha reta até o cais, balançando nas ondas.
      const viagem = suaveNasPontas(trecho(t, T.navega));
      const kAtraca = suaveNasPontas(trecho(t, T.atraca));
      const onda = Math.sin(Math.PI * viagem) * (1 - kAtraca);
      const bx = lerp(P0.x, cais.x, viagem);
      const by = lerp(P0.y, cais.y, viagem) + 1.1 * Math.sin(t / 110) * onda;
      const inclina = 5 * Math.sin(t / 150) * onda;

      // 7. Ao atracar, o casco vira a barra do logo e a vela recolhe.
      const kk = Math.max(k, 0.001);
      const c: Casco = {
        cx: bx,
        cy: by,
        w: lerp(CASCO.w * kk, BARRA.w, kAtraca),
        bw: lerp(CASCO.bw * kk, BARRA.bw, kAtraca),
        h: lerp(CASCO.h * kk, BARRA.h, kAtraca),
        dip: lerp(CASCO.dip * kk, BARRA.dip, kAtraca),
        rr: lerp(CASCO.rr * kk, BARRA.rr, kAtraca),
      };
      // A vela baixa ao se aproximar do porto, para caber na abertura do "C".
      const baixa = lerp(1, 0.4, suaveNasPontas(trecho(t, [1000, 1400])));
      const kVela = saiSuave(trecho(t, [250, 450])) * baixa * (1 - kAtraca);
      eBarco.setAttribute("transform", `rotate(${inclina} ${bx} ${by})`);
      eCasco.setAttribute("d", caminhoCasco(c));
      eVela.setAttribute("d", caminhoVela(bx, by - c.h / 2, kVela));
    };

    // Desligado: volta ao quadro inicial (texto e seta visíveis, símbolo escondido) e não anima.
    if (!executando) {
      desenhar(0);
      return;
    }

    // Ligado e com "reduzir movimento": vai direto ao quadro final e avisa que acabou.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      desenhar(TOTAL);
      aoTerminarRef.current();
      return;
    }

    // Ligado: mede a seta (ponto de partida do barco) e toca quadro a quadro.
    const br = el.getBoundingClientRect();
    const ar = eSeta.getBoundingClientRect();
    P0 = { x: ar.left + ar.width / 2 - br.left, y: ar.top + ar.height / 2 - br.top };
    let inicio: number | null = null;
    let quadro = 0;
    /**
     * Um quadro do laço: calcula o tempo desde o início, desenha e agenda o próximo.
     * No fim (TOTAL) desenha o último quadro e avisa o pai por aoTerminar.
     * @param agora relógio do navegador (ms) entregue pelo requestAnimationFrame.
     */
    const passo = (agora: number) => {
      if (inicio === null) inicio = agora;
      const t = agora - inicio;
      if (t >= TOTAL) {
        desenhar(TOTAL);
        aoTerminarRef.current();
        return;
      }
      desenhar(t);
      quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    // Limpa: cancela o quadro pendente (login recusado no meio, ou a página trocou).
    return () => cancelAnimationFrame(quadro);
  }, [executando]);

  return (
    <button
      ref={botao}
      type="submit"
      // Durante o login o botão fica sem resposta a novo clique, mas sem "disabled" (não escurece nem some o foco).
      aria-busy={executando}
      // [PV-3] A APARÊNCIA do botão: cor de fundo (bg-botao e bg-botao-hover, tokens), altura h-14 (56 px; ligada à ESCALA do símbolo), canto rounded-xl e anel de foco. active:scale dá o "afundar" ao clicar.
      className={cx(
        "relative inline-flex h-14 w-full select-none items-center justify-center overflow-hidden rounded-xl bg-botao text-base font-semibold text-sobre-cor",
        "shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_6px_16px_-8px_color-mix(in_srgb,var(--botao)_80%,transparent)] transition-[background-color,transform] duration-200",
        "hover:bg-botao-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie",
        executando && "cursor-default",
      )}
    >
      {/* Conteúdo em repouso: texto + seta. pointer-events-none para o clique ir sempre ao botão. */}
      <span className="pointer-events-none flex items-center justify-center gap-2.5">
        <span ref={texto} aria-hidden={executando}>{children}</span>
        <ArrowRight ref={seta} aria-hidden="true" className="h-[18px] w-[18px] shrink-0 [transform-box:fill-box] [transform-origin:center]" />
      </span>

      {/* Palco da animação: o viewBox é ajustado em px a cada ciclo (ver o efeito). Cores por token: o "C" e a vela em branco, o casco em branco translúcido. */}
      <svg ref={palco} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 280 56">
        <g ref={gC} opacity="0">
          <path className="fill-white" fillRule="evenodd" d={CAMINHO_C} />
        </g>
        <g ref={gBarco} opacity="0">
          <path ref={vela} className="fill-white" />
          <path ref={casco} className="fill-sobre-cor/75" />
        </g>
      </svg>

      {/* Leitor de tela: avisa que o login está em andamento (a animação em si é só visual). */}
      <span role="status" className="sr-only">{executando ? textoExecutando : ""}</span>
    </button>
  );
}
