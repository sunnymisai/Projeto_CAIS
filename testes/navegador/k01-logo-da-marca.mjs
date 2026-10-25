/* ============================================================================
   TESTES/NAVEGADOR/K01-LOGO-DA-MARCA.MJS
   O que é: confere a identidade da empresa no tema (fase 2): (1) com o tema CAIS, o logo do CAIS aparece e o
     SeloCais também; (2) com um tema que traz logo e nome, o cabeçalho da Sidebar, do login e da home mostra a
     marca da empresa (<img> com alt) e o CAIS continua visível no selo fixo; (3) no escuro o logo escuro é o
     escolhido; (4) em 375 px nada estoura para o lado e o selo aparece no login e na home.
   Onde é usado: rodado à mão: node testes/navegador/k01-logo-da-marca.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs, components/marca/LogoDaMarca.tsx e components/marca/SeloCais.tsx.
   Contexto: docs/temas-contrato.md, "Identidade da empresa no tema (fase 2)".
   ============================================================================ */
import { CONTAS, abrirNavegador, conferir, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('k01', 9395);
const { ev, ir, cmd, largura, entrar } = nav;

// Dois SVGs de teste (data URL válido): o claro é azul e o escuro é laranja, para saber qual foi escolhido.
const svg = (cor) => `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="60"><rect width="240" height="60" fill="${cor}"/></svg>`;
const LOGO_CLARO = `data:image/svg+xml;base64,${Buffer.from(svg('#1D4ED8')).toString('base64')}`;
const LOGO_ESCURO = `data:image/svg+xml;base64,${Buffer.from(svg('#EA580C')).toString('base64')}`;
const NOME = 'Aurora Construtora Brasil Ltda';

/** Grava o tema da empresa como padrão do sistema (ou volta ao CAIS) direto nos dados do navegador. */
const definirTema = (comMarca) => ev(`(() => {
  const k = 'cais-dados-v6';
  // A store só grava depois da primeira alteração; num perfil novo parte de dados mínimos (só as seis coleções, que é o que formatoValido exige).
  const d = JSON.parse(localStorage.getItem(k) ?? 'null') ?? { empresas: [], pessoas: [], trilhas: [], projetos: [], alocacoes: [], tarefas: [] };
  const tema = { id: 'custom-k01', nome: 'Aurora', base: false, claro: {}, escuro: {}, identidade: { nomeEmpresa: ${JSON.stringify(NOME)}, logoClaro: ${JSON.stringify(LOGO_CLARO)}, logoEscuro: ${JSON.stringify(LOGO_ESCURO)} } };
  const base = d.temas ?? { personalizados: [], padraoId: 'cais', porEmpresa: {} };
  d.temas = ${comMarca ? `{ ...base, personalizados: [tema], padraoId: 'custom-k01' }` : `{ ...base, personalizados: [], padraoId: 'cais' }`};
  localStorage.setItem(k, JSON.stringify(d));
  return 'ok';
})()`);
/** Dentro do elemento do seletor: tem imagem de marca? qual src, qual alt? tem o logo SVG do CAIS? */
const marca = (seletor) => ev(`(() => {
  const raiz = document.querySelector(${JSON.stringify(seletor)}); if (!raiz) return null;
  const img = [...raiz.querySelectorAll('img')].find((i) => i.src.startsWith('data:image/svg+xml'));
  const r = img?.getBoundingClientRect();
  return { img: !!img, alt: img?.alt ?? null, src: img?.src ?? null, visivel: !!r && r.width > 0 && r.height > 0 && r.right <= innerWidth + 1,
    cais: !!raiz.querySelector('svg[role=img][aria-label=CAIS]'), texto: raiz.innerText };
})()`);
/** Há o selo "Plataforma CAIS" visível (com tamanho) no seletor? */
const selo = (seletor) => ev(`(() => {
  const raiz = document.querySelector(${JSON.stringify(seletor)}); if (!raiz) return false;
  const p = [...raiz.querySelectorAll('p')].find((e) => e.textContent.trim() === 'Plataforma CAIS');
  if (!p) return false; const r = p.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(p).visibility !== 'hidden';
})()`);
/** A página rola para o lado? */
const estoura = () => ev(`document.documentElement.scrollWidth > innerWidth + 1`);

// 1) Tema CAIS (sem marca): logo do CAIS + selo.
await ir('/login', 3500);
await largura(1280, 900);
const ini = await definirTema(false);
c('há dados do navegador para o teste gravar o tema', ini === 'ok', ini);
await ir('/login', 3500);
const cais = await marca('aside');
c('CAIS: o painel do login mostra o logo do CAIS e nenhuma imagem de empresa', cais?.cais === true && cais?.img === false, JSON.stringify({ cais: cais?.cais, img: cais?.img }));
c('CAIS: o selo "Plataforma CAIS" aparece no painel do login (desktop)', await selo('aside'));

// 2) Tema com marca: login, home e sidebar.
await definirTema(true);
await ir('/login', 3500);
const painel = await marca('aside');
c('marca: o painel do login mostra a imagem da empresa', painel?.img === true && painel?.visivel === true, JSON.stringify({ img: painel?.img, visivel: painel?.visivel }));
c('marca: a imagem tem alt = nome da empresa', painel?.alt === NOME, painel?.alt);
c('marca: o logo do CAIS sai do cabeçalho do painel', painel?.cais === false, '');
c('marca: o painel usa o logo do fundo escuro (laranja)', painel?.src === LOGO_ESCURO, '');
c('marca: o selo do CAIS continua no painel', await selo('aside'));

await largura(375, 800);
await ir('/login', 3500);
c('marca (375 px): o logo aparece no topo do login e cabe na tela', (await marca('header'))?.visivel === true, '');
c('marca (375 px): o selo do CAIS aparece no rodapé do login', await selo('footer'));
c('marca (375 px): o login não rola para o lado', !(await estoura()));

await ir('/', 3500);
const topo = await marca('header');
c('home (375 px): o topo mostra a imagem da empresa dentro da tela', topo?.img === true && topo?.visivel === true, JSON.stringify({ img: topo?.img, visivel: topo?.visivel }));
c('home (375 px): o link do logo diz o nome da empresa', (await ev(`document.querySelector('header a[href="/"]')?.getAttribute('aria-label')`))?.startsWith(NOME), '');
c('home (375 px): o botão de entrar continua visível ao lado do logo', await ev(`(() => { const a = [...document.querySelectorAll('header a')].find((e) => /Entrar|Ir para o sistema/.test(e.textContent)); if (!a) return false; const r = a.getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth + 1; })()`));
c('home (375 px): não rola para o lado', !(await estoura()));
c('home (375 px): o selo do CAIS aparece no rodapé', await selo('footer'));

// 3) Escuro: o topo da home (fundo da página) passa a usar o logo escuro.
await largura(1280, 900);
await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
await ir('/', 3500);
const escuroAtivo = await ev(`document.documentElement.classList.contains('dark')`);
const topoEscuro = await marca('header');
c('escuro: o tema escuro está ativo', escuroAtivo === true, String(escuroAtivo));
c('escuro: o topo da home usa o logo escuro (laranja)', topoEscuro?.src === LOGO_ESCURO, topoEscuro?.src?.slice(0, 40));
await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
await ir('/', 3500);
c('claro: o topo da home usa o logo claro (azul)', (await marca('header'))?.src === LOGO_CLARO, '');

// 4) Sistema logado: Sidebar com a marca e o selo.
await entrar(CONTAS.admin);
await ir('/painel', 4000);
const lateral = await marca('nav[aria-label="Menu principal"]');
c('sidebar: mostra a imagem da empresa no topo', lateral?.img === true, JSON.stringify({ img: lateral?.img }));
c('sidebar: o link do logo diz o nome da empresa e leva ao painel', await ev(`(() => { const a = document.querySelector('nav[aria-label="Menu principal"] a[href="/painel"]'); return !!a && a.getAttribute('aria-label') === ${JSON.stringify(NOME + ', ir para o painel')}; })()`));
c('sidebar: o selo do CAIS está no rodapé do menu', await selo('nav[aria-label="Menu principal"]'));

// Limpeza do tema de teste (o perfil do Chrome é descartável, mas deixa o teste idempotente).
await definirTema(false);

console.log(nav.erros.length ? `\nErros do console:\n${nav.erros.join('\n')}` : '\nSem erros no console.');
nav.fechar();
c.resumo();
await espera(100);
