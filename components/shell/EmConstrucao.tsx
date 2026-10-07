/* ============================================================================
   EMCONSTRUCAO.TSX — PÁGINA "EM CONSTRUÇÃO"
   O que é: o cabeçalho de uma página mais um estado vazio "Em construção", usado pelas telas que ainda serão feitas nos próximos blocos.
   Onde é usado: app/(sistema)/carga, acessos, minhas-trilhas e minhas-tarefas; components/paineis/PainelEmpresa.tsx e PainelProfissional.tsx (somente o miolo, via EstadoConstrucao).
   Depende de: components/shell/Pagina.tsx (CabecalhoPagina), components/ui/basicos.tsx (Card, EstadoVazio) e lucide-react (Construction).
   Contexto: §8 (mapa de telas e ondas) e §13 (toda tela tem os quatro estados; aqui, o vazio).
   ============================================================================ */
import { Construction } from 'lucide-react';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { Card, EstadoVazio } from '@/components/ui/basicos';

/**
 * Só o bloco "Em construção" (sem cabeçalho), para encaixar em outra tela.
 * @param descricao - o que vai existir aqui e que bloco entrega.
 * @returns um Card com o estado vazio.
 */
export function EstadoConstrucao({ descricao }: { descricao: string }) {
  return (
    <Card>
      <EstadoVazio icone={<Construction className="h-6 w-6" aria-hidden />} titulo="Em construção" descricao={descricao} />
    </Card>
  );
}

/**
 * Página completa "Em construção": título, descrição e o estado vazio.
 * @param titulo - título da página (vira o <h1>).
 * @param descricao - frase de apoio sob o título e dentro do estado vazio.
 * @returns a página, já com o espaçamento padrão das telas internas.
 * @example <EmConstrucao titulo="Acessos" descricao="Gestão de acessos e permissões." />
 */
export default function EmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    // Mesmo respiro e largura máxima das outras telas internas.
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo={titulo} descricao={descricao} />
      <EstadoConstrucao descricao="Esta tela será entregue em um dos próximos blocos. Por enquanto, use o menu para voltar às telas que já existem." />
    </div>
  );
}
