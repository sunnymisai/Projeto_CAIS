/* ============================================================================
   NAVEGACAO.TS — ITENS DO MENU LATERAL
   O que é: a lista (agrupada) de telas que aparecem no menu lateral, com
   endereço, rótulo, ícone e os perfis que enxergam cada item.
   Onde é usado: components/shell/Sidebar.tsx (que filtra por perfil).
   Depende de: lucide-react (ícones) e lib/tipos.ts (tipo Perfil).
   Contexto: §3 (perfis), §10 (anatomia: menu sempre no mesmo lugar) e §8/§15
   (mapa e organograma de telas).
   ============================================================================ */
import { LayoutDashboard, Building2, Users, GraduationCap, FolderKanban, Palette, Gauge, KeyRound, BookOpenCheck, ListChecks } from 'lucide-react';
import type { Perfil } from '@/lib/tipos';

/**
 * Itens do menu lateral, em grupos. Cada item tem `href` (rota da página em
 * app/(sistema)), `rotulo` (texto do menu), `icone` (componente lucide-react)
 * e `perfis` (quem enxerga o item no menu).
 * ⚠️ ATENÇÃO: `perfis` aqui só decide o que APARECE no menu. Quem barra o acesso
 * de verdade é lib/permissoes.ts (ROTAS_POR_PERFIL); os dois precisam concordar,
 * senão o menu mostra um link que leva a /sem-permissao (ou esconde uma tela liberada).
 * ⚠️ ATENÇÃO: tela nova PRECISA ser registrada aqui, senão não aparece no menu
 * lateral (Sidebar) e a pessoa só chega nela digitando o endereço.
 * @example
 * // Para adicionar a tela "Relatórios" (app/(sistema)/relatorios/page.tsx), só do admin:
 * { href: '/relatorios', rotulo: 'Relatórios', icone: BarChart3, perfis: ['admin'] },
 */
export const NAVEGACAO: {
  grupo: string;
  itens: { href: string; rotulo: string; icone: typeof LayoutDashboard; perfis: Perfil[] }[];
}[] = [
  { grupo: 'Visão geral', itens: [
    { href: '/painel', rotulo: 'Painel', icone: LayoutDashboard, perfis: ['admin', 'empresa', 'profissional'] },
  ] },
  { grupo: 'Cadastros', itens: [
    { href: '/empresas', rotulo: 'Empresas', icone: Building2, perfis: ['admin'] },
    { href: '/pessoas', rotulo: 'Pessoas', icone: Users, perfis: ['admin'] },
    { href: '/acessos', rotulo: 'Acessos', icone: KeyRound, perfis: ['admin'] },
  ] },
  // A ordem dentro deste grupo define a ordem do menu de cada perfil. Por isso
  // "Projetos" aparece duas vezes: depois de Trilhas/Carga para Admin e Empresa e
  // depois de "Minhas tarefas" para o Profissional (só um deles aparece por perfil).
  { grupo: 'Programa', itens: [
    { href: '/trilhas', rotulo: 'Trilhas', icone: GraduationCap, perfis: ['admin'] },
    { href: '/carga', rotulo: 'Carga da equipe', icone: Gauge, perfis: ['admin'] },
    { href: '/projetos', rotulo: 'Projetos', icone: FolderKanban, perfis: ['admin', 'empresa'] },
    { href: '/minhas-trilhas', rotulo: 'Minhas trilhas', icone: BookOpenCheck, perfis: ['profissional'] },
    { href: '/minhas-tarefas', rotulo: 'Minhas tarefas', icone: ListChecks, perfis: ['profissional'] },
    { href: '/projetos', rotulo: 'Projetos', icone: FolderKanban, perfis: ['profissional'] },
    // Mesma rota de "Minhas trilhas": a tela é uma só; muda só o rótulo para a Empresa (§3).
    { href: '/minhas-trilhas', rotulo: 'Trilha da empresa', icone: BookOpenCheck, perfis: ['empresa'] },
  ] },
  { grupo: 'Produto', itens: [
    { href: '/design-system', rotulo: 'Design System', icone: Palette, perfis: ['admin'] },
  ] },
];
