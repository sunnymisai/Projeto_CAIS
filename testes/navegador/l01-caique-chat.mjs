/* ============================================================================
   TESTES/NAVEGADOR/L01-CAIQUE-CHAT.MJS
   O que é: conferência do chat do CAIQUE ligado à rota /api/caique/chat: o botão flutuante, o estado vazio fora
     de uma trilha (campo travado), as sugestões dentro da trilha, a resposta (com "digitando"), o feedback, o erro
     com "Tentar de novo" (forçado interceptando o fetch), limpar, Esc, a troca de trilha e o celular (375 px).
     Funciona com e sem GEMINI_API_KEY (sem a chave, a rota devolve texto de demonstração).
     Também salva capturas de tela em CAIS_CAPTURAS (se definida).
   Onde é usado: rodado à mão: node testes/navegador/l01-caique-chat.mjs (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §4 (trilhas), §13 (acessível); prompts I04 a I07 em docs/prompts.
   ============================================================================ */
import { writeFileSync } from 'node:fs';
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('l01', 9371);
const { ev, ir, entrar, clicar, largura, cmd, erros } = nav;

/** Salva uma captura de tela, se a pasta de capturas foi informada. */
async function captura(nome) {
  if (!process.env.CAIS_CAPTURAS) return;
  const { result: { data } } = await cmd('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${process.env.CAIS_CAPTURAS}/${nome}.png`, Buffer.from(data, 'base64'));
}
/** Digita no campo do chat (setter nativo + evento, que o React entende). */
const digitar = (t) => ev(`(() => { const el = document.getElementById('caique-pergunta'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, ${JSON.stringify(t)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
/** Texto visível da janela do chat (vazio se estiver fechada). */
const janela = () => ev(`document.querySelector('[role=dialog][aria-label*="CAIQUE"]')?.innerText ?? ''`);
/** Quantas sugestões (botões com "?") a janela mostra. */
const sugestoes = () => ev(`[...document.querySelectorAll('[role=dialog] button')].filter((b) => b.textContent.includes('?')).length`);
/** Espera até a resposta chegar (some o "digitando"), por no máximo `ms`. A IA real pode levar alguns segundos. */
async function esperarResposta(ms = 15000) {
  const fim = Date.now() + ms;
  await espera(300);
  while (Date.now() < fim && /digitando/.test(await janela())) await espera(250);
}

try {
  await ev(`localStorage.removeItem('cais-dados-v6')`);
  await entrar(CONTAS.ana);
  await ir('/painel', 800);

  c('o botão flutuante aparece', await ev(`!!document.querySelector('button[aria-label="Abrir o chat do CAIQUE"]')`));
  c('a janela começa fechada', !(await ev(`!!document.querySelector('[role=dialog][aria-label*="CAIQUE"]')`)));
  await captura('01-botao');

  // Fora de uma trilha: o CAIQUE explica que só conversa sobre trilhas e trava o campo.
  await clicar('button[aria-label="Abrir o chat do CAIQUE"]');
  await espera(300);
  c('abre a janela', await ev(`!!document.querySelector('[role=dialog][aria-label*="CAIQUE"]')`));
  c('fora da trilha: boas-vindas e orientação de abrir uma trilha', /Oi! Eu sou o CAIQUE/.test(await janela()) && /Abra uma trilha/.test(await janela()));
  c('fora da trilha: nenhuma sugestão', (await sugestoes()) === 0);
  c('fora da trilha: campo e botão de envio travados', await ev(`document.getElementById('caique-pergunta').disabled && document.querySelector('button[aria-label="Enviar pergunta"]').disabled`));
  await captura('02-sem-trilha');
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });

  // Dentro de uma trilha: sugestões falam dela e o campo libera.
  await ir('/minhas-trilhas', 800);
  const href = await ev(`document.querySelector('main a[href^="/minhas-trilhas/"]')?.getAttribute('href') ?? ''`);
  c('há uma trilha para abrir', href.startsWith('/minhas-trilhas/'), href);
  await ir(href, 800);
  await clicar('button[aria-label="Abrir o chat do CAIQUE"]');
  await espera(300);
  c('dentro da trilha: 4 sugestões que falam da trilha', (await sugestoes()) === 4 && /Do que trata a trilha/.test(await janela()));
  c('o foco vai para o campo de texto', await ev(`document.activeElement?.id === 'caique-pergunta'`));
  await captura('03-vazio-trilha');

  // Pergunta vazia: erro de validação.
  await clicar('button[aria-label="Enviar pergunta"]');
  await espera(200);
  c('pergunta vazia mostra o erro do campo', /Escreva a sua pergunta/.test(await janela()));

  // Envio normal: aparece "digitando" e depois a resposta (da IA ou de demonstração).
  // A resposta de demonstração chega rápido demais para ver o "digitando": atrasa só esta chamada em 800 ms.
  await ev(`(() => { const original = window.fetch; window.fetch = (url, opts) => { if (String(url).includes('/api/caique/chat')) { window.fetch = original; return new Promise((r) => setTimeout(r, 800)).then(() => original(url, opts)); } return original(url, opts); }; })()`);
  await digitar('Como funciona o quiz?');
  await clicar('button[aria-label="Enviar pergunta"]');
  await espera(100);
  c('mostra "CAIQUE está digitando…" enquanto espera', /digitando/.test(await janela()));
  await esperarResposta();
  const conversa = await janela();
  c('a pergunta da pessoa aparece', /Você:\s*Como funciona o quiz\?/.test(conversa));
  c('a resposta do CAIQUE aparece', /CAIQUE:\s*\S/.test(conversa), conversa.slice(0, 200));
  c('o rodapé avisa se é IA ou demonstração', /pode errar|Demonstração/.test(conversa));
  c('o campo foi limpo depois de enviar', (await ev(`document.getElementById('caique-pergunta').value`)) === '');

  // Feedback: marca e desmarca (e manda para /api/caique/feedback sem erro no console).
  await clicar('button[aria-label="Resposta útil"]');
  await espera(150);
  c('avaliar marca "útil" (aria-pressed)', await ev(`document.querySelector('button[aria-label="Resposta útil"]').getAttribute('aria-pressed') === 'true'`));
  await clicar('button[aria-label="Resposta útil"]');
  await espera(150);
  c('clicar de novo desfaz a avaliação', await ev(`document.querySelector('button[aria-label="Resposta útil"]').getAttribute('aria-pressed') === 'false'`));
  await captura('04-conversa');

  // Erro: a próxima chamada ao chat devolve 503 (fetch interceptado só uma vez); "Tentar de novo" repete a pergunta.
  await ev(`(() => { const original = window.fetch; window.fetch = (url, opts) => { if (String(url).includes('/api/caique/chat')) { window.fetch = original; return Promise.resolve(new Response(JSON.stringify({ erro: 'O CAIQUE está com muitas perguntas agora. Tente de novo em alguns segundos.' }), { status: 503 })); } return original(url, opts); }; })()`);
  await digitar('Qual é a próxima etapa?');
  await clicar('button[aria-label="Enviar pergunta"]');
  await espera(500);
  c('estado de erro: diz o que houve, com o motivo do servidor', await ev(`!!document.querySelector('[role=dialog] [role=alert]') && /muitas perguntas agora/.test(document.querySelector('[role=dialog]').innerText)`));
  c('estado de erro: oferece "Tentar de novo"', /Tentar de novo/.test(await janela()));
  await captura('05-erro');
  await clicar('[role=dialog] [role=alert] button');
  await esperarResposta();
  const depois = await janela();
  c('"Tentar de novo" responde sem duplicar a pergunta', !/Tentar de novo/.test(depois) && (depois.match(/Você:\s*Qual é a próxima etapa\?/g) ?? []).length === 1, depois.slice(-300));

  // Limpar: volta ao vazio.
  await clicar('button[aria-label="Limpar conversa"]');
  await espera(200);
  c('limpar volta ao estado vazio', /Oi! Eu sou o CAIQUE/.test(await janela()));

  // Esc fecha a janela.
  await ev(`document.getElementById('caique-pergunta').focus()`);
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await espera(250);
  c('Esc fecha a janela', !(await ev(`!!document.querySelector('[role=dialog][aria-label*="CAIQUE"]')`)));

  // Celular: a janela cabe na tela e não cria rolagem lateral.
  await largura(375, 800);
  await ir(href, 800);
  await clicar('button[aria-label="Abrir o chat do CAIQUE"]');
  await espera(300);
  c('375 px: sem rolagem lateral', await ev(`document.documentElement.scrollWidth <= window.innerWidth`));
  c('375 px: a janela cabe na largura da tela', await ev(`(() => { const r = document.querySelector('[role=dialog]').getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth; })()`));
  await captura('06-celular');

  // Perfis sem trilhas próprias também têm o chat (admin).
  await largura(1280, 900);
  await entrar(CONTAS.admin);
  await ir('/painel', 800);
  c('o admin também vê o botão do chat', await ev(`!!document.querySelector('button[aria-label="Abrir o chat do CAIQUE"]')`));

  await ev(`localStorage.clear(); sessionStorage.clear()`);
  // O 503 forçado de propósito aparece no console como falha de rede; ele não conta como erro.
  const errosReais = erros.filter((e) => !/503/.test(e));
  c('nenhum erro no console', errosReais.length === 0, errosReais.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
