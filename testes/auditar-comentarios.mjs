/* ============================================================================
   TESTES/AUDITAR-COMENTARIOS.MJS
   O que é: auditoria automática do PADRÃO DE COMENTÁRIOS do CLAUDE.md em todo
     arquivo de código versionado pelo git. Confere:
     1) cabeçalho "/* ====" no topo de cada arquivo;
     2) JSDoc (ou ao menos um comentário) logo acima de cada função/componente,
        inclusive as funções de dentro dos componentes (handlers);
     3) comentário explicando cada useEffect;
     4) rótulo GRAVA/APAGA/NAVEGA perto de quem grava, apaga ou navega.
   Onde é usado: rodado à mão antes de um push: node testes/auditar-comentarios.mjs
   Depende de: git (lista os arquivos versionados) e Node 22+. Nenhuma biblioteca.
   Contexto: CLAUDE.md, seção "PADRÃO DE COMENTÁRIOS (obrigatório em todo código novo ou alterado)".
   Limite: é uma checagem por texto (regex), não entende o código. Serve para achar
     esquecimentos; a leitura humana continua valendo.
   ============================================================================ */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Arquivos de código versionados (o que vai para o repositório).
const arquivos = execSync('git ls-files', { encoding: 'utf8' }).split('\n')
  .filter((f) => /\.(tsx?|mjs|js|css)$/.test(f))
  // next-env.d.ts é gerado pelo Next (e nem é versionado); arquivos .d.ts não têm lógica.
  .filter((f) => !f.endsWith('.d.ts'));

/** Problemas encontrados: { arquivo, linha, regra, trecho }. */
const problemas = [];
/** Registra um ponto para revisar (arquivo, linha, regra e um trecho curto da linha). */
const anotar = (arquivo, linha, regra, trecho) => problemas.push({ arquivo, linha, regra, trecho: trecho.trim().slice(0, 90) });

for (const arquivo of arquivos) {
  const linhas = readFileSync(arquivo, 'utf8').split(/\r?\n/);

  // 1) Cabeçalho: a primeira linha com conteúdo abre o bloco "/* ====".
  const primeira = linhas.find((l) => l.trim());
  if (!primeira?.trim().startsWith('/* ====')) anotar(arquivo, 1, 'sem cabeçalho', primeira ?? '(vazio)');

  // CSS só precisa do cabeçalho (as outras regras são de código).
  if (arquivo.endsWith('.css')) continue;

  /** Há comentário nas `n` linhas acima da linha i (ignora linhas em branco e decoradores de JSX)? */
  const comentadoAcima = (i, n) => {
    for (let k = i - 1, vistos = 0; k >= 0 && vistos < n; k--) {
      const l = linhas[k].trim();
      if (!l) continue;
      vistos++;
      if (l.startsWith('//') || l.endsWith('*/') || l.startsWith('*') || l.startsWith('/*') || l.startsWith('{/*')) return true;
    }
    return false;
  };
  /** Algum rótulo (GRAVA/APAGA/NAVEGA) na linha i ou nas `n` linhas acima? */
  const rotuladoPerto = (i, n) => linhas.slice(Math.max(0, i - n), i + 1).some((l) => /GRAVA|APAGA|NAVEGA/.test(l));

  linhas.forEach((linha, i) => {
    const l = linha.trim();
    // Linhas de comentário não contam como código.
    if (l.startsWith('//') || l.startsWith('*') || l.startsWith('/*')) return;

    // 2) Funções e componentes declarados no nível do arquivo (sem recuo).
    const ehFuncao = /^(export\s+(default\s+)?)?(async\s+)?function\s+\w+/.test(linha)
      || /^(export\s+)?const\s+[A-Za-z_]\w*\s*=\s*(async\s*)?(\([^)]*\)|\w+)\s*(:\s*[^=]+)?=>/.test(linha)
      || /^(export\s+)?const\s+[A-Z]\w*\s*=\s*forwardRef/.test(linha);
    if (ehFuncao && !comentadoAcima(i, 1)) anotar(arquivo, i + 1, 'função/componente sem JSDoc', linha);
    // 2b) Funções de dentro de componentes com corpo de várias linhas (handlers como salvar, abrir, enviar).
    const ehFuncaoInterna = /^\s{2,}const\s+\w+\s*=\s*(useCallback\(\s*)?(async\s*)?\([^)]*\)\s*(:\s*[^=]+)?=>\s*\{\s*$/.test(linha);
    if (ehFuncaoInterna && !arquivo.includes('.casos.') && !comentadoAcima(i, 2)) anotar(arquivo, i + 1, 'função interna sem comentário', linha);

    // 3) useEffect precisa de um comentário dizendo quando roda e o que limpa.
    if (/\buseEffect\(/.test(linha) && !/^import/.test(l) && !comentadoAcima(i, 4)) anotar(arquivo, i + 1, 'useEffect sem comentário', linha);

    // 4) Efeitos colaterais com rótulo por perto (até 8 linhas acima).
    if (/router\.(push|replace)\(/.test(linha) && !rotuladoPerto(i, 8)) anotar(arquivo, i + 1, 'navegação sem NAVEGA', linha);
    if (/\b(d|dados)\.(salvar|remover|moverTarefa|restaurarDemonstracao)\(/.test(linha) && !rotuladoPerto(i, 8)) anotar(arquivo, i + 1, 'gravação sem GRAVA/APAGA', linha);
    if (/(localStorage|sessionStorage)\.(setItem|removeItem|clear)\(/.test(linha) && !arquivo.startsWith('testes/') && !rotuladoPerto(i, 8)) anotar(arquivo, i + 1, 'storage sem GRAVA/APAGA', linha);
  });
}

// Relatório agrupado por regra.
const porRegra = Object.groupBy(problemas, (p) => p.regra);
for (const [regra, lista] of Object.entries(porRegra)) {
  console.log(`\n## ${regra} (${lista.length})`);
  for (const p of lista) console.log(`  ${p.arquivo}:${p.linha}  ${p.trecho}`);
}
console.log(`\n${arquivos.length} arquivos conferidos; ${problemas.length} ponto(s) para revisar.`);
process.exitCode = problemas.length ? 1 : 0;
