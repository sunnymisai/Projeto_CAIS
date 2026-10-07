/* ============================================================================
   PROBLEMA.TSX — SEÇÃO "O PROGRAMA": COMO É HOJE × COMO FICA COM O CAIS
   O que é: duas colunas que comparam o cenário atual de formação e acompanhamento
   com o que muda usando o CAIS, fechando com a ideia do rastro único.
   Onde é usado: app/page.tsx (âncora #programa, linkada pelo topo e pelo rodapé).
   Depende de: lucide-react, ./CabecalhoSecao.
   Contexto: §2 (o problema e como o CAIS resolve).
   ============================================================================ */
import { Check, Minus } from "lucide-react";
import CabecalhoSecao from "./CabecalhoSecao";

// Como é hoje (§2). Texto direto, sem números inventados.
const HOJE = [
  "Material de onboarding espalhado em PDF, vídeo e e-mail.",
  "Ninguém sabe quem leu, entendeu ou ficou para trás.",
  "A alocação das pessoas é decidida por conversa.",
  "O andamento dos projetos é acompanhado por planilha.",
  "Nenhum lugar mostra formação e entrega lado a lado.",
];

// Como fica com o CAIS (§2).
const COM_CAIS = [
  "Uma trilha única por público, com prazo e nota.",
  "Progresso visível por pessoa, por empresa e por turma.",
  "Alocação registrada com papel e período.",
  "Tarefa com responsável, prazo e histórico.",
  "Um painel liga o que a pessoa aprendeu ao que ela entregou.",
];

/**
 * Seção "O programa". Server Component.
 * Fundo bg-fundo (a seção seguinte usa bg-superficie, para alternar).
 * No celular as duas colunas empilham; a partir de md ficam lado a lado.
 *
 * @returns a <section id="programa">.
 */
export default function Problema() {
  return (
    // scroll-mt-20: ao rolar até a âncora, deixa espaço para o topo fixo (h-16).
    <section id="programa" aria-labelledby="titulo-programa" className="scroll-mt-20 bg-fundo py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <CabecalhoSecao
          rotulo="O programa"
          idTitulo="titulo-programa"
          titulo="Formação e trabalho no mesmo lugar"
          descricao="Hoje, cada etapa do caminho de uma pessoa fica num canto diferente. O CAIS junta tudo."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Coluna "Como é hoje": ícone NEUTRO (não vermelho), porque descreve o cenário atual, não um erro. */}
          <div className="rounded-2xl border border-borda bg-superficie p-6 sm:p-8">
            <h3 className="font-space text-xl font-semibold text-tinta">Como é hoje</h3>
            <ul className="mt-5 space-y-3">
              {HOJE.map((t) => (
                <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-tinta-suave">
                  <Minus className="mt-1 h-4 w-4 shrink-0 text-tinta-fraca" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna "Como fica com o CAIS": destaque com a cor de ação (roxo) e ícone de check. */}
          <div className="rounded-2xl border border-primaria/40 bg-primaria-suave p-6 sm:p-8">
            <h3 className="font-space text-xl font-semibold text-tinta">Como fica com o CAIS</h3>
            <ul className="mt-5 space-y-3">
              {COM_CAIS.map((t) => (
                <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-tinta">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primaria" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Frase de fechamento (§2): o rastro único. */}
        <p className="mt-10 max-w-3xl font-space text-xl font-medium leading-snug text-tinta sm:text-2xl">
          Formação, alocação e entrega deixam o mesmo rastro, no mesmo lugar.
        </p>
      </div>
    </section>
  );
}
