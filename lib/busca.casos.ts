/* ============================================================================
   CASOS DE TESTE DA BUSCA GLOBAL
   O que é: script simples (sem biblioteca de testes) que confere lib/busca.ts com dados fixos: o que cada perfil
     acha, o escopo (nada de outra empresa), a trava da trilha obrigatória, acentos, várias palavras e o limite.
   Onde é usado: rodado à mão no terminal; nenhuma tela importa este arquivo.
   Depende de: lib/busca.ts, lib/permissoes.ts, lib/escopo.ts e lib/tipos.ts (imports com extensão .ts para o Node achar os módulos).
   Contexto: §3 (perfis), §10 (topo com busca) e §12 (trilha obrigatória).
   Como rodar: node --experimental-strip-types lib/busca.casos.ts
   ============================================================================ */

import { buscarGlobal, placeholderDaBusca } from './busca.ts';
import { podeAcessar } from './permissoes.ts';
import { podeVerProjeto } from './escopo.ts';
import type { Dados, Pessoa, Tarefa, Trilha } from './tipos.ts';

/** Pessoa de teste. */
const pessoa = (id: string, nome: string, perfil: Pessoa['perfil'], empresaId = '', status: Pessoa['status'] = 'ativo'): Pessoa => ({
  id, nome, email: `${id}@${{ emp_v: 'vertice', emp_a: 'aurora' }[empresaId] ?? 'cais'}.x`, telefone: '', cargo: perfil === 'profissional' ? 'Designer' : '', perfil, status, dataEntrada: '2026-01-01',
  area: '', nivel: '', cargaMax: 40, habilidades: [], empresaId,
});
/** Empresa de teste. */
const empresa = (id: string, nomeFantasia: string, cnpj: string) => ({
  id, razaoSocial: `${nomeFantasia} Ltda.`, nomeFantasia, cnpj, segmento: '', porte: '', site: '', cep: '', logradouro: '', numero: '',
  cidadeUf: '', contatoNome: '', contatoEmail: '', contatoTelefone: '', contatoCargo: '', status: 'ativa' as const, dataEntrada: '2026-01-01',
});
/** Projeto de teste. */
const projeto = (id: string, nome: string, empresaId: string, tipo = '') => ({
  id, nome, tipo, empresaId, contatoNome: '', descricao: '', inicio: '2026-01-01', entrega: '2026-12-01', prioridade: 'media' as const, liderId: '', status: 'andamento' as const, cor: 'roxo', colunas: [],
});
/** Tarefa de teste. */
const tarefa = (id: string, projetoId: string, titulo: string, responsavelId: string, extra: Partial<Tarefa> = {}): Tarefa => ({
  id, projetoId, colunaId: 'c1', titulo, descricao: '', responsavelId, prazo: '2026-12-01', prioridade: 'media', etiquetas: [], checklist: [], comentarios: [], ordem: 0, ...extra,
});
/** Trilha de teste com uma etapa obrigatória; o progresso diz quem já concluiu. */
const trilha = (id: string, titulo: string, alcance: Trilha['alcance'], empresaId: string, progresso: Trilha['progresso'], etapa = 'Etapa única'): Trilha => ({
  id, titulo, descricao: '', alcance, empresaId, pessoaIds: [], status: 'publicada', prazoDias: 0, progresso,
  etapas: [{ id: `${id}_e1`, titulo: etapa, tipo: 'texto' as const, obrigatoria: true, notaMinima: 0 }],
});

