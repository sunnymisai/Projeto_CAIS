/* ============================================================================
   APP/API/CAIQUE/CHAT/ROUTE.TS — ROTA DO CHAT DO CAIQUE (POST /api/caique/chat)
   O que é: recebe a pergunta, a trilha aberta e o histórico; pergunta ao Gemini e devolve a resposta.
     É aqui (no servidor) que a chave do Gemini fica: o navegador nunca a vê.
   Onde é usado: lib/caique.ts (perguntarAoCaique), chamado por components/caique/ChatWidget.tsx.
   Depende de: lib/caique.ts (validarPedido, montarRespostaSimulada), lib/caique-servidor.ts (Gemini)
     e lib/caique-logger.ts (registro).
   Contexto: §4 (trilhas); prompts I02 e I03 em docs/prompts.
   ============================================================================ */

import { montarRespostaSimulada, validarPedido } from '@/lib/caique';
import { ErroGemini, geminiConfigurado, perguntarAoGemini } from '@/lib/caique-servidor';
import { gravarLogCaique } from '@/lib/caique-logger';
import { limiteAtingido, origemPermitida } from '@/lib/caique-protecao';

// [PV-1] AS MENSAGENS DE ERRO que a pessoa vê no chat, por status. Troque o texto aqui.
const ERROS: Record<number, string> = {
  503: 'O CAIQUE está com muitas perguntas agora. Tente de novo em alguns segundos.',
  504: 'O CAIQUE demorou demais para responder. Tente de novo.',
  502: 'Não consegui responder agora. Tente de novo.',
};

/**
 * POST /api/caique/chat
 * @param request - corpo { pergunta, trilha, historico } (PedidoCaique em lib/caique.ts).
 * @returns 200 { id, texto, simulada } ou { erro } com 400 (pedido inválido), 403 (outro site),
 *   429 (perguntas demais), 502/503/504 (falha da IA) ou 500.
 */
// TODO(API): não há sessão no servidor para quem entra por e-mail e senha (o cadastro mora no navegador),
// então a rota ainda não sabe QUEM pergunta nem confere a empresa. Quando a PROGLOGIC tiver sessão,
// conferir aqui o usuário e se a trilha pertence ao público dele.
export async function POST(request: Request) {
  // Só o próprio CAIS pode chamar: impede outro site de gastar a cota do Gemini pelo navegador de alguém.
  if (!origemPermitida(request)) return Response.json({ erro: 'Origem não permitida.' }, { status: 403 });
  if (limiteAtingido(request)) {
    return Response.json({ erro: 'Muitas perguntas seguidas. Espere um minuto e tente de novo.' }, { status: 429 });
  }

  const corpo: unknown = await request.json().catch(() => null);
  const validado = validarPedido(corpo);
  if ('erro' in validado) return Response.json({ erro: validado.erro }, { status: 400 });
  const { pergunta, trilha, historico } = validado.pedido;

  const id = crypto.randomUUID();
  const inicio = Date.now();
  /** Monta o registro do log desta pergunta (o mesmo formato no sucesso e na falha). */
  const registro = (resposta: string, origem: 'gemini' | 'simulada', tokens: number, erro: string | null) => ({
    tipo: 'pergunta' as const, id, quando: new Date().toISOString(), trilhaId: trilha.id, trilhaTitulo: trilha.titulo,
    pergunta, resposta, origem, tempoMs: Date.now() - inicio, tokens, erro,
  });

  // SIMULADO: sem GEMINI_API_KEY no .env.local o chat continua funcionando, com texto de demonstração.
  if (!geminiConfigurado()) {
    const texto = montarRespostaSimulada(pergunta, trilha.titulo);
    // GRAVA: uma linha em logs/caique-<data>.jsonl.
    await gravarLogCaique(registro(texto, 'simulada', 0, null));
    return Response.json({ id, texto, simulada: true });
  }

  try {
    const { texto, tokens } = await perguntarAoGemini(pergunta, trilha, historico);
    // GRAVA: uma linha em logs/caique-<data>.jsonl.
    await gravarLogCaique(registro(texto, 'gemini', tokens, null));
    return Response.json({ id, texto, simulada: false });
  } catch (e) {
    const status = e instanceof ErroGemini ? e.status : 500;
    const detalhe = e instanceof Error ? e.message : String(e);
    console.error('[CAIQUE] Falha ao responder:', detalhe);
    // GRAVA: a falha também vai para o log, para o time ver quanto a IA erra.
    await gravarLogCaique(registro('', 'gemini', 0, detalhe));
    return Response.json({ erro: ERROS[status] ?? ERROS[502] }, { status });
  }
}
