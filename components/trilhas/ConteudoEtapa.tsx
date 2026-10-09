/* ============================================================================
   CONTEUDOETAPA.TSX
   O que é: mostra o conteúdo de uma etapa conforme o tipo: texto em parágrafos,
     vídeo e áudio com o player nativo do navegador, e PDF/apresentação/link como
     um cartão "Abrir em nova aba". Sem endereço, avisa que é conteúdo de demonstração;
     se o vídeo/áudio não carregar, mostra o erro e o link.
   Onde é usado: app/(sistema)/minhas-trilhas/[id]/etapa/[etapaId]/page.tsx (player).
   Depende de: lib/tipos.ts (Etapa), lib/trilhas.ts (TIPOS_ETAPA), components/button.tsx
     (classesBotao), components/ui/basicos.tsx (Aviso) e lucide-react.
   Contexto: §4 (etapa contém conteúdo: texto, vídeo, PDF, áudio, apresentação, link externo).
   ============================================================================ */
"use client";

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Etapa } from '@/lib/tipos';
import { TIPOS_ETAPA } from '@/lib/trilhas';
import { classesBotao } from '@/components/button';
import { Aviso } from '@/components/ui/basicos';

/**
 * Texto corrido: cada linha em branco separa um parágrafo.
 * @param props.texto o texto da etapa.
 * @returns os parágrafos (ou nada, se o texto estiver vazio).
 */
function Paragrafos({ texto }: { texto?: string }) {
  if (!texto?.trim()) return null;
  return (
    // max-w-prose: linhas de leitura confortável (~65 caracteres) no desktop.
    <div className="max-w-prose space-y-3 text-[15px] leading-relaxed text-tinta">
      {texto.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

/**
 * Link "Abrir em nova aba".
 * rel="noopener noreferrer": a página aberta não consegue controlar esta aba nem saber de onde veio.
 * @param props.url endereço.
 * @param props.rotulo texto do link.
 * @returns o link com cara de botão.
 */
function AbrirEmNovaAba({ url, rotulo = 'Abrir em nova aba' }: { url: string; rotulo?: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={classesBotao({ variante: 'secundario', className: 'w-full sm:w-auto' })}>
      <ExternalLink className="h-4 w-4" aria-hidden />{rotulo}
      {/* Aviso para o leitor de tela: o link sai desta aba. */}
      <span className="sr-only">(abre em nova aba)</span>
    </a>
  );
}

// [PV-1] O CONTEÚDO DE CADA TIPO DE ETAPA: texto e quiz mostram só os parágrafos; vídeo e áudio usam o player do navegador (com aviso se o arquivo não carregar); PDF, apresentação e link externo viram um cartão com "Abrir em nova aba".
/**
 * Conteúdo de uma etapa (o quiz em si fica em QuizEtapa; aqui só a instrução dele).
 * @param props.etapa a etapa.
 * @returns o conteúdo conforme o tipo.
 * @example <ConteudoEtapa etapa={etapa} />
 */
export default function ConteudoEtapa({ etapa }: { etapa: Etapa }) {
  // true quando o <video>/<audio> avisou que não conseguiu carregar o arquivo.
  const [falhouMidia, setFalhouMidia] = useState(false);
  const texto = etapa.conteudo?.texto;
  const url = etapa.conteudo?.url?.trim();
  const { icone: Icone, rotulo } = TIPOS_ETAPA[etapa.tipo];

  // Texto e quiz: só os parágrafos (no quiz, é a instrução).
  if (etapa.tipo === 'texto' || etapa.tipo === 'quiz') {
    // [PV-2] O AVISO DE ETAPA DE TEXTO SEM TEXTO ("Conteúdo de demonstração"): no protótipo a pessoa pode concluir a etapa mesmo assim.
    // Etapa de texto sem texto: estado vazio explicado.
    if (etapa.tipo === 'texto' && !texto?.trim()) return <Aviso tipo="info" titulo="Conteúdo de demonstração">Esta etapa ainda não tem texto. No protótipo, você pode marcá-la como concluída para seguir.</Aviso>;
    return <Paragrafos texto={texto} />;
  }

  // Vídeo e áudio: player nativo (controles do próprio navegador, acessíveis pelo teclado).
  if (etapa.tipo === 'video' || etapa.tipo === 'audio') {
    return (
      <div className="space-y-4">
        {!url ? (
          // Sem endereço: o protótipo não tem o arquivo; explica em vez de mostrar um player quebrado.
          <Aviso tipo="info" titulo="Conteúdo de demonstração">No protótipo, esta etapa não tem {etapa.tipo === 'video' ? 'vídeo' : 'áudio'}. Leia a descrição e marque como concluída para seguir.</Aviso>
        ) : falhouMidia ? (
          // Estado de erro: diz o que houve e oferece outro caminho.
          <Aviso tipo="erro" titulo={`Não foi possível carregar o ${etapa.tipo === 'video' ? 'vídeo' : 'áudio'}`}
            acao={<AbrirEmNovaAba url={url} />}>
            O arquivo não respondeu (no protótipo, os endereços são de exemplo). Tente abrir em nova aba.
          </Aviso>
        ) : etapa.tipo === 'video' ? (
          // aspect-video: 16:9 em qualquer largura; preload="metadata" não baixa o vídeo antes do play (§13).
          <video controls preload="metadata" src={url} onError={() => setFalhouMidia(true)}
            className="aspect-video w-full rounded-2xl bg-noite" aria-label={`Vídeo: ${etapa.titulo}`} />
        ) : (
          <audio controls preload="metadata" src={url} onError={() => setFalhouMidia(true)} className="w-full" aria-label={`Áudio: ${etapa.titulo}`} />
        )}
        <Paragrafos texto={texto} />
      </div>
    );
  }

  // PDF, apresentação e link externo: cartão com o tipo, a descrição e "Abrir em nova aba".
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie-alt p-4 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primaria-suave text-primaria"><Icone className="h-6 w-6" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-tinta">{rotulo}</p>
          {/* break-all: endereço longo quebra em vez de empurrar a tela para o lado no celular. */}
          <p className="mt-0.5 break-all text-[13px] text-tinta-suave">{url || 'Conteúdo de demonstração: no protótipo, esta etapa não tem arquivo.'}</p>
        </div>
        {url && <AbrirEmNovaAba url={url} />}
      </div>
      <Paragrafos texto={texto} />
    </div>
  );
}
