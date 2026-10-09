/* ============================================================================
   TESTES/NAVEGADOR/D04-MINHAS-TAREFAS.MJS
   O que é: teste de aceite do D04 (Minhas tarefas do profissional) no Chrome headless.
   Onde é usado: rodado à mão: node testes/navegador/d04-minhas-tarefas.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts (tarefas da Ana no
     Portal de pedidos: tar_3, tar_6, tar_13 atrasada, tar_14 hoje, tar_15 amanhã, tar_16 concluída).
   Contexto: prompt D04 (aceite: mover pela lista reflete no quadro e vice-versa; 375 px; teclado).
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('d04', 9354);
const { ev, ir, entrar, largura, cmd, tab, erros } = nav;

/** Texto visível da área principal da tela (onde ficam as páginas). */
const textoMain = () => ev(`document.querySelector('main')?.innerText ?? ''`);
// Títulos de um grupo (pelo título do h2).
const doGrupo = (titulo) => ev(`(() => { const h = [...document.querySelectorAll('main section h2')].find((x) => x.textContent.trim().startsWith(${JSON.stringify(titulo)})); return h ? [...h.closest('section').querySelectorAll('li > button > span:first-child')].map((s) => s.textContent.trim()) : []; })()`);
// Em que lista do quadro está um cartão (pelo título).
const listaNoQuadro = (titulo) => ev(`[...document.querySelectorAll('main section[aria-label^="Lista "]')].find((s) => s.textContent.includes(${JSON.stringify(titulo)}))?.getAttribute('aria-label')`);
// `texto`: o caractere que a tecla gera (no Enter, o retorno de carro); sem ele o navegador não "aperta" o botão.
const tecla = async (key, code, vk, texto) => {
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, ...(texto ? { text: texto } : {}) });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
  await espera(300);
};
/** Troca o Status no detalhe aberto (Select "Status"). */
const mudarStatus = (rotuloColuna) => ev(`(() => {
  const s = [...document.querySelectorAll('[role=dialog] select')].find((x) => [...x.options].some((o) => o.text === ${JSON.stringify(rotuloColuna)}));
  const op = [...s.options].find((o) => o.text === ${JSON.stringify(rotuloColuna)});
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, op.value);
  s.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`);