const dados: Dados = {
  temas: { personalizados: [], padraoId: 'cais', porEmpresa: {} },
  empresas: [empresa('emp_v', 'Vértice Logística', '11.222.333/0001-81'), empresa('emp_a', 'Aurora Saúde', '45.678.901/0001-75')],
  pessoas: [
    pessoa('adm', 'Administrador CAIS', 'admin'),
    pessoa('ana', 'Ana Souza', 'profissional'),
    pessoa('bia', 'Bia Lima', 'profissional'),
    // Gabi está num projeto, mas ainda não fez a trilha obrigatória: a trava do §12 vale para ela.
    pessoa('gabi', 'Gabi Costa', 'profissional'),
    pessoa('marcos', 'Marcos Vieira', 'empresa', 'emp_v'),
    pessoa('pat', 'Patrícia Melo', 'empresa', 'emp_a'),
  ],
  trilhas: [
    // Geral e obrigatória: ana e bia concluíram; gabi não.
    trilha('tg', 'Boas-vindas ao programa', 'geral', '', { ana: { concluidas: 1 }, bia: { concluidas: 1 }, marcos: { concluidas: 1 }, pat: { concluidas: 1 } }, 'Código de conduta'),
    trilha('tv', 'Processos da Vértice', 'empresa', 'emp_v', {}),
    trilha('ta', 'Processos da Aurora', 'empresa', 'emp_a', {}),
  ],
  projetos: [projeto('p1', 'Portal de pedidos', 'emp_v', 'Aplicação web'), projeto('p2', 'App de agendamento', 'emp_a')],
  alocacoes: ['ana', 'gabi'].map((pessoaId) => ({ id: `a_${pessoaId}`, projetoId: 'p1', pessoaId, papel: '', inicio: '2026-01-01', fim: '2026-12-01', carga: 10, obs: '' }))
    .concat([{ id: 'a_bia', projetoId: 'p2', pessoaId: 'bia', papel: '', inicio: '2026-01-01', fim: '2026-12-01', carga: 10, obs: '' }]),
  tarefas: [
    tarefa('t1', 'p1', 'Corrigir a validação do CNPJ', 'ana', { etiquetas: ['Bug'], anexos: [{ id: 'x1', nome: 'layout-final.pdf', tipo: 'application/pdf', tamanho: 10, autorId: 'ana', data: '2026-10-01' }] }),
    tarefa('t2', 'p2', 'Lembretes por SMS', 'bia'),
    tarefa('t3', 'p1', 'Validação de e-mail', 'ana'),
    // Dez tarefas com "reunião": enchem sozinhas a lista e provam que não escondem os outros tipos.
    ...Array.from({ length: 10 }, (_, i) => tarefa(`r${i}`, 'p1', `Reunião ${i} do portal`, 'ana')),
  ],
};
const admin = { pessoaId: 'adm', perfil: 'admin' as const };
const marcos = { pessoaId: 'marcos', perfil: 'empresa' as const };
const ana = { pessoaId: 'ana', perfil: 'profissional' as const };
const gabi = { pessoaId: 'gabi', perfil: 'profissional' as const };

/** Resumo "Tipo:id" dos resultados, para comparar. */
const resumo = (texto: string, sessao: { pessoaId: string; perfil: 'admin' | 'empresa' | 'profissional' }, limite?: number) =>
  buscarGlobal(texto, sessao, dados, limite).itens.map((r) => `${r.tipo}:${r.id}`);

