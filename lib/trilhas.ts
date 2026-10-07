import { FileText, PlayCircle, FileType2, Headphones, Presentation, Link2, ListChecks } from 'lucide-react';
import type { TipoEtapa, Trilha } from './tipos';

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
export const ALCANCE: Record<Trilha['alcance'], { rotulo: string; descricao: string; cor: string }> = {
  geral: { rotulo: 'Trilha geral', descricao: 'Vale para todas as empresas e todos os profissionais.', cor: '#7C5CFF' },
  empresa: { rotulo: 'Trilha da empresa', descricao: 'Vale só para as pessoas ligadas àquela empresa.', cor: '#10B981' },
  profissional: { rotulo: 'Trilha do profissional', descricao: 'Vale para uma pessoa ou um grupo escolhido a dedo.', cor: '#F5A524' },
};
