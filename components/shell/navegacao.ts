/* ============================================================================
   NAVEGACAO.TS — ITENS DO MENU LATERAL
   O que é: a lista (agrupada) de telas que aparecem no menu lateral, com
   endereço, rótulo e ícone de cada uma.
   Onde é usado: components/shell/Sidebar.tsx.
   Depende de: lucide-react (ícones).
   Contexto: §10 (anatomia: menu sempre no mesmo lugar) e §8/§15 (mapa e
   organograma de telas).
   ============================================================================ */
import { LayoutDashboard, Building2, Users, GraduationCap, FolderKanban, Palette } from 'lucide-react';

/**
 * Itens do menu lateral, em grupos. Cada item tem `href` (rota da página em
 * app/(sistema)), `rotulo` (texto do menu) e `icone` (componente lucide-react).
 * ⚠️ ATENÇÃO: tela nova PRECISA ser registrada aqui, senão não aparece no menu
 * lateral (Sidebar) e a pessoa só chega nela digitando o endereço.
 * @example
 * // Para adicionar a tela "Relatórios" (app/(sistema)/relatorios/page.tsx):
 * { href: '/relatorios', rotulo: 'Relatórios', icone: BarChart3 },
 */
export const NAVEGACAO = [
  { grupo: 'Visão geral', itens: [
    { href: '/painel', rotulo: 'Painel', icone: LayoutDashboard },
  ] },
  { grupo: 'Cadastros', itens: [
    { href: '/empresas', rotulo: 'Empresas', icone: Building2 },
    { href: '/pessoas', rotulo: 'Pessoas', icone: Users },
  ] },
  { grupo: 'Programa', itens: [
    { href: '/trilhas', rotulo: 'Trilhas', icone: GraduationCap },
    { href: '/projetos', rotulo: 'Projetos', icone: FolderKanban },
  ] },
  { grupo: 'Produto', itens: [
    { href: '/design-system', rotulo: 'Design System', icone: Palette },
  ] },
];
