/* ============================================================================
   TESTES/NAVEGADOR/CDP.MJS
   O que é: utilitário dos testes de navegador: abre um Chrome sem janela
     (headless), conversa com ele pelo Chrome DevTools Protocol (CDP) e oferece
     atalhos (ir para uma rota, rodar JS na página, entrar com uma conta, clicar,
     mudar a largura da tela, ler erros do console).
   Onde é usado: os testes desta pasta (ex.: d02-minhas-trilhas.mjs).
   Depende de: Node 22+ (fetch e WebSocket nativos), Google Chrome instalado e o
     `npm run dev` rodando em http://localhost:3000. Nenhuma biblioteca nova.
   Contexto: CLAUDE.md "Verificação antes de dizer que terminou" (teste no navegador).
   Como rodar um teste: node testes/navegador/<arquivo>.mjs
   ============================================================================ */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Endereço do app em desenvolvimento. */
export const BASE = process.env.CAIS_URL ?? 'http://localhost:3000';

// Onde o Chrome costuma estar no Windows; CHROME=... no ambiente troca o caminho.
const CHROMES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

/** Contas de demonstração (as mesmas de lib/auth.tsx), no formato da sessão salva. */
export const CONTAS = {
  admin: { pessoaId: 'pes_admin', nome: 'Administrador CAIS', email: 'admin@cais.com.br', perfil: 'admin' },
  ana: { pessoaId: 'pes_ana', nome: 'Ana Souza', email: 'ana.souza@cais.example', perfil: 'profissional' },
  carla: { pessoaId: 'pes_carla', nome: 'Carla Nunes', email: 'carla.nunes@cais.example', perfil: 'profissional' },
  elisa: { pessoaId: 'pes_elisa', nome: 'Elisa Rocha', email: 'elisa.rocha@cais.example', perfil: 'profissional' },
  marcos: { pessoaId: 'pes_marcos', nome: 'Marcos Vieira', email: 'marcos@vertice.example', perfil: 'empresa' },
  patricia: { pessoaId: 'pes_patricia', nome: 'Patrícia Melo', email: 'patricia@aurora.example', perfil: 'empresa' },
};

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
export { espera };

/**
 * Abre o Chrome headless com um perfil limpo e devolve os atalhos de teste.
 * O perfil fica em testes/navegador/.perfis/<nome> (ignorado pelo git) e é apagado antes.
 * @param nome - nome do perfil (um por teste, para não misturar dados).
 * @param porta - porta do DevTools (troque se dois testes rodarem juntos).
 * @returns { cmd, ev, ir, entrar, clicar, largura, erros, fechar }.
 */
export async function abrirNavegador(nome, porta = 9350) {
  const chrome = CHROMES.find((c) => existsSync(c));
  if (!chrome) throw new Error('Chrome não encontrado. Defina CHROME=<caminho do chrome.exe>.');
  const pasta = join(dirname(fileURLToPath(import.meta.url)), '.perfis', nome);
  rmSync(pasta, { recursive: true, force: true });
  mkdirSync(pasta, { recursive: true });
  const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${pasta}`, '--no-first-run', 'about:blank']);

  // Espera o Chrome abrir a porta do DevTools e pega a aba.
  let alvo;
  for (let i = 0; i < 60 && !alvo; i++) {
    await espera(250);
    try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find((t) => t.type === 'page'); } catch { /* ainda abrindo */ }
  }
  if (!alvo) { proc.kill(); throw new Error('O Chrome não respondeu.'); }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));

  let id = 0;
  const pendentes = new Map();
  const erros = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pendentes.has(m.id)) { pendentes.get(m.id)(m); pendentes.delete(m.id); }
    // Guarda exceções e console.error da página: o teste mostra no fim.
    if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description?.slice(0, 300) ?? m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erros.push(m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300));
  });

  /** Manda um comando CDP e espera a resposta. */
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pendentes.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  /** Roda JS na página e devolve o valor (ou 'ERRO: ...'). Aceita await. */
  const ev = async (expr) => {
    const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) return 'ERRO: ' + (r.result.exceptionDetails.exception?.description ?? '').slice(0, 200);
    return r.result?.result?.value;
  };
  /** Muda a largura da tela (375 = celular). */
  const largura = (w, h = 800) => cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 500 });
  /** Vai para uma rota do app e espera carregar (a store simula 450 ms de rede). */
  const ir = async (rota, ms = 3000) => { await cmd('Page.navigate', { url: BASE + rota }); await espera(ms); };
  /**
   * Entra com uma conta gravando a sessão direto no navegador (o fluxo de login já tem teste próprio).
   * @param conta - uma das CONTAS (ou null para sair).
   */
  const entrar = async (conta) => {
    await ev(`localStorage.removeItem('cais-sessao'); sessionStorage.clear(); ${conta ? `localStorage.setItem('cais-sessao', ${JSON.stringify(JSON.stringify({ ...conta, token: 'demo.teste' }))})` : ''}`);
  };
  /** Clique de mouse de verdade no centro do elemento (seletor CSS). */
  const clicar = async (seletor) => {
    const p = await ev(`(() => { const el = document.querySelector(${JSON.stringify(seletor)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    if (!p) return false;
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await cmd('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 });
    return true;
  };
  /** Aperta Tab e devolve o elemento focado e se o foco está visível (outline ou anel). */
  const tab = async (shift = false) => {
    const mods = shift ? 8 : 0;
    await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: mods });
    await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: mods });
    await espera(60);
    return ev(`(() => { const el = document.activeElement; if (!el || el === document.body) return null; const s = getComputedStyle(el);
      return { tag: el.tagName, texto: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 50), visivel: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none') }; })()`);
  };
  const fechar = () => { ws.close(); proc.kill(); };

  await cmd('Runtime.enable');
  await cmd('Page.enable');
  await largura(1280, 900);
  // Abre o app uma vez para o localStorage do endereço existir.
  await ir('/login', 4000);
  return { cmd, ev, ir, entrar, clicar, largura, tab, erros, fechar };
}

/**
 * Conferência simples: imprime ✓ ou ✗ com a descrição e conta as falhas.
 * @example const c = conferir(); c('vê três trilhas', n === 3); c.resumo();
 */
export function conferir() {
  let falhas = 0;
  const c = (descricao, ok, detalhe = '') => {
    if (!ok) falhas++;
    console.log(`${ok ? '✓' : '✗'} ${descricao}${detalhe ? `  (${detalhe})` : ''}`);
  };
  c.resumo = () => { console.log(falhas ? `\n${falhas} conferência(s) falharam.` : '\nTudo certo.'); process.exitCode = falhas ? 1 : 0; };
  return c;
}
