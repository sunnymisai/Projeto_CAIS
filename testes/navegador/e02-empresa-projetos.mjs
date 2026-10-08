/* ============================================================================
   TESTES/NAVEGADOR/E02-EMPRESA-PROJETOS.MJS
   O que é: conferência da visão da empresa nos projetos e na trilha (E02): /projetos só
     com os dela, quadro sem arrastar e sem criar, detalhe da tarefa em leitura com
     comentário liberado, etiqueta "Empresa" no comentário (vista pelo admin), Equipe e
     painel sem carga de ninguém, "Próximas entregas" na Visão geral, projeto de outra
     empresa → /sem-permissao, Minhas trilhas com a geral e a da empresa, e o nome da
     empresa no topo, em 1280 e 375 px, sem erro no console.
   Onde é usado: rodado à mão: node testes/navegador/e02-empresa-projetos.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §3 (empresa acompanha e comenta), §5 (permissões nos projetos) e §4 (trilhas).
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('e02', 9362);
const { ev, ir, entrar, largura, erros } = nav;
/** Texto visível da área de conteúdo (<main>). */
const texto = () => ev(`document.querySelector('main')?.innerText ?? ''`);
/**
 * Abre uma rota e espera até `condicao` (expressão JS) ficar verdadeira, por até 15 s.
 * @param rota - caminho do app.
 * @param condicao - expressão avaliada na página.
 */
const abrir = async (rota, condicao) => {
  await ir(rota, 500);
  for (let i = 0; i < 30 && !(await ev(condicao)); i++) await espera(500);
};
const semRolagemLateral = `(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`;
const COMENTARIO = `Comentário de teste do cliente ${Date.now()}`;

