/* ============================================================================
   NEXT.CONFIG.TS
   O que é: a configuração do Next.js do projeto.
   Onde é usado: pelo próprio Next, ao rodar `npm run dev` e `npm run build`.
   Depende de: next (NextConfig) e node:os (endereços de rede do computador).
   Contexto: docs/notas-next16.md e node_modules/next/dist/docs/
     (01-app/03-api-reference/05-config/01-next-config-js/allowedDevOrigins.md).
   ============================================================================ */
import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

/**
 * Lista os IPv4 deste computador na rede (ex.: 10.131.63.49), para abrir o
 * `npm run dev` pelo celular ou por outro micro da mesma rede.
 * O IP muda quando a rede muda (DHCP), por isso é lido a cada início do servidor.
 * @returns os endereços IPv4 que não são internos.
 */
function ipsDaRede(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((rede) => rede && rede.family === "IPv4" && !rede.internal)
    .map((rede) => rede!.address);
}

const nextConfig: NextConfig = {
  // ⚠️ ATENÇÃO: no Next 16, o servidor de desenvolvimento só entrega os scripts
  // da página para "localhost". Aberta por 127.0.0.1 ou pelo IP da rede, a tela
  // aparece, mas o JavaScript não roda: os botões não preenchem, o Entrar não leva
  // ao painel e nenhuma validação funciona. Esta lista libera esses endereços.
  // Vale só para o `npm run dev`; não muda nada no build.
  allowedDevOrigins: ["127.0.0.1", ...ipsDaRede()],
  // Esconde a bolinha "N" que o Next mostra no canto da tela durante o `npm run dev`
  // (ela nunca aparece no build). Erros de compilação e de execução continuam aparecendo.
  devIndicators: false,
};

export default nextConfig;