try {
  await entrar(CONTAS.ana);
  await ir('/minhas-tarefas');

  // ---------- Grupos ----------
  c('Atrasadas: "Corrigir a validação do CNPJ"', JSON.stringify(await doGrupo('Atrasadas')) === JSON.stringify(['Corrigir a validação do CNPJ']), JSON.stringify(await doGrupo('Atrasadas')));
  c('Hoje: "Ajustar o topo para o celular"', JSON.stringify(await doGrupo('Hoje')) === JSON.stringify(['Ajustar o topo para o celular']));
  const semana = await doGrupo('Esta semana');
  const depois = await doGrupo('Depois');
  // d(1) cai em "Depois" se hoje for domingo (ver comentário no seed).
  const domingo = new Date().getDay() === 0;
  c('Esta semana / Depois conforme o dia da semana', domingo ? depois.includes('Documentar o quadro de tarefas') : semana.includes('Documentar o quadro de tarefas'), `semana=${semana} | depois=${depois}`);
  c('Depois: as duas tarefas com prazo longo', ['Contrato da API de tarefas', 'Ficha do projeto'].every((t) => depois.includes(t)));
  c('não mostra tarefa de outra pessoa', !/Tela de login|Shell da aplicação/.test(await textoMain()));
  c('Concluídas começam recolhidas (aria-expanded=false, contagem 1)', await ev(`(() => { const b = document.querySelector('[aria-controls="lista-concluidas"]'); return b?.getAttribute('aria-expanded') === 'false' && b.textContent.includes('(1,') && !document.querySelector('#lista-concluidas'); })()`));
  await ev(`document.querySelector('[aria-controls="lista-concluidas"]').click()`); await espera(300);
  c('ao abrir, mostra "Configurar o repositório" concluída', /Configurar o repositório[\s\S]*Concluída em/.test(await ev(`document.querySelector('#lista-concluidas')?.innerText ?? ''`)));

  // ---------- Item ----------
  const item = await ev(`[...document.querySelectorAll('main li button')].find((b) => b.textContent.includes('Corrigir a validação'))?.innerText.replace(/\\n+/g, ' | ')`);
  c('item: projeto, "Atrasada há 2 dias", prioridade e checklist 1/3', /Portal de pedidos/.test(item) && /Atrasada há 2 dias/.test(item) && /Prioridade alta/.test(item) && /1\/3/.test(item), item);
  c('item tem a cor do projeto como acento', await ev(`[...document.querySelectorAll('main li button')].find((b) => b.textContent.includes('Corrigir a validação')).style.borderLeftColor !== ''`));

  // ---------- Filtros e contagem ----------
  c('rodapé: "Mostrando 6 de 6 tarefas"', /Mostrando 6 de 6 tarefas/.test(await textoMain()));
  await ev(`(() => { const s = [...document.querySelectorAll('main select')].find((x) => [...x.options].some((o) => o.value === 'alta')); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, 'alta'); s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await espera(300);
  c('filtro prioridade alta: "Mostrando 2 de 6" e "Limpar filtros"', /Mostrando 2 de 6 tarefas/.test(await textoMain()) && /Limpar filtros/.test(await textoMain()), (await textoMain()).match(/Mostrando.*/)?.[0]);
  await ev(`[...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'Limpar filtros').click()`); await espera(300);
  c('limpar volta para 6 de 6', /Mostrando 6 de 6 tarefas/.test(await textoMain()));

  // ---------- Teclado: Tab até o item, Enter abre, Esc fecha e o foco volta ----------
  await ev(`document.activeElement?.blur()`);
  let alvo = null;
  for (let i = 0; i < 30 && !alvo; i++) { const p = await tab(); if (p?.texto.includes('Ajustar o topo')) alvo = p; }
  c('Tab chega no item com foco visível', alvo?.visivel === true, JSON.stringify(alvo));
  await tecla('Enter', 'Enter', 13, String.fromCharCode(13)); await espera(500);
  c('Enter abre o detalhe por cima com ?tarefa=', (await ev('location.search')) === '?tarefa=tar_14' && await ev(`!!document.querySelector('[role=dialog]')`), await ev('location.search'));
  await tecla('Escape', 'Escape', 27); await espera(500);
  c('Esc fecha, tira o ?tarefa= e o foco volta ao item', (await ev('location.search')) === '' && !(await ev(`!!document.querySelector('[role=dialog]')`)) && (await ev(`document.activeElement?.textContent ?? ''`)).includes('Ajustar o topo'), await ev(`document.activeElement?.textContent?.slice(0, 40)`));

  // ---------- Lista → quadro ----------
  await ir('/minhas-tarefas?tarefa=tar_14');
  c('?tarefa= na URL abre o detalhe direto', await ev(`!!document.querySelector('[role=dialog]')`));
  await mudarStatus('Fazendo'); await espera(400);
  await ir('/projetos/prj_portal');
  c('mudou para "Fazendo" na lista → aparece em "Lista Fazendo" no quadro', (await listaNoQuadro('Ajustar o topo para o celular')) === 'Lista Fazendo', await listaNoQuadro('Ajustar o topo para o celular'));

  // ---------- Quadro → lista ----------
  await ir('/projetos/prj_portal?tarefa=tar_15');
  await mudarStatus('Pronto'); await espera(400);
  await ir('/minhas-tarefas');
  await ev(`document.querySelector('[aria-controls="lista-concluidas"]').click()`); await espera(300);
  c('movida para "Pronto" no projeto → vai para "Concluídas recentemente"', /Documentar o quadro de tarefas/.test(await ev(`document.querySelector('#lista-concluidas')?.innerText ?? ''`)) && !(await doGrupo('Esta semana')).includes('Documentar o quadro de tarefas'));

  // ---------- Não abre tarefa alheia pela URL ----------
  await ir('/minhas-tarefas?tarefa=tar_1');
  c('?tarefa= de outra pessoa não abre detalhe', !(await ev(`!!document.querySelector('[role=dialog]')`)));

  // ---------- 375 px ----------
  await largura(375, 760); await ir('/minhas-tarefas');
  c('375 px: sem rolagem lateral', await ev(`(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`));
  c('375 px: itens com alvo ≥ 44 px', await ev(`[...document.querySelectorAll('main li button')].every((b) => b.getBoundingClientRect().height >= 44)`));
  await ir('/minhas-tarefas?tarefa=tar_13');
  c('375 px: detalhe abre sem rolagem lateral', await ev(`!!document.querySelector('[role=dialog]') && document.documentElement.scrollWidth <= innerWidth + 1`));
  await largura(1280, 900);

  // ---------- Estado vazio ----------
  const soAna = { id: 'pes_ana', nome: 'Ana Souza', email: 'ana.souza@cais.example', telefone: '', cargo: '', perfil: 'profissional', status: 'ativo', dataEntrada: '2026-01-01', area: '', nivel: '', cargaMax: 40, habilidades: [], empresaId: '' };
  await ev(`localStorage.setItem('cais-dados-v6', ${JSON.stringify(JSON.stringify({ empresas: [], pessoas: [soAna], trilhas: [], projetos: [], alocacoes: [], tarefas: [] }))})`);
  await ir('/minhas-tarefas');
  c('sem tarefas: "Nenhuma tarefa com você. Bom trabalho!" com link para Projetos', /Nenhuma tarefa com você\. Bom trabalho!/.test(await textoMain()) && await ev(`!!document.querySelector('main a[href="/projetos"]')`));
  await ev(`localStorage.clear(); sessionStorage.clear()`);

  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