const casos: { porque: string; obtido: unknown; esperado: unknown }[] = [
  { porque: 'menos de 2 letras não busca', obtido: buscarGlobal('p', admin, dados), esperado: { itens: [], total: 0 } },
  { porque: 'espaços não contam como letras ("  p ")', obtido: buscarGlobal('  p ', admin, dados).itens.length, esperado: 0 },
  { porque: 'admin acha o projeto pelo nome', obtido: resumo('portal de', admin).filter((x) => x.startsWith('Projeto')), esperado: ['Projeto:p1'] },
  { porque: 'sem acento e sem maiúsculas: "AURORA SAUDE" acha a empresa', obtido: resumo('AURORA SAUDE', admin).includes('Empresa:emp_a'), esperado: true },
  { porque: 'várias palavras em qualquer ordem: "pedidos portal" acha o projeto', obtido: resumo('pedidos portal', admin).includes('Projeto:p1'), esperado: true },
  { porque: 'o CNPJ casa só com os números', obtido: resumo('45678901', admin), esperado: ['Empresa:emp_a'] },
  { porque: 'a empresa do projeto também vale: "vertice" traz o projeto, a empresa, a pessoa e as trilhas', obtido: [...new Set(resumo('vertice', admin).map((x) => x.split(':')[0]))], esperado: ['Projeto', 'Empresa', 'Pessoa', 'Trilha'] },
  { porque: 'o arquivo é achado pelo nome e abre a tarefa', obtido: buscarGlobal('layout', ana, dados).itens.map((r) => `${r.tipo}:${r.href}`), esperado: ['Arquivo:/projetos/p1?tarefa=t1'] },
  { porque: 'a tarefa abre o detalhe no projeto (?tarefa=)', obtido: buscarGlobal('cnpj', admin, dados).itens.find((r) => r.tipo === 'Tarefa')?.href, esperado: '/projetos/p1?tarefa=t1' },
  { porque: 'a etiqueta da tarefa também vale ("bug")', obtido: resumo('bug', ana), esperado: ['Tarefa:t1'] },
  { porque: 'o título que COMEÇA com o texto vem antes do que só contém', obtido: resumo('valida', ana).filter((x) => x.startsWith('Tarefa')), esperado: ['Tarefa:t3', 'Tarefa:t1'] },
  { porque: 'a etapa da trilha vale ("conduta" acha as boas-vindas)', obtido: resumo('conduta', admin), esperado: ['Trilha:tg'] },
  { porque: 'o administrador não tem "Minha trilha" (ele não cumpre trilha)', obtido: resumo('processos', admin), esperado: ['Trilha:tv', 'Trilha:ta'] },

  // ESCOPO: a empresa só acha o que é dela.
  { porque: 'empresa não acha nada da Aurora (projeto, tarefa, trilha ou empresa)', obtido: resumo('aurora', marcos).concat(resumo('agendamento', marcos), resumo('lembretes', marcos)), esperado: [] },
  { porque: 'empresa acha o projeto e as trilhas dela (editor e a que ela cumpre)', obtido: resumo('vertice', marcos), esperado: ['Projeto:p1', 'Trilha:tv', 'Minha trilha:tv'] },
  { porque: 'empresa não pesquisa empresas nem pessoas (as telas são do admin)', obtido: resumo('ana', marcos).concat(resumo('vertice', marcos).filter((x) => x.startsWith('Empresa') || x.startsWith('Pessoa'))), esperado: [] },
  { porque: 'profissional só acha tarefa de projeto em que está', obtido: resumo('lembretes', ana).concat(resumo('cnpj', ana)), esperado: ['Tarefa:t1'] },
  { porque: 'profissional acha a trilha que cumpre, no player, e não no editor', obtido: buscarGlobal('vertice', ana, dados).itens.filter((r) => r.tipo.includes('rilha')).map((r) => r.href), esperado: ['/minhas-trilhas/tv'] },
  { porque: 'profissional não acha empresa nem pessoa', obtido: resumo('bia', ana).concat(resumo('aurora', ana)), esperado: [] },

  // TRAVA da trilha obrigatória (§12): quem está travado só abre /painel e /minhas-trilhas.
  { porque: 'trava: o profissional com trilha obrigatória pendente NÃO recebe projeto nem tarefa', obtido: resumo('portal', gabi), esperado: [] },
  { porque: 'trava: ele ainda acha a trilha que precisa cumprir', obtido: resumo('boas-vindas', gabi), esperado: ['Minha trilha:tg'] },
  { porque: 'sem trava (já concluiu), o mesmo profissional acha o projeto', obtido: resumo('portal', ana).includes('Projeto:p1'), esperado: true },

  // LIMITE: as vagas são repartidas entre os tipos.
  { porque: 'limite: 10 vagas, mesmo com 10 tarefas casando', obtido: buscarGlobal('portal', admin, dados).itens.length, esperado: 10 },
  { porque: 'limite: o total conta tudo o que casou (projeto + 10 tarefas)', obtido: buscarGlobal('portal', admin, dados).total, esperado: 11 },
  { porque: 'rodízio: as tarefas não escondem o projeto', obtido: resumo('portal', admin).includes('Projeto:p1'), esperado: true },
  { porque: 'rodízio: com 3 vagas, "vertice" traz um de cada tipo antes de repetir (projeto, empresa, pessoa)', obtido: resumo('vertice', admin, 3), esperado: ['Projeto:p1', 'Empresa:emp_v', 'Pessoa:marcos'] },

  // TEXTO DO CAMPO: só promete o que o perfil acha.
  { porque: 'placeholder do admin cita empresa e pessoa', obtido: /empresa/.test(placeholderDaBusca('admin')) && /pessoa/.test(placeholderDaBusca('admin')), esperado: true },
  { porque: 'placeholder da empresa e do profissional NÃO cita empresa nem pessoa', obtido: [placeholderDaBusca('empresa'), placeholderDaBusca('profissional')].some((t) => /empresa|pessoa/.test(t)), esperado: false },
  { porque: 'placeholder cita tarefa e trilha em todos os perfis', obtido: (['admin', 'empresa', 'profissional'] as const).every((p) => /tarefa/.test(placeholderDaBusca(p)) && /trilha/.test(placeholderDaBusca(p))), esperado: true },

  // INVARIANTE: nenhum link sugerido leva a /sem-permissao.
  {
    porque: 'nenhum resultado, de nenhum perfil, leva a uma rota proibida ou a projeto fora do escopo',
    obtido: (() => {
      const ruins: string[] = [];
      for (const sessao of [admin, marcos, { pessoaId: 'pat', perfil: 'empresa' as const }, ana, gabi, { pessoaId: 'bia', perfil: 'profissional' as const }]) {
        for (const q of ['po', 'vert', 'aur', 'ana', 'bia', 'proc', 'reun', 'lay', 'bo', 'cnpj', 'le', 'ap']) {
          for (const r of buscarGlobal(q, sessao, dados, 100).itens) {
            const id = /^\/projetos\/([^/?]+)/.exec(r.href)?.[1];
            if (!podeAcessar(sessao.perfil, r.href) || (id && !podeVerProjeto(sessao, id, dados))) ruins.push(`${sessao.pessoaId} ${q} → ${r.href}`);
          }
        }
      }
      return ruins;
    })(),
    esperado: [],
  },
];

let falhas = 0;
for (const c of casos) {
  const ok = JSON.stringify(c.obtido) === JSON.stringify(c.esperado);
  if (!ok) falhas++;
  console.log(`${ok ? 'OK    ' : 'FALHOU'} ${c.porque}${ok ? '' : `\n         obtido:   ${JSON.stringify(c.obtido)}\n         esperado: ${JSON.stringify(c.esperado)}`}`);
}
console.log(`\n${casos.length - falhas} de ${casos.length} casos passaram.`);
process.exitCode = falhas ? 1 : 0;
