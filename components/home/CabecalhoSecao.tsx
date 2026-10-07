/* ============================================================================
   CABECALHOSECAO.TSX — CABEÇALHO PADRÃO DAS SEÇÕES DA HOMEPAGE
   O que é: o trio "rótulo pequeno + título (h2) + parágrafo" que abre cada seção.
   Onde é usado: components/home/Problema, Pilares, ComoFunciona,
   ParaSuaEmpresa, Perfis, Perguntas e FormularioInteresse.
   Depende de: nada além do React (usa as classes de tokens de app/globals.css).
   Contexto: §15 item 0 (homepage).
   ============================================================================ */

/** Props do cabeçalho de seção. */
interface CabecalhoSecaoProps {
  /** Rótulo pequeno acima do título (ex.: "O programa"). */
  rotulo: string;
  /** Título da seção, renderizado como <h2>. */
  titulo: string;
  /** Parágrafo de apoio abaixo do título (opcional). */
  descricao?: string;
  /** id do <h2>, usado em aria-labelledby da <section>. */
  idTitulo: string;
}

/**
 * Cabeçalho de uma seção da homepage. Server Component.
 * Mantém o mesmo visual e a hierarquia (h2) em todas as seções.
 *
 * @param rotulo texto pequeno em cima do título.
 * @param titulo o <h2> da seção.
 * @param descricao parágrafo de apoio (opcional).
 * @param idTitulo id do <h2>, para a seção apontar com aria-labelledby.
 * @returns o bloco de cabeçalho.
 * @example <CabecalhoSecao rotulo="O programa" titulo="..." idTitulo="titulo-programa" />
 */
export default function CabecalhoSecao({ rotulo, titulo, descricao, idTitulo }: CabecalhoSecaoProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-primaria">{rotulo}</p>
      <h2 id={idTitulo} className="mt-2 font-space text-3xl font-semibold leading-tight tracking-tight text-tinta sm:text-4xl">
        {titulo}
      </h2>
      {descricao && <p className="mt-4 text-base leading-relaxed text-tinta-suave sm:text-lg">{descricao}</p>}
    </div>
  );
}
