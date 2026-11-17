/* ============================================================================
   CAIQUE-LOGGER.TS — REGISTRO DAS PERGUNTAS, RESPOSTAS E AVALIAÇÕES DO CAIQUE
   O que é: grava em logs/caique-AAAA-MM-DD.jsonl uma linha por pergunta respondida e uma por avaliação (👍/👎).
     JSONL = um JSON por linha: só acrescenta no fim do arquivo, então duas gravações ao mesmo tempo não se apagam.
   Onde é usado: app/api/caique/chat/route.ts e app/api/caique/feedback/route.ts.
   Depende de: fs e path do Node (só roda no servidor).
   Contexto: prompts I03 (logger) e I08 (analytics) em docs/prompts.
   ============================================================================ */

import 'server-only';
import { promises as fs } from 'fs';
import { join } from 'path';

/** Uma pergunta respondida (ou que falhou). */
export interface LogPergunta {
  tipo: 'pergunta';
  /** Id da resposta, o mesmo que o navegador usa para mandar a avaliação. */
  id: string;
  quando: string;
  trilhaId: string;
  trilhaTitulo: string;
  pergunta: string;
  resposta: string;
  /** 'gemini' = IA de verdade; 'simulada' = sem GEMINI_API_KEY. */
  origem: 'gemini' | 'simulada';
  tempoMs: number;
  tokens: number;
  erro: string | null;
}

/** Uma avaliação dada a uma resposta. null = a pessoa desfez a avaliação. */
export interface LogAvaliacao {
  tipo: 'avaliacao';
  id: string;
  quando: string;
  avaliacao: 'util' | 'nao-util' | null;
}

// [PV-1] ONDE OS LOGS FICAM: a pasta logs/ na raiz do projeto (fora do Git, veja o .gitignore).
// ⚠️ ATENÇÃO: em hospedagem sem disco gravável (ex.: Vercel) a gravação falha em silêncio; em produção, troque por um banco.
const PASTA_LOGS = join(process.cwd(), 'logs');

/**
 * Acrescenta um registro ao arquivo do dia.
 * Nunca lança erro: falhar ao registrar não pode impedir a pessoa de receber a resposta.
 * @param registro - a pergunta ou a avaliação.
 */
// GRAVA: uma linha no fim de logs/caique-<data>.jsonl.
export async function gravarLogCaique(registro: LogPergunta | LogAvaliacao): Promise<void> {
  try {
    await fs.mkdir(PASTA_LOGS, { recursive: true });
    const dia = registro.quando.slice(0, 10);
    await fs.appendFile(join(PASTA_LOGS, `caique-${dia}.jsonl`), `${JSON.stringify(registro)}\n`, 'utf-8');
  } catch (erro) {
    console.error('[CAIQUE] Não consegui gravar o log:', erro);
  }
}
