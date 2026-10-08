/* ============================================================================
   TESTES/NAVEGADOR/D03-PLAYER-E-QUIZ.MJS
   O que é: teste de aceite do D03 (player de etapa e quiz) no Chrome headless.
   Onde é usado: rodado à mão: node testes/navegador/d03-player-e-quiz.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts (Ana no Nivelamento
     em 2 de 5; Elisa na Boas-vindas em 3 de 5; Felipe convidado).
   Contexto: prompt D03 (aceite: Ana faz a trilha inteira, reprova uma vez e passa; o
     painel do admin mostra o progresso; teclado; 375 px; primeiro acesso cai na trilha).
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('d03', 9352);
const { ev, ir, entrar, clicar, largura, cmd, erros } = nav;

// Respostas certas do quiz "Prova prática" (lib/seed.ts, et_n5), pelo texto da alternativa.
const CERTAS_NIVEL = ['Por props', 'Uma vez, depois que o componente aparece', 'string | undefined', 'text-erro', 'Carregando, vazio, com erro e com dado'];
const semRolagemLateral = `(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`;
/** Texto visível da área principal da tela (onde ficam as páginas). */
const textoMain = () => ev(`document.querySelector('main')?.innerText ?? ''`);
/** Progresso salvo no navegador de uma pessoa numa trilha (lido do localStorage). */
const progressoDe = (trilhaId, pessoaId) => ev(`JSON.parse(localStorage.getItem('cais-dados-v3')).trilhas.find((t) => t.id === '${trilhaId}').progresso['${pessoaId}']`);
/** Marca, em cada pergunta visível, a alternativa cujo texto está na lista (ou a primeira que NÃO está, para errar). */
const responder = (lista, errar = false) => ev(`(() => {
  const certas = ${JSON.stringify(lista)};
  const errar = ${errar};
  for (const fs of document.querySelectorAll('main fieldset')) {
    const labels = [...fs.querySelectorAll('label')];
    const alvo = errar ? labels.find((l) => !certas.some((c) => l.textContent.includes(c))) : labels.find((l) => certas.some((c) => l.textContent.includes(c)));
    alvo?.querySelector('input').click();
  }
  return document.querySelectorAll('main fieldset').length;
})()`);
/** Trecho de JS que acha, na página, o botão ou link cujo texto começa com `texto`. */
const botao = (texto) => `[...document.querySelectorAll('main button, main a')].find((b) => b.textContent.trim().startsWith(${JSON.stringify(texto)}))`;
/** Clica no botão/link pelo texto e espera a tela reagir. */
const clicarBotao = async (texto) => { await ev(`${botao(texto)}?.click()`); await espera(500); };

