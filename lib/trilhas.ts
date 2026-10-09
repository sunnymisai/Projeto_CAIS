/* ============================================================================
   TRILHAS (RÓTULOS, ÍCONES E CORES)
   O que é: tabelas fixas com o rótulo e o ícone de cada tipo de etapa e o rótulo, a descrição e a cor de cada alcance de trilha; o padrão de tentativas, a validação do quiz e o endereço do player (hrefEtapa).
   Onde é usado: app/(sistema)/trilhas/page.tsx, app/(sistema)/trilhas/[id]/page.tsx e as telas de app/(sistema)/minhas-trilhas.
   Depende de: lucide-react (ícones) e lib/tipos.ts (Etapa, TipoEtapa, Trilha).
   Contexto: §4 (Trilhas: alcances e tipos de conteúdo), §9 (cor tem significado).
   ============================================================================ */

import { FileText, PlayCircle, FileType2, Headphones, Presentation, Link2, ListChecks } from 'lucide-react';
import type { Etapa, TipoEtapa, Trilha } from './tipos';

// [PV-1] Rótulo e ícone de cada tipo de etapa (Texto, Vídeo, PDF, Áudio, Apresentação, Link, Quiz). Tipo novo: acrescente aqui (o TypeScript cobra).
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

// [PV-2] As três camadas de trilha (geral, da empresa, do profissional): nomes, descrições e a cor oficial de cada uma do deck (hex fixo de propósito).
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

// [PV-3] Tentativas do quiz quando a etapa não define (3). O máximo é 10 (lib/quiz.ts). TODO(PROGLOGIC): confirmar o padrão.
/**
 * Tentativas de quiz quando a etapa não define `tentativasMax` (dados antigos ou etapa nova).
 * 0 nas etapas significa "sem limite".
 */
// TODO(PROGLOGIC): confirmar o padrão de tentativas (hoje 3).
export const TENTATIVAS_PADRAO = 3;

// [PV-4] O que impede PUBLICAR uma trilha com quiz: precisa de pelo menos uma pergunta, com enunciado, duas alternativas e a correta marcada.
/**
 * Pendências de UMA etapa de quiz que impedem publicar a trilha.
 * Regra: pelo menos uma pergunta, e cada pergunta com enunciado, duas ou mais
 * alternativas preenchidas e a correta marcada (apontando para uma alternativa preenchida).
 * Etapa que não é quiz não tem pendência aqui.
 * @param etapa - a etapa.
 * @param numero - posição da etapa para a mensagem (1 = primeira).
 * @returns lista de mensagens em português ([] = tudo certo).
 * @example problemasDoQuiz({ ...quiz, perguntas: [] }, 4) // ['O quiz da etapa 4 precisa de pelo menos uma pergunta.']
 */
export function problemasDoQuiz(etapa: Etapa, numero: number): string[] {
  if (etapa.tipo !== 'quiz') return [];
  const perguntas = etapa.perguntas ?? [];
  if (perguntas.length === 0) return [`O quiz da etapa ${numero} precisa de pelo menos uma pergunta.`];
  const erros: string[] = [];
  perguntas.forEach((p, i) => {
    const nome = `Pergunta ${i + 1} da etapa ${numero}`;
    if (!p.enunciado.trim()) erros.push(`${nome}: escreva o enunciado.`);
    if (p.alternativas.filter((a) => a.trim()).length < 2) erros.push(`${nome}: preencha pelo menos duas alternativas.`);
    // A correta precisa existir e não pode ser uma alternativa em branco.
    if (!p.alternativas[p.correta]?.trim()) erros.push(`${nome}: marque a alternativa correta.`);
  });
  return erros;
}

// [PV-5] O endereço do player de uma etapa (/minhas-trilhas/<trilha>/etapa/<etapa>); todo link para uma etapa passa por aqui.
/**
 * Endereço do player de uma etapa (tela do D03), usado pelos botões "Começar"/"Continuar".
 * @param trilhaId - id da trilha.
 * @param etapaId - id da etapa.
 * @returns o caminho.
 * @example hrefEtapa('tri_boasvindas', 'et_1') // '/minhas-trilhas/tri_boasvindas/etapa/et_1'
 */
// ⚠️ ATENÇÃO: o formato precisa bater com a pasta app/(sistema)/minhas-trilhas/[id]/etapa/[etapaId].
export const hrefEtapa = (trilhaId: string, etapaId: string) => `/minhas-trilhas/${trilhaId}/etapa/${etapaId}`;
