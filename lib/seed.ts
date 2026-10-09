/* ============================================================================
   SEED (DADOS DE DEMONSTRAÇÃO, FICTÍCIOS)
   O que é: cria o conjunto inicial de empresas, pessoas, trilhas, projetos, alocações e tarefas do protótipo.
   Onde é usado: lib/store.tsx (estado inicial e "Restaurar demonstração" do Topbar) e components/projetos/FormProjeto.tsx (COLUNAS_PADRAO).
   Depende de: lib/tipos.ts (Dados, Coluna), lib/utils.ts (hojeISO, somaDias) e lib/carga.ts (segundaDaSemana, para alinhar o cenário da Elisa às semanas).
   Contexto: §5 (as 4 colunas padrão do quadro), §16 (Bruno passa de 40 h de propósito, para mostrar o aviso de carga).
   ============================================================================ */

import type { Dados, Coluna } from './tipos';
import { hojeISO, somaDias } from './utils';
import { segundaDaSemana } from './carga';

/*
 * As datas são geradas a partir de hoje, para que prazos, atrasos e
 * alertas façam sentido sempre que o sistema for aberto.
 * Quando a API existir, este arquivo deixa de ser usado.
 * TODO(API): apagar este arquivo quando os dados vierem da API da PROGLOGIC.
 */

// [PV-1] As listas padrão de todo projeto novo: A fazer, Fazendo, Revisão, Pronto. A penúltima e a última são as que aceitam aprovação da empresa.
/**
 * As quatro colunas com que todo projeto nasce (§5): A fazer, Fazendo, Revisão, Pronto.
 * ⚠️ ATENÇÃO: a ÚLTIMA coluna conta como "pronto" em lib/metricas.ts e lib/store.tsx;
 * mudar a ordem muda o que é considerado concluído. Usada também em FormProjeto.
 */
export const COLUNAS_PADRAO: Coluna[] = [
  { id: 'col_afazer', titulo: 'A fazer' },
  { id: 'col_fazendo', titulo: 'Fazendo' },
  { id: 'col_revisao', titulo: 'Revisão' },
  { id: 'col_pronto', titulo: 'Pronto' },
];

// [PV-2] OS DADOS DE DEMONSTRAÇÃO inteiros (empresas, pessoas, trilhas, projetos, alocações, tarefas). Mudou o seed de forma incompatível? Suba a CHAVE em lib/store.tsx.
/**
 * Monta os dados de demonstração com datas relativas ao dia de hoje.
 * Cada chamada gera um objeto novo (nada é compartilhado entre chamadas).
 * @returns um objeto `Dados` completo, pronto para a store.
 * @example const dados = criarSeed(); dados.projetos.length // 3
 */
