/* ============================================================================
   TRILHAS (RÓTULOS, ÍCONES E CORES)
   O que é: tabelas fixas com o rótulo e o ícone de cada tipo de etapa e o rótulo, a descrição e a cor de cada alcance de trilha.
   Onde é usado: app/(sistema)/trilhas/page.tsx e app/(sistema)/trilhas/[id]/page.tsx.
   Depende de: lucide-react (ícones) e lib/tipos.ts (TipoEtapa, Trilha).
   Contexto: §4 (Trilhas: alcances e tipos de conteúdo), §9 (cor tem significado).
   ============================================================================ */

import { FileText, PlayCircle, FileType2, Headphones, Presentation, Link2, ListChecks } from 'lucide-react';
import type { TipoEtapa, Trilha } from './tipos';

/**
 * Rótulo e ícone de cada tipo de etapa.
 * `Record<TipoEtapa, ...>` obriga a ter uma entrada para CADA tipo: se alguém
 * criar um tipo novo em lib/tipos.ts, o TypeScript acusa aqui.
 * @example const { rotulo, icone: Icone } = TIPOS_ETAPA[etapa.tipo];
 */
export const TIPOS_ETAPA: Record<TipoEtapa, { rotulo: string; icone: typeof FileText }> = {
  texto: { rotulo: 'Texto', icone: FileText },
  video: { rotulo: 'Vídeo', icone: PlayCircle },
  pdf: { rotulo: 'PDF', icone: FileType2 },
  audio: { rotulo: 'Áudio', icone: Headphones },
  apresentacao: { rotulo: 'Apresentação', icone: Presentation },
  link: { rotulo: 'Link externo', icone: Link2 },
  quiz: { rotulo: 'Quiz', icone: ListChecks },
};

/* Cores de alcance, as mesmas do slide 5 do deck */
/**
 * Rótulo, descrição e cor de cada alcance de trilha (§4).
 * A cor é um hex fixo de propósito: é a cor oficial de cada camada no deck
 * (exceção à regra "só tokens", porque identifica o alcance, não o tema).
 * @example ALCANCE[trilha.alcance].rotulo // 'Trilha da empresa'
 */
export const ALCANCE: Record<Trilha['alcance'], { rotulo: string; descricao: string; cor: string }> = {
  geral: { rotulo: 'Trilha geral', descricao: 'Vale para todas as empresas e todos os profissionais.', cor: '#7C5CFF' },
  empresa: { rotulo: 'Trilha da empresa', descricao: 'Vale só para as pessoas ligadas àquela empresa.', cor: '#10B981' },
  profissional: { rotulo: 'Trilha do profissional', descricao: 'Vale para uma pessoa ou um grupo escolhido a dedo.', cor: '#F5A524' },
};
