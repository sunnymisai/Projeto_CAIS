/* ============================================================================
   COMOFUNCIONA.TSX — SEÇÃO "COMO FUNCIONA"
   O que é: linha do tempo em 4 passos (Empresa, Projeto, Alocação, Tarefa) e
   o bloco "A trilha da sua empresa".
   Onde é usado: app/page.tsx (âncora #como-funciona).
   Depende de: lucide-react, ./CabecalhoSecao.
   Contexto: §5 (os quatro níveis de projeto) e §4 (trilha da empresa).
   ============================================================================ */
import { ListChecks } from "lucide-react";
import CabecalhoSecao from "./CabecalhoSecao";

// [PV-1] OS QUATRO NÍVEIS do §5 (Empresa, Projeto, Alocação, Tarefa) e a frase de cada um. Passo novo entra aqui; o desenho acompanha a quantidade.
// Os quatro níveis do §5, na ordem em que acontecem.
const PASSOS = [
  { nome: "Empresa", texto: "Quem traz a demanda para o programa." },
  { nome: "Projeto", texto: "Tem escopo, prazo e status, e pertence a uma empresa." },
  { nome: "Alocação", texto: "Define quem trabalha, em que papel, em que período e com que carga." },
  { nome: "Tarefa", texto: "O trabalho do dia a dia, com responsável e prazo." },
];

// [PV-2] A seção "Como funciona" (id como-funciona): título, descrição e os passos lado a lado no desktop e empilhados no celular.
/**
 * Seção "Como funciona". Server Component.
 * Os passos são uma lista ordenada (<ol>): no celular ficam um embaixo do
 * outro; a partir de md ficam lado a lado, com uma linha ligando os números.
 *
 * @returns a <section id="como-funciona">.
 */
export default function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="titulo-como-funciona" className="scroll-mt-20 bg-fundo py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <CabecalhoSecao
          rotulo="Como funciona"
          idTitulo="titulo-como-funciona"
          titulo="Do pedido da empresa à tarefa do dia"
          descricao="O trabalho que a sua empresa traz segue quatro níveis, sempre registrados."
        />

        {/* md:grid-cols-4: horizontal no desktop. A linha entre os números é desenhada
          * pelo ::before de cada passo (menos o último); no celular vira linha vertical. */}
        <ol className="mt-12 grid gap-8 md:grid-cols-4 md:gap-6">
          {PASSOS.map((p, i) => (
            <li
              key={p.nome}
              className={`relative pl-14 md:pl-0 md:pt-14 ${
                i < PASSOS.length - 1
                  ? "before:absolute before:left-5 before:top-10 before:h-[calc(100%+2rem-2.5rem)] before:w-px before:bg-borda md:before:left-10 md:before:top-5 md:before:h-px md:before:w-[calc(100%+1.5rem-2.5rem)]"
                  : ""
              }`}
            >
              {/* Número do passo. Posição: à esquerda no celular, acima no desktop. */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-botao font-space text-base font-semibold text-white"
              >
                {i + 1}
              </span>
              <h3 className="font-space text-lg font-semibold text-tinta">{p.nome}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-tinta-suave">{p.texto}</p>
            </li>
          ))}
        </ol>

        {/* Bloco da trilha da empresa (§4). */}
        <div className="mt-14 rounded-2xl border border-borda bg-superficie p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primaria-suave text-primaria">
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-space text-xl font-semibold text-tinta">A trilha da sua empresa</h3>
              <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-tinta-suave">
                Além da trilha geral do programa, a sua empresa tem uma trilha própria, só para as
                pessoas ligadas a ela: regras internas, ferramentas e processos do cliente. A
                coordenação define quem recebe, quando abre, o prazo e o que é obrigatório, e o
                progresso aparece no painel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
