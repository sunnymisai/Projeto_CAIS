/**
 * AVISO: com Tailwind v4 (usado neste projeto), este arquivo só é lido se
 * houver uma diretiva "@config" apontando para ele dentro do CSS — e este
 * projeto não tem essa diretiva. Ou seja, as cores/fontes declaradas aqui
 * embaixo NÃO estão ativas.
 *
 * A fonte da verdade real dos tokens de marca (cores, fontes) é o bloco
 * @theme em app/globals.css. Edite as cores lá, não aqui.
 */
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