/* ============================================================================
   SECOES.TS — LISTA DE ÂNCORAS DA HOMEPAGE
   O que é: a lista (id + rótulo) das seções que o topo e o rodapé linkam.
   Onde é usado: components/home/TopoHome.tsx e components/home/RodapeHome.tsx.
   Depende de: nada.
   Contexto: §15 item 0 (homepage como ponto de entrada público).
   ============================================================================ */

/** Uma âncora da homepage: `id` é o id da <section>; `rotulo` é o texto do link. */
export interface SecaoAncora {
  id: string;
  rotulo: string;
}

/**
 * Âncoras exibidas no topo e no rodapé, na ordem em que as seções aparecem.
 * ⚠️ ATENÇÃO: cada `id` precisa existir como id de uma seção em components/home/
 * (programa → Problema, como-funciona → ComoFunciona, empresa → ParaSuaEmpresa,
 * perguntas → Perguntas). Se mudar aqui, mude lá, senão o link não leva a lugar nenhum.
 */
export const SECOES_NAV: SecaoAncora[] = [
  { id: "programa", rotulo: "O programa" },
  { id: "como-funciona", rotulo: "Como funciona" },
  { id: "empresa", rotulo: "Para sua empresa" },
  { id: "perguntas", rotulo: "Perguntas" },
];
