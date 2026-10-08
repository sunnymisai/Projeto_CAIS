/* ============================================================================
   TESTES/NAVEGADOR/D02-MINHAS-TRILHAS.MJS
   O que é: teste de aceite do D02 (Minhas trilhas e detalhe da trilha) no Chrome headless.
   Onde é usado: rodado à mão: node testes/navegador/d02-minhas-trilhas.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts (trilhas, prazos e progresso).
   Contexto: prompt D02 (aceite: login como Ana, trilhas certas, 375 px e desktop, teclado).
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('d02');
const { ev, ir, entrar, clicar, largura, tab, erros } = nav;

// Títulos dos cards de trilha na lista (na ordem da tela).
const titulosDaLista = () => ev(`[...document.querySelectorAll('main section li h3')].map((h) => h.textContent.trim())`);
// Texto de um card (pelo título).
const textoDoCard = (titulo) => ev(`[...document.querySelectorAll('main section li')].find((li) => li.querySelector('h3')?.textContent.trim() === ${JSON.stringify(titulo)})?.innerText.replace(/\\n+/g, ' | ')`);

try {
  // ---------- Ana (profissional) ----------
  await entrar(CONTAS.ana);
  await ir('/minhas-trilhas');
  const ana = await titulosDaLista();
  c('Ana vê as 3 trilhas do público dela', JSON.stringify([...ana].sort()) === JSON.stringify(['Boas-vindas ao programa', 'Nivelamento de front-end', 'Processos da Vértice']), ana.join(', '));
  c('grupos na ordem geral → empresa → profissional', JSON.stringify(await ev(`[...document.querySelectorAll('main section h2')].map((h) => h.textContent.replace(/\\(.*\\)/, '').trim())`)) === JSON.stringify(['Trilha geral', 'Trilha da empresa', 'Trilha do profissional']));
  const destaque = await ev(`document.querySelector('main')?.innerText.split('Trilha geral')[0].replace(/\\n+/g, ' | ')`);
  c('"Continue de onde parou" mostra o Nivelamento na etapa 3 (Tipagem com TypeScript)', /continue de onde parou/i.test(destaque) && /Nivelamento de front-end/.test(destaque) && /3 de 5/.test(destaque) && /Tipagem com TypeScript/.test(destaque), destaque?.slice(0, 160));
  const nivel = await textoDoCard('Nivelamento de front-end');
  c('card mostra "2 de 5 etapas" e o prazo "Até dd/mm"', /2 de 5 etapas/.test(nivel) && /Até \d\d\/\d\d/.test(nivel), nivel);
  const bv = await textoDoCard('Boas-vindas ao programa');
  c('trilha concluída mostra "Concluída" e a nota do quiz', /Concluída/.test(bv) && /Nota 92/.test(bv), bv);

  // Teclado: os cards e os botões são alcançáveis e o foco fica visível.
  await ev(`document.activeElement?.blur()`);
  const paradas = [];
  for (let i = 0; i < 40; i++) paradas.push(await tab());
  const naLista = paradas.filter((p) => p && /Nivelamento|Boas-vindas|Processos|Continuar|Ver etapas/.test(p.texto));
  c('teclado alcança "Continuar", "Ver etapas" e os 3 cards', ['Continuar', 'Ver etapas', 'Nivelamento', 'Boas-vindas', 'Processos'].every((t) => naLista.some((p) => p.texto.includes(t))));
  c('todos esses alvos têm foco visível', naLista.length > 0 && naLista.every((p) => p.visivel), naLista.filter((p) => !p.visivel).map((p) => p.texto).join(', '));

  // 375 px: nada rola de lado.
  await largura(375); await espera(500);
  c('375 px: lista sem rolagem horizontal', await ev(`(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`));

  // ---------- Detalhe (Ana, Nivelamento) ----------
  await largura(1280, 900);
  await ir('/minhas-trilhas/tri_nivel_front');
  const estados = await ev(`[...document.querySelectorAll('main ol > li')].map((li) => li.innerText.match(/Concluída|Próxima|Bloqueada/)?.[0])`);
  c('etapas: 2 concluídas, 1 próxima, 2 bloqueadas', JSON.stringify(estados) === JSON.stringify(['Concluída', 'Concluída', 'Próxima', 'Bloqueada', 'Bloqueada']), JSON.stringify(estados));
  const bloqueada = await ev(`document.querySelectorAll('main ol > li')[3].innerText`);
  c('bloqueada explica o motivo', bloqueada.includes('Conclua “Tipagem com TypeScript” para liberar'), bloqueada.replace(/\n+/g, ' | '));
  c('bloqueada não é link; concluída e próxima são', await ev(`(() => { const lis = document.querySelectorAll('main ol > li'); return !!lis[0].querySelector('a') && !!lis[2].querySelector('a[aria-current="step"]') && !lis[3].querySelector('a'); })()`));
  c('quiz mostra nota mínima e tentativas', /Nota mínima 70% · 3 tentativas/.test(await ev(`document.querySelectorAll('main ol > li')[4].innerText`)));
  c('desktop: botão "Continuar" no cabeçalho visível', await ev(`(() => { const a = [...document.querySelectorAll('main a')].find((x) => x.textContent.trim().startsWith('Continuar')); return !!a && getComputedStyle(a).display !== 'none'; })()`));

  await largura(375, 740); await espera(500);
  const barra = await ev(`(() => { const b = document.querySelector('main div.fixed.bottom-0'); if (!b) return null; const a = b.querySelector('a'); return { visivel: getComputedStyle(b).display !== 'none', alturaBotao: a.getBoundingClientRect().height, texto: a.textContent.trim() }; })()`);
  c('375 px: barra fixa com "Continuar" e alvo de toque ≥ 44 px', barra?.visivel && barra.alturaBotao >= 44 && barra.texto.startsWith('Continuar'), JSON.stringify(barra));
  // Rola até o fim: a última etapa não pode ficar atrás da barra.
  await ev(`document.querySelector('#conteudo').scrollTo(0, 1e6)`); await espera(300);
  c('375 px: última etapa não fica coberta pela barra', await ev(`(() => { const ult = [...document.querySelectorAll('main ol > li')].at(-1).getBoundingClientRect(); const barra = document.querySelector('main div.fixed.bottom-0').getBoundingClientRect(); return ult.bottom <= barra.top; })()`));
  c('375 px: detalhe sem rolagem horizontal', await ev(`(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`));
  // O botão leva ao player (provisório do D03), não a um 404.
  // Espera o endereço mudar (até 15 s) em vez de um tempo fixo: no `npm run dev` a rota do
  // player é compilada na primeira visita, e com a máquina ocupada isso pode passar de 2,5 s.
  await clicar('main div.fixed.bottom-0 a');
  for (let i = 0; i < 30 && (await ev('location.pathname')) === '/minhas-trilhas/tri_nivel_front'; i++) await espera(500);
  // Depois da troca de endereço, dá um tempo para o player desenhar antes de conferir o texto.
  await espera(1000);
  c('"Continuar" abre o player da etapa atual (sem 404)', (await ev('location.pathname')) === '/minhas-trilhas/tri_nivel_front/etapa/et_n3' && !/404|não encontrada/i.test(await ev(`document.querySelector('main')?.innerText ?? ''`)), await ev('location.pathname'));
  await largura(1280, 900);

  // ---------- Fora do público ----------
  await ir('/minhas-trilhas/tri_lgpd', 3500);
  c('Ana: trilha em rascunho → /sem-permissao', (await ev('location.pathname')) === '/sem-permissao');

  // ---------- Prazos (Elisa vencido, Carla perto) ----------
  await entrar(CONTAS.elisa); await ir('/minhas-trilhas');
  c('Elisa: Boas-vindas "Venceu em dd/mm"', /Venceu em \d\d\/\d\d/.test(await textoDoCard('Boas-vindas ao programa') ?? ''), await textoDoCard('Boas-vindas ao programa'));
  await entrar(CONTAS.carla); await ir('/minhas-trilhas');
  c('Carla: Vértice "Faltam 2 dias"', /Faltam 2 dias/.test(await textoDoCard('Processos da Vértice') ?? ''), await textoDoCard('Processos da Vértice'));

  // ---------- Empresa ----------
  await entrar(CONTAS.marcos); await ir('/minhas-trilhas');
  const marcos = await titulosDaLista();
  c('Marcos (Vértice) vê Boas-vindas e Processos da Vértice', JSON.stringify([...marcos].sort()) === JSON.stringify(['Boas-vindas ao programa', 'Processos da Vértice']), marcos.join(', '));
  await entrar(CONTAS.patricia); await ir('/minhas-trilhas');
  const patricia = await titulosDaLista();
  c('Patrícia (Aurora) vê só a Boas-vindas', JSON.stringify(patricia) === JSON.stringify(['Boas-vindas ao programa']), patricia.join(', '));
  await ir('/minhas-trilhas/tri_vertice', 3500);
  c('Patrícia: trilha da Vértice → /sem-permissao', (await ev('location.pathname')) === '/sem-permissao');

  // ---------- Estado vazio ----------
  // A store só grava depois da 1ª alteração, então o teste monta dados completos: só a Patrícia e nenhuma trilha.
  const soPatricia = { id: 'pes_patricia', nome: 'Patrícia Melo', email: 'patricia@aurora.example', telefone: '', cargo: '', perfil: 'empresa', status: 'ativo', dataEntrada: '2026-01-01', area: '', nivel: '', cargaMax: 40, habilidades: [], empresaId: 'emp_aurora' };
  await ev(`localStorage.setItem('cais-dados-v2', ${JSON.stringify(JSON.stringify({ empresas: [], pessoas: [soPatricia], trilhas: [], projetos: [], alocacoes: [], tarefas: [] }))})`);
  await ir('/minhas-trilhas');
  c('sem trilhas: estado vazio com a frase do prompt', (await ev(`document.querySelector('main').innerText`)).includes('Nenhuma trilha atribuída a você ainda.'));
  // Devolve a demonstração para não atrapalhar o próximo teste.
  await ev(`localStorage.removeItem('cais-dados-v2')`);

  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
