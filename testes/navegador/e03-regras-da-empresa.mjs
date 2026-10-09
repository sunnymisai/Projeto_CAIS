/* ============================================================================
   TESTES/NAVEGADOR/E03-REGRAS-DA-EMPRESA.MJS
   O que é: conferência das regras que a PROGLOGIC definiu em 09/10/2026: a empresa
     aprova (e desfaz a aprovação) das entregas; a aprovação some quando a tarefa
     volta para A fazer; o admin só vê o estado; a empresa vê as horas do time e aloca
     nos projetos dela (o profissional não); a trilha pode ter prazo indeterminado ou
     definido pelo admin; e o quiz aceita de 1 a 10 tentativas.
   Onde é usado: rodado à mão: node testes/navegador/e03-regras-da-empresa.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §3 (perfis), §4 (trilhas: prazo, nota mínima e tentativas) e §5 (projetos e alocação).
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('e03', 9373);
const { ev, ir, entrar, erros } = nav;
const CHAVE = 'cais-dados-v6';

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
/** Texto do <main>. */
const texto = () => ev(`document.querySelector('main')?.innerText ?? ''`);
/** Lê uma tarefa direto do armazenamento do navegador (null se ainda não gravou). */
const tarefa = (id) => ev(`(JSON.parse(localStorage.getItem('${CHAVE}') ?? 'null')?.tarefas ?? []).find((t) => t.id === '${id}') ?? null`);
/** Lê uma trilha direto do armazenamento do navegador. */
const trilha = (id) => ev(`(JSON.parse(localStorage.getItem('${CHAVE}') ?? 'null')?.trilhas ?? []).find((t) => t.id === '${id}') ?? null`);
/**
 * Clica num botão (da página ou do diálogo) pelo texto exato.
 * @param texto - texto do botão.
 * @param raiz - seletor da raiz (padrão: a página inteira).
 */
const botao = (txt, raiz = 'document') => ev(`(() => { const b = [...${raiz}.querySelectorAll('button')].find((x) => x.textContent.trim() === ${JSON.stringify(txt)}); if (!b) return false; b.click(); return true; })()`);
/** Existe botão com esse texto? */
const temBotao = (txt, raiz = 'document') => ev(`[...${raiz}.querySelectorAll('button')].some((x) => x.textContent.trim() === ${JSON.stringify(txt)})`);
/** Preenche um campo do diálogo pelo rótulo (input ou select), com o setter nativo para o React perceber. */
const preencher = (rotulo, valor) => ev(`(() => {
  const l = [...document.querySelectorAll('[role=dialog] label')].find((x) => x.textContent.replace('*', '').trim() === ${JSON.stringify(rotulo)});
  const el = l && document.getElementById(l.htmlFor); if (!el) return false;
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(valor)});
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  el.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); return true;
})()`);
const TAREFA = '/projetos/prj_portal?aba=tarefas&tarefa=';
const detalheAberto = `!!document.querySelector('[role=dialog] #anexos-titulo')`;
const hoje = await ev(`(() => { const x = new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); })()`);

