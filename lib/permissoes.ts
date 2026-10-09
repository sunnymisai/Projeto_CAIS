/* ============================================================================
   PERMISSÕES POR PERFIL
   O que é: funções puras que dizem quais rotas cada perfil abre (podeAcessar) e quais ações cada perfil pode fazer (podeFazer).
   Onde é usado: lib/permissoes.casos.ts (testes com Node), app/(sistema)/layout.tsx (porteiro e guarda de trilha obrigatória), components/shell/Sidebar.tsx, as telas de projetos e app/(sistema)/acessos (quadro "O que cada perfil pode fazer").
   Depende de: tipos de lib/tipos.ts e publicoDaTrilha de lib/metricas.ts (sem React, para rodar em Node).
   Contexto: §3 (Perfis), §5 (Permissões de projetos, "a confirmar com a PROGLOGIC"), §7 (a segurança real é do back-end) e §12 (fluxo 1: trilha obrigatória libera o sistema).
   ============================================================================ */

import type { Dados, Perfil } from './tipos.ts';
import { publicoDaTrilha } from './metricas.ts';

/*
 * ⚠️ ATENÇÃO: isto é CONVENIÊNCIA DE INTERFACE (esconder o que a pessoa não
 * pode usar). Quem garante a permissão de verdade é o back-end da PROGLOGIC
 * (§7). Quando a API existir, ela deve responder 403 e a tela só reflete isso.
 * TODO(API): trocar estas regras locais pelas permissões devolvidas pela API.
 */

/**
 * Prefixo de rota → perfis que podem abrir.
 * ⚠️ ATENÇÃO: toda rota nova em app/(sistema)/ precisa entrar aqui; se esquecer,
 * `podeAcessar` trata como "só admin" e os outros perfis caem em /sem-permissao.
 */
export const ROTAS_POR_PERFIL: Record<string, readonly Perfil[]> = {
  // §3: as três visões compartilhadas (o painel muda conforme quem olha, §6).
  // TODO(PROGLOGIC): confirmar
  '/painel': ['admin', 'empresa', 'profissional'],
  '/projetos': ['admin', 'empresa', 'profissional'],
  '/perfil': ['admin', 'empresa', 'profissional'],
  // §3/§15 item 3: cadastros e governança são do Administrador.
  // TODO(PROGLOGIC): confirmar
  '/empresas': ['admin'],
  '/pessoas': ['admin'],
  '/trilhas': ['admin'],
  '/design-system': ['admin'],
  '/carga': ['admin'],
  '/acessos': ['admin'],
  // §3: Empresa cumpre a trilha dela e Profissional cumpre as atribuídas.
  // TODO(PROGLOGIC): confirmar
  '/minhas-trilhas': ['empresa', 'profissional'],
  // §3: só o Profissional "vê e move as próprias tarefas".
  // TODO(PROGLOGIC): confirmar
  '/minhas-tarefas': ['profissional'],
};

/**
 * Diz se o perfil pode abrir o caminho.
 * O prefixo MAIS LONGO que casa vence (ex.: "/projetos/prj_1" casa com "/projetos").
 * Casa só em fronteira de segmento: "/projetosx" NÃO casa com "/projetos".
 * Rota não listada = SÓ ADMIN. É o lado seguro: esquecer de cadastrar uma rota
 * nova nega o acesso (erro visível) em vez de abrir sem querer (erro silencioso).
 * @param perfil - perfil da sessão.
 * @param caminho - caminho da URL (com ou sem ?query e #âncora).
 * @returns true se o perfil pode acessar.
 * @example podeAcessar('profissional', '/empresas') // false
 */
export function podeAcessar(perfil: Perfil, caminho: string): boolean {
  // Tira ?query e #âncora e a barra final: só o caminho importa para a regra.
  const limpo = caminho.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  let melhor: string | null = null;
  for (const prefixo of Object.keys(ROTAS_POR_PERFIL)) {
    // Fronteira de segmento: igual ao prefixo ou começa com "prefixo/".
    const casa = limpo === prefixo || limpo.startsWith(prefixo + '/');
    // O prefixo mais longo é o mais específico, por isso vence.
    if (casa && (melhor === null || prefixo.length > melhor.length)) melhor = prefixo;
  }
  // Rota não listada: só admin (explicado acima).
  if (melhor === null) return perfil === 'admin';
  return ROTAS_POR_PERFIL[melhor].includes(perfil);
}

