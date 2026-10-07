import type { Dados, Trilha } from './tipos';
import { hojeISO } from './utils';

/* Cálculos derivados usados no painel e nas fichas. Nada aqui é salvo:
   tudo é recalculado a partir dos dados, como faria a API. */

/** Quem deve cumprir a trilha, conforme o alcance (slide 5). */
export function publicoDaTrilha(t: Trilha, d: Dados): string[] {
  const profissionais = d.pessoas.filter((p) => p.perfil === 'profissional' && p.status !== 'inativo');
  if (t.alcance === 'geral') return profissionais.map((p) => p.id);
  if (t.alcance === 'profissional') return t.pessoaIds;
  const projetos = new Set(d.projetos.filter((p) => p.empresaId === t.empresaId).map((p) => p.id));
  return [...new Set(d.alocacoes.filter((a) => projetos.has(a.projetoId)).map((a) => a.pessoaId))];
}

export function situacaoNaTrilha(t: Trilha, pessoaId: string) {
  const p = t.progresso[pessoaId];
  const total = t.etapas.length;
  if (!p || p.concluidas === 0) return 'nao_iniciada' as const;
  if (p.concluidas >= total) return 'concluida' as const;
  return 'andamento' as const;
}

export function resumoTrilha(t: Trilha, d: Dados) {
  const publico = publicoDaTrilha(t, d);
  const r = { publico: publico.length, concluida: 0, andamento: 0, nao_iniciada: 0 };
  publico.forEach((id) => { r[situacaoNaTrilha(t, id)]++; });
  return r;
}

/** Trilhas obrigatórias concluídas pela pessoa (coluna "Trilhas" da equipe). */
export function trilhasDaPessoa(pessoaId: string, d: Dados) {
  const minhas = d.trilhas.filter((t) => t.status === 'publicada' && publicoDaTrilha(t, d).includes(pessoaId));
  return { total: minhas.length, concluidas: minhas.filter((t) => situacaoNaTrilha(t, pessoaId) === 'concluida').length };
}

export function progressoProjeto(projetoId: string, d: Dados) {
  const proj = d.projetos.find((p) => p.id === projetoId);
  const tarefas = d.tarefas.filter((t) => t.projetoId === projetoId);
  const ultima = proj?.colunas[proj.colunas.length - 1]?.id;
  const prontas = tarefas.filter((t) => t.colunaId === ultima).length;
  const hoje = hojeISO();
  const atrasadas = tarefas.filter((t) => t.colunaId !== ultima && t.prazo < hoje).length;
  return { total: tarefas.length, prontas, atrasadas, pct: tarefas.length ? (prontas / tarefas.length) * 100 : 0 };
}

export const ROTULO_STATUS_PROJETO = { planejado: 'Planejado', andamento: 'Em andamento', pausado: 'Pausado', concluido: 'Concluído' } as const;
export const TOM_STATUS_PROJETO = { planejado: 'neutro', andamento: 'primaria', pausado: 'aviso', concluido: 'sucesso' } as const;
export const ROTULO_PRIORIDADE = { baixa: 'Baixa', media: 'Média', alta: 'Alta' } as const;
export const TOM_PRIORIDADE = { baixa: 'neutro', media: 'aviso', alta: 'erro' } as const;
