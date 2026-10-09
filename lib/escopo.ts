/* ============================================================================
   ESCOPO DE DADOS POR SESSÃO
   O que é: funções puras que filtram os dados (projetos, tarefas, alocações, empresas, pessoas) para mostrar só o que a pessoa logada pode ver.
   Onde é usado: lib/permissoes.casos.ts (testes com Node) e, nas partes seguintes, painéis, busca do topo e telas de projetos.
   Depende de: apenas tipos de lib/tipos.ts (sem React, para rodar em Node).
   Contexto: §3 (Perfis), §5 (quem vê o quê nos projetos) e §7 (segurança é do back-end).
   ============================================================================ */

import type { Alocacao, Dados, Empresa, Perfil, Pessoa, Projeto, Tarefa } from './tipos.ts';

/*
 * ⚠️ ATENÇÃO: isto é CONVENIÊNCIA DE INTERFACE. Filtrar aqui evita mostrar
 * dados que a pessoa não deveria ver, mas quem protege de verdade é o
 * back-end da PROGLOGIC (§7): a API só deve devolver o que o perfil pode ler.
 * TODO(API): quando a API filtrar por perfil, estas funções viram só um reforço.
 */

/**
 * O mínimo que o escopo precisa da sessão. `Sessao` (lib/auth.tsx) é compatível;
 * definimos aqui para este arquivo não importar React.
 */
export interface SessaoEscopo {
  pessoaId: string;
  perfil: Perfil;
}

// [PV-1] REGRA CENTRAL de visibilidade de projetos: admin vê todos; empresa os da própria empresa; profissional os em que está alocado. Mudar aqui muda todas as telas.
/**
 * Projetos que a sessão enxerga: admin todos; empresa os da sua empresa;
 * profissional os em que tem alocação.
 * Pessoa inexistente nos dados → lista vazia (lado seguro).
 * @param sessao - quem está logado.
 * @param dados - todos os dados (de `useDados()`).
 * @returns os projetos visíveis.
 * @example projetosVisiveis({ pessoaId: 'pes_marcos', perfil: 'empresa' }, dados) // só os da Vértice
 */
export function projetosVisiveis(sessao: SessaoEscopo, dados: Dados): Projeto[] {
  if (sessao.perfil === 'admin') return dados.projetos;
  if (sessao.perfil === 'empresa') {
    const empresaId = dados.pessoas.find((p) => p.id === sessao.pessoaId)?.empresaId;
    // Sem empresa vinculada não há o que mostrar (§11: empresa tem vínculo obrigatório).
    if (!empresaId) return [];
    return dados.projetos.filter((p) => p.empresaId === empresaId);
  }
  // [PV-2] Pergunta aberta: o profissional continua vendo o projeto depois que a alocação dele terminou? Hoje continua.
  // Profissional: Set dos projetos em que ele tem alocação (busca rápida).
  // TODO(PROGLOGIC): confirmar se alocação encerrada (fim no passado) ainda dá acesso.
  const meus = new Set(dados.alocacoes.filter((a) => a.pessoaId === sessao.pessoaId).map((a) => a.projetoId));
  return dados.projetos.filter((p) => meus.has(p.id));
}

// [PV-3] Porteiro de /projetos/[id] digitado na URL: quem não vê o projeto vai para /sem-permissao.
/**
 * Diz se a sessão pode ver o projeto (usado no /projetos/[id] digitado na URL).
 * @param sessao - quem está logado.
 * @param projetoId - id do projeto.
 * @param dados - todos os dados.
 * @returns true se o projeto está no escopo.
 * @example podeVerProjeto(sessaoAna, 'prj_agenda', dados) // false: ela não está alocada lá
 */
export function podeVerProjeto(sessao: SessaoEscopo, projetoId: string, dados: Dados): boolean {
  return projetosVisiveis(sessao, dados).some((p) => p.id === projetoId);
}

// [PV-4] Quais tarefas cada perfil vê (as dos projetos visíveis). TODO(PROGLOGIC): confirmar se o profissional vê as tarefas dos colegas.
/**
 * Tarefas dos projetos visíveis. Empresa vê todas as do projeto dela (§5);
 * profissional também vê todas as do projeto onde está (só MOVE as próprias).
 * TODO(PROGLOGIC): confirmar se o profissional vê as tarefas dos colegas.
 * @param sessao - quem está logado.
 * @param dados - todos os dados.
 * @returns as tarefas visíveis.
 */
export function tarefasVisiveis(sessao: SessaoEscopo, dados: Dados): Tarefa[] {
  const ids = new Set(projetosVisiveis(sessao, dados).map((p) => p.id));
  return dados.tarefas.filter((t) => ids.has(t.projetoId));
}

/**
 * Alocações dos projetos visíveis (quem está em cada projeto que a pessoa enxerga).
 * @param sessao - quem está logado.
 * @param dados - todos os dados.
 * @returns as alocações visíveis.
 */
export function alocacoesVisiveis(sessao: SessaoEscopo, dados: Dados): Alocacao[] {
  const ids = new Set(projetosVisiveis(sessao, dados).map((p) => p.id));
  return dados.alocacoes.filter((a) => ids.has(a.projetoId));
}

// [PV-5] Quais empresas cada perfil vê (a empresa vê a própria; o profissional, as dos projetos dele). TODO(PROGLOGIC): confirmar.
/**
 * Empresas visíveis: admin todas; os outros só as empresas dos projetos que
 * enxergam (a empresa vê a própria, mesmo sem projeto ainda).
 * TODO(PROGLOGIC): confirmar se o profissional pode ver dados da empresa cliente.
 * @param sessao - quem está logado.
 * @param dados - todos os dados.
 * @returns as empresas visíveis.
 */
export function empresasVisiveis(sessao: SessaoEscopo, dados: Dados): Empresa[] {
  if (sessao.perfil === 'admin') return dados.empresas;
  const ids = new Set(projetosVisiveis(sessao, dados).map((p) => p.empresaId));
  if (sessao.perfil === 'empresa') {
    const propria = dados.pessoas.find((p) => p.id === sessao.pessoaId)?.empresaId;
    if (propria) ids.add(propria);
  }
  return dados.empresas.filter((e) => ids.has(e.id));
}

// [PV-6] Quais pessoas cada perfil vê (busca do topo e listas). TODO(PROGLOGIC): confirmar se a empresa vê nome e contato dos profissionais alocados.
/**
 * Pessoas visíveis: admin todas; os outros veem a si mesmos e quem está
 * alocado nos projetos que enxergam (a equipe). Empresa NÃO vê outras empresas.
 * TODO(PROGLOGIC): confirmar se a Empresa pode ver nome/contato dos profissionais alocados.
 * @param sessao - quem está logado.
 * @param dados - todos os dados.
 * @returns as pessoas visíveis.
 */
export function pessoasVisiveis(sessao: SessaoEscopo, dados: Dados): Pessoa[] {
  if (sessao.perfil === 'admin') return dados.pessoas;
  const ids = new Set(alocacoesVisiveis(sessao, dados).map((a) => a.pessoaId));
  ids.add(sessao.pessoaId);
  return dados.pessoas.filter((p) => ids.has(p.id));
}
