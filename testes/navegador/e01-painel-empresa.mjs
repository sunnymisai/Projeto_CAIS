/* ============================================================================
   TESTES/NAVEGADOR/E01-PAINEL-EMPRESA.MJS
   O que é: conferência do painel da empresa (E01): cada empresa vê só o que é dela,
     cabeçalho com nome fantasia e status, período no lugar das horas (privacidade),
     entregas aprovadas × aguardando revisão por projeto, vazio de entregas da Aurora,
     os dois temas, 375 px sem rolagem lateral e nenhum erro no console.
   Onde é usado: rodado à mão: node testes/navegador/e01-painel-empresa.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §3 (empresa vê só os próprios projetos), §6 (painel da empresa) e §13 (quatro estados).
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('e01', 9360);
const { ev, ir, entrar, largura, erros } = nav;
/** Texto visível da área de conteúdo (<main>), para procurar nomes de projeto e mensagens. */
const texto = () => ev(`document.querySelector('main')?.innerText ?? ''`);
const semRolagemLateral = `(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`;
/**
 * Abre o /painel e espera os blocos aparecerem (até 15 s), em vez de um tempo fixo:
 * com a máquina ocupada (build, tsc), a primeira compilação do Next pode passar de 3 s.
 */
const abrirPainel = async () => {
  await ir('/painel', 500);
  for (let i = 0; i < 30; i++) {
    // Pronto = o link "Ver projetos" já apareceu: o Bloco só mostra a ação depois que os dados carregaram.
    if (await ev(`[...document.querySelectorAll('main a')].some((a) => a.textContent.trim() === 'Ver projetos')`)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
};
/**
 * Texto de um bloco do painel, achado pelo título (h2/h3 do CardTitulo).
 * @param titulo - título exato do bloco, ex.: 'Entregas'.
 * @returns o texto do cartão inteiro ('' se não achar).
 */
const bloco = (titulo) => ev(`(() => { const h = [...document.querySelectorAll('main h2, main h3')].find((x) => x.textContent.trim() === ${JSON.stringify(titulo)}); return h?.closest('.flex.flex-col')?.innerText ?? ''; })()`);

try {
  // Parte do seed atual (o mesmo que "Restaurar dados de demonstração").
  await ev(`localStorage.removeItem('cais-dados-v4')`);

  // --- Marcos (Vértice) ---
  await entrar(CONTAS.marcos);
  await abrirPainel();
  const h1 = await ev(`document.querySelector('main h1')?.innerText ?? ''`);
  c('Marcos: cabeçalho com nome fantasia e status', h1.includes('Vértice Logística') && h1.includes('Ativa'), h1);
  const tm = await texto();
  c('Marcos: vê os projetos da Vértice', tm.includes('Portal de pedidos') && tm.includes('Painel de estoque'));
  c('Marcos: não vê o projeto da Aurora', !tm.includes('App de agendamento'));
  c('Marcos: andamento com % escrito', /\d+% pronto/.test(await bloco('Andamento dos projetos')));
  const time = await bloco('Quem está no time');
  // dataCurta escreve "27 ago": o período fica "27 ago a 22 nov".
  c('Marcos: time com período', /\d{1,2} [a-zç]{3} a \d{1,2} [a-zç]{3}/.test(time), time.slice(0, 120));
  c('Marcos: time sem horas (privacidade)', !/h\/sem|\bh\b/.test(time));
  const ent = await bloco('Entregas');
  c('Marcos: entregas por projeto com aprovadas e aguardando revisão', ent.includes('Aprovadas') && ent.includes('Aguardando revisão') && ent.includes('Portal de pedidos'), ent.slice(0, 160));
  c('Marcos: barras das entregas com resumo em texto', await ev(`[...document.querySelectorAll('main [role=img]')].every((b) => (b.getAttribute('aria-label') ?? '').length > 0)`));
  c('Marcos: trilha do time aparece', (await bloco('Trilha do time')).includes('Processos da Vértice'));

  // --- Patrícia (Aurora) ---
  await entrar(CONTAS.patricia);
  await abrirPainel();
  const h1p = await ev(`document.querySelector('main h1')?.innerText ?? ''`);
  c('Patrícia: cabeçalho da Aurora', h1p.includes('Aurora Saúde'), h1p);
  const tp = await texto();
  c('Patrícia: vê só o projeto da Aurora', tp.includes('App de agendamento') && !tp.includes('Portal de pedidos') && !tp.includes('Painel de estoque'));
  c('Patrícia: entregas no estado vazio (projeto planejado, sem tarefas)', (await bloco('Entregas')).includes('Nenhuma entrega ainda'));
  c('Patrícia: quem começa depois aparece com "A partir de"', (await bloco('Quem está no time')).includes('A partir de'));

  // --- Dois temas e 375 px ---
  for (const tema of ['claro', 'escuro']) {
    await ev(`localStorage.setItem('cais-tema', '${tema}')`);
    for (const w of [1280, 375]) {
      await largura(w, 900);
      await entrar(CONTAS.marcos);
      await abrirPainel();
      const escuro = await ev(`document.documentElement.classList.contains('dark')`);
      c(`tema ${tema} (${w} px): tema aplicado`, escuro === (tema === 'escuro'));
      c(`tema ${tema} (${w} px): sem rolagem lateral`, await ev(semRolagemLateral));
    }
  }
  await largura(1280, 900);
  await ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
