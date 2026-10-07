/* ============================================================================
   TEMA (CLARO, ESCURO OU SEGUIR O SISTEMA)
   O que é: o ÚNICO lugar que sabe ler, aplicar e gravar o tema do CAIS, e o hook useTema() que mantém todos os botões de tema sincronizados.
   Onde é usado: components/ThemeToggle.tsx (botão sol/lua do topo e das telas públicas) e app/(sistema)/perfil/page.tsx (aba Preferências).
   Depende de: React (useSyncExternalStore), localStorage e matchMedia do navegador.
   Contexto: §9 (design system: tema claro e escuro) e §13 (qualidade: funciona nos dois temas).
   ============================================================================ */

"use client";

import { useSyncExternalStore } from 'react';

/*
 * ⚠️ ATENÇÃO — LIGAÇÃO COM O SCRIPT DE app/layout.tsx:
 * O <script> inline de app/layout.tsx roda ANTES da página aparecer (e antes do React
 * hidratar) para evitar o "piscar" branco no tema escuro. Ele NÃO pode importar este
 * arquivo (é um texto dentro do <head>), então repete duas coisas de propósito:
 *   1) a chave 'cais-tema' (CHAVE_TEMA abaixo);
 *   2) os valores 'claro' e 'escuro' (sem chave salva = seguir o sistema).
 * Se mudar a chave ou os valores aqui, mude o script lá; senão a escolha deixa de ser
 * restaurada na próxima visita. Fora esse script, ninguém mais escreve 'cais-tema'.
 */

/** Chave do localStorage onde a escolha fica guardada. */
export const CHAVE_TEMA = 'cais-tema';

/** As três escolhas: claro, escuro ou seguir o tema do sistema operacional. */
export type Tema = 'claro' | 'escuro' | 'sistema';

// Nome do evento que avisa todos os botões de tema de que a escolha mudou (na mesma aba).
const EVENTO = 'cais-tema-mudou';

// Escolha em memória: vale quando o localStorage não deixa gravar (navegação privada)
// e evita reler o armazenamento a cada desenho. null = ainda não decidida (ler do storage).
let temaEmMemoria: Tema | null = null;

/**
 * Lê a escolha de tema (da memória ou do localStorage).
 * @returns 'claro', 'escuro' ou 'sistema' (quando não há nada salvo).
 * @example lerTema() // 'sistema' na primeira visita
 */
export function lerTema(): Tema {
  if (temaEmMemoria !== null) return temaEmMemoria;
  try {
    const v = localStorage.getItem(CHAVE_TEMA);
    return v === 'claro' || v === 'escuro' ? v : 'sistema';
  } catch {
    // Navegação privada: sem armazenamento, segue o sistema.
    return 'sistema';
  }
}

/**
 * Liga ou desliga as cores escuras na página.
 * @param escuro - true coloca a classe "dark" no <html> (o app/globals.css troca as cores por ela).
 */
function aplicar(escuro: boolean) {
  document.documentElement.classList.toggle('dark', escuro);
}

/**
 * Escolhe o tema: aplica na hora, grava e avisa os outros botões de tema.
 * @param tema - 'claro', 'escuro' ou 'sistema' (apaga a escolha e volta a seguir o sistema).
 * @example definirTema('escuro')
 */
// GRAVA: escreve 'claro' ou 'escuro' em localStorage['cais-tema']; 'sistema' apaga a chave.
// APAGA: no caso 'sistema', remove a chave 'cais-tema'.
export function definirTema(tema: Tema) {
  temaEmMemoria = tema;
  try {
    if (tema === 'sistema') localStorage.removeItem(CHAVE_TEMA);
    else localStorage.setItem(CHAVE_TEMA, tema);
  } catch { /* navegação privada: vale só nesta sessão (temaEmMemoria) */ }
  // 'sistema' pergunta ao sistema operacional qual tema ele está usando agora.
  aplicar(tema === 'escuro' || (tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  window.dispatchEvent(new Event(EVENTO));
}

/**
 * Registra os ouvintes que mantêm o hook atualizado e devolve a função que os remove.
 * Ouve: o nosso evento (mudança nesta aba), o evento "storage" (mudança em outra aba)
 * e a mudança do tema do sistema (só tem efeito enquanto a escolha for 'sistema').
 * @param avisar - função do React que manda redesenhar quem usa o hook.
 * @returns a limpeza (remove os três ouvintes).
 */
function assinar(avisar: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  // O sistema trocou de tema: só acompanha se a pessoa escolheu "seguir o sistema".
  const noSistema = () => {
    if (lerTema() === 'sistema') aplicar(mq.matches);
    avisar();
  };
  // Outra aba mudou a escolha: esquece a memória, relê do storage e aplica aqui também.
  const noStorage = (e: StorageEvent) => {
    if (e.key !== CHAVE_TEMA) return;
    temaEmMemoria = null;
    const t = lerTema();
    aplicar(t === 'escuro' || (t === 'sistema' && mq.matches));
    avisar();
  };
  window.addEventListener(EVENTO, avisar);
  window.addEventListener('storage', noStorage);
  mq.addEventListener('change', noSistema);
  return () => {
    window.removeEventListener(EVENTO, avisar);
    window.removeEventListener('storage', noStorage);
    mq.removeEventListener('change', noSistema);
  };
}

/**
 * Hook do tema: use em qualquer botão ou tela que mostre ou mude o tema.
 * Todos os usuários do hook ficam sincronizados (trocar na aba Preferências muda o botão do topo e vice-versa).
 * @returns `tema` (a escolha: claro, escuro ou sistema), `escuro` (o que está valendo agora) e `definir` (muda o tema).
 * @example const { tema, escuro, definir } = useTema(); definir(escuro ? 'claro' : 'escuro');
 */
export function useTema() {
  // Servidor: 'sistema' e claro (não há navegador); o navegador corrige logo depois da hidratação.
  const tema = useSyncExternalStore(assinar, lerTema, () => 'sistema' as Tema);
  // O que está valendo é lido do <html> (o script de app/layout.tsx já aplicou antes do React).
  const escuro = useSyncExternalStore(assinar, () => document.documentElement.classList.contains('dark'), () => false);
  return { tema, escuro, definir: definirTema };
}