try {
  await ev(`localStorage.removeItem('cais-dados-v4')`);
  await entrar(CONTAS.marcos);

  // 1) /projetos só com os da Vértice.
  await abrir('/projetos', `(document.querySelector('main')?.innerText ?? '').includes('Portal de pedidos')`);
  const lista = await texto();
  c('/projetos: Marcos vê os da Vértice e não o da Aurora', lista.includes('Portal de pedidos') && lista.includes('Painel de estoque') && !lista.includes('App de agendamento'));

  // 2) Quadro sem arrastar e sem criar.
  await abrir('/projetos/prj_portal?aba=tarefas', `document.querySelectorAll('[data-cartao]').length > 0`);
  c('quadro: nenhum cartão arrastável', await ev(`[...document.querySelectorAll('[data-cartao]')].every((el) => el.getAttribute('draggable') !== 'true')`));
  c('quadro: sem botão "Nova tarefa"', !(await ev(`[...document.querySelectorAll('main button')].some((b) => b.textContent.includes('Nova tarefa'))`)));

  // 3) Detalhe da tarefa em leitura, com comentário liberado; Marcos comenta.
  const tarefaId = await ev(`document.querySelector('[data-cartao]').dataset.cartao`);
  await abrir(`/projetos/prj_portal?aba=tarefas&tarefa=${tarefaId}`, `!!document.querySelector('[role=dialog] textarea[aria-label="Novo comentário"]')`);
  c('detalhe: só o campo de comentário é editável', await ev(`[...document.querySelectorAll('[role=dialog] input:not([type=hidden]), [role=dialog] select, [role=dialog] textarea')].every((el) => el.getAttribute('aria-label') === 'Novo comentário')`));
  await ev(`(() => { const el = document.querySelector('[role=dialog] textarea[aria-label="Novo comentário"]'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, ${JSON.stringify(COMENTARIO)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await espera(200);
  await ev(`[...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Comentar').click()`);
  await espera(400);
  c('detalhe: comentário do Marcos salvo', (await ev(`document.querySelector('[role=dialog]')?.innerText ?? ''`)).includes(COMENTARIO));

  // 4) O admin vê o comentário com a etiqueta "Empresa".
  await entrar(CONTAS.admin);
  await abrir(`/projetos/prj_portal?aba=tarefas&tarefa=${tarefaId}`, `(document.querySelector('[role=dialog]')?.innerText ?? '').includes(${JSON.stringify(COMENTARIO)})`);
  const linha = await ev(`(() => { const li = [...document.querySelectorAll('[role=dialog] li')].find((x) => x.innerText.includes(${JSON.stringify(COMENTARIO)})); return li?.querySelector('p')?.innerText ?? ''; })()`);
  c('admin: comentário com a etiqueta "Empresa" ao lado do nome', linha.includes('Marcos Vieira') && linha.includes('Empresa'), linha);
  // O admin continua vendo a carga na Equipe (a regra de privacidade é só para a empresa).
  await abrir('/projetos/prj_portal?aba=equipe', `!!document.querySelector('main table')`);
  c('admin: Equipe continua com carga', (await texto()).includes('h/sem'));

  // 5) Equipe, Visão geral e painel do Marcos sem carga de ninguém.
  await entrar(CONTAS.marcos);
  await abrir('/projetos/prj_portal?aba=equipe', `!!document.querySelector('main table')`);
  // textContent (e não innerText): o cabeçalho da tabela fica em caixa alta só por CSS.
  const cab = await ev(`[...document.querySelectorAll('main thead th')].map((th) => th.textContent.trim()).filter(Boolean).join('|')`);
  c('Equipe (empresa): colunas pessoa, papel e período', cab === 'Pessoa|Papel|Período', cab);
  c('Equipe (empresa): nenhuma carga em horas', !/h\/sem/.test(await texto()));
  await abrir('/projetos/prj_portal?aba=geral', `(document.querySelector('main')?.innerText ?? '').includes('Próximas entregas')`);
  const geral = await texto();
  c('Visão geral: prazo, status, líder e progresso', geral.includes('Período') && geral.includes('Status do projeto') && geral.includes('Líder') && geral.includes('Tarefas prontas'));
  c('Visão geral: card "Próximas entregas"', geral.includes('Próximas entregas') && (/em \d+ dias?|vence hoje/.test(geral) || geral.includes('Nenhuma tarefa vence')));
  await abrir('/painel', `[...document.querySelectorAll('main a')].some((a) => a.textContent.trim() === 'Ver projetos')`);
  c('painel (empresa): nenhuma carga em horas', !/h\/sem/.test(await texto()));

  // 6) Projeto da Aurora pela URL → /sem-permissao.
  await abrir('/projetos/prj_agenda', `location.pathname === '/sem-permissao'`);
  c('URL do projeto da Aurora → /sem-permissao', (await ev('location.pathname')) === '/sem-permissao');

  // 7) Minhas trilhas: a geral e a da empresa.
  await abrir('/minhas-trilhas', `(document.querySelector('main')?.innerText ?? '').includes('Processos da Vértice')`);
  const trilhas = await texto();
  c('Minhas trilhas: Boas-vindas (geral) e Processos da Vértice (empresa)', trilhas.includes('Boas-vindas ao programa') && trilhas.includes('Processos da Vértice'));
  c('Minhas trilhas: não aparece trilha só de profissionais', !trilhas.includes('Nivelamento de front-end'));

  // 8) Nome da empresa no topo, ao lado do avatar (desktop) e 375 px sem rolagem lateral.
  c('topo: nome da empresa ao lado do avatar', (await ev(`document.querySelector('button[aria-label="Menu do perfil"]')?.innerText ?? ''`)).includes('Vértice Logística'));
  for (const rota of ['/projetos/prj_portal?aba=geral', '/projetos/prj_portal?aba=equipe']) {
    await largura(375, 900);
    await abrir(rota, `!!document.querySelector('main h1')`);
    await espera(800);
    c(`375 px sem rolagem lateral: ${rota}`, await ev(semRolagemLateral));
  }
  await largura(1280, 900);
  await ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
