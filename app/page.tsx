/* ============================================================================
   APP/PAGE.TSX (HOMEPAGE)
   O que é: a página pública da raiz "/", que apresenta o CAIS para uma empresa
     que avalia participar do programa.
   Onde é usado: rota "/". Chegam aqui visitantes de fora e o link
     "Ir para a página inicial" da página 404 (app/not-found.tsx).
   Depende de: components/home/TopoHome.tsx e components/home/Hero.tsx.
   Contexto: §15 item 0 (homepage como ponto de entrada público) e §16;
     docs/notas-next16.md §1 (Server Component) e §5 (metadados).

   DIVISÃO SERVER x CLIENT (por quê):
     - Esta página é Server Component: só monta as seções e exporta os
       metadados (title e description só funcionam em Server Component).
     - Cada seção é um arquivo em components/home/. A maioria é Server
       Component (só texto e imagens: nenhum JavaScript vai ao navegador).
     - Só vira Client Component quem precisa de interação ou da sessão:
       TopoHome (menu do celular, tecla Esc e useAuth).
   ============================================================================ */

import type { Metadata } from 'next';
import TopoHome from '@/components/home/TopoHome';
import Hero from '@/components/home/Hero';

/**
 * Título e descrição da aba. `absolute` ignora o template "%s · CAIS" do
 * layout raiz: na home o título é a própria apresentação do produto.
 */
export const metadata: Metadata = {
  title: { absolute: 'CAIS · Uma plataforma para formar, alocar e acompanhar' },
  description:
    'O CAIS reúne onboarding por trilhas, gestão de projetos e dashboards para empresas parceiras e profissionais do programa PROGLOGIC · Residência Técnica.',
};

/**
 * Homepage pública.
 * Landmarks: <header> (dentro do TopoHome), <main> e <footer>; só um <h1> (no Hero).
 *
 * @returns o topo fixo e o conteúdo principal.
 */
export default function Home() {
  return (
    // .home-raiz liga a rolagem suave só nesta página (veja app/globals.css).
    <div className="home-raiz">
      <TopoHome />
      {/* id="conteudo": destino do link "Pular para o conteúdo" do topo. */}
      <main id="conteudo">
        <Hero />
      </main>
    </div>
  );
}
