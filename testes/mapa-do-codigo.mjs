/* ============================================================================
   TESTES/MAPA-DO-CODIGO.MJS
   O que é: gera e confere o MAPA DO CÓDIGO (docs/MAPA-DO-CODIGO.md): para cada arquivo
     .tsx, .ts e .css do projeto, a lista numerada dos PONTOS VITAIS DE ALTERAÇÃO, ou seja,
     os lugares onde alguém mexeria para mudar uma regra, um texto, uma cor, uma rota...
     Cada ponto é um comentário no código no formato [PV-n] (n recomeça em 1 em cada arquivo).
     O mapa é GERADO desses comentários, então o código e o .md nunca divergem.
   Onde é usado: rodado à mão. Gerar o mapa: node testes/mapa-do-codigo.mjs
     Só conferir (não grava): node testes/mapa-do-codigo.mjs --conferir
     O testes/auditar-comentarios.mjs chama problemasDoMapa() daqui antes de todo push.
   Depende de: git (lista os arquivos versionados) e Node 22+. Nenhuma biblioteca.
   Contexto: CLAUDE.md, seção "PADRÃO DE COMENTÁRIOS" (regra 6: pontos vitais).

   COMO MARCAR UM PONTO VITAL (resumo; o texto completo está em CLAUDE.md)
   - Em .ts/.tsx:  // [PV-3] Assunto: o que controla e como mudar.
   - Dentro de JSX: um comentário de JSX (chave, barra-asterisco) com o mesmo texto [PV-3] ...
   - Em .css:      um comentário de bloco do CSS com o mesmo texto [PV-3] ...
   - O número é sequencial dentro do arquivo (1, 2, 3...). Ao inserir um ponto no meio,
     renumere os seguintes e rode este script de novo (o conferir acusa buraco ou repetição).
   - O comentário fica numa linha só, logo ACIMA do que muda.
   - Arquivos .json não aceitam comentário: os pontos deles ficam na constante EXTRAS_JSON abaixo.
   ============================================================================ */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/** Onde o mapa é gravado. */
const SAIDA = 'docs/MAPA-DO-CODIGO.md';

/**
 * Arquivos .json: não têm comentário, então os pontos vitais ficam aqui (e entram no mapa).
 * Para mudar script, dependência ou opção do TypeScript, o ponto está descrito abaixo.
 * Cada item: a chave do JSON e o que ela controla.
 */
const EXTRAS_JSON = {
  'package.json': [
    '"scripts": comandos do projeto. `dev` abre o servidor de desenvolvimento, `build` gera a versão de produção, `lint` roda o ESLint. Para um comando novo, acrescente aqui.',
    '"dependencies": bibliotecas usadas pelo app (Next, React, lucide-react). NÃO instale biblioteca nova sem combinar com o time (regra do CLAUDE.md).',
    '"devDependencies": ferramentas só do desenvolvimento (TypeScript, ESLint, Tailwind). A versão do Next e a do eslint-config-next devem ficar iguais.',
    '"name" e "version": identificação do projeto (`projeto_cais`). Mudar o nome não afeta o app.',
  ],
  'tsconfig.json': [
    '"compilerOptions.strict": TypeScript estrito. Desligar faria o compilador aceitar erros de tipo; não recomendado.',
    '"compilerOptions.paths" (`@/*`): o atalho de importação. `@/lib/utils` aponta para `./lib/utils`. Mudar aqui exige mudar todos os imports.',
    '"compilerOptions.allowImportingTsExtensions": permite `import ... from \'./metricas.ts\'`. É isso que deixa os arquivos `*.casos.ts` rodarem no Node; não desligue.',
    '"include" e "exclude": quais arquivos o TypeScript confere. Pasta nova de código precisa estar coberta por `**/*.ts` e `**/*.tsx`.',
  ],
};

/** Arquivos de código que entram no mapa (versionados; sem .d.ts, sem os casos de teste e sem a pasta testes/). */
function listarArquivos() {
  return execSync('git ls-files', { encoding: 'utf8' }).split('\n')
    .filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith('.d.ts') && !f.endsWith('.casos.ts') && !f.startsWith('testes/'))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** Uma marcação no formato [PV-n] + o texto, em qualquer estilo de comentário. */
const MARCA = /\[PV-(\d+)\]\s*(.*?)\s*(?:\*\/\}?|\*\/)?\s*$/;

/**
 * Lê os pontos vitais de um arquivo.
 * @param {string} arquivo - caminho relativo.
 * @returns {{ n: number, texto: string, linha: number }[]} os pontos, na ordem em que aparecem.
 */
