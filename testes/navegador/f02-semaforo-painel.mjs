/* ============================================================================
   TESTES/NAVEGADOR/F02-SEMAFORO-PAINEL.MJS
   O que é: conferência do F02 (semáforo integrado à store): no card "Alocação e
     carga" do painel do admin, Diego nunca aparece acima do limite (o caso do time,
     §16) e Bruno aparece; cada barra mostra o nível em texto; a Gabriela aparece
     livre; nenhum erro no console.
   Onde é usado: rodado à mão: node testes/navegador/f02-semaforo-painel.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §5 (aviso, não bloqueio) e §16 (semáforo de carga por período).
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('f02', 9365);
const { ev, ir, entrar, erros } = nav;

try {
  await ev(`localStorage.removeItem('cais-dados-v4')`);
  await entrar(CONTAS.admin);
  await ir('/painel', 500);
  // Espera o card de carga desenhar (até 15 s).
  for (let i = 0; i < 30 && !(await ev(`(document.querySelector('main')?.innerText ?? '').includes('Alocação e carga') && !!document.querySelector('main [role=img][aria-label*="horas"]')`)); i++) await espera(500);
  // aria-label de cada barra: "Nome: X de Y horas, nível".
  const barras = await ev(`[...document.querySelectorAll('main [role=img][aria-label*="horas"]')].map((b) => b.getAttribute('aria-label'))`);
  const de = (nome) => barras.find((b) => b.startsWith(nome)) ?? '';
  c('Bruno aparece acima do limite', de('Bruno Lima').includes('acima do limite'), de('Bruno Lima'));
  c('Diego nunca aparece acima do limite', !!de('Diego Alves') && !de('Diego Alves').includes('acima do limite'), de('Diego Alves'));
  c('Gabriela aparece livre', de('Gabriela Costa').includes('livre'), de('Gabriela Costa'));
  c('toda barra tem o nível em texto', barras.length > 0 && barras.every((b) => /livre|com folga|no limite|acima do limite/.test(b)), String(barras.length));
  const texto = await ev(`document.querySelector('main')?.innerText ?? ''`);
  c('o nível aparece escrito ao lado do número', /\d+ \/ \d+ h · (Livre|Com folga|No limite|Acima do limite)/.test(texto));
  await ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