// SIMULADO: tudo aqui é fictício (domínios .example, CNPJs de teste).
export function criarSeed(): Dados {
  const h = hojeISO();
  // Atalho: d(-14) = 14 dias atrás; d(45) = daqui a 45 dias (AAAA-MM-DD).
  const d = (n: number) => somaDias(h, n);
  // Segunda-feira daqui a 2 semanas: o cenário da Elisa (F02) ocupa exatamente as semanas que começam nela e na seguinte.
  const s2 = somaDias(segundaDaSemana(h), 14);
  // Data-hora ISO de "N horas atrás", usada nos comentários (3600000 ms = 1 h).
  const agoraMenos = (horas: number) => new Date(Date.now() - horas * 3600000).toISOString();

  return {
    // [PV-3] As empresas de exemplo (ativa, em negociação, encerrada). CNPJs e domínios são fictícios.
    // Quatro empresas em situações diferentes (ativa, em negociação, encerrada) para testar filtros e etiquetas.
    empresas: [
      { id: 'emp_vertice', razaoSocial: 'Vértice Logística Integrada Ltda.', nomeFantasia: 'Vértice Logística', cnpj: '11.222.333/0001-81', segmento: 'Logística', porte: 'Médio', site: 'https://vertice.example', cep: '50030-230', logradouro: 'Av. Rio Branco', numero: '120', cidadeUf: 'Recife / PE', contatoNome: 'Marcos Vieira', contatoEmail: 'marcos@vertice.example', contatoTelefone: '(81) 99876-1122', contatoCargo: 'Gerente de TI', status: 'ativa', dataEntrada: d(-60) },
      { id: 'emp_aurora', razaoSocial: 'Aurora Saúde e Bem-Estar S.A.', nomeFantasia: 'Aurora Saúde', cnpj: '45.678.901/0001-75', segmento: 'Saúde', porte: 'Grande', site: 'https://aurora.example', cep: '52011-000', logradouro: 'Rua da Aurora', numero: '455', cidadeUf: 'Recife / PE', contatoNome: 'Patrícia Melo', contatoEmail: 'patricia@aurora.example', contatoTelefone: '(81) 98765-3344', contatoCargo: 'Diretora de Produto', status: 'ativa', dataEntrada: d(-30) },
      { id: 'emp_mare', razaoSocial: 'Maré Alta Comércio Varejista Ltda.', nomeFantasia: 'Maré Alta Varejo', cnpj: '90.817.263/0001-80', segmento: 'Varejo', porte: 'Pequeno', site: '', cep: '', logradouro: '', numero: '', cidadeUf: 'Olinda / PE', contatoNome: 'Rafael Costa', contatoEmail: 'rafael@marealta.example', contatoTelefone: '(81) 99111-2233', contatoCargo: 'Sócio', status: 'negociacao', dataEntrada: d(-5) },
      { id: 'emp_agro', razaoSocial: 'Nordeste Agro Tecnologia Ltda.', nomeFantasia: 'Nordeste Agro', cnpj: '33.445.566/0001-86', segmento: 'Agronegócio', porte: 'Médio', site: 'https://nordesteagro.example', cep: '', logradouro: '', numero: '', cidadeUf: 'Petrolina / PE', contatoNome: 'Júlia Farias', contatoEmail: 'julia@nordesteagro.example', contatoTelefone: '(87) 99222-4455', contatoCargo: 'Coordenadora', status: 'encerrada', dataEntrada: d(-200) },
    ],
    // [PV-4] As pessoas de exemplo e as CONTAS de login (admin, profissionais, empresas). O cargaMax de cada uma é o limite do semáforo. Conta nova: acrescente também em CONTAS_DEMO (lib/auth.tsx).
    // Pessoas dos três perfis. pes_admin, pes_ana e pes_marcos batem com as contas SIMULADAS de lib/auth.tsx.
    // ⚠️ ATENÇÃO: mudar esses ids ou e-mails desencontra o login de demonstração e o cadastro.
    pessoas: [
      { id: 'pes_admin', nome: 'Administrador CAIS', email: 'admin@cais.com.br', telefone: '', cargo: 'Coordenação do programa', perfil: 'admin', status: 'ativo', dataEntrada: d(-120), area: '', nivel: '', cargaMax: 40, habilidades: [], empresaId: '' },
      { id: 'pes_ana', nome: 'Ana Souza', email: 'ana.souza@cais.example', telefone: '(81) 99000-0001', cargo: 'Desenvolvedora', perfil: 'profissional', status: 'ativo', dataEntrada: d(-90), area: 'Front-end', nivel: 'Pleno', cargaMax: 40, habilidades: ['React', 'TypeScript', 'Liderança'], empresaId: '' },
      { id: 'pes_bruno', nome: 'Bruno Lima', email: 'bruno.lima@cais.example', telefone: '(81) 99000-0002', cargo: 'Desenvolvedor', perfil: 'profissional', status: 'ativo', dataEntrada: d(-80), area: 'Front-end', nivel: 'Júnior', cargaMax: 40, habilidades: ['React', 'CSS'], empresaId: '' },
      { id: 'pes_carla', nome: 'Carla Nunes', email: 'carla.nunes@cais.example', telefone: '(81) 99000-0003', cargo: 'Designer', perfil: 'profissional', status: 'ativo', dataEntrada: d(-70), area: 'UX', nivel: 'Pleno', cargaMax: 40, habilidades: ['Figma', 'Pesquisa'], empresaId: '' },
      { id: 'pes_diego', nome: 'Diego Alves', email: 'diego.alves@cais.example', telefone: '(81) 99000-0004', cargo: 'Analista de testes', perfil: 'profissional', status: 'ativo', dataEntrada: d(-60), area: 'QA', nivel: 'Júnior', cargaMax: 40, habilidades: ['Testes', 'Cypress'], empresaId: '' },
      { id: 'pes_elisa', nome: 'Elisa Rocha', email: 'elisa.rocha@cais.example', telefone: '(81) 99000-0005', cargo: 'Desenvolvedora', perfil: 'profissional', status: 'ativo', dataEntrada: d(-20), area: 'Front-end', nivel: 'Júnior', cargaMax: 30, habilidades: ['JavaScript'], empresaId: '' },
      { id: 'pes_felipe', nome: 'Felipe Andrade', email: 'felipe.andrade@cais.example', telefone: '(81) 99000-0006', cargo: 'Desenvolvedor', perfil: 'profissional', status: 'convidado', dataEntrada: d(-2), area: 'Back-end', nivel: 'Estágio', cargaMax: 20, habilidades: ['Python'], empresaId: '' },
      // Semáforo (F02): profissional ativa e totalmente livre nas próximas semanas (nenhuma alocação), para a tela /carga mostrar o nível "Livre".
      { id: 'pes_gabriela', nome: 'Gabriela Costa', email: 'gabriela.costa@cais.example', telefone: '(81) 99000-0007', cargo: 'Desenvolvedora', perfil: 'profissional', status: 'ativo', dataEntrada: d(-40), area: 'Back-end', nivel: 'Pleno', cargaMax: 40, habilidades: ['Node.js', 'SQL'], empresaId: '' },
      { id: 'pes_marcos', nome: 'Marcos Vieira', email: 'marcos@vertice.example', telefone: '(81) 99876-1122', cargo: 'Gerente de TI', perfil: 'empresa', status: 'ativo', dataEntrada: d(-60), area: '', nivel: '', cargaMax: 0, habilidades: [], empresaId: 'emp_vertice' },
      { id: 'pes_patricia', nome: 'Patrícia Melo', email: 'patricia@aurora.example', telefone: '(81) 98765-3344', cargo: 'Diretora de Produto', perfil: 'empresa', status: 'ativo', dataEntrada: d(-30), area: '', nivel: '', cargaMax: 0, habilidades: [], empresaId: 'emp_aurora' },
    ],
    // [PV-5] As trilhas de exemplo, com conteúdo, quizzes, prazos e datas de conclusão. As datas de publicação criam prazo vencido, perto e no prazo para a demonstração.
    // Uma trilha de cada alcance (geral, empresa, profissional) + um rascunho, para o painel ter todos os casos (§4).
    trilhas: [
      {
        id: 'tri_boasvindas', titulo: 'Boas-vindas ao programa', descricao: 'Como a residência funciona, código de conduta e ferramentas do dia a dia.',
        // publicadaEm d(-45) + 7 dias: a Elisa (entrou em d(-20)) está com o prazo VENCIDO; serve de exemplo para o aviso.
        alcance: 'geral', empresaId: '', pessoaIds: [], status: 'publicada', prazoDias: 7, publicadaEm: d(-45),
        etapas: [
          { id: 'et_1', titulo: 'Boas-vindas', tipo: 'texto', obrigatoria: true, notaMinima: 0,
            conteudo: { texto: 'Que bom ter você aqui! A residência junta formação e prática: você faz as trilhas, é alocado em projetos de empresas parceiras e acompanha a própria evolução no painel. Leia as próximas etapas com calma; algumas travam a seguinte até serem concluídas.' } },
          { id: 'et_2', titulo: 'Como funciona o programa', tipo: 'video', obrigatoria: true, notaMinima: 0,
            conteudo: { texto: 'Vídeo de 8 minutos com o caminho completo: trilha, alocação e entrega.', url: 'https://example.com/videos/como-funciona' } },
          { id: 'et_3', titulo: 'Código de conduta', tipo: 'pdf', obrigatoria: true, notaMinima: 0,
            conteudo: { texto: 'Leia o documento inteiro: o quiz da próxima etapa é sobre ele.', url: 'https://example.com/docs/codigo-de-conduta.pdf' } },
          { id: 'et_4', titulo: 'Verificação de leitura', tipo: 'quiz', obrigatoria: true, notaMinima: 70, tentativasMax: 3,
            conteudo: { texto: 'Quatro perguntas sobre o código de conduta. Você precisa de 70% para seguir.' },
            perguntas: [
              { id: 'q_bv1', enunciado: 'Você encontrou um problema no projeto do cliente fora do seu escopo. O que fazer?', alternativas: ['Corrigir sem avisar ninguém', 'Registrar e avisar o responsável pelo projeto', 'Ignorar, não é sua tarefa'], correta: 1 },
              { id: 'q_bv2', enunciado: 'Dados pessoais de clientes podem ser copiados para o seu computador pessoal?', alternativas: ['Sim, se for para testar', 'Só com autorização do administrador', 'Não, nunca'], correta: 2 },
              { id: 'q_bv3', enunciado: 'Onde o andamento das suas tarefas deve ficar registrado?', alternativas: ['No quadro do projeto no CAIS', 'Numa planilha própria', 'Só na conversa com o time'], correta: 0 },
              { id: 'q_bv4', enunciado: 'Quem você procura quando uma trilha obrigatória está atrasada?', alternativas: ['Ninguém, ela some sozinha', 'O administrador do programa', 'A empresa do projeto'], correta: 1 },
            ] },
          { id: 'et_5', titulo: 'Ferramentas do dia a dia', tipo: 'apresentacao', obrigatoria: false, notaMinima: 0,
            conteudo: { texto: 'Slides com as ferramentas que o time usa: CAIS, repositório e canal de mensagens.', url: 'https://example.com/slides/ferramentas' } },
        ],
        // concluidaEm (G01): quando cada pessoa terminou a trilha; alimenta "trilhas concluídas no período" e a evolução da turma no painel do admin.
        progresso: { pes_ana: { concluidas: 5, nota: 92, tentativas: 1, concluidaEm: d(-40) }, pes_bruno: { concluidas: 5, nota: 78, tentativas: 2, concluidaEm: d(-33) }, pes_carla: { concluidas: 5, nota: 85, tentativas: 1, concluidaEm: d(-26) }, pes_diego: { concluidas: 5, nota: 74, tentativas: 2, concluidaEm: d(-12) }, pes_elisa: { concluidas: 3 }, pes_felipe: { concluidas: 0 }, pes_gabriela: { concluidas: 5, nota: 90, tentativas: 1, concluidaEm: d(-5) } },
      },
      {
        id: 'tri_vertice', titulo: 'Processos da Vértice', descricao: 'Regras internas, ferramentas e o fluxo de entregas do cliente.',
        // publicadaEm d(-8) + 10 dias: a Carla (2 de 3) está com o prazo PERTO de vencer (faltam 2 dias).
        alcance: 'empresa', empresaId: 'emp_vertice', pessoaIds: [], status: 'publicada', prazoDias: 10, publicadaEm: d(-8),
        etapas: [
          { id: 'et_v1', titulo: 'Quem é a Vértice', tipo: 'apresentacao', obrigatoria: true, notaMinima: 0,
            conteudo: { texto: 'Quem são, o que vendem e por que o portal de pedidos importa para eles.', url: 'https://example.com/slides/vertice' } },
          { id: 'et_v2', titulo: 'Ferramentas e acessos', tipo: 'texto', obrigatoria: true, notaMinima: 0,
            conteudo: { texto: 'A Vértice usa o próprio repositório e um ambiente de homologação. Os acessos são pedidos ao Marcos Vieira (Gerente de TI) e chegam em até 2 dias úteis. Toda entrega passa por revisão do time deles antes de ir para produção.' } },
          { id: 'et_v3', titulo: 'Checagem de processos', tipo: 'quiz', obrigatoria: true, notaMinima: 70, tentativasMax: 2,
            conteudo: { texto: 'Três perguntas sobre o fluxo de entregas da Vértice.' },
            perguntas: [
              { id: 'q_v1', enunciado: 'Quem libera os acessos aos sistemas da Vértice?', alternativas: ['O administrador do CAIS', 'O Marcos Vieira, Gerente de TI', 'Qualquer pessoa do time'], correta: 1 },
              { id: 'q_v2', enunciado: 'Antes de ir para produção, a entrega precisa de quê?', alternativas: ['Revisão do time da Vértice', 'Nada, sobe direto', 'Aprovação do profissional mais antigo'], correta: 0 },
              { id: 'q_v3', enunciado: 'Onde se testa uma mudança antes da entrega?', alternativas: ['Em produção, com cuidado', 'No ambiente de homologação', 'Só no computador de quem fez'], correta: 1 },
            ] },
        ],
        progresso: { pes_ana: { concluidas: 3, nota: 88, tentativas: 1, concluidaEm: d(-6) }, pes_bruno: { concluidas: 3, nota: 71, tentativas: 2, concluidaEm: d(-4) }, pes_carla: { concluidas: 2 }, pes_diego: { concluidas: 3, nota: 80, tentativas: 1, concluidaEm: d(-2) } },
      },
      {
        id: 'tri_nivel_front', titulo: 'Nivelamento de front-end', descricao: 'React, TypeScript e o design system do CAIS.',
        // publicadaEm d(-14) + 21 dias: prazo em d(+7) para a Ana, o Bruno e a Elisa (NO PRAZO); o Felipe conta da entrada, d(-2).
        // A Ana (conta de demonstração do profissional) está no meio desta trilha (2 de 5), para "Minhas trilhas" ter uma em andamento.
        alcance: 'profissional', empresaId: '', pessoaIds: ['pes_ana', 'pes_bruno', 'pes_elisa', 'pes_felipe'], status: 'publicada', prazoDias: 21, publicadaEm: d(-14),
        etapas: [
          { id: 'et_n1', titulo: 'Componentes e props', tipo: 'video', obrigatoria: true, notaMinima: 0,
            conteudo: { texto: 'Como quebrar uma tela em componentes e passar dados por props.', url: 'https://example.com/videos/componentes-e-props' } },
          { id: 'et_n2', titulo: 'Estado e efeitos', tipo: 'video', obrigatoria: true, notaMinima: 0,
            conteudo: { texto: 'useState, useEffect e quando cada um é a escolha certa.', url: 'https://example.com/videos/estado-e-efeitos' } },
          { id: 'et_n3', titulo: 'Tipagem com TypeScript', tipo: 'link', obrigatoria: true, notaMinima: 0,
            conteudo: { texto: 'Leia a seção "Everyday Types" do manual oficial.', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html' } },
          { id: 'et_n4', titulo: 'Design system CAIS', tipo: 'texto', obrigatoria: true, notaMinima: 0,
            conteudo: { texto: 'No CAIS, cor é sempre token (bg-superficie, text-tinta, text-primaria...), nunca hex solto. Cor tem significado: verde é sucesso, âmbar é atenção, vermelho é erro e roxo é ação. Toda tela tem quatro estados: carregando, vazio, com erro e com dado. A página viva fica em /design-system.' } },
          { id: 'et_n5', titulo: 'Prova prática', tipo: 'quiz', obrigatoria: true, notaMinima: 70, tentativasMax: 3,
            conteudo: { texto: 'Cinco perguntas sobre React, TypeScript e o design system.' },
            perguntas: [
              { id: 'q_n1', enunciado: 'Como um componente pai envia dados para o filho?', alternativas: ['Por props', 'Por variável global', 'Pelo localStorage'], correta: 0 },
              { id: 'q_n2', enunciado: 'Quando um useEffect com lista de dependências vazia ([]) roda?', alternativas: ['A cada tecla digitada', 'Uma vez, depois que o componente aparece', 'Nunca'], correta: 1 },
              { id: 'q_n3', enunciado: 'Qual tipo descreve "texto ou nada"?', alternativas: ['string', 'string | undefined', 'any'], correta: 1 },
              { id: 'q_n4', enunciado: 'No CAIS, qual é o jeito certo de pintar um texto de erro?', alternativas: ['text-[#DC3545]', 'text-red-500', 'text-erro'], correta: 2 },
              { id: 'q_n5', enunciado: 'Quais são os quatro estados que toda tela precisa ter?', alternativas: ['Carregando, vazio, com erro e com dado', 'Claro, escuro, celular e desktop', 'Criar, ler, editar e apagar'], correta: 0 },
            ] },
        ],
        progresso: { pes_ana: { concluidas: 2 }, pes_bruno: { concluidas: 4 }, pes_elisa: { concluidas: 1 }, pes_felipe: { concluidas: 0 } },
      },
      {
        id: 'tri_lgpd', titulo: 'LGPD na prática', descricao: 'Como tratar dados pessoais nos projetos dos clientes.',
        // Rascunho: ainda sem publicadaEm (ganha a data quando o admin publicar).
        // prazoDias 0 = prazo INDETERMINADO (a empresa não pediu prazo): o admin define os dias se ela pedir.
        alcance: 'geral', empresaId: '', pessoaIds: [], status: 'rascunho', prazoDias: 0,
        etapas: [
          { id: 'et_l1', titulo: 'O que a lei exige', tipo: 'pdf', obrigatoria: true, notaMinima: 0,
            conteudo: { texto: 'Resumo dos artigos da LGPD que mais aparecem nos projetos.', url: 'https://example.com/docs/lgpd-resumo.pdf' } },
          { id: 'et_l2', titulo: 'Casos reais', tipo: 'audio', obrigatoria: false, notaMinima: 0,
            conteudo: { texto: 'Podcast de 15 minutos com três casos de vazamento e o que daria para evitar.', url: 'https://example.com/audio/lgpd-casos' } },
        ],
        progresso: {},
      },
    ],
    // [PV-6] Os projetos de exemplo, um por situação (em andamento, curto, planejado), cada um de uma empresa.
    // Dois projetos em andamento e um planejado (que só começa daqui a 7 dias).
    projetos: [
      { id: 'prj_portal', nome: 'Portal de pedidos', tipo: 'Aplicação web', empresaId: 'emp_vertice', contatoNome: 'Marcos Vieira', descricao: 'Portal para os clientes da Vértice acompanharem pedidos, entregas e notas fiscais em tempo real.', inicio: d(-42), entrega: d(45), prioridade: 'alta', liderId: 'pes_ana', status: 'andamento', cor: 'roxo', colunas: COLUNAS_PADRAO },
      { id: 'prj_estoque', nome: 'Painel de estoque', tipo: 'Dashboard', empresaId: 'emp_vertice', contatoNome: 'Marcos Vieira', descricao: 'Painel interno com níveis de estoque por centro de distribuição.', inicio: d(-7), entrega: d(30), prioridade: 'media', liderId: 'pes_bruno', status: 'andamento', cor: 'verde', colunas: COLUNAS_PADRAO },
      // Semáforo (F02, o exemplo do time no §16): projeto curto, de hoje até daqui a 7 dias.
      { id: 'prj_sprint', nome: 'Sprint de acessibilidade', tipo: 'Melhoria', empresaId: 'emp_vertice', contatoNome: 'Marcos Vieira', descricao: 'Revisão de acessibilidade do portal antes da próxima entrega: contraste, teclado e leitores de tela.', inicio: d(0), entrega: d(7), prioridade: 'alta', liderId: 'pes_diego', status: 'andamento', cor: 'azul', colunas: COLUNAS_PADRAO },
      { id: 'prj_agenda', nome: 'App de agendamento', tipo: 'Aplicativo móvel', empresaId: 'emp_aurora', contatoNome: 'Patrícia Melo', descricao: 'Agendamento de consultas pelo celular, com lembretes e confirmação.', inicio: d(7), entrega: d(80), prioridade: 'media', liderId: 'pes_carla', status: 'planejado', cor: 'ambar', colunas: COLUNAS_PADRAO },
    ],
    // [PV-7] AS ALOCAÇÕES que criam os cenários do semáforo: Bruno acima do limite, Diego (o exemplo do time) nunca vermelho, Elisa vermelha em 2 semanas, Gabriela livre.
    // Cenários do semáforo de carga (F02, lib/carga.ts):
    // - Bruno soma 30 h + 15 h = 45 h nos mesmos dias (112,5%): VERMELHO de propósito (§5: "é aviso, não bloqueio");
    // - Diego (o exemplo do time, §16): 10 h/sem no Sprint de hoje a d(7) e 30 h/sem no Portal a partir de d(8).
    //   As duas nunca estão ativas no mesmo dia: o pico é 75% e ele NUNCA fica vermelho;
    // - Elisa (limite 30 h): 20 h no Estoque + 15 h no App de agendamento só nas semanas de s2 e s2+7 → 117%,
    //   vermelha só nessas 2 semanas;
    // - Gabriela: nenhuma alocação (livre).
    alocacoes: [
      { id: 'alo_1', projetoId: 'prj_portal', pessoaId: 'pes_ana', papel: 'Líder', inicio: d(-42), fim: d(45), carga: 20, obs: '' },
      { id: 'alo_2', projetoId: 'prj_portal', pessoaId: 'pes_bruno', papel: 'Front-end', inicio: d(-14), fim: d(45), carga: 30, obs: '' },
      { id: 'alo_3', projetoId: 'prj_portal', pessoaId: 'pes_carla', papel: 'UX', inicio: d(-9), fim: d(20), carga: 15, obs: '' },
      { id: 'alo_4', projetoId: 'prj_portal', pessoaId: 'pes_diego', papel: 'QA', inicio: d(8), fim: d(45), carga: 30, obs: 'Começa quando o Sprint de acessibilidade termina.' },
      { id: 'alo_8', projetoId: 'prj_sprint', pessoaId: 'pes_diego', papel: 'Líder', inicio: d(0), fim: d(7), carga: 10, obs: '' },
      { id: 'alo_5', projetoId: 'prj_estoque', pessoaId: 'pes_bruno', papel: 'Líder', inicio: d(-7), fim: d(30), carga: 15, obs: 'Soma com o Portal passa de 40 h.' },
      { id: 'alo_6', projetoId: 'prj_estoque', pessoaId: 'pes_elisa', papel: 'Front-end', inicio: d(-7), fim: d(30), carga: 20, obs: '' },
      { id: 'alo_7', projetoId: 'prj_agenda', pessoaId: 'pes_carla', papel: 'Líder', inicio: d(7), fim: d(80), carga: 15, obs: '' },
      { id: 'alo_9', projetoId: 'prj_agenda', pessoaId: 'pes_elisa', papel: 'Front-end', inicio: s2, fim: somaDias(s2, 11), carga: 15, obs: 'Reforço de 2 semanas: soma com o Estoque passa do limite dela.' },
    ],
    // [PV-8] As tarefas do quadro, com checklist, comentários, anexos de exemplo e as aprovações da empresa (aprovadaEm).
    // Tarefas nas 4 colunas; algumas com prazo já vencido (d(-2), d(-1)) para mostrar atraso.
    tarefas: [
      // Anexos de exemplo (G03, SIMULADO): só metadados; nenhum arquivo é guardado.
      { id: 'tar_1', projetoId: 'prj_portal', colunaId: 'col_afazer', titulo: 'Tela de login', descricao: 'Tela de acesso com e-mail e senha, estados de erro e link para recuperar a senha.', responsavelId: 'pes_bruno', prazo: d(15), prioridade: 'alta', etiquetas: ['Front', 'Login'], checklist: [{ id: 'c1', texto: 'Layout aprovado', feito: true }, { id: 'c2', texto: 'Estados de erro', feito: true }, { id: 'c3', texto: 'Versão para celular', feito: false }, { id: 'c4', texto: 'Ligar à API real', feito: false }], comentarios: [{ id: 'm1', autorId: 'pes_ana', texto: 'Falta o estado de senha errada.', data: agoraMenos(2) }], ordem: 0, anexos: [{ id: 'anx_1', nome: 'fluxo-de-login.pdf', tipo: 'application/pdf', tamanho: 482304, autorId: 'pes_carla', data: agoraMenos(30) }, { id: 'anx_2', nome: 'tela-de-login-v2.png', tipo: 'image/png', tamanho: 1258291, autorId: 'pes_carla', data: agoraMenos(6) }] },
      { id: 'tar_2', projetoId: 'prj_portal', colunaId: 'col_afazer', titulo: 'Ficha da empresa', descricao: '', responsavelId: 'pes_carla', prazo: d(17), prioridade: 'media', etiquetas: ['Front'], checklist: Array.from({ length: 6 }, (_, i) => ({ id: 'f' + i, texto: `Item ${i + 1}`, feito: false })), comentarios: [], ordem: 1, anexos: [{ id: 'anx_3', nome: 'campos-da-ficha.xlsx', tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', tamanho: 38912, autorId: 'pes_ana', data: agoraMenos(50) }] },
      { id: 'tar_3', projetoId: 'prj_portal', colunaId: 'col_afazer', titulo: 'Contrato da API de tarefas', descricao: 'Alinhar com a PROGLOGIC os campos e códigos de erro.', responsavelId: 'pes_ana', prazo: d(21), prioridade: 'media', etiquetas: ['API'], checklist: [{ id: 'a1', texto: 'Listar endpoints', feito: false }, { id: 'a2', texto: 'Definir paginação', feito: false }, { id: 'a3', texto: 'Revisar com o back', feito: false }], comentarios: [], ordem: 2 },
      { id: 'tar_4', projetoId: 'prj_portal', colunaId: 'col_fazendo', titulo: 'Shell da aplicação', descricao: 'Menu lateral, topo com busca, avisos e perfil.', responsavelId: 'pes_bruno', prazo: d(-2), prioridade: 'alta', etiquetas: ['Front'], checklist: [{ id: 's1', texto: 'Menu', feito: true }, { id: 's2', texto: 'Topo', feito: true }, { id: 's3', texto: 'Busca', feito: true }, { id: 's4', texto: 'Avisos', feito: false }, { id: 's5', texto: 'Celular', feito: false }], comentarios: [], ordem: 0 },
      { id: 'tar_5', projetoId: 'prj_portal', colunaId: 'col_fazendo', titulo: 'Design system: botões', descricao: '', responsavelId: 'pes_carla', prazo: d(3), prioridade: 'media', etiquetas: ['UX'], checklist: [{ id: 'b1', texto: 'Primário', feito: true }, { id: 'b2', texto: 'Secundário', feito: true }, { id: 'b3', texto: 'Perigo', feito: false }], comentarios: [], ordem: 1 },
      { id: 'tar_6', projetoId: 'prj_portal', colunaId: 'col_fazendo', titulo: 'Ficha do projeto', descricao: '', responsavelId: 'pes_ana', prazo: d(18), prioridade: 'alta', etiquetas: ['Front'], checklist: [{ id: 'p1', texto: 'Abas', feito: true }, { id: 'p2', texto: 'Equipe', feito: false }, { id: 'p3', texto: 'Tarefas', feito: false }, { id: 'p4', texto: 'Arquivos', feito: false }, { id: 'p5', texto: 'Celular', feito: false }], comentarios: [], ordem: 2 },
      { id: 'tar_7', projetoId: 'prj_portal', colunaId: 'col_revisao', titulo: 'Cadastro de empresa', descricao: 'Máscara de CNPJ, CEP e validação ao sair do campo.', responsavelId: 'pes_bruno', prazo: d(5), prioridade: 'media', etiquetas: ['Front'], checklist: [{ id: 'e1', texto: 'Campos', feito: true }, { id: 'e2', texto: 'Máscaras', feito: true }, { id: 'e3', texto: 'Validação', feito: true }, { id: 'e4', texto: 'Lista', feito: true }], comentarios: [], ordem: 0 },
      // Aprovação da entrega (09/10/2026): a Vértice (Marcos) já aprovou as entregas antigas; tar_16, tar_21, tar_7 e tar_12 ficam aguardando a aprovação dela.
      { id: 'tar_8', projetoId: 'prj_portal', colunaId: 'col_pronto', titulo: 'Wireframes dos cadastros', descricao: '', responsavelId: 'pes_carla', prazo: d(-6), prioridade: 'media', etiquetas: ['UX'], checklist: Array.from({ length: 6 }, (_, i) => ({ id: 'w' + i, texto: `Tela ${i + 1}`, feito: true })), comentarios: [], ordem: 0, concluidaEm: d(-7), aprovadaEm: d(-6), aprovadaPorId: 'pes_marcos' },
      { id: 'tar_9', projetoId: 'prj_portal', colunaId: 'col_pronto', titulo: 'Guia de estilo v1', descricao: '', responsavelId: 'pes_carla', prazo: d(-10), prioridade: 'baixa', etiquetas: ['UX'], checklist: [{ id: 'g1', texto: 'Cores', feito: true }, { id: 'g2', texto: 'Tipografia', feito: true }, { id: 'g3', texto: 'Ícones', feito: true }], comentarios: [], ordem: 1, concluidaEm: d(-11), aprovadaEm: d(-10), aprovadaPorId: 'pes_marcos' },
      // Tarefas da Ana para "Minhas tarefas" (D04) ter um item em cada grupo: atrasada, hoje, esta semana e concluída recentemente.
      // ⚠️ ATENÇÃO: d(1) cai em "Esta semana" em qualquer dia, menos no domingo (aí amanhã já é a semana seguinte e vai para "Depois").
      { id: 'tar_13', projetoId: 'prj_portal', colunaId: 'col_fazendo', titulo: 'Corrigir a validação do CNPJ', descricao: 'O cadastro aceita CNPJ com dígito verificador errado quando há pontuação.', responsavelId: 'pes_ana', prazo: d(-2), prioridade: 'alta', etiquetas: ['Front', 'Bug'], checklist: [{ id: 'v1', texto: 'Reproduzir o erro', feito: true }, { id: 'v2', texto: 'Corrigir a máscara', feito: false }, { id: 'v3', texto: 'Testar com 5 CNPJs', feito: false }], comentarios: [], ordem: 10 },
      { id: 'tar_14', projetoId: 'prj_portal', colunaId: 'col_afazer', titulo: 'Ajustar o topo para o celular', descricao: 'Busca e avisos não cabem em 375 px.', responsavelId: 'pes_ana', prazo: d(0), prioridade: 'media', etiquetas: ['Front', 'Celular'], checklist: [], comentarios: [], ordem: 10 },
      { id: 'tar_15', projetoId: 'prj_portal', colunaId: 'col_afazer', titulo: 'Documentar o quadro de tarefas', descricao: 'Explicar as colunas e o arrastar para o time da Vértice.', responsavelId: 'pes_ana', prazo: d(1), prioridade: 'baixa', etiquetas: ['Docs'], checklist: [{ id: 'q1', texto: 'Colunas', feito: false }, { id: 'q2', texto: 'Arrastar e soltar', feito: false }], comentarios: [], ordem: 11 },
      { id: 'tar_16', projetoId: 'prj_portal', colunaId: 'col_pronto', titulo: 'Configurar o repositório', descricao: '', responsavelId: 'pes_ana', prazo: d(-3), prioridade: 'media', etiquetas: ['Infra'], checklist: [{ id: 'r1', texto: 'Criar o repositório', feito: true }, { id: 'r2', texto: 'Regras de branch', feito: true }], comentarios: [], ordem: 10, concluidaEm: d(-2) },
      // Histórico de entregas da Ana (D05: gráfico das últimas 8 semanas). Por isso o Portal e a alocação dela começam em d(-42).
      { id: 'tar_17', projetoId: 'prj_portal', colunaId: 'col_pronto', titulo: 'Levantamento de requisitos', descricao: '', responsavelId: 'pes_ana', prazo: d(-40), prioridade: 'media', etiquetas: [], checklist: [], comentarios: [], ordem: 11, concluidaEm: d(-38), aprovadaEm: d(-37), aprovadaPorId: 'pes_marcos' },
      { id: 'tar_18', projetoId: 'prj_portal', colunaId: 'col_pronto', titulo: 'Protótipo do portal', descricao: '', responsavelId: 'pes_ana', prazo: d(-33), prioridade: 'media', etiquetas: [], checklist: [], comentarios: [], ordem: 12, concluidaEm: d(-31), aprovadaEm: d(-30), aprovadaPorId: 'pes_marcos' },
      { id: 'tar_19', projetoId: 'prj_portal', colunaId: 'col_pronto', titulo: 'Modelo de dados dos pedidos', descricao: '', responsavelId: 'pes_ana', prazo: d(-30), prioridade: 'media', etiquetas: [], checklist: [], comentarios: [], ordem: 13, concluidaEm: d(-29), aprovadaEm: d(-28), aprovadaPorId: 'pes_marcos' },
      { id: 'tar_20', projetoId: 'prj_portal', colunaId: 'col_pronto', titulo: 'Tela de pedidos (lista)', descricao: '', responsavelId: 'pes_ana', prazo: d(-19), prioridade: 'media', etiquetas: [], checklist: [], comentarios: [], ordem: 14, concluidaEm: d(-17), aprovadaEm: d(-16), aprovadaPorId: 'pes_marcos' },
      { id: 'tar_21', projetoId: 'prj_portal', colunaId: 'col_pronto', titulo: 'Filtro de pedidos por status', descricao: '', responsavelId: 'pes_ana', prazo: d(-10), prioridade: 'media', etiquetas: [], checklist: [], comentarios: [], ordem: 15, concluidaEm: d(-9) },
      { id: 'tar_10', projetoId: 'prj_estoque', colunaId: 'col_afazer', titulo: 'Gráfico por centro de distribuição', descricao: '', responsavelId: 'pes_elisa', prazo: d(12), prioridade: 'media', etiquetas: ['Front', 'Gráfico'], checklist: [], comentarios: [], ordem: 0 },
      { id: 'tar_11', projetoId: 'prj_estoque', colunaId: 'col_fazendo', titulo: 'Filtro por período', descricao: '', responsavelId: 'pes_bruno', prazo: d(-1), prioridade: 'alta', etiquetas: ['Front'], checklist: [{ id: 'x1', texto: 'Seletor de datas', feito: true }, { id: 'x2', texto: 'Aplicar na API', feito: false }], comentarios: [], ordem: 0 },
      { id: 'tar_12', projetoId: 'prj_estoque', colunaId: 'col_pronto', titulo: 'Protótipo navegável', descricao: '', responsavelId: 'pes_elisa', prazo: d(-3), prioridade: 'media', etiquetas: ['UX'], checklist: [], comentarios: [], ordem: 0, concluidaEm: d(-4) },
    ],
  };
}