export function lerPontos(arquivo) {
  const pontos = [];
  readFileSync(arquivo, 'utf8').split(/\r?\n/).forEach((l, i) => {
    // Só linhas de comentário contam (evita pegar um "[PV-1]" dentro de uma string de código).
    if (!/^\s*(\/\/|\/\*|\{\/\*|\*)/.test(l)) return;
    const m = l.match(MARCA);
    if (m) pontos.push({ n: Number(m[1]), texto: m[2].trim(), linha: i + 1 });
  });
  return pontos;
}

/**
 * O que o arquivo é, tirado do cabeçalho ("O que é: ...").
 * @param {string} arquivo - caminho relativo.
 * @returns {string} uma frase curta (vazia se não achar).
 */
function oQueE(arquivo) {
  const topo = readFileSync(arquivo, 'utf8').split(/\r?\n/).slice(0, 14).join(' ');
  const m = topo.match(/O que é:\s*(.*?)(?:Onde é usado:|Depende de:|Contexto:|=====)/);
  return m ? m[1].replace(/\s+/g, ' ').trim().replace(/\.$/, '') : '';
}

/**
 * Monta o texto do mapa (Markdown).
 * @returns {string} o conteúdo de docs/MAPA-DO-CODIGO.md.
 */
export function gerarTexto() {
  const arquivos = listarArquivos();
  const grupos = new Map();
  for (const a of arquivos) {
    const pasta = a.includes('/') ? a.split('/')[0] : 'raiz do projeto';
    if (!grupos.has(pasta)) grupos.set(pasta, []);
    grupos.get(pasta).push(a);
  }
  const NOME = { app: 'app/ (telas e rotas)', components: 'components/ (peças de tela)', lib: 'lib/ (regras e dados)', 'raiz do projeto': 'Raiz do projeto (configuração)' };
  const out = [];
  out.push('# Mapa do código do CAIS');
  out.push('');
  out.push('> **Arquivo gerado.** Não edite à mão: rode `node testes/mapa-do-codigo.mjs` depois de mexer nos comentários `[PV-n]` do código.');
  out.push('');
  out.push('## Como usar');
  out.push('');
  out.push('1. Ache o arquivo na lista abaixo (está agrupado por pasta, na ordem alfabética).');
  out.push('2. Leia os pontos numerados: cada um diz **o que controla** e **como mudar**.');
  out.push('3. No código, procure pelo número com a busca do editor: `[PV-3]` (o número recomeça em 1 em cada arquivo, então busque dentro do arquivo certo).');
  out.push('');
  out.push('Um **ponto vital de alteração** é um lugar onde alguém mexeria para mudar uma regra, um texto, uma cor, uma rota, um limite ou uma ligação com a API. A "linha" é onde o comentário estava quando o mapa foi gerado e pode se deslocar um pouco depois; o número `[PV-n]` é o que vale.');
  out.push('');
  out.push('Arquivos `.json` não aceitam comentário, por isso os pontos deles estão descritos aqui, no fim.');
  out.push('');
  let total = 0;
  for (const [pasta, lista] of grupos) {
    out.push(`## ${NOME[pasta] ?? pasta}`);
    out.push('');
    for (const a of lista) {
      const pontos = lerPontos(a);
      total += pontos.length;
      out.push(`### \`${a}\``);
      const resumo = oQueE(a);
      if (resumo) out.push(`*${resumo}.*`);
      out.push('');
      if (pontos.length === 0) out.push('_Sem ponto vital de alteração: o arquivo não tem regra, texto ou configuração que o time costume mudar._');
      for (const p of pontos) out.push(`${p.n}. ${p.texto} _(linha ${p.linha})_`);
      out.push('');
    }
  }
  out.push('## Arquivos .json');
  out.push('');
  for (const [arquivo, itens] of Object.entries(EXTRAS_JSON)) {
    out.push(`### \`${arquivo}\``);
    out.push('');
    itens.forEach((t, i) => out.push(`${i + 1}. ${t}`));
    out.push('');
    total += itens.length;
  }
  out.push('---');
  out.push('');
  out.push(`${arquivos.length + Object.keys(EXTRAS_JSON).length} arquivos mapeados, ${total} pontos vitais.`);
  out.push('');
  return out.join('\n');
}

/**
 * Confere o mapa e a numeração.
 * - cada arquivo mapeado tem a numeração 1, 2, 3... sem buraco nem repetição;
 * - o arquivo docs/MAPA-DO-CODIGO.md está igual ao que seria gerado agora (não ficou velho).
 * @returns {{ arquivo: string, regra: string, detalhe: string }[]} problemas encontrados ([] = tudo certo).
 */
export function problemasDoMapa() {
  const problemas = [];
  for (const a of listarArquivos()) {
    const nums = lerPontos(a).map((p) => p.n);
    nums.forEach((n, i) => {
      if (n !== i + 1) problemas.push({ arquivo: a, regra: 'numeração dos pontos vitais', detalhe: `esperado [PV-${i + 1}], achei [PV-${n}]` });
    });
  }
  const esperado = gerarTexto();
  const atual = existsSync(SAIDA) ? readFileSync(SAIDA, 'utf8').replace(/\r\n/g, '\n') : '';
  if (atual !== esperado) problemas.push({ arquivo: SAIDA, regra: 'mapa desatualizado', detalhe: 'rode: node testes/mapa-do-codigo.mjs' });
  return problemas;
}

// Execução direta pelo terminal (e não quando o auditor importa as funções acima: aí o argv[1] é o auditor).
if (process.argv[1]?.endsWith('mapa-do-codigo.mjs')) {
  if (process.argv.includes('--conferir')) {
    const p = problemasDoMapa();
    p.forEach((x) => console.log(`${x.arquivo}: ${x.regra} (${x.detalhe})`));
    console.log(`\n${p.length} problema(s) no mapa do código.`);
    process.exitCode = p.length ? 1 : 0;
  } else {
    writeFileSync(SAIDA, gerarTexto());
    console.log(`Mapa gravado em ${SAIDA}.`);
  }
}
