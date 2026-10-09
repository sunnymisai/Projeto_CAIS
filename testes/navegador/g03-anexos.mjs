/* ============================================================================
   TESTES/NAVEGADOR/G03-ANEXOS.MJS
   O que é: conferência do G03 (anexos simulados e aba Arquivos): anexar pelo campo de
     arquivo (arquivo de verdade escolhido via DevTools), limite de 10 MB com mensagem
     clara, tamanho legível, remover com confirmação (Esc cancela), o botão de escolher
     arquivo alcançável pelo teclado, a aba Arquivos (lista, filtro por tipo, link para a
     tarefa, vazio), permissões (admin, profissional nas próprias tarefas, empresa só
     vê), 375 px sem rolagem lateral e nenhum erro no console.
   Onde é usado: rodado à mão: node testes/navegador/g03-anexos.mjs
     (com o `npm run dev` aberto em http://localhost:3000). Cria dois arquivos de
     teste em testes/navegador/.perfis/ (ignorada pelo git).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §5 (anexos da tarefa e aba Arquivos) e §13 (teclado).
   ============================================================================ */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('g03', 9372);
const { ev, ir, entrar, largura, cmd, erros } = nav;

// Arquivos de teste de verdade (o DevTools precisa de um caminho no disco).
const pasta = join(dirname(fileURLToPath(import.meta.url)), '.perfis', 'g03-arquivos');
mkdirSync(pasta, { recursive: true });
const pequeno = join(pasta, 'ata-da-reuniao.txt');
const grande = join(pasta, 'video-grande.mp4');
writeFileSync(pequeno, 'ata de teste\n'.repeat(100));
writeFileSync(grande, Buffer.alloc(11 * 1024 * 1024, 1));

/**
 * Abre uma rota e espera `condicao` (expressão JS) ficar verdadeira, por até 15 s.
 * @param rota - caminho do app.
 * @param condicao - expressão avaliada na página.
 */
const abrir = async (rota, condicao) => {
  await ir(rota, 500);
  for (let i = 0; i < 30 && !(await ev(condicao)); i++) await espera(500);
};
/** Texto do diálogo aberto ('' se não houver). */
const dialogo = () => ev(`document.querySelector('[role=dialog]')?.innerText ?? ''`);
/**
 * Escolhe um arquivo no <input type=file> do detalhe, como se a pessoa o tivesse selecionado.
 * @param caminho - caminho do arquivo no disco.
 */
const escolher = async (caminho) => {
  const { result: doc } = await cmd('DOM.getDocument', { depth: 0 });
  const { result: alvo } = await cmd('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '[role=dialog] input[type=file]' });
  await cmd('DOM.setFileInputFiles', { files: [caminho], nodeId: alvo.nodeId });
  await espera(600);
};
/**
 * Aperta uma tecla no navegador (Enter, Escape ou Tab).
 * @param key - nome da tecla.
 */
const tecla = async (key) => {
  const cod = { Enter: 13, Escape: 27, Tab: 9 }[key];
  const text = key === 'Enter' ? String.fromCharCode(13) : undefined;
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: cod, text });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: cod });
  await espera(300);
};
const semRolagemLateral = `(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`;
const TAREFA = '/projetos/prj_portal?aba=tarefas&tarefa=';

