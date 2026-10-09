/* ============================================================================
   ANEXOS (REGRAS PURAS DOS ARQUIVOS DE UMA TAREFA)
   O que é: funções puras dos anexos da tarefa (G03): validar o arquivo escolhido,
     criar o metadado, escrever o tamanho de forma legível, descobrir a categoria
     (para o ícone e o filtro) e juntar os anexos de um projeto.
   Onde é usado: components/projetos/DetalheTarefa.tsx (área Anexos),
     components/projetos/ArquivosDoProjeto.tsx (aba Arquivos) e lib/anexos.casos.ts.
   Depende de: apenas os tipos de lib/tipos.ts (sem React, para rodar em Node).
   Contexto: §5 (anexos da tarefa; aba Arquivos do projeto) e §7 (upload é do back-end).

   ⚠️ SIMULADO: guardamos SÓ os metadados do arquivo (nome, tipo, tamanho, quem
   enviou e quando), NUNCA o conteúdo. O localStorage tem limite de poucos MB por
   endereço (em geral 5 a 10 MB no total); um único PDF de 3 MB já comeria boa parte.
   TODO(API): o upload de verdade (multipart) devolve uma URL; aí o metadado passa a
   guardar a `url` e a tela abre o arquivo por ela.
   ============================================================================ */

import type { Anexo, Dados } from './tipos.ts';

// [PV-1] Limite de tamanho por arquivo anexado: 10 MB. Mude este cálculo (e os textos das telas) para aceitar arquivos maiores.
/** Limite de tamanho por arquivo: 10 MB (10 × 1024 × 1024 bytes). */
export const LIMITE_BYTES = 10 * 1024 * 1024;

/** Categorias de arquivo (ícone e filtro da aba Arquivos). */
export type CategoriaAnexo = 'imagem' | 'pdf' | 'planilha' | 'documento' | 'compactado' | 'outro';

// [PV-2] Nomes das categorias de arquivo (Imagens, PDFs...) usados no filtro da aba Arquivos.
/** Nome de cada categoria, em português (filtro e rótulos). */
export const ROTULO_CATEGORIA: Record<CategoriaAnexo, string> = {
  imagem: 'Imagens',
  pdf: 'PDFs',
  planilha: 'Planilhas',
  documento: 'Documentos',
  compactado: 'Compactados',
  outro: 'Outros',
};

/** Nome de cada categoria no SINGULAR (a legenda de um arquivo só: "Imagem · 1,2 MB"). */
export const ROTULO_CATEGORIA_UNICA: Record<CategoriaAnexo, string> = {
  imagem: 'Imagem',
  pdf: 'PDF',
  planilha: 'Planilha',
  documento: 'Documento',
  compactado: 'Compactado',
  outro: 'Arquivo',
};

/**
 * Escreve um tamanho em bytes de forma legível, com vírgula decimal (pt-BR).
 * @param bytes - tamanho em bytes.
 * @returns ex.: "1,2 MB", "340 KB", "812 B".
 * @example tamanhoLegivel(1_258_291) // '1,2 MB'
 */
export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  // Uma casa decimal, com vírgula; "10,0" vira "10".
  return `${(kb / 1024).toFixed(1).replace('.', ',').replace(',0', '')} MB`;
}

// [PV-3] Como um arquivo vira categoria (imagem, PDF, planilha...), pelo tipo MIME ou pela extensão. Extensão nova: acrescente na lista da categoria.
/**
 * Categoria de um arquivo, pelo tipo MIME e, na falta dele, pela extensão do nome.
 * @param nome - nome do arquivo.
 * @param tipo - tipo MIME (pode vir vazio).
 * @returns a categoria.
 * @example categoriaDoAnexo('layout.PNG', '') // 'imagem'
 */
export function categoriaDoAnexo(nome: string, tipo: string): CategoriaAnexo {
  const ext = nome.includes('.') ? nome.split('.').pop()!.toLowerCase() : '';
  if (tipo.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'imagem';
  if (tipo === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || tipo.includes('spreadsheet') || tipo === 'text/csv' || tipo === 'application/vnd.ms-excel') return 'planilha';
  if (['doc', 'docx', 'odt', 'txt', 'md', 'rtf', 'ppt', 'pptx'].includes(ext) || tipo.startsWith('text/') || tipo.includes('word') || tipo.includes('presentation')) return 'documento';
  if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext) || tipo.includes('zip') || tipo.includes('compressed')) return 'compactado';
  return 'outro';
}

// [PV-4] A validação de upload: recusa arquivo vazio ou acima do limite, com mensagem em português dizendo como corrigir.
/**
 * Confere o arquivo escolhido: não pode passar de 10 MB nem estar vazio.
 * @param arquivo - o que o navegador entrega (nome e tamanho bastam).
 * @returns a mensagem de erro, em português e dizendo como corrigir; null se está tudo certo.
 * @example validarArquivo({ name: 'video.mp4', size: 30_000_000 }) // 'O arquivo "video.mp4" tem 28,6 MB; o limite é 10 MB. Escolha um arquivo menor.'
 */
export function validarArquivo(arquivo: { name: string; size: number }): string | null {
  if (arquivo.size === 0) return `O arquivo "${arquivo.name}" está vazio. Escolha outro arquivo.`;
  if (arquivo.size > LIMITE_BYTES) return `O arquivo "${arquivo.name}" tem ${tamanhoLegivel(arquivo.size)}; o limite é ${tamanhoLegivel(LIMITE_BYTES)}. Escolha um arquivo menor.`;
  return null;
}

// [PV-5] O que é guardado de um anexo: SÓ nome, tipo, tamanho, autor e data (nunca o conteúdo). TODO(API): guardar a url do upload.
/**
 * Cria o metadado de um anexo a partir do arquivo escolhido (o conteúdo NÃO é guardado).
 * @param arquivo - nome, tipo e tamanho do arquivo.
 * @param autorId - quem anexou.
 * @param id - id novo (quem chama gera com novoId('anx')).
 * @param agora - data e hora (padrão: agora); existe para facilitar teste.
 * @returns o anexo.
 * @example criarAnexo({ name: 'a.pdf', type: 'application/pdf', size: 1000 }, 'pes_ana', 'anx_1')
 */
export function criarAnexo(arquivo: { name: string; type: string; size: number }, autorId: string, id: string, agora: string = new Date().toISOString()): Anexo {
  return { id, nome: arquivo.name, tipo: arquivo.type, tamanho: arquivo.size, autorId, data: agora };
}

/** Um anexo junto da tarefa e do projeto de onde veio (aba Arquivos). */
export interface AnexoDoProjeto { anexo: Anexo; tarefaId: string; tarefaTitulo: string }

/**
 * Todos os anexos das tarefas de um projeto, do mais recente para o mais antigo.
 * @param projetoId - id do projeto.
 * @param d - dados (só `tarefas` é lido).
 * @returns a lista.
 * @example anexosDoProjeto('prj_portal', d)[0].tarefaTitulo // 'Tela de login'
 */
export function anexosDoProjeto(projetoId: string, d: Pick<Dados, 'tarefas'>): AnexoDoProjeto[] {
  return d.tarefas
    .filter((t) => t.projetoId === projetoId)
    .flatMap((t) => (t.anexos ?? []).map((anexo) => ({ anexo, tarefaId: t.id, tarefaTitulo: t.titulo })))
    .sort((a, b) => b.anexo.data.localeCompare(a.anexo.data));
}
