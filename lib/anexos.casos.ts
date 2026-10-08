/* ============================================================================
   CASOS DE TESTE DOS ANEXOS
   O que é: script simples (sem biblioteca de testes) que confere as funções de
     lib/anexos.ts: tamanho legível, categoria, validação do limite de 10 MB, criação
     do metadado e a lista de anexos de um projeto. Cada caso tem entrada, esperado e o porquê.
   Onde é usado: rodado à mão no terminal; nenhuma tela importa este arquivo.
   Depende de: lib/anexos.ts e lib/tipos.ts (imports com extensão .ts para o Node achar os módulos).
   Contexto: §5 (anexos da tarefa; aba Arquivos).
   Como rodar: node --experimental-strip-types lib/anexos.casos.ts
   ============================================================================ */

import { LIMITE_BYTES, ROTULO_CATEGORIA_UNICA, anexosDoProjeto, categoriaDoAnexo, criarAnexo, tamanhoLegivel, validarArquivo } from './anexos.ts';
import type { Dados } from './tipos.ts';

const MB = 1024 * 1024;
const dados = {
  tarefas: [
    { id: 't1', projetoId: 'p', titulo: 'Tela de login', anexos: [{ id: 'a1', nome: 'a.pdf', tipo: 'application/pdf', tamanho: 10, autorId: 'x', data: '2026-10-01T10:00:00Z' }] },
    { id: 't2', projetoId: 'p', titulo: 'Cadastro', anexos: [{ id: 'a2', nome: 'b.png', tipo: 'image/png', tamanho: 10, autorId: 'x', data: '2026-10-05T10:00:00Z' }] },
    { id: 't3', projetoId: 'p', titulo: 'Sem anexo' },
    { id: 't4', projetoId: 'outro', titulo: 'Outro projeto', anexos: [{ id: 'a3', nome: 'c.pdf', tipo: '', tamanho: 10, autorId: 'x', data: '2026-10-06T10:00:00Z' }] },
  ],
} as unknown as Dados;
const lista = anexosDoProjeto('p', dados);

const casos: { porque: string; obtido: unknown; esperado: unknown }[] = [
  { porque: 'menos de 1 KB vira bytes', obtido: tamanhoLegivel(812), esperado: '812 B' },
  { porque: 'KB arredondado', obtido: tamanhoLegivel(340 * 1024), esperado: '340 KB' },
  { porque: 'MB com uma casa e vírgula (pt-BR)', obtido: tamanhoLegivel(Math.round(1.2 * MB)), esperado: '1,2 MB' },
  { porque: 'MB redondo não mostra ",0"', obtido: tamanhoLegivel(10 * MB), esperado: '10 MB' },
  { porque: 'categoria pelo tipo MIME', obtido: categoriaDoAnexo('x', 'application/pdf'), esperado: 'pdf' },
  { porque: 'categoria pela extensão quando o tipo vem vazio (e em maiúsculas)', obtido: categoriaDoAnexo('Layout.PNG', ''), esperado: 'imagem' },
  { porque: 'planilha por extensão', obtido: categoriaDoAnexo('dados.xlsx', ''), esperado: 'planilha' },
  { porque: 'documento por extensão', obtido: categoriaDoAnexo('ata.docx', ''), esperado: 'documento' },
  { porque: 'compactado por extensão', obtido: categoriaDoAnexo('codigo.zip', ''), esperado: 'compactado' },
  { porque: 'sem extensão e sem tipo cai em "outro"', obtido: categoriaDoAnexo('LEIAME', ''), esperado: 'outro' },
  { porque: 'arquivo de 10 MB exatos é aceito (o limite é "mais de 10 MB")', obtido: validarArquivo({ name: 'ok.pdf', size: LIMITE_BYTES }), esperado: null },
  { porque: 'arquivo acima de 10 MB é recusado com mensagem clara', obtido: validarArquivo({ name: 'video.mp4', size: 30 * MB }), esperado: 'O arquivo "video.mp4" tem 30 MB; o limite é 10 MB. Escolha um arquivo menor.' },
  { porque: 'arquivo vazio é recusado', obtido: validarArquivo({ name: 'vazio.txt', size: 0 }), esperado: 'O arquivo "vazio.txt" está vazio. Escolha outro arquivo.' },
  { porque: 'o metadado guarda nome, tipo, tamanho, autor e data (e nada do conteúdo)', obtido: JSON.stringify(criarAnexo({ name: 'a.pdf', type: 'application/pdf', size: 5 }, 'pes_ana', 'anx_1', '2026-10-08T09:00:00Z')), esperado: '{"id":"anx_1","nome":"a.pdf","tipo":"application/pdf","tamanho":5,"autorId":"pes_ana","data":"2026-10-08T09:00:00Z"}' },
  { porque: 'a legenda de um arquivo usa o singular ("Imagem", não "Imagen")', obtido: ROTULO_CATEGORIA_UNICA[categoriaDoAnexo('a.png', '')], esperado: 'Imagem' },
  { porque: 'anexos do projeto: só os dele, o mais recente primeiro', obtido: lista.map((x) => x.anexo.id).join(','), esperado: 'a2,a1' },
  { porque: 'cada anexo do projeto aponta para a tarefa de origem', obtido: lista.map((x) => x.tarefaTitulo).join(','), esperado: 'Cadastro,Tela de login' },
];

// Roda os casos e imprime OK/FALHOU com o porquê (mesmo formato de permissoes.casos.ts).
let falhas = 0;
for (const c of casos) {
  const ok = c.obtido === c.esperado;
  if (!ok) falhas++;
  console.log(`${ok ? 'OK    ' : 'FALHOU'} ${c.porque}${ok ? '' : ` (obtido: ${String(c.obtido)}, esperado: ${String(c.esperado)})`}`);
}
console.log(`\n${casos.length - falhas} de ${casos.length} casos passaram.`);
if (falhas > 0) process.exit(1);