try {
  await ev(`localStorage.removeItem('cais-dados-v6')`);

  // --- Admin: lista do seed, anexar, limite, remover. ---
  await entrar(CONTAS.admin);
  await abrir(TAREFA + 'tar_1', `!!document.querySelector('[role=dialog] #anexos-titulo')`);
  let t = await dialogo();
  c('admin: tarefa do seed mostra os 2 anexos com tamanho legível', t.includes('Anexos · 2') && t.includes('fluxo-de-login.pdf') && t.includes('1,2 MB') && t.includes('471 KB'), t.slice(t.indexOf('Anexos'), t.indexOf('Anexos') + 140));
  c('admin: o ícone de cada anexo é decorativo e há legenda de tipo ("PDF" e "Imagem")', t.includes('PDF') && t.includes('Imagem'));

  // Teclado: o botão "Escolher arquivo" é alcançável e aciona o campo de arquivo.
  await ev(`window.__cliques = 0; const i = document.querySelector('[role=dialog] input[type=file]'); i.click = () => { window.__cliques++; };`);
  await ev(`[...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Escolher arquivo').focus()`);
  await tecla('Enter');
  c('teclado: Enter no botão "Escolher arquivo" aciona o campo de arquivo', (await ev('window.__cliques')) === 1);
  c('teclado: o campo de arquivo em si não entra na ordem do Tab (o botão faz esse papel)', (await ev(`document.querySelector('[role=dialog] input[type=file]').tabIndex`)) === -1);

  await escolher(grande);
  t = await dialogo();
  c('arquivo de 11 MB é recusado com mensagem clara e não entra na lista', t.includes('tem 11 MB; o limite é 10 MB') && t.includes('Anexos · 2'), t.slice(t.indexOf('Não foi possível'), t.indexOf('Não foi possível') + 120));
  await escolher(pequeno);
  t = await dialogo();
  c('arquivo pequeno é anexado (contagem 3, nome e tamanho)', t.includes('Anexos · 3') && t.includes('ata-da-reuniao.txt') && /Documento · \d+ KB/.test(t));
  c('depois de anexar o erro anterior some', !(await dialogo()).includes('o limite é 10 MB'));
  const salvo = await ev(`JSON.parse(localStorage.getItem('cais-dados-v6')).tarefas.find((x) => x.id === 'tar_1').anexos.at(-1)`);
  c('só os metadados são guardados (nome, tipo, tamanho, autor, data; sem conteúdo)', !!salvo && Object.keys(salvo).sort().join(',') === 'autorId,data,id,nome,tamanho,tipo' && salvo.autorId === 'pes_admin', JSON.stringify(salvo));

  // Remover: a confirmação aparece na própria linha; Esc cancela SEM fechar o detalhe; Enter confirma.
  const lixeira = `[role=dialog] button[aria-label="Remover o anexo ata-da-reuniao.txt"]`;
  await ev(`document.querySelector('${lixeira}').focus()`);
  await tecla('Enter');
  c('remover pede confirmação na própria linha (o foco vai para "Cancelar")', (await ev(`document.activeElement?.textContent.trim()`)) === 'Cancelar' && (await dialogo()).includes('Remover anexo'));
  await tecla('Escape');
  c('Esc cancela a remoção: o anexo continua, o detalhe não fecha e o foco volta para a lixeira', (await dialogo()).includes('ata-da-reuniao.txt') && (await ev(`document.activeElement?.getAttribute('aria-label')`)) === 'Remover o anexo ata-da-reuniao.txt');
  await tecla('Enter');
  await ev(`[...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Remover anexo').focus()`);
  await tecla('Enter');
  await espera(400);
  c('Enter em "Remover anexo" remove (volta a 2 anexos)', (await dialogo()).includes('Anexos · 2') && !(await dialogo()).includes('ata-da-reuniao.txt'));

  // --- Aba Arquivos. ---
  await abrir('/projetos/prj_portal?aba=arquivos', `!!document.querySelector('main ul[aria-label="Arquivos do projeto"]')`);
  let aba = await ev(`document.querySelector('main')?.innerText ?? ''`);
  c('aba Arquivos lista os 3 anexos do projeto, com a tarefa de origem', ['fluxo-de-login.pdf', 'tela-de-login-v2.png', 'campos-da-ficha.xlsx'].every((n) => aba.includes(n)) && aba.includes('Tarefa: Tela de login') && aba.includes('Tarefa: Ficha da empresa'));
  c('aba Arquivos: a contagem aparece na aba', await ev(`[...document.querySelectorAll('main [role=tab]')].some((x) => /Arquivos\\s*3/.test(x.textContent.replace(/\\s+/g, ' ')))`));
  await ev(`[...document.querySelectorAll('main [role=radiogroup][aria-label="Filtrar por tipo de arquivo"] [role=radio]')].find((b) => b.textContent.trim() === 'Imagens').click()`);
  await espera(400);
  aba = await ev(`document.querySelector('main')?.innerText ?? ''`);
  c('filtro por tipo: "Imagens" mostra só a imagem', aba.includes('tela-de-login-v2.png') && !aba.includes('fluxo-de-login.pdf') && !aba.includes('campos-da-ficha.xlsx'));
  c('o link da tarefa de origem abre a tarefa (?tarefa=)', await ev(`!![...document.querySelectorAll('main a')].find((a) => a.getAttribute('href') === '/projetos/prj_portal?aba=tarefas&tarefa=tar_1')`));
  await abrir('/projetos/prj_estoque?aba=arquivos', `(document.querySelector('main')?.innerText ?? '').includes('Nenhum arquivo neste projeto')`);
  c('projeto sem anexo mostra o vazio explicando', (await ev(`document.querySelector('main')?.innerText ?? ''`)).includes('Os arquivos anexados às tarefas aparecem aqui'));

  // --- Profissional: só nas próprias tarefas. ---
  await entrar(CONTAS.ana);
  await abrir(TAREFA + 'tar_3', `!!document.querySelector('[role=dialog] #anexos-titulo')`);
  c('profissional: na PRÓPRIA tarefa vê a área de anexar', await ev(`!!document.querySelector('[role=dialog] input[type=file]')`));
  await abrir(TAREFA + 'tar_1', `!!document.querySelector('[role=dialog] #anexos-titulo')`);
  t = await dialogo();
  c('profissional: na tarefa de OUTRO só vê a lista (sem anexar nem remover)', t.includes('fluxo-de-login.pdf') && !(await ev(`!!document.querySelector('[role=dialog] input[type=file]')`)) && !(await ev(`!!document.querySelector('[role=dialog] button[aria-label^="Remover o anexo"]')`)));

  // --- Empresa: só vê. ---
  await entrar(CONTAS.marcos);
  await abrir(TAREFA + 'tar_1', `!!document.querySelector('[role=dialog] #anexos-titulo')`);
  t = await dialogo();
  c('empresa: vê os anexos mas não pode anexar nem remover', t.includes('fluxo-de-login.pdf') && !(await ev(`!!document.querySelector('[role=dialog] input[type=file]')`)) && !(await ev(`!!document.querySelector('[role=dialog] button[aria-label^="Remover o anexo"]')`)));
  await abrir('/projetos/prj_portal?aba=arquivos', `!!document.querySelector('main ul[aria-label="Arquivos do projeto"]')`);
  c('empresa: a aba Arquivos funciona (leitura)', (await ev(`document.querySelector('main')?.innerText ?? ''`)).includes('fluxo-de-login.pdf'));

  // --- 375 px. ---
  await entrar(CONTAS.admin);
  await largura(375, 800);
  await abrir('/projetos/prj_portal?aba=arquivos', `!!document.querySelector('main ul[aria-label="Arquivos do projeto"]')`);
  await espera(500);
  c('375 px: aba Arquivos sem rolagem lateral', await ev(semRolagemLateral));
  await abrir(TAREFA + 'tar_1', `!!document.querySelector('[role=dialog] #anexos-titulo')`);
  await espera(500);
  c('375 px: detalhe da tarefa com anexos sem rolagem lateral', await ev(`(() => { const d = document.querySelector('[role=dialog]'); return d.scrollWidth <= d.clientWidth + 1; })()`));
  await largura(1280, 900);
  await ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
