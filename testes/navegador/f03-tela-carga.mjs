/* ============================================================================
   TESTES/NAVEGADOR/F03-TELA-CARGA.MJS
   O que é: conferência do F03 (tela "Carga da equipe" e componentes do semáforo):
     Diego nunca vermelho, Elisa vermelha só em 2 semanas, Bruno vermelho, Gabriela
     livre, aria-label das células, quebra por projeto, painel lateral (abre, mostra
     os dias e as alocações, fecha com Esc), filtros e contagem, teclado, 375 px
     (cards), os dois temas, acesso só do admin e a seção no /design-system.
   Onde é usado: rodado à mão: node testes/navegador/f03-tela-carga.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §10 (anatomia da tela), §13 (teclado e tabela acessível) e §16 (semáforo).
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('f03', 9366);
const { ev, ir, entrar, largura, tab, cmd, erros } = nav;
/**
 * Abre /carga e espera a matriz (ou os cards) desenhar, por até 15 s.
 * @param seletor - o que precisa existir para a tela estar pronta.
 */
const abrirCarga = async (seletor = 'main table tbody tr') => {
  await ir('/carga', 500);
  for (let i = 0; i < 30 && !(await ev(`!!document.querySelector(${JSON.stringify(seletor)})`)); i++) await espera(500);
};
/**
 * aria-label das células (botões) de uma pessoa na matriz.
 * @param nome - nome da pessoa.
 * @returns lista de rótulos, um por semana.
 */
const celulas = (nome) => ev(`[...document.querySelectorAll('main td button[aria-label^=${JSON.stringify(nome + ',')}]')].map((b) => b.getAttribute('aria-label'))`);
/** Clica num botão do <main> pelo texto (ex.: '12 semanas'). */
const botao = (texto) => ev(`[...document.querySelectorAll('main button, main [role=radio]')].find((b) => b.textContent.trim() === ${JSON.stringify(texto)})?.click()`);
const semRolagemLateral = `(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`;

