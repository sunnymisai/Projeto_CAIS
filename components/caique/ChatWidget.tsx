/* ============================================================================
   CHATWIDGET.TSX — O CHAT DO CAIQUE (BOTÃO FLUTUANTE + JANELA)
   O que é: o botão redondo no canto da tela e a janela de conversa do CAIQUE, com os quatro estados:
   vazio (boas-vindas e sugestões), carregando ("CAIQUE está digitando"), erro (com "Tentar de novo") e com conversa.
   As respostas vêm da rota /api/caique/chat (Gemini); sem a chave no servidor, ela devolve texto de demonstração.
   O CAIQUE só conversa sobre a trilha aberta (decisão do time, 17/11/2026): fora de uma trilha o campo fica travado.
   Onde é usado: app/(sistema)/layout.tsx (aparece em todas as telas internas).
   Depende de: lib/caique.ts, lib/store.tsx (useDados, para a trilha aberta), components/caique/ChatMensagem.tsx,
     lucide-react e next/navigation (usePathname).
   Contexto: §4 (trilhas), §13 (acessível); prompts I04 e I05 em docs/prompts.
   ============================================================================ */
"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CircleAlert, MessageCircle, RotateCw, Send, Sparkles, Trash2, X } from 'lucide-react';
import { useDados } from '@/lib/store';
import {
  LIMITE_PERGUNTA, enviarAvaliacao, historicoParaEnvio, idTrilhaDoCaminho, montarContextoTrilha,
  perguntarAoCaique, sugestoesCaique, validarPergunta, type MensagemCaique,
} from '@/lib/caique';
import { ChatMensagem } from './ChatMensagem';

/** Hora atual no formato HH:mm, para o carimbo das mensagens. */
const horaAgora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// [PV-1] OS TEXTOS DO CHAT: nome, boas-vindas, avisos e mensagens de erro. Troque o texto aqui, não no meio do JSX.
const COPY = {
  nome: 'CAIQUE',
  semTrilha: 'Assistente das trilhas',
  abrir: 'Abrir o chat do CAIQUE',
  fechar: 'Fechar o chat',
  limpar: 'Limpar conversa',
  boasVindas: 'Oi! Eu sou o CAIQUE.',
  boasVindasTexto: 'Tiro dúvidas sobre esta trilha. Escolha uma pergunta ou escreva a sua.',
  semTrilhaTexto: 'Abra uma trilha para conversar comigo. Eu tiro dúvidas sobre o conteúdo das etapas dela.',
  semTrilhaCampo: 'Abra uma trilha para perguntar.',
  aviso: 'O CAIQUE usa IA e pode errar. Confira no material da trilha.',
  avisoSimulado: 'Demonstração: a IA ainda não está ligada.',
  placeholder: 'Escreva a sua pergunta…',
  enviar: 'Enviar pergunta',
  digitando: 'CAIQUE está digitando…',
  erroTitulo: 'Não consegui responder agora.',
  erroTexto: 'Confira a sua conexão e tente de novo.',
  tentarDeNovo: 'Tentar de novo',
};

/**
 * O chat do CAIQUE.
 * Fica montado no layout das telas internas, então a conversa continua ao trocar de tela.
 * Se a tela aberta for uma trilha, as sugestões e a resposta falam dela.
 * @returns o botão flutuante e, quando aberto, a janela de conversa.
 */
