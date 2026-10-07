import { LayoutDashboard, Building2, Users, GraduationCap, FolderKanban, Palette } from 'lucide-react';

/* Itens do menu lateral. Para adicionar uma tela, inclua uma linha aqui. */
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
