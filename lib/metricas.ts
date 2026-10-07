/* ============================================================================
   MÉTRICAS (CÁLCULOS DERIVADOS)
   O que é: funções puras que calculam público e situação das trilhas, progresso dos projetos e rótulos/cores de status e prioridade.
   Onde é usado: app/(sistema)/painel, pessoas, projetos, projetos/[id], trilhas, trilhas/[id] e components/projetos/Equipe.tsx e Vistas.tsx.
   Depende de: lib/tipos.ts (Dados, Trilha) e lib/utils.ts (hojeISO).
   Contexto: §4 (alcance das trilhas), §5 (equipe e tarefas), §6 (dashboards).
   ============================================================================ */

// ⚠️ ATENÇÃO: os imports levam a extensão .ts de propósito (tsconfig: allowImportingTsExtensions):
// lib/permissoes.ts importa publicoDaTrilha daqui e é testado com Node (permissoes.casos.ts),
// que só acha o módulo com a extensão. Tirar o ".ts" quebra o teste, não o app.
import type { Dados, Perfil, Trilha } from './tipos.ts';
import { hojeISO } from './utils.ts';

/* Cálculos derivados usados no painel e nas fichas. Nada aqui é salvo:
   tudo é recalculado a partir dos dados, como faria a API. */

/**
 * Quem deve cumprir a trilha, conforme o alcance (slide 5).
 * - geral: todos os profissionais que não estão inativos;
 * - profissional: só as pessoas escolhidas em `pessoaIds`;
 * - empresa: quem está alocado em algum projeto daquela empresa.
 * @param t - a trilha.
 * @param d - todos os dados (vindos de `useDados()`).
 * @returns lista de ids de pessoas, sem repetição.
 */
export function publicoDaTrilha(t: Trilha, d: Dados): string[] {
  // Inativo não recebe trilha nova (§11: inativar mantém o histórico, mas tira da operação).
  const profissionais = d.pessoas.filter((p) => p.perfil === 'profissional' && p.status !== 'inativo');
  if (t.alcance === 'geral') return profissionais.map((p) => p.id);
  if (t.alcance === 'profissional') return t.pessoaIds;
  // Alcance 'empresa': a pessoa está "ligada à empresa" quando está alocada num projeto dela.
  // Set dos ids de projeto para a busca `has` ser rápida.
  const projetos = new Set(d.projetos.filter((p) => p.empresaId === t.empresaId).map((p) => p.id));
  // O Set externo tira repetidos (a mesma pessoa pode estar em dois projetos da empresa).
  return [...new Set(d.alocacoes.filter((a) => projetos.has(a.projetoId)).map((a) => a.pessoaId))];
}

/**
 * Em que pé uma pessoa está numa trilha.
 * @param t - a trilha.
 * @param pessoaId - id da pessoa.
 * @returns 'nao_iniciada', 'andamento' ou 'concluida'.
 * @example situacaoNaTrilha(trilhaCom5Etapas, 'pes_elisa') // 'andamento' (3 de 5)
 */
export function situacaoNaTrilha(t: Trilha, pessoaId: string) {
  const p = t.progresso[pessoaId];
  const total = t.etapas.length;
  // Sem registro de progresso ou com zero etapas feitas = ainda não começou.
  if (!p || p.concluidas === 0) return 'nao_iniciada' as const;
  // >= (e não ===) protege contra etapa removida depois que a pessoa já tinha concluído.
  if (p.concluidas >= total) return 'concluida' as const;
  return 'andamento' as const;
}

/**
 * Contagem do público da trilha por situação (para os cards e gráficos do painel).
 * @param t - a trilha.
 * @param d - todos os dados.
 * @returns `{ publico, concluida, andamento, nao_iniciada }` (números).
 */
export function resumoTrilha(t: Trilha, d: Dados) {
  const publico = publicoDaTrilha(t, d);
  const r = { publico: publico.length, concluida: 0, andamento: 0, nao_iniciada: 0 };
  // A situação devolvida é exatamente o nome do contador a somar.
  publico.forEach((id) => { r[situacaoNaTrilha(t, id)]++; });
  return r;
}

/**
 * Trilhas obrigatórias concluídas pela pessoa (coluna "Trilhas" da equipe).
 * Só conta trilhas publicadas em que a pessoa faz parte do público.
 * @param pessoaId - id da pessoa.
 * @param d - todos os dados.
 * @returns `{ total, concluidas }`, ex.: `{ total: 3, concluidas: 2 }` → "2/3".
 */
export function trilhasDaPessoa(pessoaId: string, d: Dados) {
  const minhas = d.trilhas.filter((t) => t.status === 'publicada' && publicoDaTrilha(t, d).includes(pessoaId));
  return { total: minhas.length, concluidas: minhas.filter((t) => situacaoNaTrilha(t, pessoaId) === 'concluida').length };
}

/**
 * Andamento de um projeto pelas tarefas.
 * @param projetoId - id do projeto.
 * @param d - todos os dados.
 * @returns `{ total, prontas, atrasadas, pct }` — `pct` vai de 0 a 100.
 */
export function progressoProjeto(projetoId: string, d: Dados) {
  const proj = d.projetos.find((p) => p.id === projetoId);
  const tarefas = d.tarefas.filter((t) => t.projetoId === projetoId);
  // ⚠️ ATENÇÃO: "pronta" = está na ÚLTIMA coluna do quadro (mesma regra de moverTarefa em lib/store.tsx).
  const ultima = proj?.colunas[proj.colunas.length - 1]?.id;
  const prontas = tarefas.filter((t) => t.colunaId === ultima).length;
  const hoje = hojeISO();
  // Atrasada = não está pronta e o prazo já passou. Comparar texto funciona porque o formato é AAAA-MM-DD.
  const atrasadas = tarefas.filter((t) => t.colunaId !== ultima && t.prazo < hoje).length;
  // Projeto sem tarefas fica em 0% (evita divisão por zero).
  return { total: tarefas.length, prontas, atrasadas, pct: tarefas.length ? (prontas / tarefas.length) * 100 : 0 };
}

/** Nome de cada perfil de acesso, em português (Meu perfil, Acessos). */
export const ROTULO_PERFIL: Record<Perfil, string> = { admin: 'Administrador', empresa: 'Empresa', profissional: 'Profissional' };

/** Texto exibido para cada status de projeto. */
export const ROTULO_STATUS_PROJETO = { planejado: 'Planejado', andamento: 'Em andamento', pausado: 'Pausado', concluido: 'Concluído' } as const;
/** Tom (cor semântica da etiqueta) de cada status de projeto. */
export const TOM_STATUS_PROJETO = { planejado: 'neutro', andamento: 'primaria', pausado: 'aviso', concluido: 'sucesso' } as const;
/** Texto exibido para cada prioridade. */
export const ROTULO_PRIORIDADE = { baixa: 'Baixa', media: 'Média', alta: 'Alta' } as const;
/** Tom de cada prioridade: alta usa a cor de erro para chamar atenção. */
export const TOM_PRIORIDADE = { baixa: 'neutro', media: 'aviso', alta: 'erro' } as const;
