/* ============================================================================
   PERFIS.TSX — SEÇÃO "QUEM USA O CAIS"
   O que é: três cards com os perfis do sistema (Administrador, Empresa e
   Profissional), destacando o da Empresa.
   Onde é usado: app/page.tsx.
   Depende de: lucide-react, components/ui/basicos (Etiqueta), ./CabecalhoSecao.
   Contexto: §3 (perfis) e §7 (escopo: o back-end e as permissões são da PROGLOGIC).
   ============================================================================ */
import { Briefcase, Building2, Smartphone, type LucideIcon } from "lucide-react";
import { Etiqueta } from "@/components/ui/basicos";
import CabecalhoSecao from "./CabecalhoSecao";

/** Dados de um perfil. */
interface Perfil {
  nome: string;
  resumo: string;
  itens: string[];
  Icone: LucideIcon;
  /** true = card em destaque (o da Empresa, o público desta página). */
  destaque?: boolean;
  /** Etiqueta pequena no card (opcional). */
  etiqueta?: string;
}

// Perfis do §3. O da Empresa vem em destaque porque é para quem esta página fala.
const PERFIS: Perfil[] = [
  {
    nome: "Administrador",
    resumo: "Quem opera o programa.",
    Icone: Briefcase,
    itens: [
      "Cria e publica trilhas e define o público.",
      "Cadastra empresas e profissionais.",
      "Cria projetos e aloca pessoas.",
      "Acompanha tudo pelos painéis.",
    ],
  },
  {
    nome: "Empresa",
    resumo: "A parceira que traz o projeto: entra, entende, sai.",
    Icone: Building2,
    destaque: true,
    etiqueta: "Para a sua empresa",
    itens: [
      "Cumpre a trilha da empresa.",
      "Vê apenas os projetos próprios.",
      "Acompanha o andamento e interage com o time alocado.",
      "Tem um painel do próprio portfólio.",
    ],
  },
  {
    nome: "Profissional",
    resumo: "Quem é formado e alocado. Funciona no celular.",
    Icone: Smartphone,
    itens: [
      "Cumpre as trilhas atribuídas e responde quiz.",
      "Vê os projetos em que está.",
      "Vê e move as próprias tarefas.",
      "Acompanha o próprio progresso.",
    ],
  },
];

/**
 * Seção de perfis. Server Component.
 * Fundo bg-fundo (a anterior usa bg-superficie).
 *
 * @returns a <section> com os três cards de perfil.
 */
export default function Perfis() {
  return (
    <section aria-labelledby="titulo-perfis" className="scroll-mt-20 bg-fundo py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <CabecalhoSecao
          rotulo="Quem usa"
          idTitulo="titulo-perfis"
          titulo="Cada perfil vê o que precisa"
          descricao="O CAIS tem três perfis, cada um com as telas e as informações do seu papel."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PERFIS.map(({ nome, resumo, itens, Icone, destaque, etiqueta }) => (
            <article
              key={nome}
              // O card em destaque ganha borda roxa e sombra; os outros ficam neutros.
              className={`rounded-2xl border bg-superficie p-6 ${
                destaque ? "border-primaria shadow-card ring-1 ring-primaria/30" : "border-borda"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primaria-suave text-primaria">
                  <Icone className="h-5 w-5" aria-hidden="true" />
                </span>
                {etiqueta && <Etiqueta tom="primaria">{etiqueta}</Etiqueta>}
              </div>
              <h3 className="mt-4 font-space text-xl font-semibold text-tinta">{nome}</h3>
              <p className="mt-1 text-[15px] font-medium text-tinta">{resumo}</p>
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
