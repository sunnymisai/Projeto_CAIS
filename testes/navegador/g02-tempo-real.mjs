/* ============================================================================
   TESTES/NAVEGADOR/G02-TEMPO-REAL.MJS
   O que é: conferência do G02 (quadro em tempo real simulado entre abas): duas
     abas no mesmo projeto; mover uma tarefa na aba A (pelo Status do detalhe)
     atualiza a aba B sem recarregar, com o cartão em destaque, o aviso "X moveu
     'tarefa' para Revisão" (aria-live) e o indicador "Ao vivo"; a aba A não anuncia
     o próprio movimento; comentário novo também chega; nenhum erro no console.
   Onde é usado: rodado à mão: node testes/navegador/g02-tempo-real.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs (abre o Chrome e a aba A) e do seed de lib/seed.ts.
   Contexto: §5 (tempo real via WebSocket quando um colega move um cartão).
   ============================================================================ */
import { abrirNavegador, BASE, conferir, CONTAS, espera } from './cdp.mjs';

const PORTA = 9370;
const c = conferir();
const A = await abrirNavegador('g02', PORTA);

/**
 * Abre a aba B no MESMO Chrome (mesmo localStorage e mesmo BroadcastChannel) e devolve atalhos.
 * @returns { ev, ir, fechar, erros }.
 */
async function abrirAbaB() {
  const alvo = await (await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map(); const erros = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description?.slice(0, 300));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erros.push(m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300));
  });
  /** Comando CDP na aba B. */
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  /** Roda JS na aba B. */
  const ev = async (x) => (await cmd('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  /** Navega a aba B. */
  const ir = async (rota, ms = 3000) => { await cmd('Page.navigate', { url: BASE + rota }); await espera(ms); };
  return { ev, ir, erros, fechar: () => ws.close() };
}

/**
 * Espera a condição (JS) ficar verdadeira numa aba, por até `ms`.
 * @param aba - { ev }.
 * @param condicao - expressão JS.
 * @param ms - tempo máximo.
 * @returns true se ficou verdadeira.
 */
const esperarAte = async (aba, condicao, ms = 15000) => {
  for (let t = 0; t < ms; t += 300) { if (await aba.ev(condicao)) return true; await espera(300); }
  return false;
};

let B;
try {
  await A.ev(`localStorage.removeItem('cais-dados-v5')`);
  await A.entrar(CONTAS.admin);
  // A tarefa: a primeira da coluna "A fazer" do Portal.
  await A.ir('/projetos/prj_portal?aba=tarefas', 500);
  await esperarAte(A, `document.querySelectorAll('[data-cartao]').length > 0`);
  const tarefa = await A.ev(`(() => { const d = JSON.parse(localStorage.getItem('cais-dados-v5') ?? 'null'); return d ? null : null; })()`) ?? null;
  // Sem dados gravados ainda (seed só em memória): pega o cartão pela tela.
  const tarefaId = tarefa ?? await A.ev(`document.querySelector('[data-cartao]').dataset.cartao`);
  const titulo = await A.ev(`document.querySelector('[data-cartao="${tarefaId}"] p')?.textContent ?? ''`);

  B = await abrirAbaB();
  await B.ir('/projetos/prj_portal?aba=tarefas', 500);
  await esperarAte(B, `document.querySelectorAll('[data-cartao]').length > 0`);
  c('aba B: indicador "Ao vivo" no topo do quadro', (await B.ev(`document.querySelector('main')?.innerText ?? ''`)).includes('Ao vivo'));

  // Aba A: abre o detalhe e muda o Status para "Revisão".
  await A.ir(`/projetos/prj_portal?aba=tarefas&tarefa=${tarefaId}`, 500);
  await esperarAte(A, `!!document.querySelector('[role=dialog] select')`);
  const mudou = await A.ev(`(() => {
    const l = [...document.querySelectorAll('[role=dialog] label')].find((x) => x.textContent.replace('*', '').trim() === 'Status');
    const el = l && document.getElementById(l.htmlFor); if (!el) return false;
    const op = [...el.options].find((o) => o.textContent.trim() === 'Revisão'); if (!op) return false;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, op.value);
    el.dispatchEvent(new Event('change', { bubbles: true })); return op.value;
  })()`);
  c('aba A: tarefa movida para Revisão pelo Status do detalhe', !!mudou, String(mudou));

  // Aba B, SEM recarregar: o cartão aparece na coluna Revisão, com destaque e o aviso.
  const chegou = await esperarAte(B, `(() => { const el = document.querySelector('[data-cartao="${tarefaId}"]'); return !!el && el.classList.contains('ring-primaria'); })()`, 10000);
  c('aba B: o cartão pisca em destaque sem recarregar a página', chegou);
  const aviso = await B.ev(`document.querySelector('main [role=status][aria-live=polite]')?.textContent ?? ''`);
  c('aba B: aviso aria-live "Administrador moveu ... para Revisão"', aviso === `Administrador moveu '${titulo}' para Revisão`, aviso);
  const naColuna = await B.ev(`(() => { const d = JSON.parse(localStorage.getItem('cais-dados-v5')); const p = d.projetos.find((x) => x.id === 'prj_portal'); const t = d.tarefas.find((x) => x.id === '${tarefaId}'); return p.colunas.find((col) => col.id === t.colunaId)?.titulo; })()`);
  c('aba B: os dados da aba B foram recarregados (a tarefa está em Revisão)', naColuna === 'Revisão', naColuna);
  const somePosDestaque = await esperarAte(B, `!document.querySelector('[data-cartao="${tarefaId}"]')?.classList.contains('ring-primaria')`, 6000);
  c('aba B: o destaque some sozinho depois de alguns segundos', somePosDestaque);

  // A aba que mexeu não anuncia o próprio movimento.
  await A.ev(`document.querySelector('[role=dialog] button[aria-label="Fechar"]')?.click()`);
  await espera(500);
  c('aba A: não anuncia o próprio movimento', !(await A.ev(`document.querySelector('main [role=status][aria-live=polite]')?.textContent ?? ''`)).includes('moveu'));

  // Comentário novo também chega.
  await A.ir(`/projetos/prj_portal?aba=tarefas&tarefa=${tarefaId}`, 500);
  await esperarAte(A, `!!document.querySelector('[role=dialog] textarea[aria-label="Novo comentário"]')`);
  await A.ev(`(() => { const el = document.querySelector('[role=dialog] textarea[aria-label="Novo comentário"]'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, 'Teste de tempo real'); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await espera(300);
  await A.ev(`[...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Comentar')?.click()`);
  const comentou = await esperarAte(B, `(document.querySelector('main [role=status][aria-live=polite]')?.textContent ?? '').startsWith('Administrador comentou em')`, 10000);
  c('aba B: comentário novo também é anunciado', comentou);

  await A.ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console (abas A e B)', A.erros.length === 0 && B.erros.length === 0, [...A.erros, ...B.erros].join(' || '));
} finally {
  B?.fechar();
  A.fechar();
  c.resumo();
}
