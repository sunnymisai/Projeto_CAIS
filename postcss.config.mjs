/* ============================================================================
   POSTCSS.CONFIG.MJS
   O que é: liga o Tailwind CSS v4 ao processamento de CSS do Next (o plugin @tailwindcss/postcss).
   Onde é usado: pelo Next, ao compilar app/globals.css (npm run dev e npm run build).
   Depende de: @tailwindcss/postcss (devDependency do package.json).
   Contexto: CLAUDE.md "Pilha": Tailwind v4 configurado só pelo CSS (app/globals.css, @theme inline). ⚠️ ATENÇÃO: sem este arquivo nenhuma classe do Tailwind funciona.
   ============================================================================ */
// Um único plugin: o Tailwind v4 lê a configuração direto do CSS, não de um arquivo JS.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
