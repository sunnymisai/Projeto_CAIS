/* ============================================================================
   CASOS DE TESTE DAS PERMISSÕES
   O que é: script simples (sem biblioteca de testes) que confere podeAcessar, podeFazer e os filtros de lib/escopo.ts. Cada caso tem entrada, esperado e o porquê.
   Onde é usado: rodado à mão no terminal; nenhuma tela importa este arquivo.
   Depende de: lib/metricas.ts (publicoDaTrilha), lib/permissoes.ts (inclusive a guarda da trilha obrigatória), lib/escopo.ts e lib/tipos.ts (imports com extensão .ts para o Node achar os módulos).
   Contexto: §3 (Perfis), §5 (Permissões de projetos).
   Como rodar: node --experimental-strip-types lib/permissoes.casos.ts
   ============================================================================ */

import {
  podeAcessar, podeFazer, temTrilhaObrigatoriaPendente, rotaLiberadaComTrilhaPendente, EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO,
  ROTAS_POR_PERFIL, ROTULO_DAS_ROTAS, ROTULO_DAS_ACOES, TODAS_AS_ACOES, rotasDoPerfil, permissaoDaAcao, mudancaDeAcesso,
} from './permissoes.ts';
import { projetosVisiveis, podeVerProjeto, tarefasVisiveis, alocacoesVisiveis, empresasVisiveis, pessoasVisiveis } from './escopo.ts';
import { publicoDaTrilha } from './metricas.ts';
import type { Dados, Pessoa, Tarefa } from './tipos.ts';

// Mini base de dados só para os testes (espelha os ids do seed: Vértice e Aurora).
const pessoa = (id: string, perfil: Pessoa['perfil'], empresaId = ''): Pessoa => ({
  id, nome: id, email: `${id}@x`, telefone: '', cargo: '', perfil, status: 'ativo', dataEntrada: '2026-01-01',
  area: '', nivel: '', cargaMax: 40, habilidades: [], empresaId,
});
/** Monta uma tarefa de teste no projeto e com o responsável indicados. */
const tarefa = (id: string, projetoId: string, responsavelId: string): Tarefa => ({
  id, projetoId, colunaId: 'c1', titulo: id, descricao: '', responsavelId, prazo: '2026-12-01', prioridade: 'media',
  etiquetas: [], checklist: [], comentarios: [], ordem: 0,
});
/** Monta um projeto de teste ligado a uma empresa. */
const projeto = (id: string, empresaId: string) => ({
  id, nome: id, tipo: '', empresaId, contatoNome: '', descricao: '', inicio: '2026-01-01', entrega: '2026-12-01',
  prioridade: 'media' as const, liderId: '', status: 'andamento' as const, cor: 'roxo', colunas: [{ id: 'c1', titulo: 'A fazer' }],
});
/** Monta uma empresa de teste. */
const empresa = (id: string) => ({
  id, razaoSocial: id, nomeFantasia: id, cnpj: '', segmento: '', porte: '', site: '', cep: '', logradouro: '', numero: '',
  cidadeUf: '', contatoNome: '', contatoEmail: '', contatoTelefone: '', contatoCargo: '', status: 'ativa' as const, dataEntrada: '2026-01-01',
});
/** Monta uma alocação de teste (pessoa num projeto). */
const aloc = (id: string, projetoId: string, pessoaId: string) => ({
  id, projetoId, pessoaId, papel: '', inicio: '2026-01-01', fim: '2026-12-01', carga: 10, obs: '',
});

const dados: Dados = {
  empresas: [empresa('emp_vertice'), empresa('emp_aurora')],
  pessoas: [
    pessoa('pes_admin', 'admin'), pessoa('pes_ana', 'profissional'), pessoa('pes_bruno', 'profissional'),
    pessoa('pes_carla', 'profissional'), pessoa('pes_marcos', 'empresa', 'emp_vertice'), pessoa('pes_patricia', 'empresa', 'emp_aurora'),
  ],
  trilhas: [],
  projetos: [projeto('prj_portal', 'emp_vertice'), projeto('prj_agenda', 'emp_aurora')],
  alocacoes: [aloc('a1', 'prj_portal', 'pes_ana'), aloc('a2', 'prj_portal', 'pes_bruno'), aloc('a3', 'prj_agenda', 'pes_carla')],
  tarefas: [tarefa('t1', 'prj_portal', 'pes_ana'), tarefa('t2', 'prj_portal', 'pes_bruno'), tarefa('t3', 'prj_agenda', 'pes_carla')],
};