/** Ações de projeto que dependem do perfil. */
export type Acao =
  | 'criar_tarefa'
  | 'editar_tarefa'
  | 'excluir_tarefa'
  | 'editar_lista'
  | 'alocar'
  | 'editar_projeto'
  | 'mover_tarefa'
  | 'comentar_tarefa'
  | 'anexar_arquivo'
  | 'aprovar_entrega';

/** Informação extra que algumas ações precisam para decidir. */
export interface ContextoAcao {
  /** id da pessoa logada (para 'mover_tarefa' e 'anexar_arquivo'). */
  pessoaId?: string;
  /** id do responsável da tarefa (para 'mover_tarefa' e 'anexar_arquivo'). */
  responsavelId?: string;
  /** true se a pessoa enxerga o projeto (para 'comentar_tarefa', 'alocar' e 'aprovar_entrega'; veja lib/escopo.ts). */
  enxergaProjeto?: boolean;
}

/**
 * Diz se o perfil pode fazer a ação.
 * @param perfil - perfil da sessão.
 * @param acao - o que a pessoa quer fazer.
 * @param contexto - dados extras (quem é a pessoa, de quem é a tarefa, se vê o projeto).
 * @returns true se pode.
 * @example podeFazer('profissional', 'mover_tarefa', { pessoaId: 'pes_ana', responsavelId: 'pes_ana' }) // true
 */
export function podeFazer(perfil: Perfil, acao: Acao, contexto: ContextoAcao = {}): boolean {
  switch (acao) {
    // §5: criar/editar/excluir tarefa, editar lista (renomear/excluir coluna) e editar projeto
    // são só do Administrador (quem opera o programa, §3).
    // TODO(PROGLOGIC): confirmar
    case 'criar_tarefa':
    case 'editar_tarefa':
    case 'excluir_tarefa':
    case 'editar_lista':
    case 'editar_projeto':
      return perfil === 'admin';

    // Decisão da PROGLOGIC (09/10/2026): a EMPRESA aloca o time nos projetos DELA. O administrador
    // aloca em qualquer projeto; o profissional não aloca. Sem a informação de escopo (enxergaProjeto),
    // a empresa NÃO aloca (lado seguro). Quem chama passa enxergaProjeto de lib/escopo.ts.
    case 'alocar':
      if (perfil === 'admin') return true;
      return perfil === 'empresa' && contexto.enxergaProjeto === true;

    // Decisão da PROGLOGIC (09/10/2026): a EMPRESA aprova (e desaprova) as entregas do projeto dela.
    // É só da empresa: o admin acompanha, mas quem aprova é o cliente. Sem escopo, nega.
    case 'aprovar_entrega':
      return perfil === 'empresa' && contexto.enxergaProjeto === true;

    // §3/§5: "o profissional vê e move as próprias tarefas"; Empresa só acompanha.
    // Sem pessoaId ou responsavelId no contexto o profissional NÃO move (lado seguro).
    // TODO(PROGLOGIC): confirmar
    case 'mover_tarefa':
      if (perfil === 'admin') return true;
      if (perfil === 'profissional') {
        return !!contexto.pessoaId && contexto.pessoaId === contexto.responsavelId;
      }
      return false;

    // §5: "Empresa vê as tarefas do projeto dela e comenta"; o profissional também
    // comenta onde está. Vale para qualquer perfil que enxerga o projeto; o admin
    // enxerga todos. Sem a informação de escopo, negamos (lado seguro).
    // TODO(PROGLOGIC): confirmar
    case 'comentar_tarefa':
      if (perfil === 'admin') return true;
      return contexto.enxergaProjeto === true;

    // G03: anexar e remover arquivo seguem a regra de mover: admin em qualquer tarefa; profissional
    // só nas próprias; Empresa só vê (§5). Sem pessoaId ou responsavelId no contexto, nega (lado seguro).
    // TODO(PROGLOGIC): confirmar
    case 'anexar_arquivo':
      if (perfil === 'admin') return true;
      if (perfil === 'profissional') return !!contexto.pessoaId && contexto.pessoaId === contexto.responsavelId;
      return false;
  }
}

/* ============================================================================
   GUARDA DA TRILHA OBRIGATÓRIA (§12, fluxo 1: "conclui e libera o sistema")
   ============================================================================ */