export function ChatWidget() {
  const caminho = usePathname();
  const dados = useDados();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemCaique[]>([]);
  const [texto, setTexto] = useState('');
  // true enquanto a resposta não chegou (mostra "digitando" e trava o envio).
  const [enviando, setEnviando] = useState(false);
  // Pergunta que falhou, guardada para o "Tentar de novo". null = sem erro.
  const [falhou, setFalhou] = useState<string | null>(null);
  // Mensagem do servidor sobre a falha (ex.: "demorou demais"); null = usa o texto padrão.
  const [motivoFalha, setMotivoFalha] = useState<string | null>(null);
  // true quando a última resposta veio de demonstração (servidor sem chave do Gemini).
  const [simulada, setSimulada] = useState(false);
  // Erro de validação da pergunta (vazia ou grande demais), mostrado ao tentar enviar.
  const [erroCampo, setErroCampo] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const contador = useRef(0);

  // A trilha da tela aberta (se for uma trilha que existe); undefined nas outras telas.
  const idTrilha = idTrilhaDoCaminho(caminho);
  const trilha = idTrilha ? dados.trilhas.find((t) => t.id === idTrilha) : undefined;
  const tituloTrilha = trilha?.titulo;

  // De qual trilha é a conversa na tela. Quando a pessoa troca de trilha (ou sai dela), a conversa anterior
  // era sobre outro material, então recomeça. Trocar de etapa na mesma trilha mantém a conversa.
  // Ajuste durante a renderização (padrão do React para "resetar estado quando uma prop muda"), sem useEffect.
  const [trilhaDaConversa, setTrilhaDaConversa] = useState(trilha?.id);
  if (trilhaDaConversa !== trilha?.id) {
    setTrilhaDaConversa(trilha?.id);
    setMensagens([]);
    setFalhou(null);
    setMotivoFalha(null);
    setErroCampo(null);
  }

  // Roda quando chega mensagem ou muda "digitando/erro": leva a conversa ao fim. Sem limpeza.
  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' });
  }, [mensagens, enviando, falhou]);

  // Roda ao abrir a janela: põe o cursor no campo de texto. Sem limpeza.
  useEffect(() => {
    if (aberto) campoRef.current?.focus();
  }, [aberto]);

  /**
   * Envia uma pergunta ao CAIQUE e acrescenta a resposta à conversa.
   * @param pergunta - o texto a enviar (do campo, de uma sugestão ou do "Tentar de novo").
   * @param repetindo - true quando é o "Tentar de novo": a pergunta já está na conversa e não é duplicada.
   */
  // GRAVA: o estado do chat na tela (a conversa some ao recarregar a página) e, no servidor, uma linha de log.
  async function enviar(pergunta: string, repetindo = false) {
    // Enviar de novo enquanto espera duplicaria a pergunta; sem trilha não há sobre o que conversar.
    if (enviando || !trilha) return;
    const erro = validarPergunta(pergunta);
    setErroCampo(erro);
    if (erro) return;
    const limpa = pergunta.trim();
    setFalhou(null);
    setMotivoFalha(null);
    // O histórico é o que veio ANTES desta pergunta. No "Tentar de novo" a pergunta já é a última da lista, então sai do recorte.
    const anteriores = repetindo ? mensagens.slice(0, -1) : mensagens;
    if (!repetindo) {
      setMensagens((m) => [...m, { id: `m${++contador.current}`, papel: 'usuario', texto: limpa, hora: horaAgora() }]);
      setTexto('');
    }
    setEnviando(true);
    try {
      const resposta = await perguntarAoCaique(limpa, montarContextoTrilha(trilha), historicoParaEnvio(anteriores));
      setSimulada(resposta.simulada);
      setMensagens((m) => [...m, { id: `m${++contador.current}`, papel: 'caique', texto: resposta.texto, hora: horaAgora(), idResposta: resposta.id }]);
    } catch (e) {
      // Falha de rede, timeout ou limite da IA: guarda a pergunta para tentar de novo e mostra o motivo que o servidor deu.
      setFalhou(limpa);
      // "Falha 500" e erros de rede do navegador não ajudam a pessoa: nesses casos fica o texto padrão.
      const motivo = e instanceof Error && !/^Falha \d+$/.test(e.message) && e.name === 'Error' ? e.message : null;
      setMotivoFalha(motivo);
    } finally {
      setEnviando(false);
    }
  }

  /** Registra a avaliação de uma resposta (clicar de novo na mesma avaliação a desfaz). */
  // GRAVA: o estado do chat na tela e a avaliação no log do servidor (/api/caique/feedback).
  function avaliar(id: string, valor: 'util' | 'nao-util') {
    const alvo = mensagens.find((x) => x.id === id);
    if (!alvo) return;
    const novo = alvo.feedback === valor ? undefined : valor;
    setMensagens((m) => m.map((x) => (x.id === id ? { ...x, feedback: novo } : x)));
    if (alvo.idResposta) void enviarAvaliacao(alvo.idResposta, novo ?? null);
  }

  /** Apaga a conversa inteira e volta ao estado vazio. */
  // APAGA: remove todas as mensagens da tela (o log do servidor fica).
  function limpar() {
    setMensagens([]);
    setFalhou(null);
    setMotivoFalha(null);
    setErroCampo(null);
    setTexto('');
    campoRef.current?.focus();
  }

  // Botão flutuante: só aparece com a janela fechada. O z-50 fica acima do conteúdo e abaixo dos modais.
  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={COPY.abrir}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-botao text-sobre-cor shadow-card transition-colors hover:bg-botao-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
      >
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </button>
    );
  }

  const vazio = mensagens.length === 0 && !enviando && !falhou;

  return (
    // role="dialog" sem aria-modal: o chat não prende o foco, a pessoa continua usando a tela. Esc fecha.
    <section
      role="dialog"
      aria-label={`Conversa com o ${COPY.nome}`}
      onKeyDown={(e) => { if (e.key === 'Escape') setAberto(false); }}
      className="fixed bottom-4 right-4 z-50 flex h-[min(620px,calc(100dvh-2rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[20px] border border-borda bg-superficie shadow-card sm:bottom-6 sm:right-6"
    >
      {/* Cabeçalho: nome, contexto (a trilha aberta) e ações. */}
      <header className="flex items-center gap-3 border-b border-borda px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primaria-suave text-primaria">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-space text-base font-semibold leading-tight text-tinta">{COPY.nome}</h2>
          <p className="truncate text-xs text-tinta-suave">{tituloTrilha ?? COPY.semTrilha}</p>
        </div>
        <button type="button" onClick={limpar} disabled={mensagens.length === 0 && !falhou} aria-label={COPY.limpar}
          className="rounded-lg p-2 text-tinta-suave transition-colors hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 disabled:opacity-40">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setAberto(false)} aria-label={COPY.fechar}
          className="rounded-lg p-2 text-tinta-suave transition-colors hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      {/* Conversa. role="log" + aria-live: o leitor de tela anuncia cada resposta nova. Só esta área rola. */}
      <div className="rolagem flex-1 overflow-y-auto px-4 py-4">
        {vazio ? (
          // Estado VAZIO: explica o que o CAIQUE faz e oferece a próxima ação (perguntas prontas).
          <div className="flex h-full flex-col justify-center">
            <p className="font-space text-lg font-semibold text-tinta">{COPY.boasVindas}</p>
            {/* Sem trilha aberta não há sugestão (sugestoesCaique devolve []): só a orientação de abrir uma. */}
            <p className="mt-1 text-sm text-tinta-suave">{trilha ? COPY.boasVindasTexto : COPY.semTrilhaTexto}</p>
            <div className="mt-4 flex flex-col gap-2">
              {sugestoesCaique(tituloTrilha).map((s) => (
                <button key={s} type="button" onClick={() => enviar(s)}
                  className="rounded-xl border border-borda bg-superficie px-3.5 py-2.5 text-left text-sm text-tinta transition-colors hover:border-primaria/50 hover:bg-primaria-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul role="log" aria-live="polite" aria-label="Mensagens da conversa" className="flex flex-col gap-3">
            {mensagens.map((m) => <ChatMensagem key={m.id} mensagem={m} aoAvaliar={avaliar} />)}
            {/* Estado CARREGANDO: três pontinhos pulsando; o texto é para o leitor de tela. */}
            {enviando && (
              <li className="flex items-center gap-2 text-xs text-tinta-suave" role="status">
                <span className="flex gap-1" aria-hidden="true">
                  {[0, 150, 300].map((d) => <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-primaria" style={{ animationDelay: `${d}ms` }} />)}
                </span>
                {COPY.digitando}
              </li>
            )}
          </ul>
        )}
        {/* Estado ERRO: diz o que houve e oferece tentar de novo (a pergunta não se perde). */}
        {falhou && (
          <div role="alert" className="mt-3 flex items-start gap-2.5 rounded-xl border border-erro/30 bg-erro/10 px-3.5 py-3 text-sm text-erro">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">{COPY.erroTitulo}</p>
              <p>{motivoFalha ?? COPY.erroTexto}</p>
              <button type="button" onClick={() => enviar(falhou, true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-erro/40 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-erro/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erro/50">
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                {COPY.tentarDeNovo}
              </button>
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {/* Campo de envio. Enter envia; Shift+Enter quebra a linha. */}
      <form
        onSubmit={(e) => { e.preventDefault(); void enviar(texto); }}
        className="border-t border-borda px-3 pb-3 pt-2.5"
      >
        {erroCampo && <p role="alert" className="mb-1.5 text-xs text-erro">{erroCampo}</p>}
        <div className="flex items-end gap-2">
          <label htmlFor="caique-pergunta" className="sr-only">Sua pergunta para o CAIQUE</label>
          <textarea
            id="caique-pergunta"
            ref={campoRef}
            value={texto}
            rows={2}
            maxLength={LIMITE_PERGUNTA + 50}
            disabled={!trilha}
            placeholder={trilha ? COPY.placeholder : COPY.semTrilhaCampo}
            onChange={(e) => { setTexto(e.target.value); if (erroCampo) setErroCampo(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void enviar(texto); } }}
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-borda bg-fundo px-3 py-2.5 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-2 focus:ring-primaria/25 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button type="submit" disabled={enviando || !trilha} aria-label={COPY.enviar}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-botao text-sobre-cor transition-colors hover:bg-botao-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 disabled:opacity-50">
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {/* Aviso: deixa claro quando a IA está desligada (resposta de demonstração) e, com ela ligada, que pode errar. */}
        <p className="mt-1.5 text-[11px] text-tinta-suave">{simulada ? COPY.avisoSimulado : COPY.aviso}</p>
      </form>
    </section>
  );
}
