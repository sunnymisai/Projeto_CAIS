/* ============================================================================
   CAIQUE-PROTECAO.TS — PROTEÇÕES DAS ROTAS DO CAIQUE (ORIGEM E LIMITE DE PERGUNTAS)
   O que é: duas barreiras baratas enquanto não há login no servidor: só aceita chamada do próprio site
     e limita quantas perguntas um mesmo endereço faz por minuto (protege a cota e o custo do Gemini).
   Onde é usado: app/api/caique/chat/route.ts e app/api/caique/feedback/route.ts.
   Depende de: nada (só a Request padrão da web).
   Contexto: prompt I01 (segurança) em docs/prompts.
   ============================================================================ */

import 'server-only';

/**
 * Diz se a chamada veio do próprio CAIS.
 * O navegador sempre manda o cabeçalho Origin em POST; se ele aponta para outro site, recusamos.
 * @param request - a requisição recebida.
 * @returns true se não há Origin (curl, testes) ou se o host do Origin é o mesmo do servidor.
 */
export function origemPermitida(request: Request): boolean {
  const origem = request.headers.get('origin');
  if (!origem) return true;
  try {
    return new URL(origem).host === request.headers.get('host');
  } catch {
    return false;
  }
}

// [PV-1] O LIMITE DE PERGUNTAS: no máximo LIMITE_POR_JANELA perguntas por endereço a cada JANELA_MS.
const LIMITE_POR_JANELA = 20;
const JANELA_MS = 60_000;

// ⚠️ ATENÇÃO: o contador mora na memória deste processo. Com várias instâncias do servidor (ex.: Vercel),
// cada uma conta separado e o limite real fica maior. Em produção, troque por um contador compartilhado.
const pedidosPorEndereco = new Map<string, number[]>();

/**
 * Registra a pergunta e diz se o endereço passou do limite.
 * @param request - a requisição recebida (o endereço vem do x-forwarded-for).
 * @returns true se deve recusar com 429.
 */
// GRAVA: o horário desta pergunta no contador em memória.
export function limiteAtingido(request: Request): boolean {
  const endereco = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const agora = Date.now();
  // Mantém só os pedidos dentro da janela; os mais antigos já não contam.
  const recentes = (pedidosPorEndereco.get(endereco) ?? []).filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= LIMITE_POR_JANELA) {
    pedidosPorEndereco.set(endereco, recentes);
    return true;
  }
  recentes.push(agora);
  pedidosPorEndereco.set(endereco, recentes);
  return false;
}