/**
 * Liga/desliga a guarda da trilha obrigatória no primeiro acesso do profissional.
 * `false` por enquanto: as telas de trilha do profissional (/minhas-trilhas) só nascem
 * no bloco D, que vai ligar esta constante. Com `false`, ninguém fica preso.
 * ⚠️ ATENÇÃO: ligar sem a tela /minhas-trilhas pronta trancaria o profissional sem saída;
 * app/(sistema)/layout.tsx é quem lê esta constante.
 * TODO(PROGLOGIC): confirmar se a trava vale para toda trilha ou só para a de boas-vindas.
 */
export const EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO = true;

/**
 * Diz se a pessoa ainda precisa concluir uma trilha obrigatória.
 * Regra conservadora (a "Trilha" não tem um campo "obrigatória"; só as etapas têm):
 * conta a trilha PUBLICADA de alcance "geral" (a de boas-vindas) em que a pessoa faz
 * parte do público e que ainda tem alguma etapa obrigatória por concluir.
 * As etapas são feitas em ordem (§4: a obrigatória trava as próximas), então
 * "concluídas = N" significa que as N primeiras estão feitas.
 * @param pessoaId - id da pessoa (da sessão).
 * @param dados - todos os dados (de `useDados()`).
 * @returns true se existe trilha obrigatória pendente.
 * @example temTrilhaObrigatoriaPendente('pes_felipe', dados) // true: 0 de 5 na trilha de boas-vindas
 */
// TODO(PROGLOGIC): confirmar quais trilhas travam o sistema (hoje: só as gerais publicadas).
export function temTrilhaObrigatoriaPendente(pessoaId: string, dados: Dados): boolean {
  return dados.trilhas.some((t) => {
    // Só trilha publicada e geral entra na regra (rascunho não aparece para ninguém, §4).
    if (t.status !== 'publicada' || t.alcance !== 'geral') return false;
    // Quem não está no público da trilha não deve nada a ela (ex.: pessoa inativa).
    if (!publicoDaTrilha(t, dados).includes(pessoaId)) return false;
    const feitas = t.progresso[pessoaId]?.concluidas ?? 0;
    // Pendente = alguma etapa obrigatória depois das já concluídas.
    return t.etapas.some((e, i) => i >= feitas && e.obrigatoria);
  });
}

/**
 * Diz se a rota continua liberada enquanto a trilha obrigatória está pendente.
 * Só /minhas-trilhas (e o que vem depois dela) e /painel; o resto mostra o aviso de bloqueio.
 * @param caminho - caminho da URL (com ou sem ?query e #âncora).
 * @returns true se a pessoa pode abrir mesmo com trilha pendente.
 * @example rotaLiberadaComTrilhaPendente('/minhas-trilhas/tri_1') // true
 */
export function rotaLiberadaComTrilhaPendente(caminho: string): boolean {
  const limpo = caminho.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  // Fronteira de segmento (igual a podeAcessar): "/painelx" NÃO conta como "/painel".
  return ['/minhas-trilhas', '/painel'].some((p) => limpo === p || limpo.startsWith(p + '/'));
}

/* ============================================================================
   LEITURA DAS REGRAS PARA TELAS (Acessos: "O que cada perfil pode fazer")
   ============================================================================ */

/**
 * Nome de cada rota de ROTAS_POR_PERFIL, em português, para mostrar à equipe.
 * ⚠️ ATENÇÃO: toda rota nova de ROTAS_POR_PERFIL precisa de um nome aqui; o caso de teste
 * "toda rota tem rótulo" (lib/permissoes.casos.ts) falha se esquecer.
 */
export const ROTULO_DAS_ROTAS: Record<string, string> = {
  '/painel': 'Painel',
  '/projetos': 'Projetos e quadro',
  '/perfil': 'Meu perfil',
  '/empresas': 'Empresas',
  '/pessoas': 'Pessoas',
  '/trilhas': 'Trilhas (editor)',
  '/design-system': 'Design System',
  '/carga': 'Carga da equipe',
  '/acessos': 'Acessos',
  '/minhas-trilhas': 'Minhas trilhas',
  '/minhas-tarefas': 'Minhas tarefas',
};