const ana = { pessoaId: 'pes_ana', perfil: 'profissional' as const };
const marcos = { pessoaId: 'pes_marcos', perfil: 'empresa' as const };
const patricia = { pessoaId: 'pes_patricia', perfil: 'empresa' as const };
const admin = { pessoaId: 'pes_admin', perfil: 'admin' as const };
/** Ids ordenados e juntos ('a,b'): compara listas sem depender da ordem de origem. */
const ids = (xs: { id: string }[]) => xs.map((x) => x.id).sort().join(',');


// Trilha de boas-vindas (geral, publicada) com 3 etapas: 2 obrigatórias e 1 opcional no fim.
// Progresso: Ana fez as 3; Bruno fez 1 (falta uma obrigatória); Carla fez 2 (só falta a opcional, que não trava).
const trilhaGeral = (status: 'publicada' | 'rascunho', alcance: 'geral' | 'profissional' = 'geral') => ({
  id: 'tri_x', titulo: 'x', descricao: '', alcance, empresaId: '', pessoaIds: [] as string[], status, prazoDias: 7,
  etapas: [
    { id: 'e1', titulo: 'e1', tipo: 'texto' as const, obrigatoria: true, notaMinima: 0 },
    { id: 'e2', titulo: 'e2', tipo: 'texto' as const, obrigatoria: true, notaMinima: 0 },
    { id: 'e3', titulo: 'e3', tipo: 'texto' as const, obrigatoria: false, notaMinima: 0 },
  ],
  progresso: { pes_ana: { concluidas: 3 }, pes_bruno: { concluidas: 1 }, pes_carla: { concluidas: 2 } },
});
/** Os dados de teste com UMA trilha (para os casos da trilha obrigatória). */
const comTrilha = (t: ReturnType<typeof trilhaGeral>): Dados => ({ ...dados, trilhas: [t] });