try {
  await ev(`localStorage.removeItem('${CHAVE}')`);

  // ---------- 1) A empresa aprova a entrega ----------
  await entrar(CONTAS.marcos);
  await abrir('/painel', `[...document.querySelectorAll('main a')].some((a) => a.textContent.trim() === 'Ver projetos')`);
  const antes = Number(((await texto()).match(/(\d+) aprovadas? de/) ?? [])[1] ?? -1);
  await abrir(TAREFA + 'tar_16', detalheAberto);
  let t = await dialogo();
  c('empresa: tarefa em Pronto sem aprovação mostra "Aguardando a aprovação da empresa" e o botão', t.includes('Aguardando a aprovação da empresa') && (await temBotao('Aprovar entrega', "document.querySelector('[role=dialog]')")));
  await botao('Aprovar entrega', "document.querySelector('[role=dialog]')"); await espera(500);
  t = await dialogo();
  c('empresa: depois de aprovar mostra "Aprovada ... por Marcos Vieira" e o botão vira "Desfazer aprovação"', t.includes('pela empresa em') && t.includes('por Marcos Vieira') && (await temBotao('Desfazer aprovação', "document.querySelector('[role=dialog]')")), t.slice(t.indexOf('Aprovação'), t.indexOf('Aprovação') + 120));
  const salva = await tarefa('tar_16');
  c('a aprovação é gravada com a data de hoje e quem aprovou', salva?.aprovadaEm === hoje && salva?.aprovadaPorId === 'pes_marcos', JSON.stringify({ aprovadaEm: salva?.aprovadaEm, por: salva?.aprovadaPorId }));
  await abrir('/projetos/prj_portal?aba=tarefas', `!!document.querySelector('[data-cartao="tar_16"]')`);
  c('o cartão no quadro ganha o selo "Aprovada"', (await ev(`document.querySelector('[data-cartao="tar_16"]')?.innerText ?? ''`)).includes('Aprovada'));
  await abrir('/painel', `[...document.querySelectorAll('main a')].some((a) => a.textContent.trim() === 'Ver projetos')`);
  const depois = Number(((await texto()).match(/(\d+) aprovadas? de/) ?? [])[1] ?? -1);
  c('painel da empresa: as aprovadas do período sobem em 1', antes >= 0 && depois === antes + 1, `${antes} → ${depois}`);
  c('painel da empresa: lista "Aguardando a sua aprovação" com link para a tarefa', (await texto()).includes('Aguardando a sua aprovação'));

  // ---------- 2) Desfazer ----------
  await abrir(TAREFA + 'tar_16', detalheAberto);
  await botao('Desfazer aprovação', "document.querySelector('[role=dialog]')"); await espera(500);
  c('empresa: "Desfazer aprovação" tira a aprovação', (await dialogo()).includes('Aguardando a aprovação da empresa') && !(await tarefa('tar_16'))?.aprovadaEm);

  // ---------- 3) Só vale em Revisão e Pronto ----------
  await abrir(TAREFA + 'tar_3', detalheAberto);
  c('tarefa ainda em A fazer não mostra aprovação', !(await ev(`!!document.querySelector('[role=dialog] #aprovacao-titulo')`)));

  // ---------- 4) Admin vê, mas não aprova; mover para A fazer apaga a aprovação ----------
  await abrir(TAREFA + 'tar_16', detalheAberto);
  await botao('Aprovar entrega', "document.querySelector('[role=dialog]')"); await espera(500);
  await entrar(CONTAS.admin);
  await abrir(TAREFA + 'tar_16', detalheAberto);
  t = await dialogo();
  c('admin: vê "Aprovada" mas não tem botão de aprovar nem de desfazer', t.includes('pela empresa em') && !(await temBotao('Aprovar entrega', "document.querySelector('[role=dialog]')")) && !(await temBotao('Desfazer aprovação', "document.querySelector('[role=dialog]')")));
  const moveu = await ev(`(() => {
    const l = [...document.querySelectorAll('[role=dialog] label')].find((x) => x.textContent.replace('*', '').trim() === 'Status');
    const el = l && document.getElementById(l.htmlFor); if (!el) return false;
    const op = [...el.options].find((o) => o.textContent.trim() === 'A fazer'); if (!op) return false;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, op.value);
    el.dispatchEvent(new Event('change', { bubbles: true })); return true;
  })()`);
  await espera(600);
  c('admin: mover a tarefa de volta para A fazer apaga a aprovação', moveu && !(await tarefa('tar_16'))?.aprovadaEm);

  // ---------- 5) A empresa vê as horas e aloca nos projetos dela ----------
  await entrar(CONTAS.marcos);
  await abrir('/projetos/prj_portal?aba=equipe', `!!document.querySelector('main table')`);
  c('empresa: Equipe tem o botão "Alocar pessoa" e as ações de editar e remover', (await temBotao('Alocar pessoa', "document.querySelector('main')")) && (await ev(`!!document.querySelector('main button[aria-label^="Editar alocação de"]')`)));
  await botao('Alocar pessoa', "document.querySelector('main')"); await espera(600);
  const opcoes = await ev(`[...document.querySelectorAll('[role=dialog] select option')].map((o) => o.textContent).join(' | ')`);
  c('empresa: o modal lista os profissionais ativos para alocar', opcoes.includes('Gabriela Costa'), opcoes.slice(0, 120));
  await preencher('Pessoa', 'pes_gabriela'); await espera(200);
  await preencher('Papel no projeto', await ev(`[...document.querySelectorAll('[role=dialog] select')][1].options[1].value`)); await espera(200);
  await preencher('Carga semanal (horas)', '10'); await espera(500);
  t = await dialogo();
  c('empresa: o modal mostra a prévia do semáforo (antes e depois)', t.includes('Antes') && t.includes('Depois'));
  await botao('Alocar', "document.querySelector('[role=dialog]')"); await espera(700);
  const aloc = await ev(`(JSON.parse(localStorage.getItem('${CHAVE}') ?? 'null')?.alocacoes ?? []).find((a) => a.pessoaId === 'pes_gabriela' && a.projetoId === 'prj_portal') ?? null`);
  c('empresa: a alocação da Gabriela no Portal é gravada com as 10 h/sem', aloc?.carga === 10, JSON.stringify(aloc));
  const linha = await ev(`[...document.querySelectorAll('main tbody tr')].find((r) => r.innerText.includes('Gabriela Costa'))?.innerText ?? ''`);
  c('empresa: a Gabriela aparece na tabela da Equipe com "10 h/sem"', linha.includes('10 h/sem'), linha.replace(/\s+/g, ' '));
  await ev(`document.querySelector('main button[aria-label="Remover Gabriela Costa da equipe"]')?.click()`); await espera(600);
  c('empresa: remover tira a Gabriela da equipe', !(await texto()).includes('Gabriela Costa'));

  await entrar(CONTAS.ana);
  await abrir('/projetos/prj_portal?aba=equipe', `!!document.querySelector('main table')`);
  c('profissional: Equipe sem "Alocar pessoa" e sem editar ou remover', !(await temBotao('Alocar pessoa', "document.querySelector('main')")) && !(await ev(`!!document.querySelector('main button[aria-label^="Editar alocação de"]')`)));

  // ---------- 6) Prazo da trilha: indeterminado ou com dias ----------
  await entrar(CONTAS.admin);
  await abrir('/trilhas/tri_lgpd', `[...document.querySelectorAll('main [role=tab]')].length > 0`);
  await ev(`[...document.querySelectorAll('main [role=tab]')].find((x) => x.textContent.includes('Público'))?.click()`); await espera(500);
  const chave = `document.querySelector('main button[role=switch][aria-labelledby]')`;
  const rotuloChave = `(() => { const sw = [...document.querySelectorAll('main button[role=switch]')].find((b) => document.getElementById(b.getAttribute('aria-labelledby'))?.textContent === 'Prazo indeterminado'); return sw; })()`;
  c('admin: trilha com prazo 0 mostra "Prazo indeterminado" ligado e sem o campo de dias', (await ev(`${rotuloChave}?.getAttribute('aria-checked')`)) === 'true' && !(await texto()).includes('Prazo para concluir (dias)'), chave);
  await ev(`${rotuloChave}.click()`); await espera(500);
  c('admin: desligar abre o campo de dias (padrão 14) e grava', (await texto()).includes('Prazo para concluir (dias)') && (await trilha('tri_lgpd'))?.prazoDias === 14);
  await ev(`${rotuloChave}.click()`); await espera(500);
  c('admin: ligar de novo volta para o prazo indeterminado (0)', (await trilha('tri_lgpd'))?.prazoDias === 0);
  await abrir('/trilhas', `(document.querySelector('main')?.innerText ?? '').includes('LGPD na prática')`);
  c('lista de trilhas: a trilha sem prazo mostra "Sem prazo"', (await texto()).includes('Sem prazo'));
  await abrir('/trilhas/tri_lgpd', `!![...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'Publicar')`);
  await botao('Publicar', "document.querySelector('main')"); await espera(800);
  c('admin: a trilha sem prazo publica normalmente', (await trilha('tri_lgpd'))?.status === 'publicada');
  await entrar(CONTAS.ana);
  await abrir('/minhas-trilhas', `(document.querySelector('main')?.innerText ?? '').includes('LGPD na prática')`);
  const minhas = await texto();
  c('profissional: a trilha sem prazo aparece com "Prazo indeterminado"', minhas.includes('LGPD na prática') && minhas.includes('Prazo indeterminado'));

  // ---------- 7) Quiz: de 1 a 10 tentativas ----------
  await entrar(CONTAS.admin);
  await abrir('/trilhas/tri_boasvindas', `!!document.querySelector('main label[title^="De 1 a"] input')`);
  const campo = `document.querySelector('main label[title^="De 1 a"] input')`;
  c('quiz: o campo de tentativas vai de 1 a 10', (await ev(`${campo}.min`)) === '1' && (await ev(`${campo}.max`)) === '10');
  /**
   * Digita um valor no campo de tentativas e devolve o que ficou gravado na etapa do quiz.
   * @param v - texto digitado.
   */
  const digitar = async (v) => {
    await ev(`(() => { const el = ${campo}; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await espera(400);
    return (await trilha('tri_boasvindas'))?.etapas.find((e) => e.tipo === 'quiz')?.tentativasMax;
  };
  c('quiz: 15 vira 10 (o máximo)', (await digitar('15')) === 10);
  c('quiz: 0 vira 1 (não existe mais "sem limite")', (await digitar('0')) === 1);
  c('quiz: 7 fica 7', (await digitar('7')) === 7);
  await entrar(CONTAS.ana);
  await abrir('/minhas-trilhas/tri_boasvindas', `(document.querySelector('main')?.innerText ?? '').includes('Nota mínima')`);
  c('aluno: o detalhe da trilha mostra "7 tentativas"', (await texto()).includes('7 tentativas'));

  await ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