/** Nome de cada ação de `podeFazer`, em português. */
export const ROTULO_DAS_ACOES: Record<Acao, string> = {
  criar_tarefa: 'Criar tarefa',
  editar_tarefa: 'Editar tarefa',
  excluir_tarefa: 'Excluir tarefa',
  editar_lista: 'Renomear ou excluir lista (coluna)',
  alocar: 'Alocar pessoas em projetos',
  editar_projeto: 'Criar ou editar projeto',
  mover_tarefa: 'Mover tarefa de coluna',
  comentar_tarefa: 'Comentar em tarefa',
  anexar_arquivo: 'Anexar e remover arquivos da tarefa',
  aprovar_entrega: 'Aprovar a entrega de uma tarefa',
};

/**
 * Todas as ações, na ordem em que aparecem na tabela de permissões.
 * ⚠️ ATENÇÃO: ação nova em `Acao` precisa entrar aqui e em ROTULO_DAS_ACOES (o TypeScript cobra o rótulo).
 */
export const TODAS_AS_ACOES: Acao[] = ['criar_tarefa', 'editar_tarefa', 'excluir_tarefa', 'editar_lista', 'alocar', 'editar_projeto', 'mover_tarefa', 'comentar_tarefa', 'anexar_arquivo', 'aprovar_entrega'];

/**
 * Prefixos de rota que o perfil pode abrir (na ordem de ROTAS_POR_PERFIL).
 * @param perfil - o perfil.
 * @returns lista de prefixos, ex.: ['/painel', '/projetos', '/perfil', ...].
 * @example rotasDoPerfil('empresa').includes('/pessoas') // false
 */
export function rotasDoPerfil(perfil: Perfil): string[] {
  return Object.keys(ROTAS_POR_PERFIL).filter((r) => ROTAS_POR_PERFIL[r].includes(perfil));
}

/**
 * Resume uma ação para um perfil, sem inventar regra: pergunta a `podeFazer` duas vezes,
 * uma com o contexto mais favorável (é o dono da tarefa e enxerga o projeto) e uma sem contexto.
 * @param perfil - o perfil.
 * @param acao - a ação.
 * @returns 'sim' (sempre pode), 'nao' (nunca pode) ou 'condicional' (depende de ser dono/enxergar o projeto).
 * @example permissaoDaAcao('profissional', 'mover_tarefa') // 'condicional' (só as próprias)
 */
export function permissaoDaAcao(perfil: Perfil, acao: Acao): 'sim' | 'nao' | 'condicional' {
  const melhor = podeFazer(perfil, acao, { pessoaId: 'p', responsavelId: 'p', enxergaProjeto: true });
  const semContexto = podeFazer(perfil, acao);
  if (melhor && semContexto) return 'sim';
  if (!melhor && !semContexto) return 'nao';
  return 'condicional';
}

/** Explicação da condição, para as ações que podem ser 'condicional'. */
export const CONDICAO_DA_ACAO: Partial<Record<Acao, string>> = {
  mover_tarefa: 'só as próprias tarefas',
  anexar_arquivo: 'só as próprias tarefas',
  alocar: 'só nos projetos da própria empresa',
  aprovar_entrega: 'só nos projetos da própria empresa',
  comentar_tarefa: 'só nos projetos que enxerga',
};

/**
 * O que muda para uma pessoa quando o perfil dela troca de `de` para `para`.
 * @param de - perfil atual.
 * @param para - perfil novo.
 * @returns `passaAVer` (telas novas), `deixaDeVer` (telas que perde), e as ações que `ganha` e `perde`.
 * @example mudancaDeAcesso('profissional', 'empresa').deixaDeVer // ['/minhas-tarefas']
 */
export function mudancaDeAcesso(de: Perfil, para: Perfil) {
  const antes = rotasDoPerfil(de);
  const depois = rotasDoPerfil(para);
  // "Pode" = 'sim' ou 'condicional'; quem passa de 'nao' para 'pode' ganha, e o inverso perde.
  const pode = (p: Perfil, a: Acao) => permissaoDaAcao(p, a) !== 'nao';
  return {
    passaAVer: depois.filter((r) => !antes.includes(r)),
    deixaDeVer: antes.filter((r) => !depois.includes(r)),
    ganha: TODAS_AS_ACOES.filter((a) => !pode(de, a) && pode(para, a)),
    perde: TODAS_AS_ACOES.filter((a) => pode(de, a) && !pode(para, a)),
  };
}