// Cada caso: descrição (o porquê), valor obtido e valor esperado.
const casos: { porque: string; obtido: unknown; esperado: unknown }[] = [
  { porque: 'admin abre /empresas (cadastro é do admin)', obtido: podeAcessar('admin', '/empresas'), esperado: true },
  { porque: 'profissional NÃO abre /empresas', obtido: podeAcessar('profissional', '/empresas'), esperado: false },
  { porque: 'empresa NÃO abre /pessoas', obtido: podeAcessar('empresa', '/pessoas'), esperado: false },
  { porque: 'empresa abre /projetos/prj_x (prefixo /projetos)', obtido: podeAcessar('empresa', '/projetos/prj_x'), esperado: true },
  { porque: 'profissional abre /minhas-tarefas', obtido: podeAcessar('profissional', '/minhas-tarefas'), esperado: true },
  { porque: 'empresa NÃO abre /minhas-tarefas', obtido: podeAcessar('empresa', '/minhas-tarefas'), esperado: false },
  { porque: 'empresa abre /minhas-trilhas', obtido: podeAcessar('empresa', '/minhas-trilhas'), esperado: true },
  { porque: 'admin NÃO abre /minhas-tarefas (é só do profissional)', obtido: podeAcessar('admin', '/minhas-tarefas'), esperado: false },
  { porque: 'rota não listada vale só para admin (profissional)', obtido: podeAcessar('profissional', '/qualquer-coisa'), esperado: false },
  { porque: 'rota não listada vale só para admin (admin)', obtido: podeAcessar('admin', '/qualquer-coisa'), esperado: true },
  { porque: '"/projetosx" não casa com o prefixo "/projetos" (fronteira de segmento)', obtido: podeAcessar('empresa', '/projetosx'), esperado: false },
  { porque: '?voltar= e #âncora são ignorados', obtido: podeAcessar('profissional', '/projetos?x=1#a'), esperado: true },
  { porque: 'profissional NÃO cria tarefa', obtido: podeFazer('profissional', 'criar_tarefa'), esperado: false },
  { porque: 'empresa NÃO edita projeto', obtido: podeFazer('empresa', 'editar_projeto'), esperado: false },
  { porque: 'admin edita projeto', obtido: podeFazer('admin', 'editar_projeto'), esperado: true },
  { porque: 'profissional NÃO aloca', obtido: podeFazer('profissional', 'alocar', { enxergaProjeto: true }), esperado: false },
  { porque: 'admin aloca em qualquer projeto', obtido: podeFazer('admin', 'alocar'), esperado: true },
  { porque: 'empresa aloca nos projetos DELA (enxerga o projeto)', obtido: podeFazer('empresa', 'alocar', { enxergaProjeto: true }), esperado: true },
  { porque: 'empresa NÃO aloca em projeto que não enxerga', obtido: podeFazer('empresa', 'alocar', { enxergaProjeto: false }), esperado: false },
  { porque: 'empresa sem informação de escopo NÃO aloca (lado seguro)', obtido: podeFazer('empresa', 'alocar'), esperado: false },
  { porque: 'empresa aprova a entrega do projeto dela', obtido: podeFazer('empresa', 'aprovar_entrega', { enxergaProjeto: true }), esperado: true },
  { porque: 'empresa NÃO aprova entrega de projeto que não enxerga', obtido: podeFazer('empresa', 'aprovar_entrega', { enxergaProjeto: false }), esperado: false },
  { porque: 'admin NÃO aprova entrega (quem aprova é o cliente)', obtido: podeFazer('admin', 'aprovar_entrega', { enxergaProjeto: true }), esperado: false },
  { porque: 'profissional NÃO aprova a própria entrega', obtido: podeFazer('profissional', 'aprovar_entrega', { enxergaProjeto: true }), esperado: false },
  { porque: 'admin move qualquer tarefa', obtido: podeFazer('admin', 'mover_tarefa', { pessoaId: 'pes_admin', responsavelId: 'pes_ana' }), esperado: true },
  { porque: 'profissional move a própria tarefa', obtido: podeFazer('profissional', 'mover_tarefa', { pessoaId: 'pes_ana', responsavelId: 'pes_ana' }), esperado: true },
  { porque: 'profissional NÃO move tarefa de outro', obtido: podeFazer('profissional', 'mover_tarefa', { pessoaId: 'pes_ana', responsavelId: 'pes_bruno' }), esperado: false },
  { porque: 'profissional sem contexto NÃO move (lado seguro)', obtido: podeFazer('profissional', 'mover_tarefa'), esperado: false },
  { porque: 'admin anexa arquivo em qualquer tarefa (G03)', obtido: podeFazer('admin', 'anexar_arquivo', { pessoaId: 'pes_admin', responsavelId: 'pes_ana' }), esperado: true },
  { porque: 'profissional anexa na própria tarefa', obtido: podeFazer('profissional', 'anexar_arquivo', { pessoaId: 'pes_ana', responsavelId: 'pes_ana' }), esperado: true },
  { porque: 'profissional NÃO anexa na tarefa de outro', obtido: podeFazer('profissional', 'anexar_arquivo', { pessoaId: 'pes_ana', responsavelId: 'pes_bruno' }), esperado: false },
  { porque: 'empresa só vê: NÃO anexa nem remove', obtido: podeFazer('empresa', 'anexar_arquivo', { pessoaId: 'pes_marcos', responsavelId: 'pes_marcos' }), esperado: false },
  { porque: 'empresa NÃO move tarefa', obtido: podeFazer('empresa', 'mover_tarefa', { pessoaId: 'pes_marcos', responsavelId: 'pes_marcos' }), esperado: false },
  { porque: 'empresa que enxerga o projeto comenta', obtido: podeFazer('empresa', 'comentar_tarefa', { enxergaProjeto: true }), esperado: true },
  { porque: 'empresa que NÃO enxerga o projeto não comenta', obtido: podeFazer('empresa', 'comentar_tarefa', { enxergaProjeto: false }), esperado: false },
  { porque: 'admin vê todos os projetos', obtido: ids(projetosVisiveis(admin, dados)), esperado: 'prj_agenda,prj_portal' },
  { porque: 'empresa Vértice (Marcos) vê só o projeto da Vértice', obtido: ids(projetosVisiveis(marcos, dados)), esperado: 'prj_portal' },
  { porque: 'empresa Aurora (Patrícia) vê só o projeto da Aurora', obtido: ids(projetosVisiveis(patricia, dados)), esperado: 'prj_agenda' },
  { porque: 'profissional Ana vê só o projeto em que está alocada', obtido: ids(projetosVisiveis(ana, dados)), esperado: 'prj_portal' },
  { porque: 'Ana NÃO pode ver o projeto da Aurora (URL digitada)', obtido: podeVerProjeto(ana, 'prj_agenda', dados), esperado: false },
  { porque: 'Marcos NÃO pode ver o projeto da Aurora', obtido: podeVerProjeto(marcos, 'prj_agenda', dados), esperado: false },
  { porque: 'tarefas visíveis de Marcos são as do projeto da Vértice', obtido: ids(tarefasVisiveis(marcos, dados)), esperado: 't1,t2' },
  { porque: 'alocações visíveis de Patrícia são só as da Aurora', obtido: ids(alocacoesVisiveis(patricia, dados)), esperado: 'a3' },
  { porque: 'empresa Vértice só enxerga a própria empresa', obtido: ids(empresasVisiveis(marcos, dados)), esperado: 'emp_vertice' },
  { porque: 'Ana enxerga a si e aos colegas de projeto, não a Carla', obtido: ids(pessoasVisiveis(ana, dados)), esperado: 'pes_ana,pes_bruno' },
  { porque: 'sessão de pessoa inexistente não vê projeto (empresa)', obtido: ids(projetosVisiveis({ pessoaId: 'pes_fantasma', perfil: 'empresa' }, dados)), esperado: '' },
  { porque: 'toda rota de ROTAS_POR_PERFIL tem rótulo em português', obtido: Object.keys(ROTAS_POR_PERFIL).filter((r) => !ROTULO_DAS_ROTAS[r]).join(','), esperado: '' },
  { porque: 'toda ação de TODAS_AS_ACOES tem rótulo em português', obtido: TODAS_AS_ACOES.filter((a) => !ROTULO_DAS_ACOES[a]).join(','), esperado: '' },
  { porque: 'rotasDoPerfil(empresa) não inclui /pessoas', obtido: rotasDoPerfil('empresa').includes('/pessoas'), esperado: false },
  { porque: 'rotasDoPerfil(admin) inclui /acessos', obtido: rotasDoPerfil('admin').includes('/acessos'), esperado: true },
  { porque: 'rotasDoPerfil concorda com podeAcessar para o profissional', obtido: rotasDoPerfil('profissional').every((r) => podeAcessar('profissional', r)), esperado: true },
  { porque: 'permissaoDaAcao: admin cria tarefa = sim', obtido: permissaoDaAcao('admin', 'criar_tarefa'), esperado: 'sim' },
  { porque: 'permissaoDaAcao: profissional cria tarefa = nao', obtido: permissaoDaAcao('profissional', 'criar_tarefa'), esperado: 'nao' },
  { porque: 'permissaoDaAcao: profissional move tarefa = condicional (só as próprias)', obtido: permissaoDaAcao('profissional', 'mover_tarefa'), esperado: 'condicional' },
  { porque: 'permissaoDaAcao: empresa comenta = condicional (só no projeto que enxerga)', obtido: permissaoDaAcao('empresa', 'comentar_tarefa'), esperado: 'condicional' },
  { porque: 'permissaoDaAcao: empresa move tarefa = nao', obtido: permissaoDaAcao('empresa', 'mover_tarefa'), esperado: 'nao' },
  { porque: 'profissional → empresa: deixa de ver /minhas-tarefas', obtido: mudancaDeAcesso('profissional', 'empresa').deixaDeVer.join(','), esperado: '/minhas-tarefas' },
  { porque: 'profissional → empresa: não passa a ver nenhuma tela nova', obtido: mudancaDeAcesso('profissional', 'empresa').passaAVer.join(','), esperado: '' },
  { porque: 'empresa → admin: passa a ver as telas de cadastro', obtido: mudancaDeAcesso('empresa', 'admin').passaAVer.includes('/pessoas'), esperado: true },
  { porque: 'admin → profissional: perde criar_tarefa e não ganha ação nenhuma', obtido: mudancaDeAcesso('admin', 'profissional').perde.includes('criar_tarefa') && mudancaDeAcesso('admin', 'profissional').ganha.length === 0, esperado: true },
  { porque: 'sem nenhuma trilha, nada pendente', obtido: temTrilhaObrigatoriaPendente('pes_bruno', dados), esperado: false },
  { porque: 'Bruno fez só 1 de 2 obrigatórias da trilha geral publicada: pendente', obtido: temTrilhaObrigatoriaPendente('pes_bruno', comTrilha(trilhaGeral('publicada'))), esperado: true },
  { porque: 'Ana concluiu tudo: nada pendente', obtido: temTrilhaObrigatoriaPendente('pes_ana', comTrilha(trilhaGeral('publicada'))), esperado: false },
  { porque: 'Carla fez as 2 obrigatórias (falta só a opcional): nada pendente', obtido: temTrilhaObrigatoriaPendente('pes_carla', comTrilha(trilhaGeral('publicada'))), esperado: false },
  { porque: 'trilha em rascunho não trava ninguém', obtido: temTrilhaObrigatoriaPendente('pes_bruno', comTrilha(trilhaGeral('rascunho'))), esperado: false },
  { porque: 'trilha de alcance "profissional" não entra na regra conservadora', obtido: temTrilhaObrigatoriaPendente('pes_bruno', comTrilha(trilhaGeral('publicada', 'profissional'))), esperado: false },
  { porque: 'pessoa nova sem registro de progresso começa do zero: pendente', obtido: temTrilhaObrigatoriaPendente('pes_novo', { ...comTrilha(trilhaGeral('publicada')), pessoas: [...dados.pessoas, pessoa('pes_novo', 'profissional')] }), esperado: true },
  { porque: 'perfil empresa agora faz parte do público da trilha geral (§4) e tem pendência; a trava do layout só vale para o perfil Profissional', obtido: temTrilhaObrigatoriaPendente('pes_marcos', comTrilha(trilhaGeral('publicada'))), esperado: true },
  { porque: 'trilha da Vértice inclui o Marcos (perfil Empresa vinculado à Vértice)', obtido: publicoDaTrilha({ ...trilhaGeral('publicada'), alcance: 'empresa', empresaId: 'emp_vertice' }, dados).includes('pes_marcos'), esperado: true },
  { porque: 'trilha da Vértice NÃO inclui a Patrícia (é da Aurora)', obtido: publicoDaTrilha({ ...trilhaGeral('publicada'), alcance: 'empresa', empresaId: 'emp_vertice' }, dados).includes('pes_patricia'), esperado: false },
  { porque: 'administrador nunca entra no público da trilha geral', obtido: publicoDaTrilha(trilhaGeral('publicada'), dados).includes('pes_admin'), esperado: false },
  { porque: 'EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO ligada no D03 (o player de trilha existe)', obtido: EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO, esperado: true },
  { porque: '/minhas-trilhas fica liberada com trilha pendente', obtido: rotaLiberadaComTrilhaPendente('/minhas-trilhas'), esperado: true },
  { porque: '/minhas-trilhas/tri_1?x=1 fica liberada (subrota e query)', obtido: rotaLiberadaComTrilhaPendente('/minhas-trilhas/tri_1?x=1'), esperado: true },
  { porque: '/painel fica liberado com trilha pendente', obtido: rotaLiberadaComTrilhaPendente('/painel'), esperado: true },
  { porque: '/projetos fica bloqueada com trilha pendente', obtido: rotaLiberadaComTrilhaPendente('/projetos'), esperado: false },
  { porque: '/painelx NÃO casa com /painel (fronteira de segmento)', obtido: rotaLiberadaComTrilhaPendente('/painelx'), esperado: false },
];

// Confere cada caso e imprime OK/FALHOU; sai com código 1 se algum falhar.
let falhas = 0;
for (const c of casos) {
  const ok = c.obtido === c.esperado;
  if (!ok) falhas++;
  console.log(`${ok ? 'OK    ' : 'FALHOU'} ${c.porque}${ok ? '' : ` (obtido: ${String(c.obtido)}, esperado: ${String(c.esperado)})`}`);
}
console.log(`\n${casos.length - falhas} de ${casos.length} casos passaram.`);
if (falhas > 0) process.exit(1);
