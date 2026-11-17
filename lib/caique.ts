/* ============================================================================
   CAIQUE.TS — REGRAS DO ASSISTENTE CAIQUE (LADO DO NAVEGADOR + VALIDAÇÃO COMPARTILHADA)
   O que é: funções do chat do CAIQUE: de qual trilha o chat está falando, quais perguntas sugerir,
     se a pergunta é válida, o contexto da trilha enviado à IA, a validação do pedido (usada também
     pela rota do servidor) e as chamadas às rotas /api/caique/chat e /api/caique/feedback.
   Onde é usado: components/caique/ChatWidget.tsx, as rotas app/api/caique/chat e /feedback, lib/caique-servidor.ts
     e lib/caique.casos.ts.
   Depende de: lib/tipos.ts (só o tipo Trilha). Sem React e sem segredos: roda no navegador, no servidor e no Node.
   Contexto: §4 (trilhas); prompts I01 a I05 em docs/prompts.
   ============================================================================ */

import type { Trilha } from './tipos';

/** Uma mensagem do chat. */
export interface MensagemCaique {
  id: string;
  /** Quem escreveu: a pessoa ou o CAIQUE. */
  papel: 'usuario' | 'caique';
  texto: string;
  /** Hora de envio (HH:mm), só para exibir. */
  hora: string;
  /** Só nas respostas do CAIQUE: o que a pessoa achou. undefined = ainda não avaliou. */
  feedback?: 'util' | 'nao-util';
  /** Só nas respostas do CAIQUE: o id que o servidor deu à resposta (usado para mandar a avaliação). */
  idResposta?: string;
}

/** Uma etapa da trilha, do jeito que vai para a IA (sem perguntas nem respostas de quiz). */
export interface EtapaContextoCaique {
  titulo: string;
  tipo: string;
  obrigatoria: boolean;
  texto?: string;
  url?: string;
}

/** O que a IA sabe da trilha aberta. Montado no navegador porque as trilhas ainda moram lá (lib/store.tsx). */
export interface ContextoTrilhaCaique {
  id: string;
  titulo: string;
  descricao: string;
  prazoDias: number;
  etapas: EtapaContextoCaique[];
}

/** Uma mensagem anterior da conversa, no formato enviado à rota. */
export interface TurnoHistorico {
  papel: 'usuario' | 'caique';
  texto: string;
}

/** O corpo do POST /api/caique/chat. */
export interface PedidoCaique {
  pergunta: string;
  trilha: ContextoTrilhaCaique;
  historico: TurnoHistorico[];
}

/** A resposta de sucesso do POST /api/caique/chat. */
export interface RespostaCaique {
  /** Id da resposta, para a avaliação 👍/👎. */
  id: string;
  texto: string;
  /** true = a IA está desligada (sem GEMINI_API_KEY) e o texto é de demonstração. */
  simulada: boolean;
}

// [PV-1] O TAMANHO MÁXIMO da pergunta (em caracteres). O limite protege o custo da IA.
export const LIMITE_PERGUNTA = 500;

// [PV-2] QUANTO DA CONVERSA E DA TRILHA vai para a IA: mensagens anteriores, texto por etapa e número de etapas.
// Mais contexto = respostas melhores, porém mais caras e mais lentas.
export const LIMITE_HISTORICO = 10;
export const LIMITE_TEXTO_ETAPA = 4000;
export const LIMITE_ETAPAS = 40;

/**
 * Descobre de qual trilha a tela aberta fala.
 * @param caminho - a rota atual (usePathname).
 * @returns o id da trilha em /trilhas/<id> ou /minhas-trilhas/<id> (inclusive nas etapas); undefined nas outras telas.
 * @example idTrilhaDoCaminho('/minhas-trilhas/t1/etapa/e2') // 't1'
 */
export function idTrilhaDoCaminho(caminho: string): string | undefined {
  const [, raiz, id] = caminho.split('/');
  return (raiz === 'trilhas' || raiz === 'minhas-trilhas') && id ? id : undefined;
}

/**
 * Perguntas prontas mostradas no chat vazio.
 * Decisão do time (17/11/2026): o CAIQUE só fala da trilha aberta, então sem trilha não há sugestão.
 * @param tituloTrilha - título da trilha aberta, se houver.
 * @returns 4 sugestões sobre a trilha; lista vazia fora de uma trilha.
 */
