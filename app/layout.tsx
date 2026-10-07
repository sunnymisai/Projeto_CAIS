import './globals.css'; // <-- ESTA LINHA É OBRIGATÓRIA E FAZ A MAGIA ACONTECER
import type { Metadata, Viewport } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: { default: 'CAIS', template: '%s · CAIS' },
  description: 'Onboarding por trilhas, gestão de projetos e dashboards',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F7FB' },
    { media: '(prefers-color-scheme: dark)', color: '#14161F' },
  ],
};

/*
  Script de tema — roda ANTES da página aparecer, para evitar o "piscar"
  branco quando o usuário usa o modo escuro.
  Ordem de decisão:
    1) escolha salva pelo usuário (botão ThemeToggle → localStorage "cais-tema")
    2) se não houver, segue o tema do sistema operacional
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: o script acima altera a classe do <html>
    // antes do React carregar; isso é esperado e não é um erro.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
