/* ============================================================================
   TIPOS DO DOMÍNIO CAIS
   O que é: as "formas" (interfaces TypeScript) de cada dado do sistema: empresa, pessoa, trilha, projeto, alocação, tarefa.
   Onde é usado: lib/store.tsx, lib/seed.ts, lib/auth.tsx, lib/metricas.ts, lib/trilhas.ts e as telas app/(sistema)/pessoas, trilhas e trilhas/[id] (as demais telas recebem os tipos reexportados por lib/store.tsx).
   Depende de: nada (só TypeScript).
   Contexto: §4 (Trilhas), §5 (Empresa → Projeto → Alocação → Tarefa), §11 (Regras de cadastro).
   ============================================================================ */

/*
 * Espelham o modelo descrito no deck: Empresa → Projeto → Alocação → Tarefa,
 * e Trilha → Etapa. Quando a API da PROGLOGIC estiver pronta, ajuste os
 * nomes dos campos aqui e o restante do código acusa o que precisa mudar.
 * TODO(API): conferir cada campo com o contrato da API (nomes, datas, ids).
 * Convenção: datas são texto "AAAA-MM-DD"; ids são texto com prefixo (ex.: 'emp_', 'pes_').
 */

/**
 * Os três perfis de acesso (§3).
 * ⚠️ ATENÇÃO: lib/auth.tsx só deixa entrar 'admin'; renomear um valor quebra o login, o seed e os filtros por perfil das telas.
 */
export type Perfil = 'admin' | 'empresa' | 'profissional';
/** Prioridade de projeto e de tarefa. Rótulos e cores ficam em lib/metricas.ts. */
export type Prioridade = 'baixa' | 'media' | 'alta';

/** Empresa parceira que traz projetos para o programa (§11). */
export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  /** Guardado já com máscara: "11.222.333/0001-81". */
  cnpj: string;
  segmento: string;
  porte: string;
  site: string;
  cep: string;
  logradouro: string;
  numero: string;
  /** Cidade e UF juntos, ex.: "Recife / PE". */
  cidadeUf: string;
  contatoNome: string;
  /** E-mail do contato: é único e vira o login do perfil Empresa (§11). */
  contatoEmail: string;
  contatoTelefone: string;
  contatoCargo: string;
  /** Situação da parceria: Em negociação, Ativa ou Encerrada (§11). */
  status: 'negociacao' | 'ativa' | 'encerrada';
  dataEntrada: string; // AAAA-MM-DD
}

/**
 * Pessoa cadastrada. Uma só forma para os três perfis (§11): os campos que
 * não se aplicam ao perfil ficam vazios ('' ou 0).
 */
export interface Pessoa {
  id: string;
  nome: string;
  /** Único no sistema; é o login. */
  email: string;
  telefone: string;
  cargo: string;
  perfil: Perfil;
  /** 'convidado' = recebeu convite e ainda não fez o primeiro acesso; 'inativo' substitui excluir (§11). */
  status: 'convidado' | 'ativo' | 'inativo';
  /** AAAA-MM-DD */
  dataEntrada: string;
  /** Só profissional: área de atuação (Front-end, UX...). */
  area: string;
  /** Só profissional: Estágio, Júnior, Pleno... */
  nivel: string;
  /** Só profissional: limite de horas por semana (40 h padrão). Empresa/admin: 0 ou 40. */
  cargaMax: number;
  /** Só profissional: lista de habilidades (React, Figma...). */
  habilidades: string[];
  /** Obrigatório para perfil Empresa; opcional para profissional; '' quando não há. */
  empresaId: string;
}

/** Tipos de conteúdo que uma etapa de trilha pode ter (§4). Ícones em lib/trilhas.ts. */
export type TipoEtapa = 'texto' | 'video' | 'pdf' | 'audio' | 'apresentacao' | 'link' | 'quiz';

/** Uma etapa dentro de uma trilha. */
export interface Etapa {
  id: string;
  titulo: string;
  tipo: TipoEtapa;
  /** true = trava o acesso às próximas até ser concluída (§4). */
  obrigatoria: boolean;
  notaMinima: number; // só para quiz (0 a 100)
}

