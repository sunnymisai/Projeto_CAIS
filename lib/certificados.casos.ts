/* ============================================================================
   CASOS DE TESTE DOS CERTIFICADOS
   O que é: script simples (sem biblioteca de testes) que confere lib/certificados.ts com dados fixos:
     quem tem direito, o conteúdo do certificado e o código de verificação.
   Onde é usado: rodado à mão no terminal; nenhuma tela importa este arquivo.
   Depende de: lib/certificados.ts e lib/tipos.ts (imports com extensão .ts para o Node achar os módulos).
   Contexto: §4 (progresso e nota por pessoa) e pedido de 13/10/2026 (certificados).
   Como rodar: node --experimental-strip-types lib/certificados.casos.ts
   ============================================================================ */

import { certificadoDaPessoa, certificadosDaPessoa, certificadosEmitidos, codigoDoCertificado, verificarCodigo } from './certificados.ts';
import type { Dados, Pessoa, Trilha } from './tipos.ts';

/** Pessoa de teste. */
const pessoa = (id: string, perfil: Pessoa['perfil'], empresaId = '', status: Pessoa['status'] = 'ativo'): Pessoa => ({
  id, nome: `Nome ${id}`, email: `${id}@x`, telefone: '', cargo: '', perfil, status, dataEntrada: '2026-01-01',
  area: '', nivel: '', cargaMax: 40, habilidades: [], empresaId,
});
/** Trilha geral de 2 etapas; o progresso é o que cada caso quiser. */
const trilha = (id: string, status: Trilha['status'], progresso: Trilha['progresso'], etapas = 2): Trilha => ({
  id, titulo: `Trilha ${id}`, descricao: '', alcance: 'geral', empresaId: '', pessoaIds: [], status, prazoDias: 7,
  etapas: Array.from({ length: etapas }, (_, i) => ({ id: `e${i}`, titulo: `e${i}`, tipo: 'texto' as const, obrigatoria: true, notaMinima: 0 })),
  progresso,
});
/** Empresa de teste (só id e nome fantasia importam). */
const empresa = (id: string, nomeFantasia: string) => ({
  id, razaoSocial: nomeFantasia, nomeFantasia, cnpj: '', segmento: '', porte: '', site: '', cep: '', logradouro: '', numero: '',
  cidadeUf: '', contatoNome: '', contatoEmail: '', contatoTelefone: '', contatoCargo: '', status: 'ativa' as const, dataEntrada: '2026-01-01',
});

const dados: Dados = {
  temas: { personalizados: [], padraoId: 'cais', porEmpresa: {} },
  empresas: [empresa('emp_v', 'Vértice')],
  pessoas: [pessoa('ana', 'profissional'), pessoa('bia', 'profissional'), pessoa('caio', 'profissional'), pessoa('marcos', 'empresa', 'emp_v'), pessoa('dani', 'profissional', '', 'inativo')],
  trilhas: [
    // ana concluiu as 2 etapas (com nota); bia fez 1; caio nada; dani (inativa) concluiu mas não está no público.
    trilha('t1', 'publicada', { ana: { concluidas: 2, nota: 92, concluidaEm: '2026-10-01' }, bia: { concluidas: 1 }, dani: { concluidas: 2, concluidaEm: '2026-09-01' }, marcos: { concluidas: 2, concluidaEm: '2026-10-05' } }),
    trilha('t2', 'publicada', { ana: { concluidas: 2, concluidaEm: '2026-08-10' } }),
    trilha('t3', 'rascunho', { ana: { concluidas: 2, concluidaEm: '2026-10-02' } }),
    trilha('t4', 'publicada', { ana: { concluidas: 0 } }, 0),
    // Trilha antiga: concluída, mas sem a data guardada.
    trilha('t5', 'publicada', { bia: { concluidas: 2 } }),
  ],
  projetos: [{ id: 'p1', nome: 'p1', tipo: '', empresaId: 'emp_v', contatoNome: '', descricao: '', inicio: '2026-01-01', entrega: '2026-12-01', prioridade: 'media' as const, liderId: '', status: 'andamento' as const, cor: 'roxo', colunas: [] }],
  alocacoes: [{ id: 'a1', projetoId: 'p1', pessoaId: 'ana', papel: '', inicio: '2026-01-01', fim: '2026-12-01', carga: 10, obs: '' }],
  tarefas: [],
};
const admin = { pessoaId: 'adm', perfil: 'admin' as const };
const marcos = { pessoaId: 'marcos', perfil: 'empresa' as const };
const ana = { pessoaId: 'ana', perfil: 'profissional' as const };

