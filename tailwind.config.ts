/* ============================================================================
   TAILWIND.CONFIG.TS
   O que é: configuração herdada do Tailwind v3. ⚠️ ATENÇÃO: no Tailwind v4 (usado aqui) este arquivo só é lido se o CSS tiver uma diretiva "@config" apontando para ele, e o projeto NÃO tem; as cores e fontes declaradas aqui NÃO estão ativas.
   Onde é usado: por ninguém hoje (mantido só como referência dos nomes da marca).
   Depende de: tailwindcss (tipo Config).
   Contexto: os tokens reais (cores, fontes) ficam no bloco @theme de app/globals.css: edite lá, não aqui. Se for apagar este arquivo, confira antes que nada no CSS usa @config.
   ============================================================================ */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // Isto diz ao Tailwind para procurar classes nestas pastas específicas
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cais: {
          'roxo-mare': '#7C5CFF',
          'roxo-fundo': '#5B3FD4',
          'verde-atracado': '#10B981',
          'tinta': '#14161F',
          'nevoa': '#F6F7FB',
        }
      },
      fontFamily: {
        space: ['"Space Grotesk"', 'sans-serif'],
        archivo: ['Archivo', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;