// [PV-3] AS PERGUNTAS SUGERIDAS do chat vazio (só aparecem com uma trilha aberta). Troque o texto aqui.
export function sugestoesCaique(tituloTrilha?: string): string[] {
  if (!tituloTrilha) return [];
  return [`Do que trata a trilha "${tituloTrilha}"?`, 'Qual é a próxima etapa?', 'Como funciona o quiz?', 'Quanto tempo tenho para concluir?'];
}

/**
 * Confere a pergunta antes de enviar.
 * @param texto - o que a pessoa digitou.
 * @returns a mensagem de erro, ou null se está válida.
 * @example validarPergunta('   ') // 'Escreva a sua pergunta.'
 */
export function validarPergunta(texto: string): string | null {
  const limpo = texto.trim();
  if (!limpo) return 'Escreva a sua pergunta.';
  if (limpo.length > LIMITE_PERGUNTA) return `A pergunta passou de ${LIMITE_PERGUNTA} caracteres. Resuma e envie de novo.`;
  return null;
}

/**
 * Monta o contexto da trilha que vai para a IA.
 * Quiz entra só com título e tipo: perguntas e respostas certas NUNCA saem do navegador.
 * @param trilha - a trilha aberta (de useDados()).
 * @returns o contexto já cortado em LIMITE_ETAPAS e LIMITE_TEXTO_ETAPA.
 */
export function montarContextoTrilha(trilha: Trilha): ContextoTrilhaCaique {
  return {
    id: trilha.id,
    titulo: trilha.titulo,
    descricao: trilha.descricao ?? '',
    prazoDias: trilha.prazoDias ?? 0,
    etapas: trilha.etapas.slice(0, LIMITE_ETAPAS).map((e) => ({
      titulo: e.titulo,
      tipo: e.tipo,
      obrigatoria: e.obrigatoria,
      // ⚠️ ATENÇÃO: não acrescente e.perguntas aqui; o CAIQUE passaria a "colar" o quiz.
      texto: e.tipo === 'quiz' ? undefined : e.conteudo?.texto?.slice(0, LIMITE_TEXTO_ETAPA),
      url: e.conteudo?.url,
    })),
  };
}

/**
 * Recorta a conversa para enviar junto com a pergunta nova.
 * @param mensagens - todas as mensagens da tela.
 * @returns as últimas LIMITE_HISTORICO mensagens, só com papel e texto.
 */
export function historicoParaEnvio(mensagens: MensagemCaique[]): TurnoHistorico[] {
  return mensagens.slice(-LIMITE_HISTORICO).map((m) => ({ papel: m.papel, texto: m.texto }));
}

/** Confere se é texto com até `max` caracteres. */
const textoAte = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;

/**
 * Confere o corpo do POST /api/caique/chat. A rota usa esta função: nada vindo do navegador é confiável.
 * @param corpo - o JSON recebido.
 * @returns o pedido tipado, ou a mensagem de erro (em português) para devolver com status 400.
 * @example validarPedido({ pergunta: '' }) // { erro: 'Escreva a sua pergunta.' }
 */
