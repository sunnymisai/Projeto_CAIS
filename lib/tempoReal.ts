/* ============================================================================
   TEMPO REAL (CANAL DE EVENTOS DO QUADRO)
   O que é: a camada de "tempo real" do quadro (§5: "tempo real via WebSocket
     quando um colega move um cartão"). Define o contrato CanalTempoReal e uma
     implementação SIMULADA que conversa entre abas do MESMO navegador.
   Onde é usado: lib/store.tsx (publica depois de cada mudança de tarefa e assina
     para recarregar os dados quando outra aba muda algo) e, pelo `eventoExterno`
     da store, components/projetos/Quadro.tsx (destaque e aviso "Ana moveu...").
   Depende de: BroadcastChannel do navegador (sem bibliotecas).
   Contexto: §5 (tempo real no quadro) e §7 (WebSocket e back-end são da PROGLOGIC).

   COMO TROCAR PELO WEBSOCKET DE VERDADE
   O resto do sistema só conhece a interface CanalTempoReal (publicar e assinar).
   Para ligar à API, escreva outra função com a mesma interface, por exemplo:

     export function criarCanalWebSocket(url: string): CanalTempoReal {
       const ws = new WebSocket(url);                       // TODO(API): url e autenticação da PROGLOGIC
       return {
         publicar: (e) => ws.send(JSON.stringify(e)),       // ou nem publicar: o back-end avisa sozinho
         assinar: (cb) => { const f = (m: MessageEvent) => cb(JSON.parse(m.data)); ws.addEventListener('message', f); return () => ws.removeEventListener('message', f); },
       };
     }

   e troque a linha de `canalTempoReal()` lá embaixo. Com o back-end real, quem
   recebe o evento busca a tarefa na API (em vez de reler o localStorage).
   ============================================================================ */

/** Tipos de evento que o quadro entende. */
export type TipoEvento = 'tarefa_movida' | 'tarefa_salva' | 'tarefa_removida' | 'comentario_novo';

/** Um evento de tempo real: o que mudou, em qual tarefa e quem mudou. */
export interface EventoTempoReal {
  tipo: TipoEvento;
  projetoId: string;
  tarefaId: string;
  /** Título da tarefa (para o aviso "Ana moveu 'Tela de login' para Revisão"). */
  titulo: string;
  /** Coluna de destino, quando a tarefa foi movida. */
  colunaId?: string;
  /** Quem fez a mudança (nome para o aviso; id para não avisar a própria pessoa). */
  autorId?: string;
  autorNome?: string;
  /** Aba que publicou: quem recebe ignora os próprios eventos (evita laço). Preenchido pelo canal. */
  origem?: string;
}

/**
 * O contrato do canal: a mesma interface vale para o simulado e para o WebSocket.
 * - publicar: manda o evento para as outras abas (ou para o servidor).
 * - assinar: chama `callback` a cada evento de OUTRA origem; devolve a função que cancela.
 */
export interface CanalTempoReal {
  publicar: (evento: EventoTempoReal) => void;
  assinar: (callback: (evento: EventoTempoReal) => void) => () => void;
}

/** Nome do canal entre abas (todas as abas do CAIS no mesmo navegador escutam este nome). */
const NOME_CANAL = 'cais-tempo-real';

/**
 * Canal SIMULADO entre abas do mesmo navegador, com BroadcastChannel.
 * Cada aba ganha uma `origem` aleatória; o BroadcastChannel já não entrega a mensagem para
 * quem mandou, e a checagem da origem é uma segunda trava contra laço.
 * Sem BroadcastChannel (servidor, navegador antigo), devolve um canal que não faz nada.
 * @returns o canal.
 * @example const cancelar = criarCanalSimulado().assinar((e) => console.info(e.tipo));
 */
// SIMULADO: só funciona entre abas do mesmo navegador. TODO(API): trocar por criarCanalWebSocket (ver cabeçalho).
export function criarCanalSimulado(): CanalTempoReal {
  if (typeof BroadcastChannel === 'undefined') return { publicar: () => {}, assinar: () => () => {} };
  const origem = Math.random().toString(36).slice(2);
  const canal = new BroadcastChannel(NOME_CANAL);
  return {
    publicar: (evento) => canal.postMessage({ ...evento, origem }),
    assinar: (callback) => {
      /** Repassa só os eventos de outra aba. */
      const ouvir = (m: MessageEvent<EventoTempoReal>) => { if (m.data?.origem !== origem) callback(m.data); };
      canal.addEventListener('message', ouvir);
      return () => canal.removeEventListener('message', ouvir);
    },
  };
}

/** O canal da aba, criado na primeira vez que alguém pede (um por aba). */
let unico: CanalTempoReal | null = null;

/**
 * O canal de tempo real em uso no app (o simulado, por enquanto).
 * @returns o canal único da aba.
 */
export function canalTempoReal(): CanalTempoReal {
  if (!unico) unico = criarCanalSimulado();
  return unico;
}
