/* ============================================================================
   TESTES/NAVEGADOR/F04-SEMAFORO-ALOCACAO.MJS
   O que é: conferência do F04: modal "Alocar pessoa" com a prévia antes × depois, o
     aviso com a data sugerida e o botão que a aplica (Bruno), sem bloquear o "Alocar";
     Diego alocado depois do sprint sem aviso de sobrecarga; select de pessoas com o
     pico no período; coluna Carga da Equipe com o indicador; link "Ver carga da
     equipe" no painel do admin; "Minha carga" do profissional com 8 semanas e a
     quebra por projeto; "Disponibilidade" na ficha de pessoa; 375 px; console limpo.
   Onde é usado: rodado à mão: node testes/navegador/f04-semaforo-alocacao.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §5 (aviso, não bloqueio), §12 fluxo 3 (alocar alguém) e §16 (semáforo).
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('f04', 9367);
const { ev, ir, entrar, largura, erros } = nav;
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
 * Preenche um campo do diálogo pelo rótulo (input, select): usa o setter nativo para o React perceber.
 * @param rotulo - texto do <label>.
 * @param valor - novo valor.
 */
const preencher = (rotulo, valor) => ev(`(() => {
  const l = [...document.querySelectorAll('[role=dialog] label')].find((x) => x.textContent.replace('*', '').trim() === ${JSON.stringify(rotulo)});
  const el = l && document.getElementById(l.htmlFor);
  if (!el) return false;
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(valor)});
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  return true;
})()`);
/** Clica num botão (do diálogo ou da página) pelo começo do texto. */
const clicarTexto = (texto, raiz = 'document') => ev(`[...${raiz}.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(${JSON.stringify(texto)}))?.click()`);
/** Lê o valor de um campo do diálogo pelo rótulo. */
const valor = (rotulo) => ev(`(() => { const l = [...document.querySelectorAll('[role=dialog] label')].find((x) => x.textContent.replace('*', '').trim() === ${JSON.stringify(rotulo)}); return l ? document.getElementById(l.htmlFor)?.value : null; })()`);
const semRolagemLateral = `(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`;

