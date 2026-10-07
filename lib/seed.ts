import type { Dados, Coluna } from './tipos';
import { hojeISO, somaDias } from './utils';

/* ============================================================================
   DADOS DE DEMONSTRAÇÃO (fictícios)
   As datas são geradas a partir de hoje, para que prazos, atrasos e
   alertas façam sentido sempre que o sistema for aberto.
   Quando a API existir, este arquivo deixa de ser usado.
   ============================================================================ */

export const COLUNAS_PADRAO: Coluna[] = [
  { id: 'col_afazer', titulo: 'A fazer' },
  { id: 'col_fazendo', titulo: 'Fazendo' },
  { id: 'col_revisao', titulo: 'Revisão' },
  { id: 'col_pronto', titulo: 'Pronto' },
];

export function criarSeed(): Dados {
  const h = hojeISO();
  const d = (n: number) => somaDias(h, n);
  const agoraMenos = (horas: number) => new Date(Date.now() - horas * 3600000).toISOString();

  return {
    empresas: [
      { id: 'emp_vertice', razaoSocial: 'Vértice Logística Integrada Ltda.', nomeFantasia: 'Vértice Logística', cnpj: '11.222.333/0001-81', segmento: 'Logística', porte: 'Médio', site: 'https://vertice.example', cep: '50030-230', logradouro: 'Av. Rio Branco', numero: '120', cidadeUf: 'Recife / PE', contatoNome: 'Marcos Vieira', contatoEmail: 'marcos@vertice.example', contatoTelefone: '(81) 99876-1122', contatoCargo: 'Gerente de TI', status: 'ativa', dataEntrada: d(-60) },
      { id: 'emp_aurora', razaoSocial: 'Aurora Saúde e Bem-Estar S.A.', nomeFantasia: 'Aurora Saúde', cnpj: '45.678.901/0001-75', segmento: 'Saúde', porte: 'Grande', site: 'https://aurora.example', cep: '52011-000', logradouro: 'Rua da Aurora', numero: '455', cidadeUf: 'Recife / PE', contatoNome: 'Patrícia Melo', contatoEmail: 'patricia@aurora.example', contatoTelefone: '(81) 98765-3344', contatoCargo: 'Diretora de Produto', status: 'ativa', dataEntrada: d(-30) },
      { id: 'emp_mare', razaoSocial: 'Maré Alta Comércio Varejista Ltda.', nomeFantasia: 'Maré Alta Varejo', cnpj: '90.817.263/0001-80', segmento: 'Varejo', porte: 'Pequeno', site: '', cep: '', logradouro: '', numero: '', cidadeUf: 'Olinda / PE', contatoNome: 'Rafael Costa', contatoEmail: 'rafael@marealta.example', contatoTelefone: '(81) 99111-2233', contatoCargo: 'Sócio', status: 'negociacao', dataEntrada: d(-5) },
      { id: 'emp_agro', razaoSocial: 'Nordeste Agro Tecnologia Ltda.', nomeFantasia: 'Nordeste Agro', cnpj: '33.445.566/0001-86', segmento: 'Agronegócio', porte: 'Médio', site: 'https://nordesteagro.example', cep: '', logradouro: '', numero: '', cidadeUf: 'Petrolina / PE', contatoNome: 'Júlia Farias', contatoEmail: 'julia@nordesteagro.example', contatoTelefone: '(87) 99222-4455', contatoCargo: 'Coordenadora', status: 'encerrada', dataEntrada: d(-200) },
    ],
    pessoas: [
      { id: 'pes_admin', nome: 'Administrador CAIS', email: 'admin@cais.com.br', telefone: '', cargo: 'Coordenação do programa', perfil: 'admin', status: 'ativo', dataEntrada: d(-120), area: '', nivel: '', cargaMax: 40, habilidades: [], empresaId: '' },
      { id: 'pes_ana', nome: 'Ana Souza', email: 'ana.souza@cais.example', telefone: '(81) 99000-0001', cargo: 'Desenvolvedora', perfil: 'profissional', status: 'ativo', dataEntrada: d(-90), area: 'Front-end', nivel: 'Pleno', cargaMax: 40, habilidades: ['React', 'TypeScript', 'Liderança'], empresaId: '' },
      { id: 'pes_bruno', nome: 'Bruno Lima', email: 'bruno.lima@cais.example', telefone: '(81) 99000-0002', cargo: 'Desenvolvedor', perfil: 'profissional', status: 'ativo', dataEntrada: d(-80), area: 'Front-end', nivel: 'Júnior', cargaMax: 40, habilidades: ['React', 'CSS'], empresaId: '' },
      { id: 'pes_carla', nome: 'Carla Nunes', email: 'carla.nunes@cais.example', telefone: '(81) 99000-0003', cargo: 'Designer', perfil: 'profissional', status: 'ativo', dataEntrada: d(-70), area: 'UX', nivel: 'Pleno', cargaMax: 40, habilidades: ['Figma', 'Pesquisa'], empresaId: '' },
      { id: 'pes_diego', nome: 'Diego Alves', email: 'diego.alves@cais.example', telefone: '(81) 99000-0004', cargo: 'Analista de testes', perfil: 'profissional', status: 'ativo', dataEntrada: d(-60), area: 'QA', nivel: 'Júnior', cargaMax: 40, habilidades: ['Testes', 'Cypress'], empresaId: '' },
      { id: 'pes_elisa', nome: 'Elisa Rocha', email: 'elisa.rocha@cais.example', telefone: '(81) 99000-0005', cargo: 'Desenvolvedora', perfil: 'profissional', status: 'ativo', dataEntrada: d(-20), area: 'Front-end', nivel: 'Júnior', cargaMax: 30, habilidades: ['JavaScript'], empresaId: '' },
      { id: 'pes_felipe', nome: 'Felipe Andrade', email: 'felipe.andrade@cais.example', telefone: '(81) 99000-0006', cargo: 'Desenvolvedor', perfil: 'profissional', status: 'convidado', dataEntrada: d(-2), area: 'Back-end', nivel: 'Estágio', cargaMax: 20, habilidades: ['Python'], empresaId: '' },
      { id: 'pes_marcos', nome: 'Marcos Vieira', email: 'marcos@vertice.example', telefone: '(81) 99876-1122', cargo: 'Gerente de TI', perfil: 'empresa', status: 'ativo', dataEntrada: d(-60), area: '', nivel: '', cargaMax: 0, habilidades: [], empresaId: 'emp_vertice' },
      { id: 'pes_patricia', nome: 'Patrícia Melo', email: 'patricia@aurora.example', telefone: '(81) 98765-3344', cargo: 'Diretora de Produto', perfil: 'empresa', status: 'ativo', dataEntrada: d(-30), area: '', nivel: '', cargaMax: 0, habilidades: [], empresaId: 'emp_aurora' },
    ],
    trilhas: [
      {
        id: 'tri_boasvindas', titulo: 'Boas-vindas ao programa', descricao: 'Como a residência funciona, código de conduta e ferramentas do dia a dia.',
        alcance: 'geral', empresaId: '', pessoaIds: [], status: 'publicada', prazoDias: 7,
        etapas: [
          { id: 'et_1', titulo: 'Boas-vindas', tipo: 'texto', obrigatoria: true, notaMinima: 0 },
          { id: 'et_2', titulo: 'Como funciona o programa', tipo: 'video', obrigatoria: true, notaMinima: 0 },
          { id: 'et_3', titulo: 'Código de conduta', tipo: 'pdf', obrigatoria: true, notaMinima: 0 },
          { id: 'et_4', titulo: 'Verificação de leitura', tipo: 'quiz', obrigatoria: true, notaMinima: 70 },
          { id: 'et_5', titulo: 'Ferramentas do dia a dia', tipo: 'apresentacao', obrigatoria: false, notaMinima: 0 },
        ],
        progresso: { pes_ana: { concluidas: 5, nota: 92 }, pes_bruno: { concluidas: 5, nota: 78 }, pes_carla: { concluidas: 5, nota: 85 }, pes_diego: { concluidas: 5, nota: 74 }, pes_elisa: { concluidas: 3 }, pes_felipe: { concluidas: 0 } },
      },
      {
        id: 'tri_vertice', titulo: 'Processos da Vértice', descricao: 'Regras internas, ferramentas e o fluxo de entregas do cliente.',
        alcance: 'empresa', empresaId: 'emp_vertice', pessoaIds: [], status: 'publicada', prazoDias: 10,
        etapas: [
          { id: 'et_v1', titulo: 'Quem é a Vértice', tipo: 'apresentacao', obrigatoria: true, notaMinima: 0 },
          { id: 'et_v2', titulo: 'Ferramentas e acessos', tipo: 'texto', obrigatoria: true, notaMinima: 0 },
          { id: 'et_v3', titulo: 'Checagem de processos', tipo: 'quiz', obrigatoria: true, notaMinima: 70 },
        ],
        progresso: { pes_ana: { concluidas: 3, nota: 88 }, pes_bruno: { concluidas: 3, nota: 71 }, pes_carla: { concluidas: 2 }, pes_diego: { concluidas: 3, nota: 80 } },
      },
      {
        id: 'tri_nivel_front', titulo: 'Nivelamento de front-end', descricao: 'React, TypeScript e o design system do CAIS.',
        alcance: 'profissional', empresaId: '', pessoaIds: ['pes_bruno', 'pes_elisa', 'pes_felipe'], status: 'publicada', prazoDias: 21,
        etapas: [
          { id: 'et_n1', titulo: 'Componentes e props', tipo: 'video', obrigatoria: true, notaMinima: 0 },
          { id: 'et_n2', titulo: 'Estado e efeitos', tipo: 'video', obrigatoria: true, notaMinima: 0 },
          { id: 'et_n3', titulo: 'Tipagem com TypeScript', tipo: 'link', obrigatoria: true, notaMinima: 0 },
          { id: 'et_n4', titulo: 'Design system CAIS', tipo: 'texto', obrigatoria: true, notaMinima: 0 },
          { id: 'et_n5', titulo: 'Prova prática', tipo: 'quiz', obrigatoria: true, notaMinima: 70 },
        ],
        progresso: { pes_bruno: { concluidas: 4 }, pes_elisa: { concluidas: 1 }, pes_felipe: { concluidas: 0 } },
      },
      {
        id: 'tri_lgpd', titulo: 'LGPD na prática', descricao: 'Como tratar dados pessoais nos projetos dos clientes.',
        alcance: 'geral', empresaId: '', pessoaIds: [], status: 'rascunho', prazoDias: 14,
        etapas: [
          { id: 'et_l1', titulo: 'O que a lei exige', tipo: 'pdf', obrigatoria: true, notaMinima: 0 },
          { id: 'et_l2', titulo: 'Casos reais', tipo: 'audio', obrigatoria: false, notaMinima: 0 },
        ],
        progresso: {},
      },
    ],
    projetos: [
      { id: 'prj_portal', nome: 'Portal de pedidos', tipo: 'Aplicação web', empresaId: 'emp_vertice', contatoNome: 'Marcos Vieira', descricao: 'Portal para os clientes da Vértice acompanharem pedidos, entregas e notas fiscais em tempo real.', inicio: d(-14), entrega: d(45), prioridade: 'alta', liderId: 'pes_ana', status: 'andamento', cor: 'roxo', colunas: COLUNAS_PADRAO },
      { id: 'prj_estoque', nome: 'Painel de estoque', tipo: 'Dashboard', empresaId: 'emp_vertice', contatoNome: 'Marcos Vieira', descricao: 'Painel interno com níveis de estoque por centro de distribuição.', inicio: d(-7), entrega: d(30), prioridade: 'media', liderId: 'pes_bruno', status: 'andamento', cor: 'verde', colunas: COLUNAS_PADRAO },
      { id: 'prj_agenda', nome: 'App de agendamento', tipo: 'Aplicativo móvel', empresaId: 'emp_aurora', contatoNome: 'Patrícia Melo', descricao: 'Agendamento de consultas pelo celular, com lembretes e confirmação.', inicio: d(7), entrega: d(80), prioridade: 'media', liderId: 'pes_carla', status: 'planejado', cor: 'ambar', colunas: COLUNAS_PADRAO },
    ],
    alocacoes: [
      { id: 'alo_1', projetoId: 'prj_portal', pessoaId: 'pes_ana', papel: 'Líder', inicio: d(-14), fim: d(45), carga: 20, obs: '' },
      { id: 'alo_2', projetoId: 'prj_portal', pessoaId: 'pes_bruno', papel: 'Front-end', inicio: d(-14), fim: d(45), carga: 30, obs: '' },
      { id: 'alo_3', projetoId: 'prj_portal', pessoaId: 'pes_carla', papel: 'UX', inicio: d(-9), fim: d(20), carga: 15, obs: '' },
      { id: 'alo_4', projetoId: 'prj_portal', pessoaId: 'pes_diego', papel: 'QA', inicio: d(0), fim: d(45), carga: 20, obs: '' },
      { id: 'alo_5', projetoId: 'prj_estoque', pessoaId: 'pes_bruno', papel: 'Líder', inicio: d(-7), fim: d(30), carga: 15, obs: 'Soma com o Portal passa de 40 h.' },
      { id: 'alo_6', projetoId: 'prj_estoque', pessoaId: 'pes_elisa', papel: 'Front-end', inicio: d(-7), fim: d(30), carga: 20, obs: '' },
      { id: 'alo_7', projetoId: 'prj_agenda', pessoaId: 'pes_carla', papel: 'Líder', inicio: d(7), fim: d(80), carga: 15, obs: '' },
    ],
    tarefas: [
      { id: 'tar_1', projetoId: 'prj_portal', colunaId: 'col_afazer', titulo: 'Tela de login', descricao: 'Tela de acesso com e-mail e senha, estados de erro e link para recuperar a senha.', responsavelId: 'pes_bruno', prazo: d(15), prioridade: 'alta', etiquetas: ['Front', 'Login'], checklist: [{ id: 'c1', texto: 'Layout aprovado', feito: true }, { id: 'c2', texto: 'Estados de erro', feito: true }, { id: 'c3', texto: 'Versão para celular', feito: false }, { id: 'c4', texto: 'Ligar à API real', feito: false }], comentarios: [{ id: 'm1', autorId: 'pes_ana', texto: 'Falta o estado de senha errada.', data: agoraMenos(2) }], ordem: 0 },
      { id: 'tar_2', projetoId: 'prj_portal', colunaId: 'col_afazer', titulo: 'Ficha da empresa', descricao: '', responsavelId: 'pes_carla', prazo: d(17), prioridade: 'media', etiquetas: ['Front'], checklist: Array.from({ length: 6 }, (_, i) => ({ id: 'f' + i, texto: `Item ${i + 1}`, feito: false })), comentarios: [], ordem: 1 },
      { id: 'tar_3', projetoId: 'prj_portal', colunaId: 'col_afazer', titulo: 'Contrato da API de tarefas', descricao: 'Alinhar com a PROGLOGIC os campos e códigos de erro.', responsavelId: 'pes_ana', prazo: d(21), prioridade: 'media', etiquetas: ['API'], checklist: [{ id: 'a1', texto: 'Listar endpoints', feito: false }, { id: 'a2', texto: 'Definir paginação', feito: false }, { id: 'a3', texto: 'Revisar com o back', feito: false }], comentarios: [], ordem: 2 },
      { id: 'tar_4', projetoId: 'prj_portal', colunaId: 'col_fazendo', titulo: 'Shell da aplicação', descricao: 'Menu lateral, topo com busca, avisos e perfil.', responsavelId: 'pes_bruno', prazo: d(-2), prioridade: 'alta', etiquetas: ['Front'], checklist: [{ id: 's1', texto: 'Menu', feito: true }, { id: 's2', texto: 'Topo', feito: true }, { id: 's3', texto: 'Busca', feito: true }, { id: 's4', texto: 'Avisos', feito: false }, { id: 's5', texto: 'Celular', feito: false }], comentarios: [], ordem: 0 },
      { id: 'tar_5', projetoId: 'prj_portal', colunaId: 'col_fazendo', titulo: 'Design system: botões', descricao: '', responsavelId: 'pes_carla', prazo: d(3), prioridade: 'media', etiquetas: ['UX'], checklist: [{ id: 'b1', texto: 'Primário', feito: true }, { id: 'b2', texto: 'Secundário', feito: true }, { id: 'b3', texto: 'Perigo', feito: false }], comentarios: [], ordem: 1 },
      { id: 'tar_6', projetoId: 'prj_portal', colunaId: 'col_fazendo', titulo: 'Ficha do projeto', descricao: '', responsavelId: 'pes_ana', prazo: d(18), prioridade: 'alta', etiquetas: ['Front'], checklist: [{ id: 'p1', texto: 'Abas', feito: true }, { id: 'p2', texto: 'Equipe', feito: false }, { id: 'p3', texto: 'Tarefas', feito: false }, { id: 'p4', texto: 'Arquivos', feito: false }, { id: 'p5', texto: 'Celular', feito: false }], comentarios: [], ordem: 2 },
      { id: 'tar_7', projetoId: 'prj_portal', colunaId: 'col_revisao', titulo: 'Cadastro de empresa', descricao: 'Máscara de CNPJ, CEP e validação ao sair do campo.', responsavelId: 'pes_bruno', prazo: d(5), prioridade: 'media', etiquetas: ['Front'], checklist: [{ id: 'e1', texto: 'Campos', feito: true }, { id: 'e2', texto: 'Máscaras', feito: true }, { id: 'e3', texto: 'Validação', feito: true }, { id: 'e4', texto: 'Lista', feito: true }], comentarios: [], ordem: 0 },
      { id: 'tar_8', projetoId: 'prj_portal', colunaId: 'col_pronto', titulo: 'Wireframes dos cadastros', descricao: '', responsavelId: 'pes_carla', prazo: d(-6), prioridade: 'media', etiquetas: ['UX'], checklist: Array.from({ length: 6 }, (_, i) => ({ id: 'w' + i, texto: `Tela ${i + 1}`, feito: true })), comentarios: [], ordem: 0, concluidaEm: d(-7) },
      { id: 'tar_9', projetoId: 'prj_portal', colunaId: 'col_pronto', titulo: 'Guia de estilo v1', descricao: '', responsavelId: 'pes_carla', prazo: d(-10), prioridade: 'baixa', etiquetas: ['UX'], checklist: [{ id: 'g1', texto: 'Cores', feito: true }, { id: 'g2', texto: 'Tipografia', feito: true }, { id: 'g3', texto: 'Ícones', feito: true }], comentarios: [], ordem: 1, concluidaEm: d(-11) },
      { id: 'tar_10', projetoId: 'prj_estoque', colunaId: 'col_afazer', titulo: 'Gráfico por centro de distribuição', descricao: '', responsavelId: 'pes_elisa', prazo: d(12), prioridade: 'media', etiquetas: ['Front', 'Gráfico'], checklist: [], comentarios: [], ordem: 0 },
      { id: 'tar_11', projetoId: 'prj_estoque', colunaId: 'col_fazendo', titulo: 'Filtro por período', descricao: '', responsavelId: 'pes_bruno', prazo: d(-1), prioridade: 'alta', etiquetas: ['Front'], checklist: [{ id: 'x1', texto: 'Seletor de datas', feito: true }, { id: 'x2', texto: 'Aplicar na API', feito: false }], comentarios: [], ordem: 0 },
      { id: 'tar_12', projetoId: 'prj_estoque', colunaId: 'col_pronto', titulo: 'Protótipo navegável', descricao: '', responsavelId: 'pes_elisa', prazo: d(-3), prioridade: 'media', etiquetas: ['UX'], checklist: [], comentarios: [], ordem: 0, concluidaEm: d(-4) },
    ],
  };
}