try {
  // ---------- Ana: etapa bloqueada pela URL ----------
  await entrar(CONTAS.ana);
  await ir('/minhas-trilhas/tri_nivel_front/etapa/et_n5', 4000);
  c('etapa bloqueada pela URL volta ao detalhe com ?bloqueada=', (await ev('location.pathname + location.search')) === '/minhas-trilhas/tri_nivel_front?bloqueada=et_n5', await ev('location.pathname + location.search'));
  c('o detalhe explica o motivo', /“Prova prática” ainda está bloqueada[\s\S]*Conclua “Tipagem com TypeScript”/.test(await textoMain()));

  // ---------- Ana: etapa de link (atual) ----------
  await ir('/minhas-trilhas/tri_nivel_front/etapa/et_n3');
  const link = await ev(`(() => { const a = [...document.querySelectorAll('main a[target=_blank]')][0]; return a ? { rel: a.rel, texto: a.textContent.trim() } : null; })()`);
  c('link externo: "Abrir em nova aba" com rel="noopener noreferrer"', link?.rel === 'noopener noreferrer' && link.texto.startsWith('Abrir em nova aba'), JSON.stringify(link));
  c('"Próxima" bloqueada com o motivo escrito', await ev(`(() => { const b = ${botao('Próxima')}; return b?.tagName === 'BUTTON' && b.disabled && document.querySelector('#motivo-proxima')?.textContent.includes('Conclua esta etapa'); })()`));
  await clicarBotao('Marcar como concluída');
  c('"Marcar como concluída" grava o progresso (2 → 3)', (await progressoDe('tri_nivel_front', 'pes_ana'))?.concluidas === 3);
  c('depois de concluir, "Próxima" vira link', await ev(`${botao('Próxima')}?.tagName === 'A'`));

  // ---------- Ana: etapa de texto ----------
  await ev(`${botao('Próxima')}.click()`); await espera(2500);
  c('foi para a etapa 4 (texto)', (await ev('location.pathname')).endsWith('/etapa/et_n4') && /cor é sempre token/.test(await textoMain()));
  await clicarBotao('Marcar como concluída');
  await ev(`${botao('Próxima')}.click()`); await espera(2500);

  // ---------- Ana: quiz no desktop (reprova uma vez e passa) ----------
  c('quiz no desktop mostra as 5 perguntas juntas', (await ev(`document.querySelectorAll('main fieldset').length`)) === 5);
  c('"Enviar" desabilitado com o motivo enquanto falta responder', await ev(`(() => { const b = ${botao('Enviar respostas')}; return b?.disabled && /falta/.test(document.querySelector('main').innerText); })()`));
  const ordem1 = await ev(`[...document.querySelectorAll('main fieldset')].map((f) => [...f.querySelectorAll('label')].map((l) => l.textContent.trim()).join('/')).join(' || ')`);
  await responder(CERTAS_NIVEL, true);
  await clicarBotao('Enviar respostas');
  const res1 = await textoMain();
  c('1ª tentativa errada: "Ainda não foi desta vez", nota 0, tentativas 1/3', /Ainda não foi desta vez/.test(res1) && /Sua nota\s*0/.test(res1) && /Tentativas\s*1\/3/.test(res1), res1.match(/Sua nota[\s\S]{0,60}/)?.[0]?.replace(/\n/g, ' '));
  c('revisão: cada resposta "Errada" com texto; sem gabarito enquanto pode tentar', (res1.match(/Errada/g) ?? []).length === 5 && !/Resposta certa:/.test(res1));
  c('explica por que embaralha', /a ordem das alternativas muda/.test(res1));
  c('o foco foi para o resultado', await ev(`document.activeElement?.getAttribute('aria-live') === 'polite'`));
  await clicarBotao('Tentar de novo');
  const ordem2 = await ev(`[...document.querySelectorAll('main fieldset')].map((f) => [...f.querySelectorAll('label')].map((l) => l.textContent.trim()).join('/')).join(' || ')`);
  c('"Tentar de novo" embaralha as alternativas', ordem1 !== ordem2 && /Alternativas em nova ordem/.test(await textoMain()));
  c('"Tentativa 2 de 3"', /Tentativa 2 de 3/.test(await textoMain()));
  await responder(CERTAS_NIVEL);
  await clicarBotao('Enviar respostas'); await espera(500);
  c('aprovada na última etapa: tela de parabéns', /Parabéns, trilha concluída!/.test(await textoMain()));
  const pAna = await progressoDe('tri_nivel_front', 'pes_ana');
  c('grava: 5 de 5, nota 100, 2 tentativas (resumo e por quiz)', pAna?.concluidas === 5 && pAna.nota === 100 && pAna.tentativas === 2 && pAna.quizzes?.et_n5?.tentativas === 2, JSON.stringify(pAna));
  await clicarBotao('Voltar para Minhas trilhas'); await espera(2500);
  c('"Voltar para Minhas trilhas" e a trilha aparece concluída', (await ev('location.pathname')) === '/minhas-trilhas' && /Você está em dia/.test(await textoMain()));

  // ---------- Admin vê o progresso ----------
  await entrar(CONTAS.admin);
  await ir('/trilhas/tri_nivel_front');
  await ev(`[...document.querySelectorAll('[role=tab]')].find((b) => b.textContent.includes('Progresso')).click()`); await espera(500);
  const linhaAna = await ev(`[...document.querySelectorAll('main tr')].find((tr) => tr.textContent.includes('Ana Souza'))?.innerText.replace(/\\s+/g, ' ')`);
  c('admin: aba Progresso mostra a Ana concluída com nota 100', /Conclu/.test(linhaAna ?? '') && /100/.test(linhaAna ?? ''), linhaAna);

  // ---------- Vídeo com endereço de exemplo: estado de erro ----------
  await entrar(CONTAS.ana);
  await ir('/minhas-trilhas/tri_boasvindas/etapa/et_2', 6000);
  c('vídeo que não carrega mostra o erro e o link', /Não foi possível carregar o vídeo/.test(await textoMain()) && await ev(`!!document.querySelector('main a[target=_blank]')`));

  // ---------- Elisa no celular: quiz uma pergunta por vez, teclado, sem tentativas ----------
  await entrar(CONTAS.elisa);
  await largura(375, 760);
  await ir('/projetos');
  c('trava ligada: Elisa (trilha pendente) vê o bloqueio em /projetos', /Conclua sua trilha de boas-vindas/.test(await textoMain()));
  await ir('/minhas-trilhas/tri_boasvindas/etapa/et_4');
  c('375 px: "Pergunta 1 de 4" e só uma pergunta na tela', /Pergunta 1 de 4/.test(await textoMain()) && (await ev(`document.querySelectorAll('main fieldset').length`)) === 1);
  c('375 px: sem rolagem lateral', await ev(semRolagemLateral));
  c('375 px: alternativas com alvo ≥ 44 px', await ev(`[...document.querySelectorAll('main fieldset label')].every((l) => l.getBoundingClientRect().height >= 44)`));
  // Teclado: foca o 1º rádio, seta para baixo marca o 2º (radiogroup nativo).
  await ev(`document.querySelector('main fieldset input').focus()`);
  await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
  await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 }); await espera(200);
  c('teclado: seta para baixo marca a próxima alternativa', await ev(`[...document.querySelectorAll('main fieldset input')].findIndex((i) => i.checked) === 1`));
  c('teclado: foco visível na alternativa', await ev(`getComputedStyle(document.activeElement.closest('label')).boxShadow !== 'none'`));
  // Reprova 3 vezes (respostas erradas em todas as perguntas, uma por vez).
  const ERRADAS_BV = ['Corrigir sem avisar ninguém', 'Sim, se for para testar', 'Numa planilha própria', 'Ninguém, ela some sozinha'];
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    for (let p = 0; p < 4; p++) {
      await ev(`[...document.querySelectorAll('main fieldset label')].find((l) => ${JSON.stringify(ERRADAS_BV)}.some((e) => l.textContent.includes(e)))?.querySelector('input').click()`); await espera(100);
      if (p < 3) await clicarBotao('Próxima');
    }
    await clicarBotao('Enviar respostas');
    if (tentativa < 3) await clicarBotao('Tentar de novo');
  }
  const fim = await textoMain();
  c('3ª reprovação: "Fale com a coordenação" e sem "Tentar de novo"', /Fale com a coordenação/.test(fim) && !(await ev(`!!${botao('Tentar de novo')}`)));
  c('agora o gabarito aparece ("Resposta certa:")', /Resposta certa:/.test(fim));
  await ir('/minhas-trilhas/tri_boasvindas/etapa/et_4');
  c('voltando depois: continua "Você usou todas as tentativas"', /Você usou todas as tentativas/.test(await textoMain()));
  await largura(1280, 900);

  // ---------- Felipe: primeiro acesso cai na trilha obrigatória ----------
  await entrar(null);
  await ir('/primeiro-acesso?convite=pes_felipe', 4000);
  const set = (sel, v) => ev(`(() => { const el = document.querySelector('${sel}'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); })()`);
  await set('#senha', 'Felipe@2026'); await espera(150);
  await set('#confirmar-senha', 'Felipe@2026'); await espera(150);
  await clicar('#aceite'); await espera(200);
  await ev(`document.querySelector('form button[type=submit]').click()`); await espera(4000);
  c('primeiro acesso do profissional cai em /minhas-trilhas', (await ev('location.pathname')) === '/minhas-trilhas', await ev('location.pathname'));
  c('e o destaque é a Boas-vindas (trilha obrigatória)', /Comece por aqui[\s\S]*Boas-vindas ao programa/i.test(await textoMain()));

  // Limpa os dados para não atrapalhar o próximo teste.
  await ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console (fora o vídeo de exemplo que não existe)', erros.filter((e) => !/example\.com|MEDIA_ELEMENT|media/i.test(e)).length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