/** Trilha de onboarding (Pilar 1, §4). */
export interface Trilha {
  id: string;
  titulo: string;
  descricao: string;
  /** Quem recebe: todos, as pessoas de uma empresa ou pessoas escolhidas (§4). */
  alcance: 'geral' | 'empresa' | 'profissional';
  /** Preenchido só quando alcance = 'empresa'. */
  empresaId: string;
  /** Preenchido só quando alcance = 'profissional'. */
  pessoaIds: string[];
  /** Rascunho não aparece para ninguém além do admin. */
  status: 'rascunho' | 'publicada';
  /** Prazo para concluir, em dias. */
  prazoDias: number;
  etapas: Etapa[];
  /** pessoaId → quantas etapas concluiu e nota do quiz */
  progresso: Record<string, { concluidas: number; nota?: number }>;
}

/** Coluna do quadro kanban de um projeto (ex.: "A fazer"). */
export interface Coluna {
  id: string;
  titulo: string;
}

/** Projeto trazido por uma empresa (Pilar 2, §5). */
export interface Projeto {
  id: string;
  nome: string;
  tipo: string;
  empresaId: string;
  contatoNome: string;
  descricao: string;
  /** AAAA-MM-DD. A entrega nunca vem antes do início (§5). */
  inicio: string;
  /** AAAA-MM-DD */
  entrega: string;
  prioridade: Prioridade;
  /** id da pessoa que lidera o projeto. */
  liderId: string;
  /** Todo projeto nasce como 'planejado' (§5). */
  status: 'planejado' | 'andamento' | 'pausado' | 'concluido';
  cor: string; // fundo do quadro, como no Trello
  /**
   * Colunas do quadro, da esquerda para a direita.
   * ⚠️ ATENÇÃO: a ÚLTIMA coluna é tratada como "pronto" por lib/metricas.ts
   * (progressoProjeto) e lib/store.tsx (moverTarefa → concluidaEm).
   */
  colunas: Coluna[];
}

/** Alocação: liga uma pessoa a um projeto, com papel, período e carga (§5). */
export interface Alocacao {
  id: string;
  projetoId: string;
  pessoaId: string;
  /** Ex.: 'Líder', 'Front-end', 'QA'. */
  papel: string;
  /** AAAA-MM-DD */
  inicio: string;
  /** AAAA-MM-DD */
  fim: string;
  /** Horas por semana dedicadas a este projeto. */
  carga: number;
  obs: string;
}

/** Um item do checklist de uma tarefa. */
export interface ItemChecklist {
  id: string;
  texto: string;
  feito: boolean;
}

/** Comentário deixado em uma tarefa. */
export interface Comentario {
  id: string;
  /** id da pessoa que escreveu. */
  autorId: string;
  texto: string;
  data: string; // ISO
}

/** Tarefa do dia a dia, que vive numa coluna do quadro (§5). */
export interface Tarefa {
  id: string;
  projetoId: string;
  /** Em qual coluna do quadro a tarefa está. */
  colunaId: string;
  titulo: string;
  descricao: string;
  /** Obrigatório para criar (§5). */
  responsavelId: string;
  /** AAAA-MM-DD. Obrigatório para criar (§5). */
  prazo: string;
  prioridade: Prioridade;
  etiquetas: string[];
  checklist: ItemChecklist[];
  comentarios: Comentario[];
  /** Posição dentro da coluna (0 = topo). Renumerada por moverTarefa em lib/store.tsx. */
  ordem: number;
  /** AAAA-MM-DD em que entrou na última coluna; undefined enquanto não está pronta. */
  concluidaEm?: string;
}

/**
 * Todos os dados do sistema juntos — é o que a store guarda e o seed cria.
 * ⚠️ ATENÇÃO: adicionar/renomear coleção exige mudar o tipo `Salvavel` em lib/store.tsx e lib/seed.ts.
 */
export interface Dados {
  empresas: Empresa[];
  pessoas: Pessoa[];
  trilhas: Trilha[];
  projetos: Projeto[];
  alocacoes: Alocacao[];
  tarefas: Tarefa[];
}
