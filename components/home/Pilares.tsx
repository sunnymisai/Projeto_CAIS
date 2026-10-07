/* ============================================================================
   PILARES.TSX — SEÇÃO DOS TRÊS PILARES DO CAIS
   O que é: três cards (Onboarding, Gestão de projetos, Dashboards), cada um
   com o título e quatro itens do que a plataforma entrega naquele pilar.
   Onde é usado: app/page.tsx.
   Depende de: lucide-react, ./CabecalhoSecao e as cores --color-pilar-*
   de app/globals.css.
   Contexto: §1 (os três pilares), §4 (trilhas), §5 (projetos) e §6 (dashboards).
   ============================================================================ */
import { ChartColumn, FolderKanban, GraduationCap, type LucideIcon } from "lucide-react";
import CabecalhoSecao from "./CabecalhoSecao";

/** Dados de um pilar. `barra` e `icone` são classes de cor do próprio pilar (só acento). */
interface Pilar {
  titulo: string;
  barra: string;
  icone: string;
  Icone: LucideIcon;
  itens: string[];
}

// Conteúdo de cada pilar, tirado do §1, §4, §5 e §6.
// A cor do pilar (roxo, verde, âmbar) é só acento: barra lateral e ícone.
// O texto fica sempre em tokens de tinta, para manter o contraste AA nos dois temas.
const PILARES: Pilar[] = [
  {
    titulo: "Onboarding",
    barra: "border-pilar-roxo",
    icone: "bg-pilar-roxo/15 text-pilar-roxo",
    Icone: GraduationCap,
    itens: [
      "Trilhas com etapas, quiz e prazo, montadas pela coordenação.",
      "Trilha geral, trilha da empresa e trilha do profissional.",
      "Etapa obrigatória trava o acesso até ser concluída.",
      "Progresso e nota acompanhados por pessoa.",
    ],
  },
  {
    titulo: "Gestão de projetos",
    barra: "border-pilar-verde",
    icone: "bg-pilar-verde/15 text-pilar-verde",
    Icone: FolderKanban,
    itens: [
      "Cada projeto pertence a uma empresa.",
      "Profissionais alocados com papel, período e carga.",
      "Tarefas com responsável e prazo.",
      "Quadro, lista e cronograma para acompanhar.",
    ],
  },
  {
    titulo: "Dashboards",
    barra: "border-pilar-ambar",
    icone: "bg-pilar-ambar/15 text-pilar-ambar",
    Icone: ChartColumn,
    itens: [
      "Cada perfil vê o andamento pelo seu ângulo.",
      "Administrador: trilhas, projetos, pessoas e turma.",
      "Empresa: andamento e entregas dos próprios projetos.",
      "Profissional: trilhas, tarefas, prazos e carga da semana.",
    ],
  },
];

/**
 * Seção dos três pilares. Server Component.
 * Fundo bg-superficie (alterna com a seção anterior, que usa bg-fundo).
 *
 * @returns a <section> com os três cards.
 */
export default function Pilares() {
  return (
    <section aria-labelledby="titulo-pilares" className="scroll-mt-20 bg-superficie py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <CabecalhoSecao
          rotulo="Os três pilares"
          idTitulo="titulo-pilares"
          titulo="Três pilares, ligados por uma pessoa"
          descricao="A pessoa entra por uma trilha, é alocada num projeto e o resultado aparece no painel."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PILARES.map(({ titulo, barra, icone, Icone, itens }) => (
            // border-l-4 + cor do pilar: a barra lateral é o acento. O resto da borda é neutro.
            <article key={titulo} className={`rounded-2xl border border-l-4 border-borda bg-fundo p-6 ${barra}`}>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${icone}`}>
                <Icone className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-space text-xl font-semibold text-tinta">{titulo}</h3>
              <ul className="mt-4 space-y-2.5">
                {itens.map((t) => (
                  <li key={t} className="text-[15px] leading-relaxed text-tinta-suave">
                    {t}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
