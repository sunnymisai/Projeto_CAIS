/* ============================================================================
   TESTES/NAVEGADOR/J01-BOTAO-ENTRAR.MJS
   O que é: confere o botão "Entrar" animado do login (components/BotaoEntrar.tsx): (1) em repouso mostra
     texto e seta e tem 56 px de altura; (2) enviar vazio mostra os erros e NÃO liga a animação; (3) senha errada
     liga a animação, mostra o erro e devolve o botão ao início; (4) login certo toca a animação inteira e só
     navega depois dela; (5) com "reduzir movimento" navega logo; (6) no celular (375 px) o botão cabe e a
     página não rola para o lado.
   Onde é usado: rodado à mão: node testes/navegador/j01-botao-entrar.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e das contas de demonstração da tela de login.
   Contexto: pedido de 16/10/2026 (trocar o botão de login pelo botão animado da pasta botao_novo).
   ============================================================================ */
import { abrirNavegador, conferir, espera } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('j01', 9392);
const { ev, ir, cmd, largura } = nav;
/** Caminho atual. */
const caminho = () => ev('location.pathname');
/** Estado do botão de envio: aria-busy, opacidade do texto e altura. */
const botao = () => ev(`(() => { const b = document.querySelector('form button[type=submit]'); const t = b.querySelector('span[aria-hidden]'); return { busy: b.getAttribute('aria-busy'), texto: b.textContent.trim(), opacidade: t ? getComputedStyle(t).opacity : null, altura: b.offsetHeight, largura: b.offsetWidth }; })()`);
/** Escreve num campo do React (setter nativo + evento de entrada). */
const digitar = (id, valor) => ev(`(() => { const el = document.getElementById('${id}'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, ${JSON.stringify(valor)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
/** Clica no botão de envio. */
const enviar = () => ev(`document.querySelector('form button[type=submit]').click()`);
/** Preenche com a conta de demonstração do perfil (o botão "Entrar como"). */
const demo = (rotulo) => ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '${rotulo}')?.click()`);

// 1) Repouso.
await ir('/login', 4000);
const repouso = await botao();
c('em repouso o botão diz Entrar e tem 56 px de altura', repouso.texto.includes('Entrar') && repouso.altura === 56, JSON.stringify(repouso));
c('em repouso não está ocupado (aria-busy=false)', repouso.busy === 'false', repouso.busy);

// 2) Enviar vazio: erros, sem animação.
await enviar();
await espera(600);
const vazio = await botao();
c('enviar vazio não liga a animação', vazio.busy === 'false' && vazio.opacidade === '1', JSON.stringify(vazio));
c('enviar vazio mostra os erros dos campos', (await ev(`document.body.innerText`)).includes('Informe seu e-mail.'), '');

// 3) Senha errada.
await demo('Administrador');
await espera(300);
await digitar('password', 'senha-errada-123');
await enviar();
await espera(500);
const ligou = await botao();
c('senha errada: a animação liga (aria-busy=true)', ligou.busy === 'true', JSON.stringify(ligou));
await espera(1500);
const errou = await botao();
c('senha errada: volta ao início e mostra o erro', errou.busy === 'false' && errou.opacidade === '1' && (await ev(`document.body.innerText`)).includes('E-mail ou senha incorretos'), JSON.stringify(errou));
c('senha errada: continua no /login', (await caminho()) === '/login', await caminho());

// 4) Login certo: anima inteira e só então navega.
await demo('Administrador');
await espera(300);
await enviar();
await espera(1200);
const meio = await botao();
c('login certo: em 1,2 s o texto já sumiu e ainda está no /login', meio.busy === 'true' && Number(meio.opacidade) < 0.1 && (await caminho()) === '/login', JSON.stringify(meio));
await espera(1000);
c('login certo: em ~2,2 s ainda não navegou (a animação segue)', (await caminho()) === '/login', await caminho());
await espera(2500);
c('login certo: depois da animação navega para o painel', (await caminho()).startsWith('/painel'), await caminho());

// 5) Reduzir movimento: navega logo.
await ev(`localStorage.clear(); sessionStorage.clear()`);
await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await ir('/login', 3500);
await demo('Profissional');
await espera(300);
await enviar();
await espera(1500);
c('reduzir movimento: navega em menos de 1,5 s, sem esperar a animação', (await caminho()).startsWith('/') && (await caminho()) !== '/login', await caminho());
await cmd('Emulation.setEmulatedMedia', { features: [] });

// 6) Celular.
await ev(`localStorage.clear(); sessionStorage.clear()`);
await largura(375, 800);
await ir('/login', 3500);
const cel = await botao();
c('no celular o botão ocupa a largura do cartão', cel.largura > 250 && cel.largura <= 375, JSON.stringify(cel));
c('no celular a página não rola para o lado', !(await ev(`document.documentElement.scrollWidth > innerWidth`)), '');

c.resumo();
process.exit(process.exitCode ?? 0);