try {
  await ev(`localStorage.removeItem('cais-dados-v3')`);

  // Acesso: só o admin.
  await entrar(CONTAS.ana);
  await ir('/carga', 3000);
  c('profissional em /carga → /sem-permissao', (await ev('location.pathname')) === '/sem-permissao');

  await entrar(CONTAS.admin);
  await abrirCarga();
  c('matriz com cabeçalho de semanas e linhas por pessoa', await ev(`document.querySelectorAll('main thead th[scope=col]').length === 9 && document.querySelectorAll('main tbody th[scope=row]').length >= 6`));
  c('só profissionais ativos (Felipe, convidado, fica fora)', !(await ev(`document.querySelector('main tbody').innerText.includes('Felipe')`)));
  await botao('12 semanas'); await espera(400);
  c('12 semanas: 12 colunas de semana', (await ev(`document.querySelectorAll('main thead th[scope=col]').length`)) === 13);

  const diego = await celulas('Diego Alves');
  c('Diego nunca acima do limite em 12 semanas (o caso do time)', diego.length === 12 && !diego.some((r) => r.includes('acima do limite')), diego.slice(0, 3).join(' | '));
  const elisa = await celulas('Elisa Rocha');
  const elisaVermelhas = elisa.filter((r) => r.includes('acima do limite'));
  c('Elisa acima do limite em exatamente 2 semanas', elisaVermelhas.length === 2, elisaVermelhas.join(' | '));
  c('Bruno acima do limite na semana atual', (await celulas('Bruno Lima'))[0]?.includes('acima do limite'));
  c('Gabriela livre em todas as semanas', (await celulas('Gabriela Costa')).every((r) => r.includes('livre')));
  c('aria-label da célula no formato "Nome, semana de dd/mm: N%, nível"', /^Bruno Lima, semana de \d{2}\/\d{2}: \d+%, acima do limite$/.test((await celulas('Bruno Lima'))[0] ?? ''));

  // Quebra por projeto.
  await ev(`document.querySelector('main tbody th button[aria-label*="Bruno Lima"]').click()`); await espera(300);
  const sub = await ev(`(() => { const b = document.querySelector('main tbody th button[aria-label*="Bruno Lima"]'); return { expandido: b.getAttribute('aria-expanded'), texto: document.querySelector('main tbody').innerText }; })()`);
  c('linha expansível: aria-expanded e uma sub-linha por projeto do Bruno', sub.expandido === 'true' && sub.texto.includes('Portal de pedidos') && sub.texto.includes('Painel de estoque'));

  // Painel lateral pela célula, com Enter (teclado).
  await ev(`document.querySelector('main td button[aria-label^="Bruno Lima,"]').focus()`);
  // O texto do Enter (caractere 13) faz o Chrome tratar como Enter de verdade (sem ele o botão não é acionado).
  await cmd("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: String.fromCharCode(13) });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await espera(500);
  const painel = await ev(`document.querySelector('[role=dialog]')?.innerText ?? ''`);
  c('Enter na célula abre o painel lateral com os 5 dias e as alocações', painel.includes('Dia a dia') && ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].every((dd) => painel.includes(dd)) && painel.includes('Portal de pedidos') && painel.includes('Ver equipe do projeto'), painel.slice(0, 80));
  c('painel tem link para a aba Equipe do projeto', await ev(`!![...document.querySelectorAll('[role=dialog] a')].find((a) => a.getAttribute('href')?.includes('?aba=equipe'))`));
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await espera(400);
  c('Esc fecha o painel e o foco volta para a célula', !(await ev(`!!document.querySelector('[role=dialog]')`)) && (await ev(`document.activeElement?.getAttribute('aria-label') ?? ''`)).startsWith('Bruno Lima,'));

  // Teclado: Tab percorre as células com foco visível.
  const paradas = []; for (let i = 0; i < 8; i++) paradas.push(await tab());
  c('Tab passa pelas células com foco visível', paradas.filter(Boolean).every((p) => p.visivel), JSON.stringify(paradas.filter((p) => p && !p.visivel).slice(0, 2)));

  // Filtros e contagem.
  await ev(`document.querySelector('#so-acima').click()`); await espera(300);
  const nomes = await ev(`[...document.querySelectorAll('main tbody th[scope=row] button')].map((b) => b.querySelector('span span')?.textContent).filter(Boolean).join(',')`);
  c('"Só acima do limite": Bruno e Elisa', nomes === 'Bruno Lima,Elisa Rocha', nomes);
  c('contagem no rodapé', /Mostrando 2 de \d+ profissionais/.test(await ev(`document.querySelector('main')?.innerText ?? ''`)));
  await ev(`(() => { const i = [...document.querySelectorAll('main input')].find((x) => x.placeholder === 'Ex.: Bruno'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'zzz'); i.dispatchEvent(new Event('input', { bubbles: true })); })()`); await espera(300);
  c('filtro sem resultado mostra o vazio com "Limpar filtros"', (await ev(`document.querySelector('main')?.innerText ?? ''`)).includes('Ninguém com esses filtros'));
  await botao('Limpar filtros'); await espera(300);
  c('"Limpar filtros" volta a lista inteira', (await ev(`document.querySelectorAll('main tbody th[scope=row] button').length`)) >= 6);

  // Celular e temas.
  for (const tema of ['claro', 'escuro']) {
    await ev(`localStorage.setItem('cais-tema', '${tema}')`);
    await largura(375, 800);
    await abrirCarga('main ol[aria-label^="Carga de"]');
    c(`375 px (${tema}): cards com 4 semanas por pessoa`, await ev(`(() => { const l = document.querySelector('main ol[aria-label^="Carga de"]'); return !!l && l.querySelectorAll('li').length === 4; })()`));
    c(`375 px (${tema}): sem rolagem lateral`, await ev(semRolagemLateral));
    await largura(1280, 900);
    await abrirCarga();
    c(`desktop (${tema}): tema aplicado`, (await ev(`document.documentElement.classList.contains('dark')`)) === (tema === 'escuro'));
  }

  // Página viva.
  await ir('/design-system', 3000);
  c('/design-system documenta o semáforo (indicador, linha e legenda)', await ev(`!!document.querySelector('#semaforo') && !!document.querySelector('#semaforo ol') && !!document.querySelector('#semaforo ul[aria-label="Legenda do semáforo de carga"]')`));

  await ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
