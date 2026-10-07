/* ============================================================================
   TIPOS DO DOMÍNIO CAIS
   Espelham o modelo descrito no deck: Empresa → Projeto → Alocação → Tarefa,
   e Trilha → Etapa. Quando a API da PROGLOGIC estiver pronta, ajuste os
   nomes dos campos aqui e o restante do código acusa o que precisa mudar.
   ============================================================================ */

export type Perfil = 'admin' | 'empresa' | 'profissional';
export type Prioridade = 'baixa' | 'media' | 'alta';

export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  segmento: string;
  porte: string;
  site: string;
  cep: string;
  logradouro: string;
  numero: string;
  cidadeUf: string;
  contatoNome: string;
  contatoEmail: string;
  contatoTelefone: string;
  contatoCargo: string;
  status: 'negociacao' | 'ativa' | 'encerrada';
  dataEntrada: string; // AAAA-MM-DD
}

export interface Pessoa {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  perfil: Perfil;
  status: 'convidado' | 'ativo' | 'inativo';
  dataEntrada: string;
  area: string;
  nivel: string;
  cargaMax: number;
  habilidades: string[];
  empresaId: string;
}

export type TipoEtapa = 'texto' | 'video' | 'pdf' | 'audio' | 'apresentacao' | 'link' | 'quiz';

export interface Etapa {
  id: string;
  titulo: string;
  tipo: TipoEtapa;
  obrigatoria: boolean;
  notaMinima: number; // só para quiz (0 a 100)
}

export interface Trilha {
  id: string;
  titulo: string;
  descricao: string;
  alcance: 'geral' | 'empresa' | 'profissional';
  empresaId: string;
  pessoaIds: string[];
  status: 'rascunho' | 'publicada';
  prazoDias: number;
  etapas: Etapa[];
  /** pessoaId → quantas etapas concluiu e nota do quiz */
  progresso: Record<string, { concluidas: number; nota?: number }>;
}

export interface Coluna {
  id: string;
  titulo: string;
}

export interface Projeto {
  id: string;
  nome: string;
  tipo: string;
  empresaId: string;
  contatoNome: string;
  descricao: string;
  inicio: string;
  entrega: string;
  prioridade: Prioridade;
  liderId: string;
  status: 'planejado' | 'andamento' | 'pausado' | 'concluido';
  cor: string; // fundo do quadro, como no Trello
  colunas: Coluna[];
}

export interface Alocacao {
  id: string;
  projetoId: string;
  pessoaId: string;
  papel: string;
  inicio: string;
  fim: string;
  carga: number;
  obs: string;
}

export interface ItemChecklist {
  id: string;
  texto: string;
  feito: boolean;
}

export interface Comentario {
  id: string;
  autorId: string;
  texto: string;
  data: string; // ISO
}

export interface Tarefa {
  id: string;
  projetoId: string;
  colunaId: string;
  titulo: string;
  descricao: string;
  responsavelId: string;
  prazo: string;
  prioridade: Prioridade;
  etiquetas: string[];
  checklist: ItemChecklist[];
  comentarios: Comentario[];
  ordem: number;
  concluidaEm?: string;
}

export interface Dados {
  empresas: Empresa[];
  pessoas: Pessoa[];
  trilhas: Trilha[];
  projetos: Projeto[];
  alocacoes: Alocacao[];
  tarefas: Tarefa[];
}
