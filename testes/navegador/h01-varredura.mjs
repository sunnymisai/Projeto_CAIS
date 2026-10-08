/* ============================================================================
   TESTES/NAVEGADOR/H01-VARREDURA.MJS
   O que é: a parte automática da revisão H01 (definição de pronto): abre cada rota
     com cada conta e mede para onde ela leva (permissões), botões/links sem nome,
     campos sem rótulo, gráficos (SVG) sem texto, foco visível em 30 Tabs, rolagem
     lateral em 375 px e erros no console. Imprime uma linha por conta × rota.
   Onde é usado: rodado à mão na revisão H01: node testes/navegador/h01-varredura.mjs
     (com o `npm run dev` aberto em http://localhost:3000). Grava o detalhe em
     testes/navegador/.perfis/h01.json (ignorado pelo git).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §13 (acessibilidade e responsividade) e §14 (definição de pronto).
   ============================================================================ */
import { writeFileSync } from 'node:fs';
import { abrirNavegador, CONTAS, espera } from './cdp.mjs';

const nav = await abrirNavegador('h01', 9363);
const { ev, ir, entrar, largura, tab, erros } = nav;

const PUBLICAS = ['/', '/login', '/recuperar-senha', '/primeiro-acesso?convite=pes_felipe', '/sem-permissao', '/rota-que-nao-existe'];
const INTERNAS = ['/painel', '/empresas', '/pessoas', '/trilhas', '/trilhas/tri_boasvindas', '/projetos', '/projetos/prj_portal', '/projetos/prj_agenda',
  '/design-system', '/acessos', '/carga', '/minhas-trilhas', '/minhas-trilhas/tri_boasvindas', '/minhas-trilhas/tri_boasvindas/etapa/et_1',
  '/minhas-trilhas/tri_nivel_front', '/minhas-trilhas/tri_vertice', '/minhas-tarefas', '/perfil'];
const QUEM = { anonimo: null, admin: CONTAS.admin, ana: CONTAS.ana, elisa: CONTAS.elisa, marcos: CONTAS.marcos, patricia: CONTAS.patricia };

// Mede nomes acessíveis, rótulos e gráficos na tela aberta.
const MEDIR = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const nome = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))?.textContent) || el.textContent || el.querySelector('img')?.alt || '').trim();
  const semNome = [...document.querySelectorAll('button, a[href], [role=button]')].filter((el) => vis(el) && !nome(el)).map((el) => el.outerHTML.slice(0, 140));
  const semRotulo = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter((el) => vis(el) && !(el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'))).map((el) => el.outerHTML.slice(0, 140));
  const graficos = [...document.querySelectorAll('svg')].filter((s) => vis(s) && s.getBoundingClientRect().width > 60 && !s.closest('button, a') && s.getAttribute('aria-hidden') !== 'true')
    .filter((s) => !(s.getAttribute('aria-label') || s.querySelector('title') || s.getAttribute('aria-labelledby') || s.closest('[role=img][aria-label]'))).length;
  return { caminho: location.pathname, semNome, semRotulo, graficos };
})()`;
const LARGO = `(() => { const m = document.querySelector('#conteudo'); return Math.max(document.documentElement.scrollWidth - innerWidth, m ? m.scrollWidth - m.clientWidth : 0); })()`;

const res = [];
try {
  await ev(`localStorage.removeItem('cais-dados-v2')`);
  for (const [conta, sessao] of Object.entries(QUEM)) {
    await entrar(sessao);
    for (const rota of sessao ? ['/', '/sem-permissao', ...INTERNAS] : PUBLICAS) {
      const antes = erros.length;
      await largura(1280, 900);
      await ir(rota, 2500);
      const m = await ev(MEDIR);
      // Teclado: 30 Tabs. O portal do Next (indicador do modo dev) não conta.
      const paradas = [];
      for (let i = 0; i < 30; i++) { const p = await tab(); if (p && p.tag !== 'NEXTJS-PORTAL') paradas.push(p); }
      const semAnel = [...new Set(paradas.filter((p) => !p.visivel).map((p) => `${p.tag}:${p.texto}`))];
      await largura(375, 800); await espera(600);
      const largo = await ev(LARGO);
      res.push({ conta, rota, ...m, semAnel, distintos: new Set(paradas.map((p) => p.tag + p.texto)).size, largo, console: erros.slice(antes) });
      const notas = [];
      if (m.caminho !== rota.split('?')[0]) notas.push(`→ ${m.caminho}`);
      if (m.semNome.length) notas.push(`sem nome: ${m.semNome.length}`);
      if (m.semRotulo.length) notas.push(`campo sem rótulo: ${m.semRotulo.length}`);
      if (m.graficos) notas.push(`svg sem texto: ${m.graficos}`);
      if (semAnel.length) notas.push(`foco invisível: ${semAnel.length}`);
      if (largo > 1) notas.push(`375 px +${largo}`);
      if (erros.length > antes) notas.push(`console: ${erros.length - antes}`);
      console.log(`${conta.padEnd(9)} ${rota.padEnd(44)} ${notas.join(' | ') || 'ok'}`);
    }
  }
} finally {
  writeFileSync(new URL('./.perfis/h01.json', import.meta.url), JSON.stringify(res, null, 1));
  await ev(`localStorage.clear(); sessionStorage.clear()`);
  nav.fechar();
}