const casos: { porque: string; obtido: unknown; esperado: unknown }[] = [
  { porque: 'quem concluiu todas as etapas tem certificado', obtido: certificadoDaPessoa(dados.trilhas[0], 'ana', dados)?.pessoaNome, esperado: 'Nome ana' },
  { porque: 'o certificado traz o título, as etapas, a data e a nota', obtido: (() => { const c = certificadoDaPessoa(dados.trilhas[0], 'ana', dados)!; return [c.trilhaTitulo, c.etapas, c.concluidaEm, c.nota].join('|'); })(), esperado: 'Trilha t1|2|2026-10-01|92' },
  { porque: 'quem fez só 1 de 2 etapas NÃO tem certificado', obtido: certificadoDaPessoa(dados.trilhas[0], 'bia', dados), esperado: null },
  { porque: 'quem nunca começou NÃO tem certificado', obtido: certificadoDaPessoa(dados.trilhas[0], 'caio', dados), esperado: null },
  { porque: 'trilha em rascunho NÃO emite certificado', obtido: certificadoDaPessoa(dados.trilhas[2], 'ana', dados), esperado: null },
  { porque: 'trilha sem etapas NÃO emite certificado (0 de 0 não é conclusão)', obtido: certificadoDaPessoa(dados.trilhas[3], 'ana', dados), esperado: null },
  { porque: 'pessoa inativa (fora do público) NÃO emite certificado', obtido: certificadoDaPessoa(dados.trilhas[0], 'dani', dados), esperado: null },
  { porque: 'pessoa inexistente NÃO emite certificado', obtido: certificadoDaPessoa(dados.trilhas[0], 'fantasma', dados), esperado: null },
  { porque: 'a empresa também recebe o certificado da trilha que concluiu, com o nome da empresa', obtido: certificadoDaPessoa(dados.trilhas[0], 'marcos', dados)?.empresaNome, esperado: 'Vértice' },
  { porque: 'o código segue o formato CAIS-AAAA-XXXXXXXX', obtido: /^CAIS-2026-[0-9A-F]{8}$/.test(certificadoDaPessoa(dados.trilhas[0], 'ana', dados)!.codigo), esperado: true },
  { porque: 'o código é sempre o mesmo para a mesma conclusão', obtido: codigoDoCertificado('t1', 'ana', '2026-10-01') === codigoDoCertificado('t1', 'ana', '2026-10-01'), esperado: true },
  { porque: 'o código muda com a pessoa', obtido: codigoDoCertificado('t1', 'ana', '2026-10-01') !== codigoDoCertificado('t1', 'bia', '2026-10-01'), esperado: true },
  { porque: 'o código muda com a trilha', obtido: codigoDoCertificado('t1', 'ana', '2026-10-01') !== codigoDoCertificado('t2', 'ana', '2026-10-01'), esperado: true },
  { porque: 'sem data guardada o código usa o ano 0000 e o certificado sai sem data', obtido: (() => { const c = certificadoDaPessoa(dados.trilhas[4], 'bia', dados)!; return `${c.codigo.slice(0, 9)}|${c.concluidaEm}`; })(), esperado: 'CAIS-0000|' },
  { porque: 'a lista da Ana tem 2 certificados (rascunho e sem etapas ficam de fora)', obtido: certificadosDaPessoa('ana', dados).map((c) => c.trilhaId).join(','), esperado: 't1,t2' },
  { porque: 'a lista vem com a conclusão mais recente primeiro', obtido: certificadosDaPessoa('ana', dados)[0].concluidaEm, esperado: '2026-10-01' },
  { porque: 'verificar: o código de um certificado real é encontrado', obtido: verificarCodigo(certificadoDaPessoa(dados.trilhas[0], 'ana', dados)!.codigo, dados)?.pessoaNome, esperado: 'Nome ana' },
  { porque: 'verificar: ignora maiúsculas e espaços nas pontas', obtido: verificarCodigo('  ' + certificadoDaPessoa(dados.trilhas[0], 'ana', dados)!.codigo.toLowerCase() + ' ', dados)?.trilhaId, esperado: 't1' },
  { porque: 'verificar: código inventado não existe', obtido: verificarCodigo('CAIS-2026-00000000', dados), esperado: null },
  { porque: 'verificar: texto vazio não existe', obtido: verificarCodigo('   ', dados), esperado: null },
  { porque: 'verificar: o código de uma trilha em rascunho não vale', obtido: verificarCodigo(codigoDoCertificado('t3', 'ana', '2026-10-02'), dados), esperado: null },
  { porque: 'emitidos: o admin vê todos (marcos/t1, ana/t1, ana/t2, bia/t5)', obtido: certificadosEmitidos(admin, dados).map((c) => c.pessoaId + '/' + c.trilhaId).join(','), esperado: 'marcos/t1,ana/t1,ana/t2,bia/t5' },
  { porque: 'emitidos: o profissional não usa esta lista', obtido: certificadosEmitidos(ana, dados).length, esperado: 0 },
  { porque: 'emitidos: a empresa NÃO vê trilha geral do admin (só as dela)', obtido: certificadosEmitidos(marcos, dados).length, esperado: 0 },
  { porque: 'emitidos: a empresa vê quem do time dela concluiu a trilha DELA (ana está alocada na Vértice; caio não)', obtido: certificadosEmitidos(marcos, { ...dados, trilhas: [{ ...trilha('tv', 'publicada', { ana: { concluidas: 2, concluidaEm: '2026-10-03' }, caio: { concluidas: 2, concluidaEm: '2026-10-04' } }), alcance: 'empresa' as const, empresaId: 'emp_v' }] }).map((c) => c.pessoaId).join(','), esperado: 'ana' },
  { porque: 'quem não concluiu nada tem lista vazia', obtido: certificadosDaPessoa('caio', dados).length, esperado: 0 },
];

let falhas = 0;
for (const c of casos) {
  const ok = JSON.stringify(c.obtido) === JSON.stringify(c.esperado);
  if (!ok) falhas++;
  console.log(`${ok ? 'OK    ' : 'FALHOU'} ${c.porque}${ok ? '' : `\n         obtido:   ${JSON.stringify(c.obtido)}\n         esperado: ${JSON.stringify(c.esperado)}`}`);
}
console.log(`\n${casos.length - falhas} de ${casos.length} casos passaram.`);
process.exitCode = falhas ? 1 : 0;
