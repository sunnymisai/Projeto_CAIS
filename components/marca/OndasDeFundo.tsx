/* ============================================================================
   ONDASDEFUNDO.TSX — ONDAS ANIMADAS DO FUNDO ESCURO
   O que é: três camadas de ondas, na cor de destaque do tema, que correm devagar no topo de uma área escura
   e esmaecem até sumir, como a "superfície da água" de onde o CAIS (o cais) se vê.
   Onde é usado: components/home/Hero.tsx (abertura da homepage) e components/BrandPanel.tsx (login).
   Depende de: as cores --color-onda (deriva da primária do tema) e --color-noite de app/globals.css e da animação
   `.onda-camada` (keyframes `ondas-correm`) do mesmo arquivo.
   Contexto: §9 (marca); ideia vinda do projeto de um colega (ProjetoCais), refeita só com tokens.
   ============================================================================ */

/** Largura de uma onda inteira, em unidades do SVG. A animação desloca exatamente isto (ver globals.css). */
const LARGURA_ONDA = 1600;
/** Altura de uma onda, em unidades do SVG. */
const ALTURA_ONDA = 198;
/** Contorno de uma onda: começa e termina na mesma altura (y=121), por isso duas ondas lado a lado emendam sem costura. */
const CONTORNO = 'M0 121C311 121 410-.25 811 0c400 0 500 121 789 121v77H0z';

// [PV-1] AS TRÊS CAMADAS: quanto da cor do tema (mistura com a noite), a opacidade, o deslocamento vertical e a duração da volta (menor = mais rápido). Mude aqui para deixar as ondas mais fortes, mais claras ou mais calmas.
/** As três camadas, da mais ao fundo para a mais à frente. `mistura` é a % da cor das ondas (--onda, do tema) misturada com a cor da noite. */
const CAMADAS = [
  { mistura: 38, opacidade: 0.9, topo: 40, duracao: 40 },
  { mistura: 62, opacidade: 0.75, topo: 20, duracao: 28 },
  { mistura: 100, opacidade: 0.55, topo: 0, duracao: 20 },
] as const;

/**
 * Faixa decorativa de ondas. Fica colada no topo do pai (que deve ser `relative overflow-hidden`)
 * e atrás do conteúdo. É só enfeite: escondida dos leitores de tela e sem receber clique.
 * Com `prefers-reduced-motion` as ondas ficam paradas (regra em globals.css).
 *
 * @param props.className classes extras de posição/tamanho (ex.: `top-16` para começar abaixo de um topo fixo).
 * @returns a faixa de ondas com o esmaecimento embaixo.
 * @example <OndasDeFundo className="top-16" />
 */
export default function OndasDeFundo({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      // [PV-2] A ALTURA e o ESMAECIMENTO da faixa: h-[260px] é a altura; a máscara deixa o roxo cheio até 22% e some até 74% (antes de a última camada acabar, para não aparecer linha dura). Mude para as ondas descerem mais ou menos.
      className={`pointer-events-none absolute inset-x-0 top-0 h-[260px] overflow-hidden ${className}`}
      style={{
        maskImage: 'linear-gradient(to bottom, #000 0%, #000 22%, transparent 74%)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 22%, transparent 74%)',
      }}
    >
      {CAMADAS.map((c, i) => (
        // Faixa com 3 ondas de largura (cobre telas largas): a animação a desloca 1 onda e recomeça.
        <svg
          key={i}
          className="onda-camada absolute left-0"
          style={{ top: c.topo, animationDuration: `${c.duracao}s`, animationDelay: `${-i * 7}s` }}
          width={LARGURA_ONDA * 4}
          height={ALTURA_ONDA}
          viewBox={`0 0 ${LARGURA_ONDA * 4} ${ALTURA_ONDA}`}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Degradê vertical: transparente no topo da onda, cor cheia embaixo. A cor é um token misturado com a noite (sem hex solto). */}
            <linearGradient id={`onda-${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" style={{ stopColor: `color-mix(in srgb, var(--color-onda) ${c.mistura}%, var(--color-noite))`, stopOpacity: 0.25 }} />
              <stop offset="1" style={{ stopColor: `color-mix(in srgb, var(--color-onda) ${c.mistura}%, var(--color-noite))`, stopOpacity: c.opacidade }} />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((n) => (
            <path key={n} d={CONTORNO} transform={`translate(${n * LARGURA_ONDA} 0)`} fill={`url(#onda-${i})`} />
          ))}
        </svg>
      ))}
    </div>
  );
}