try {
  await ev(`localStorage.removeItem('cais-dados-v6')`);
  await entrar(CONTAS.admin);

  // --- Bruno no App de agendamento (Aurora): fica vermelho e recebe a sugestão. ---
  await abrir('/projetos/prj_agenda?aba=equipe', `[...document.querySelectorAll('main button')].some((b) => b.textContent.includes('Alocar pessoa'))`);
  await clicarTexto('Alocar pessoa'); await espera(500);
  const opcaoBruno = await ev(`[...document.querySelectorAll('[role=dialog] select option')].find((o) => o.textContent.startsWith('Bruno Lima'))?.textContent ?? ''`);
  c('select: a opção do Bruno diz "acima do limite no período"', opcaoBruno.includes('acima do limite no período'), opcaoBruno);
  await preencher('Pessoa', 'pes_bruno'); await espera(200);
  await preencher('Papel no projeto', await ev(`[...document.querySelectorAll('[role=dialog] select')][1].options[1].value`)); await espera(200);
  await preencher('Carga semanal (horas)', '30'); await espera(400);
  const t1 = await dialogo();
  c('prévia: linhas "Antes" e "Depois" por semana', t1.includes('Antes') && t1.includes('Depois') && (await ev(`document.querySelectorAll('[role=dialog] ol[aria-label*="depois desta alocação"] li').length`)) > 0);
  c('aviso: "fica acima do limite nas semanas de ..." e "há espaço a partir de"', /fica acima do limite (na semana|nas semanas) de \d{2}\/\d{2}/.test(t1) && /há espaço a partir de \d{2}\/\d{2}/.test(t1), t1.slice(t1.indexOf('Atenção'), t1.indexOf('Atenção') + 160));
  c('é aviso, não bloqueio: "Alocar" continua habilitado', await ev(`[...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Alocar')?.disabled === false`));
  const inicioAntes = await valor('Início');
  const fimAntes = await valor('Fim');
  const sugerida = (t1.match(/Usar (\d{2}\/\d{2}) como início/) ?? [])[1];
  await clicarTexto('Usar ', `document.querySelector('[role=dialog]')`); await espera(400);
  const inicioDepois = await valor('Início');
  c('o botão aplica a data sugerida no início', !!sugerida && inicioDepois !== inicioAntes && inicioDepois.slice(8, 10) + '/' + inicioDepois.slice(5, 7) === sugerida, `${inicioAntes} → ${inicioDepois} (sugerida ${sugerida})`);
  c('o fim também muda (mantém a duração em dias úteis)', (await valor('Fim')) !== fimAntes);
  c('com a data sugerida, nenhuma semana fica acima do limite', !(await dialogo()).includes('fica acima do limite'));
  await clicarTexto('Alocar', `document.querySelector('[role=dialog]')`); await espera(500);
  const salva = await ev(`JSON.parse(localStorage.getItem('cais-dados-v6') ?? '{"alocacoes":[]}').alocacoes.find((a) => a.pessoaId === 'pes_bruno' && a.projetoId === 'prj_agenda')`);
  c('alocação do Bruno salva com o início sugerido', salva?.inicio === inicioDepois, JSON.stringify(salva));

  // --- Diego depois do sprint: não acusa sobrecarga. ---
  await clicarTexto('Alocar pessoa'); await espera(500);
  await preencher('Pessoa', 'pes_diego'); await espera(200);
  await preencher('Papel no projeto', await ev(`[...document.querySelectorAll('[role=dialog] select')][1].options[1].value`)); await espera(200);
  const depoisDoSprint = await ev(`(() => { const x = new Date(); x.setDate(x.getDate() + 8); return x.toISOString().slice(0, 10); })()`);
  await preencher('Início', depoisDoSprint); await espera(200);
  await preencher('Carga semanal (horas)', '10'); await espera(400);
  const t2 = await dialogo();
  c('Diego após o sprint: prévia aparece e não há aviso de sobrecarga', t2.includes('Depois') && !t2.includes('fica acima do limite'), t2.slice(0, 120));
  await clicarTexto('Cancelar', `document.querySelector('[role=dialog]')`); await espera(400);

  // --- Coluna Carga da Equipe com o indicador do pico. ---
  await abrir('/projetos/prj_portal?aba=equipe', `!!document.querySelector('main table')`);
  c('Equipe: coluna Carga com o indicador do pico no período', await ev(`[...document.querySelectorAll('main td [role=img]')].some((x) => (x.getAttribute('aria-label') ?? '').startsWith('Pico de Bruno Lima no período desta alocação'))`));

  // --- Painel do admin: link para /carga. ---
  await abrir('/painel', `(document.querySelector('main')?.innerText ?? '').includes('Alocação e carga')`);
  c('painel do admin: link "Ver carga da equipe"', await ev(`[...document.querySelectorAll('main a')].some((a) => a.textContent.includes('Ver carga da equipe') && a.getAttribute('href') === '/carga')`));

  // --- Ficha de pessoa: Disponibilidade. ---
  await abrir('/pessoas?abrir=pes_bruno', `!!document.querySelector('[role=dialog]')`);
  c('ficha de pessoa: Disponibilidade com 8 semanas', await ev(`document.querySelectorAll('[role=dialog] ol[aria-label^="Disponibilidade de Bruno"] li').length === 8`));

  // --- Painel do profissional: Minha carga. ---
  await entrar(CONTAS.ana);
  for (const w of [1280, 375]) {
    await largura(w, 900);
    await abrir('/painel', `!!document.querySelector('main ol[aria-label="Minha carga nas próximas 8 semanas"]')`);
    c(`Ana (${w} px): "Minha carga" com 8 semanas`, (await ev(`document.querySelectorAll('main ol[aria-label="Minha carga nas próximas 8 semanas"] li').length`)) === 8);
    c(`Ana (${w} px): quebra por projeto da semana atual`, (await ev(`document.querySelector('main')?.innerText ?? ''`)).includes('Portal de pedidos'));
    c(`Ana (${w} px): sem rolagem lateral`, await ev(semRolagemLateral));
  }
  await largura(1280, 900);
  await ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
