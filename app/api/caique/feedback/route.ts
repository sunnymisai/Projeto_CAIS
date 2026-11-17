/* ============================================================================
   APP/API/CAIQUE/FEEDBACK/ROUTE.TS — ROTA DA AVALIAÇÃO DO CAIQUE (POST /api/caique/feedback)
   O que é: recebe o 👍/👎 de uma resposta e registra no log, para o time medir a qualidade da IA.
   Onde é usado: lib/caique.ts (enviarAvaliacao), chamado por components/caique/ChatWidget.tsx.
   Depende de: lib/caique-logger.ts e lib/caique-protecao.ts.
   Contexto: prompts I03 e I08 em docs/prompts.
   ============================================================================ */

import { gravarLogCaique } from '@/lib/caique-logger';
import { origemPermitida } from '@/lib/caique-protecao';

/**
 * POST /api/caique/feedback
 * @param request - corpo { id, avaliacao } com avaliacao 'util', 'nao-util' ou null (desfez).
 * @returns { ok: true }, ou { erro } com 400 (pedido inválido) ou 403 (outro site).
 */
export async function POST(request: Request) {
  if (!origemPermitida(request)) return Response.json({ erro: 'Origem não permitida.' }, { status: 403 });

  const corpo = (await request.json().catch(() => null)) as { id?: unknown; avaliacao?: unknown } | null;
  const id = corpo?.id;
  const avaliacao = corpo?.avaliacao;
  // O id vem da rota do chat (UUID); a avaliação só pode ser um dos três valores.
  if (typeof id !== 'string' || !id || id.length > 100) return Response.json({ erro: 'Resposta inválida.' }, { status: 400 });
  if (avaliacao !== 'util' && avaliacao !== 'nao-util' && avaliacao !== null) {
    return Response.json({ erro: 'Avaliação inválida.' }, { status: 400 });
  }

  // GRAVA: uma linha de avaliação em logs/caique-<data>.jsonl (a última avaliação de um id é a que vale).
  await gravarLogCaique({ tipo: 'avaliacao', id, quando: new Date().toISOString(), avaliacao });
  return Response.json({ ok: true });
}