export function validarPedido(corpo: unknown): { pedido: PedidoCaique } | { erro: string } {
  if (!corpo || typeof corpo !== 'object') return { erro: 'Pedido inválido.' };
  const { pergunta, trilha, historico } = corpo as Record<string, unknown>;

  if (typeof pergunta !== 'string') return { erro: 'Escreva a sua pergunta.' };
  const erroPergunta = validarPergunta(pergunta);
  if (erroPergunta) return { erro: erroPergunta };

  // Sem trilha não há conversa: o CAIQUE só responde sobre a trilha aberta.
  if (!trilha || typeof trilha !== 'object') return { erro: 'Abra uma trilha para conversar com o CAIQUE.' };
  const t = trilha as Record<string, unknown>;
  if (!textoAte(t.id, 100) || !textoAte(t.titulo, 300) || !t.titulo.trim()) return { erro: 'Trilha inválida.' };
  if (!textoAte(t.descricao ?? '', 4000)) return { erro: 'Trilha inválida.' };
  if (!Array.isArray(t.etapas) || t.etapas.length > LIMITE_ETAPAS) return { erro: 'Trilha inválida.' };
  const etapasOk = t.etapas.every((e) => {
    const x = e as Record<string, unknown>;
    return x && textoAte(x.titulo, 300) && textoAte(x.tipo, 30)
      && (x.texto === undefined || textoAte(x.texto, LIMITE_TEXTO_ETAPA))
      && (x.url === undefined || textoAte(x.url, 2000));
  });
  if (!etapasOk) return { erro: 'Trilha inválida.' };

  const hist = historico ?? [];
  if (!Array.isArray(hist) || hist.length > LIMITE_HISTORICO) return { erro: 'Histórico inválido.' };
  const histOk = hist.every((m) => {
    const x = m as Record<string, unknown>;
    return x && (x.papel === 'usuario' || x.papel === 'caique') && textoAte(x.texto, 6000);
  });
  if (!histOk) return { erro: 'Histórico inválido.' };

  return {
    pedido: {
      pergunta: pergunta.trim(),
      trilha: {
        id: t.id,
        titulo: t.titulo,
        descricao: (t.descricao as string | undefined) ?? '',
        prazoDias: typeof t.prazoDias === 'number' && t.prazoDias >= 0 ? t.prazoDias : 0,
        etapas: (t.etapas as Record<string, unknown>[]).map((e) => ({
          titulo: e.titulo as string,
          tipo: e.tipo as string,
          obrigatoria: e.obrigatoria === true,
          texto: e.texto as string | undefined,
          url: e.url as string | undefined,
        })),
      },
      historico: hist as TurnoHistorico[],
    },
  };
}

/**
 * Monta a resposta de DEMONSTRAÇÃO, usada pela rota quando não há GEMINI_API_KEY.
 * @param pergunta - a pergunta já validada.
 * @param tituloTrilha - título da trilha aberta.
 * @returns um texto que deixa claro que a IA ainda não está ligada.
 */
// SIMULADO: só enquanto a chave do Gemini não estiver no .env.local.
export function montarRespostaSimulada(pergunta: string, tituloTrilha: string): string {
  return `Esta é uma resposta de demonstração sobre a trilha "${tituloTrilha}". Você perguntou: "${pergunta.trim()}". A IA ainda não está ligada: falta a chave do Gemini no servidor.`;
}

// [PV-4] O TEMPO MÁXIMO que o navegador espera a rota (ms). Fica acima do timeout do Gemini (GEMINI_TIMEOUT_MS, 8 s).
const TIMEOUT_NAVEGADOR_MS = 15000;

/**
 * Pede a resposta ao CAIQUE pela rota do servidor (é ela que guarda a chave do Gemini).
 * @param pergunta - a pergunta já validada.
 * @param trilha - o contexto da trilha aberta (montarContextoTrilha).
 * @param historico - as mensagens anteriores (historicoParaEnvio).
 * @returns a resposta com o id para avaliação.
 * @throws Error com a mensagem do servidor (falha de rede, timeout, limite da IA): o widget mostra o estado de erro.
 */
// TODO(API): quando a PROGLOGIC tiver sessão no servidor, a rota passa a saber quem pergunta e a conferir a empresa.
export async function perguntarAoCaique(pergunta: string, trilha: ContextoTrilhaCaique, historico: TurnoHistorico[]): Promise<RespostaCaique> {
  const r = await fetch('/api/caique/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pergunta, trilha, historico } satisfies PedidoCaique),
    signal: AbortSignal.timeout(TIMEOUT_NAVEGADOR_MS),
  });
  const dados = (await r.json().catch(() => ({}))) as Partial<RespostaCaique> & { erro?: string };
  if (!r.ok || !dados.texto || !dados.id) throw new Error(dados.erro ?? `Falha ${r.status}`);
  return { id: dados.id, texto: dados.texto, simulada: Boolean(dados.simulada) };
}

/**
 * Manda a avaliação 👍/👎 de uma resposta. Não lança erro: a avaliação já aparece na tela e perder o registro não atrapalha a pessoa.
 * @param idResposta - o id que a rota do chat devolveu.
 * @param avaliacao - 'util', 'nao-util' ou null (a pessoa desfez).
 */
// GRAVA: uma linha no log do servidor (logs/caique-<data>.jsonl).
export async function enviarAvaliacao(idResposta: string, avaliacao: 'util' | 'nao-util' | null): Promise<void> {
  try {
    await fetch('/api/caique/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idResposta, avaliacao }),
    });
  } catch {
    // Sem rede: a avaliação fica só na tela.
  }
}
