/* ============================================================================
   PARASUAEMPRESA.TSX — SEÇÃO "PARA SUA EMPRESA"
   O que é: explica o que a empresa vê no CAIS e mostra uma prévia ILUSTRATIVA
   do painel da empresa, com dados fictícios.
   Onde é usado: app/page.tsx (âncora #empresa).
   Depende de: components/ui/basicos (Card, Etiqueta, Progresso),
   components/ui/Graficos (BarraEmpilhada, Legenda), ./CabecalhoSecao.
   Contexto: §6 (painel da empresa) e §3 (perfil Empresa: "entra, entende, sai").
   ============================================================================ */
import { Card, Etiqueta, Progresso } from "@/components/ui/basicos";
import { BarraEmpilhada, Legenda, type Segmento } from "@/components/ui/Graficos";
import CabecalhoSecao from "./CabecalhoSecao";

// [PV-1] A LISTA do que a empresa vê no painel dela (§6), lida pelo leitor de tela no lugar da prévia ilustrada.
// O que a empresa vê no painel dela (§6).
const O_QUE_A_EMPRESA_VE = [
  "O andamento dos projetos próprios.",
  "Quem está alocado e em quê.",
  "As entregas aprovadas e as pendentes.",
  "O progresso da trilha do time dela.",
];

// [PV-2] OS NÚMEROS DA PRÉVIA do painel: dados FICTÍCIOS só para ilustrar (a legenda da imagem avisa isso).
// SIMULADO: dados FICTÍCIOS só para ilustrar o painel. Não vêm de nenhuma empresa real.
const ENTREGAS: Segmento[] = [
  { rotulo: "Aprovadas", valor: 8, cor: "var(--sucesso)" },
  { rotulo: "Pendentes", valor: 3, cor: "var(--aviso)" },
];

// [PV-3] A seção "Para sua empresa" (id empresa): o texto à esquerda e a prévia decorativa do painel à direita.
/**
 * Seção "Para sua empresa". Server Component.
 * A prévia do painel é decorativa: fica com aria-hidden e o leitor de tela
 * recebe, no lugar, o parágrafo e a lista que descrevem o que a empresa vê.
 * A legenda "Imagem ilustrativa, com dados fictícios" fica FORA do aria-hidden,
 * para que todo mundo saiba que os números não são reais.
 *
 * @returns a <section id="empresa">.
 */
export default function ParaSuaEmpresa() {
  return (
    <section id="empresa" aria-labelledby="titulo-empresa" className="scroll-mt-20 bg-superficie py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <CabecalhoSecao
            rotulo="Para sua empresa"
            idTitulo="titulo-empresa"
            titulo="Entra, entende, sai"
            descricao="O perfil da empresa é enxuto: ela acompanha os próprios projetos, sem se perder em telas que não são dela."
          />
          <p className="mt-6 text-[15px] leading-relaxed text-tinta-suave">
            No painel da empresa, o que aparece é:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-tinta-suave marker:text-primaria">
            {O_QUE_A_EMPRESA_VE.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        <figure>
          {/* Prévia do painel. aria-hidden: é só ilustração; o texto ao lado já descreve tudo. */}
          <div aria-hidden="true" className="rounded-2xl border border-borda bg-fundo p-4 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-space text-base font-semibold text-tinta">Painel da empresa</p>
              <Etiqueta tom="primaria">Exemplo</Etiqueta>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <p className="text-[13px] font-medium text-tinta-suave">Projeto A</p>
                <p className="mt-1 font-space text-2xl font-semibold text-tinta">72%</p>
                <div className="mt-3">
                  <Progresso valor={72} tom="primaria" fino />
                </div>
                <div className="mt-3">
                  <Etiqueta tom="sucesso" ponto>No prazo</Etiqueta>
                </div>
              </Card>
              <Card className="p-4">
                <p className="text-[13px] font-medium text-tinta-suave">Projeto B</p>
                <p className="mt-1 font-space text-2xl font-semibold text-tinta">35%</p>
                <div className="mt-3">
                  <Progresso valor={35} tom="aviso" fino />
                </div>
                <div className="mt-3">
                  <Etiqueta tom="aviso" ponto>Atenção ao prazo</Etiqueta>
                </div>
              </Card>
            </div>

            <Card className="mt-4 p-4">
              <p className="text-[13px] font-medium text-tinta-suave">Entregas</p>
              <div className="mt-3">
                <BarraEmpilhada segmentos={ENTREGAS} altura={12} />
              </div>
              <div className="mt-3">
                <Legenda itens={ENTREGAS} />
              </div>
            </Card>

            <Card className="mt-4 p-4">
              <p className="text-[13px] font-medium text-tinta-suave">Trilha do time</p>
              <div className="mt-3">
                <Progresso valor={60} tom="sucesso" />
              </div>
            </Card>
          </div>
          <figcaption className="mt-3 text-center text-[13px] text-tinta-suave">
            Imagem ilustrativa, com dados fictícios.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
