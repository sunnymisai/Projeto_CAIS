/* ============================================================================
   PERGUNTAS.TSX — SEÇÃO "PERGUNTAS FREQUENTES"
   O que é: lista de perguntas e respostas que abrem e fecham, feita com
   <details>/<summary> nativos (funciona até sem JavaScript).
   Onde é usado: app/page.tsx (âncora #perguntas).
   Depende de: lucide-react (seta), ./CabecalhoSecao.
   Contexto: §3 (perfis), §4 (trilhas), §7 (escopo: regras de dados são da PROGLOGIC)
   e §11 (cadastro da empresa).
   ============================================================================ */
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import CabecalhoSecao from "./CabecalhoSecao";

/** Props de uma pergunta. */
interface PerguntaProps {
  /** Texto da pergunta (vai no <summary>). */
  pergunta: string;
  /** Resposta (e, se precisar, comentários de validação). */
  children: ReactNode;
}

/**
 * Uma pergunta que abre e fecha. Usa <details>: o navegador cuida de abrir,
 * fechar e do teclado (Enter e Espaço no <summary>), sem JavaScript nosso.
 *
 * @param pergunta texto do <summary>.
 * @param children a resposta.
 * @returns o item <details>.
 */
function Pergunta({ pergunta, children }: PerguntaProps) {
  return (
    // group: deixa a seta girar quando o <details> está aberto (group-open:).
    <details className="group rounded-xl border border-borda bg-fundo">
      {/* list-none e o seletor do webkit escondem o triângulo padrão do navegador (usamos a nossa seta). */}
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 font-space text-base font-semibold text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60 [&::-webkit-details-marker]:hidden">
        {pergunta}
        <ChevronDown className="h-5 w-5 shrink-0 text-tinta-fraca transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-3 px-5 pb-5 text-[15px] leading-relaxed text-tinta-suave">{children}</div>
    </details>
  );
}

/**
 * Seção de perguntas frequentes. Server Component.
 * Fundo bg-superficie (alterna com a seção anterior, que usa bg-fundo).
 * As respostas que dependem de confirmação da PROGLOGIC têm um comentário
 * TODO(PROGLOGIC): o texto aqui é provisório e não promete nada além do contexto.
 *
 * @returns a <section id="perguntas">.
 */
export default function Perguntas() {
  return (
    <section id="perguntas" aria-labelledby="titulo-perguntas" className="scroll-mt-20 bg-superficie py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <CabecalhoSecao rotulo="Perguntas" idTitulo="titulo-perguntas" titulo="O que a sua empresa costuma perguntar" />

        <div className="mt-10 space-y-3">
          <Pergunta pergunta="Como a empresa participa?">
            <p>
              A empresa conta o seu interesse pelo formulário desta página. A coordenação do programa
              entra em contato para combinar os próximos passos e fazer o cadastro da empresa.
            </p>
            {/* TODO(PROGLOGIC): confirmar texto */}
          </Pergunta>

          <Pergunta pergunta="Quem são os profissionais?">
            <p>
              São as pessoas formadas e alocadas pelo programa PROGLOGIC · Residência Técnica. Elas
              cumprem as trilhas de formação e depois são alocadas nos projetos das empresas, com
              papel, período e carga definidos.
            </p>
            {/* TODO(PROGLOGIC): confirmar texto */}
          </Pergunta>

          <Pergunta pergunta="Como a empresa acompanha o projeto?">
            <p>
              Pelo perfil Empresa, que mostra só os projetos da própria empresa: o andamento, quem
              está alocado e em quê, as entregas aprovadas e pendentes, e o progresso da trilha do
              time. A empresa também pode comentar nas tarefas do projeto dela.
            </p>
            {/* TODO(PROGLOGIC): confirmar texto (as permissões da empresa ainda serão confirmadas) */}
          </Pergunta>

          <Pergunta pergunta="O que é a trilha da empresa?">
            <p>
              É uma trilha de onboarding só para as pessoas ligadas àquela empresa, com as regras
              internas, as ferramentas e os processos do cliente. A coordenação define quem recebe,
              quando abre, o prazo e o que é obrigatório.
            </p>
          </Pergunta>

          <Pergunta pergunta="Quanto custa?">
            <p>Fale com a coordenação do programa. Ela explica as condições para a sua empresa.</p>
            {/* TODO(PROGLOGIC): confirmar texto */}
          </Pergunta>

          <Pergunta pergunta="Como ficam a LGPD e os dados?">
            <p>
              A LGPD faz parte da trilha geral do programa, que vale para todas as empresas e
              profissionais. Sobre como os dados da sua empresa são tratados e guardados, a
              coordenação passa os detalhes antes do cadastro.
            </p>
            {/* TODO(PROGLOGIC): confirmar texto (política de dados e LGPD) */}
          </Pergunta>
        </div>
      </div>
    </section>
  );
}
