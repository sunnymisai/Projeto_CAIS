/* ============================================================================
   TESTES/NAVEGADOR/G01-FILTROS-PERIODO.MJS
   O que é: conferência do G01 (filtros por período nos painéis): trocar o período
     atualiza os números e o resumo em texto; o período vai para a URL e o link
     reabre no mesmo período; "Personalizado" com fim antes do início mostra o erro
     e não aplica; período sem dado mostra o vazio explicando, nos três painéis;
     375 px sem rolagem lateral; nenhum erro no console.
   Onde é usado: rodado à mão: node testes/navegador/g01-filtros-periodo.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §6 (dashboards), §8 Onda 4 (filtros por período) e §10 (filtros acima do conteúdo).
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('g01', 9368);
const { ev, ir, entrar, largura, erros } = nav;
/**
 * Abre uma rota e espera `condicao` (expressão JS) ficar verdadeira, por até 15 s.
 * @param rota - caminho do app.
 * @param condicao - expressão avaliada na página.
 */
const abrir = async (rota, condicao) => {
  await ir(rota, 500);
  for (let i = 0; i < 30 && !(await ev(condicao)); i++) await espera(500);
};
/** Texto do <main>. */
const texto = () => ev(`document.querySelector('main')?.innerText ?? ''`);
/**
 * Clica numa opção do filtro de período pelo texto (ex.: '90 dias') e espera a URL mudar (até 10 s):
 * a troca passa pelo router do Next, que leva mais de um instante.
 */
const opcao = async (rotulo) => {
  const antes = await ev('location.search');
  await ev(`[...document.querySelectorAll('main [role=radiogroup][aria-label="Período"] [role=radio]')].find((b) => b.textContent.trim() === ${JSON.stringify(rotulo)})?.click()`);
  if (rotulo === 'Personalizado') { await espera(500); return; }
  for (let i = 0; i < 20 && (await ev('location.search')) === antes; i++) await espera(500);
  await espera(500);
};
/** Opção marcada no filtro de período. */
const marcada = () => ev(`[...document.querySelectorAll('main [role=radiogroup][aria-label="Período"] [role=radio]')].find((b) => b.getAttribute('aria-checked') === 'true')?.textContent.trim()`);
/** Quantas trilhas concluídas o resumo do admin diz (0 se o bloco estiver vazio). */
const conclusoes = async () => Number(((await texto()).match(/(\d+) trilhas? concluídas? de/) ?? [])[1] ?? 0);
/**
 * Data local AAAA-MM-DD de N dias atrás (mesma conta do app, sem fuso de UTC).
 * @param n - quantos dias atrás.
 */
const diasAtras = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
/**
 * Preenche um campo de data do filtro pelo rótulo ("Início" ou "Fim").
 * @param rotulo - rótulo do campo.
 * @param valor - data AAAA-MM-DD.
 */
const data = (rotulo, valor) => ev(`(() => { const l = [...document.querySelectorAll('main label')].find((x) => x.textContent.trim() === ${JSON.stringify(rotulo)}); const el = l && document.getElementById(l.htmlFor); if (!el) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(valor)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
const semRolagemLateral = `(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`;
const pronto = `(document.querySelector('main')?.innerText ?? '').includes('Turma: evolução ao longo do tempo')`;

try {
  await ev(`localStorage.removeItem('cais-dados-v6')`);
  await entrar(CONTAS.admin);

  // --- Admin: padrão 30 dias; 7 e 90 mudam o número; a URL guarda o período. ---
  await abrir('/painel', pronto);
  c('admin: filtro acima dos blocos, padrão "30 dias"', (await marcada()) === '30 dias' && (await texto()).includes('No período'));
  const em30 = await conclusoes();
  await opcao('7 dias'); const em7 = await conclusoes();
  await opcao('90 dias'); const em90 = await conclusoes();
  c('admin: trocar o período muda o número de trilhas concluídas (7 ≤ 30 ≤ 90)', em7 <= em30 && em30 <= em90 && em7 < em90, `7: ${em7}, 30: ${em30}, 90: ${em90}`);
  const url = await ev('location.search');
  c('admin: o período vai para a URL (?de=&ate=)', /de=\d{4}-\d{2}-\d{2}/.test(url) && /ate=\d{4}-\d{2}-\d{2}/.test(url), url);
  await abrir('/painel' + url, pronto);
  c('admin: abrir o link reabre no mesmo período', (await marcada()) === '90 dias' && (await conclusoes()) === em90);
  c('admin: o gráfico da evolução tem resumo para leitor de tela', await ev(`!![...document.querySelectorAll('main [role=img]')].find((x) => /\\d+\\/\\d+: \\d+/.test(x.getAttribute('aria-label') ?? ''))`));

  // Personalizado: fim antes do início mostra erro e não muda a URL.
  await opcao('Personalizado');
  const antes = await ev('location.search');
  await data('Fim', diasAtras(100));
  await espera(500);
  c('personalizado: fim antes do início mostra o erro e não aplica', (await texto()).includes('O fim não pode vir antes do início') && (await ev('location.search')) === antes);
  // Período sem dado: um mês de dois anos atrás.
  await abrir(`/painel?de=${diasAtras(760)}&ate=${diasAtras(730)}`, pronto);
  const vazio = await texto();
  c('admin: período sem dado mostra o vazio explicando', vazio.includes('Nenhuma trilha concluída') && vazio.includes('Nenhuma tarefa concluída'));

  // --- Empresa (Marcos): aprovadas no período. ---
  await entrar(CONTAS.marcos);
  await abrir('/painel?de=' + diasAtras(89) + '&ate=' + diasAtras(0), `[...document.querySelectorAll('main a')].some((a) => a.textContent.trim() === 'Ver projetos')`);
  const emp = await texto();
  c('empresa: entregas aprovadas no período por projeto', /\d+ aprovadas? de \d{2}\/\d{2}\/\d{4} a/.test(emp) && emp.includes('Últimas entregas no período'));
  await abrir(`/painel?de=${diasAtras(760)}&ate=${diasAtras(730)}`, `[...document.querySelectorAll('main a')].some((a) => a.textContent.trim() === 'Ver projetos')`);
  c('empresa: período sem entrega mostra o vazio explicando', (await texto()).includes('Nenhuma entrega aprovada'));

  // --- Profissional (Ana): histórico no período. ---
  await entrar(CONTAS.ana);
  await abrir('/painel', `[...document.querySelectorAll('main a')].some((a) => a.textContent.trim() === 'Ver todas')`);
  c('profissional: resumo do histórico com o período', /\d+ entregas? de \d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4}/.test(await texto()));
  await abrir(`/painel?de=${diasAtras(760)}&ate=${diasAtras(730)}`, `[...document.querySelectorAll('main a')].some((a) => a.textContent.trim() === 'Ver todas')`);
  c('profissional: período sem entrega mostra o vazio explicando', (await texto()).includes('Nenhuma entrega no período'));

  // --- 375 px. ---
  await largura(375, 800);
  for (const conta of ['admin', 'marcos', 'ana']) {
    await entrar(CONTAS[conta]);
    await abrir('/painel', `!!document.querySelector('main [role=radiogroup][aria-label="Período"]')`);
    await espera(500);
    c(`375 px (${conta}): sem rolagem lateral`, await ev(semRolagemLateral));
  }
  await largura(1280, 900);
  await ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
