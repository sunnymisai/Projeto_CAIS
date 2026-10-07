/* ============================================================================
   TESTES/NAVEGADOR/PAINEIS-TODOS-PERFIS.MJS
   O que é: conferência rápida de que o /painel abre com conteúdo para cada perfil
     (admin, profissional e empresa), sem "Em construção", sem rolagem lateral em
     375 px e sem erro no console.
   Onde é usado: rodado à mão: node testes/navegador/paineis-todos-perfis.mjs
     (com o `npm run dev` aberto em http://localhost:3000).
   Depende de: testes/navegador/cdp.mjs e do seed de lib/seed.ts.
   Contexto: §6 (um painel por perfil) e preparação da apresentação.
   ============================================================================ */
import { abrirNavegador, conferir, CONTAS } from './cdp.mjs';

const c = conferir();
const nav = await abrirNavegador('paineis', 9358);
const { ev, ir, entrar, largura, erros } = nav;
const semRolagemLateral = `(() => { const m = document.querySelector('#conteudo'); return document.documentElement.scrollWidth <= innerWidth + 1 && m.scrollWidth <= m.clientWidth + 1; })()`;

// O que cada painel precisa mostrar (títulos dos blocos ou textos-chave).
const ESPERADO = {
  admin: ['Olá, administrador'],
  ana: ['Minhas trilhas e meu progresso', 'Minhas tarefas e meus prazos', 'Minha carga da semana', 'Meu histórico de entregas'],
  elisa: ['Minhas trilhas e meu progresso', 'Minha carga da semana'],
  marcos: ['Andamento dos projetos', 'Quem está no time', 'Entregas', 'Trilha do time', 'Portal de pedidos'],
  patricia: ['Andamento dos projetos', 'App de agendamento', 'Nenhuma trilha da sua empresa publicada'],
};

try {
  for (const [nome, esperado] of Object.entries(ESPERADO)) {
    await entrar(CONTAS[nome]);
    for (const w of [1280, 375]) {
      await largura(w, 900);
      await ir('/painel', 3000);
      const texto = await ev(`document.querySelector('main')?.innerText ?? ''`);
      const faltando = esperado.filter((e) => !texto.includes(e));
      c(`${nome} (${w} px): painel com conteúdo`, faltando.length === 0 && !/Em construção/.test(texto), faltando.length ? `faltou: ${faltando.join(', ')}` : '');
      c(`${nome} (${w} px): sem rolagem lateral`, await ev(semRolagemLateral));
    }
  }
  await largura(1280, 900);
  await ev(`localStorage.clear(); sessionStorage.clear()`);
  c('nenhum erro no console', erros.length === 0, erros.join(' || '));
} finally {
  nav.fechar();
  c.resumo();
}
