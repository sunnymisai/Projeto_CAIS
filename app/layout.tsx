/* ============================================================================
   APP/LAYOUT.TSX (LAYOUT RAIZ)
   O que é: a "moldura" HTML de todas as páginas do CAIS (<html>, <head>, <body>).
   Onde é usado: pelo próprio Next.js, automaticamente, em TODAS as rotas
     (homepage "/", login "/login", área interna "(sistema)", "/sem-permissao" e página 404).
   Depende de: app/globals.css (cores, fontes e tema), app/providers.tsx
     (sessão, dados e avisos) e o localStorage "cais-tema", gravado por lib/tema.ts
     (usado por components/ThemeToggle.tsx e pela aba Preferências de /perfil).
   Contexto: §9 (design system e marca: cores Tinta e Névoa) e
     docs/notas-next16.md §1 (é Server Component) e §5 (metadados).
   ============================================================================ */

// ⚠️ ATENÇÃO: sem o import do globals.css abaixo, nenhuma classe Tailwind nem
// cor do tema funciona: o sistema inteiro aparece "sem estilo".
import './globals.css'; // <-- ESTA LINHA É OBRIGATÓRIA E FAZ A MAGIA ACONTECER
import type { Metadata, Viewport } from 'next';
import Providers from './providers';

/**
 * Título e descrição da aba do navegador.
 * O `template` monta o título das outras páginas: se uma página exporta
 * `title: 'Projetos'`, a aba mostra "Projetos · CAIS".
 * Só funciona porque este arquivo é Server Component (notas-next16 §5).
 */
export const metadata: Metadata = {
  title: { default: 'CAIS', template: '%s · CAIS' },
  description: 'Onboarding por trilhas, gestão de projetos e dashboards',
};

/**
 * Cor da barra do navegador no celular (a faixa de cima, onde fica o relógio).
 * Segue o tema do sistema: Névoa (#F6F7FB) no claro e Tinta (#14161F) no
 * escuro, as mesmas cores de fundo do globals.css (§9).
 */
export const viewport: Viewport = {
  // viewport-fit=cover: sem isto, env(safe-area-inset-bottom) vale sempre 0 no iPhone e a barra
  // fixa do rodapé (botão "Continuar" em /minhas-trilhas/[id]) ficaria atrás da barrinha de início.
  // ⚠️ ATENÇÃO: com "cover" a página pode ir até a borda da tela; quem fica colado na borda
  // (rodapés fixos) precisa somar a área segura no padding.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F7FB' },
    { media: '(prefers-color-scheme: dark)', color: '#14161F' },
  ],
};

/*
  Script de tema — roda ANTES da página aparecer, para evitar o "piscar"
  branco quando o usuário usa o modo escuro.
  Ordem de decisão:
    1) escolha salva pelo usuário (lib/tema.ts → localStorage "cais-tema"; sem chave = seguir o sistema)
    2) se não houver, segue o tema do sistema operacional
*/
/*
 * Por que é um texto (string) e não uma função React comum?
 * - O React só "acorda" (hidrata) depois que o HTML já foi pintado na tela.
 *   Se o tema fosse aplicado num useEffect, a tela apareceria branca por um
 *   instante e só depois ficaria escura: é o "piscar" que queremos evitar.
 * - Por isso o código vai como texto dentro de um <script> inline no <head>:
 *   o navegador executa assim que lê a linha, ANTES de desenhar o <body> e
 *   ANTES da hidratação. Não pode ser um arquivo .js separado, que demoraria
 *   para baixar.
 * - O try/catch existe porque o localStorage pode estar bloqueado (aba
 *   anônima, cookies desligados); nesse caso a página abre no tema claro.
 * - Ele só ADICIONA a classe "dark" no <html>; o globals.css troca as cores
 *   quando essa classe existe.
 * ⚠️ ATENÇÃO: a chave 'cais-tema' e os valores 'escuro'/'claro' precisam ser
 * iguais aos de lib/tema.ts (CHAVE_TEMA e definirTema), que é o único código que
 * grava essa chave. Este script não pode importar lib/tema.ts (é um texto no
 * <head>, executado antes do React), por isso a repetição é intencional. Se mudar
 * só de um lado, o tema escolhido deixa de ser lembrado. Não escreva comentários DENTRO do texto
 * abaixo: eles virariam parte do código executado no navegador.
 */
const themeScript = `
(function () {
  try {
    var salvo = localStorage.getItem('cais-tema');
    var escuro = salvo ? salvo === 'escuro'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (escuro) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

/**
 * Layout raiz: envolve TODAS as páginas do sistema.
 * Roda no servidor (Server Component), por isso não usa hooks; tudo que
 * precisa do navegador fica dentro do <Providers>.
 *
 * @param props.children a página da rota atual (login, painel, 404...).
 * @returns o documento HTML completo, em português ("pt-BR").
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: o script acima altera a classe do <html>
    // antes do React carregar; isso é esperado e não é um erro.
    // Sem ele, o React compara o HTML do servidor (sem "dark") com o do
    // navegador (com "dark") e mostra um aviso vermelho no console.
    // Vale só para os atributos do próprio <html>, não para os filhos.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* dangerouslySetInnerHTML: jeito do React de colocar o texto do script
          * sem escapar os caracteres. É seguro aqui porque o texto é fixo,
          * escrito por nós, e não vem de nenhum usuário. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {/* Providers: sessão, dados e avisos ficam disponíveis para qualquer
          * página dentro do {children}. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
