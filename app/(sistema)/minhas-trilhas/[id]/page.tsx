/* ============================================================================
   APP/(SISTEMA)/MINHAS-TRILHAS/[ID]/PAGE.TSX (DETALHE DA TRILHA, VISÃO DA PESSOA)
   O que é: uma trilha vista por quem a cumpre: alcance, prazo, progresso e a
     lista de etapas com o estado de cada uma (concluída, atual, bloqueada) e o
     motivo do bloqueio; botão "Começar"/"Continuar" (fixo no rodapé no celular).
   Onde é usado: rota /minhas-trilhas/[id]. Chegam aqui: os cards e o botão
     "Ver etapas" de app/(sistema)/minhas-trilhas/page.tsx.
   Depende de: next/navigation (useParams, useRouter, useSearchParams para o ?bloqueada=),
     lib/auth.tsx (useAuth), lib/store.tsx (useDados), lib/metricas.ts (trilhasDaPessoaDetalhadas),
     lib/trilhas.ts (ALCANCE, TIPOS_ETAPA, TENTATIVAS_PADRAO, hrefEtapa),
     components/trilhas/PrazoTrilha.tsx, components/button.tsx (classesBotao),
     components/ui/basicos.tsx e components/shell/Pagina.tsx.
   Contexto: §4 (o profissional vê progresso, próximo passo em destaque, etapa
     bloqueada explicada e prazo), §13 (acessível) e docs/notas-next16.md §2 (useParams).
   ============================================================================ */

// "use client": lê a sessão e a store, que só existem no navegador.
"use client";

import Link from 'next/link';
import { Suspense, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CircleCheck, Lock, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { trilhasDaPessoaDetalhadas } from '@/lib/metricas';
import { ALCANCE, TIPOS_ETAPA, TENTATIVAS_PADRAO, hrefEtapa } from '@/lib/trilhas';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { Card, Progresso, Esqueleto, Aviso } from '@/components/ui/basicos';
import { classesBotao } from '@/components/button';
import PrazoTrilha from '@/components/trilhas/PrazoTrilha';
import { cx } from '@/lib/utils';
import type { Etapa } from '@/lib/tipos';

/**
 * Detalhe de uma trilha para quem a cumpre.
 * Trilha fora do público da pessoa, em rascunho ou inexistente → /sem-permissao
 * (a mesma resposta para os três casos, para não revelar quais trilhas existem).
 * @returns a página, ou o esqueleto enquanto carrega/redireciona.
 */
export default function DetalheMinhaTrilha() {
  // Client Component não pode usar `await params`; useParams devolve o [id] pronto (notas-next16 §2).
  const { id } = useParams<{ id: string }>();
  const { sessao } = useAuth();
  const d = useDados();
  const router = useRouter();
  // A trilha só "existe" para a pessoa se estiver na lista dela (publicada e no público).
  const t = useMemo(
    () => (sessao && d.pronto ? trilhasDaPessoaDetalhadas(sessao.pessoaId, d).find((x) => x.trilha.id === id) : undefined),
    [sessao, d, id],
  );

  // Fora do público: manda para "sem permissão". Roda quando os dados terminam de carregar
  // ou a trilha muda; não há o que limpar.
  // NAVEGA: replace (e não push), para o "voltar" do navegador não cair de novo aqui.
  useEffect(() => {
    if (d.pronto && sessao && !t) router.replace('/sem-permissao');
  }, [d.pronto, sessao, t, router]);

  // Estado carregando (ou redirecionando): esqueleto no formato da tela.
  if (!t) {
    return (
      <div className="mx-auto max-w-[860px] p-4 sm:p-6 lg:p-8">
        <Esqueleto className="mb-2 h-4 w-32" /><Esqueleto className="mb-6 h-8 w-72 max-w-full" />
        <Esqueleto className="mb-6 h-24 w-full rounded-2xl" />
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-16 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  const { trilha } = t;
  const concluida = t.situacao === 'concluida';
  const etapaAtual = t.proximaEtapa !== null ? trilha.etapas[t.proximaEtapa] : undefined;
  // Botão principal: "Começar" se nada foi feito; "Continuar" se já começou; nada se concluiu.
  const rotuloBotao = t.concluidas === 0 ? 'Começar' : 'Continuar';

  return (
    // pb-28 no celular: espaço para a barra fixa do rodapé não cobrir a última etapa.
    <div className="mx-auto max-w-[860px] p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8">
      <CabecalhoPagina trilha={[{ rotulo: 'Minhas trilhas', href: '/minhas-trilhas' }]} titulo={trilha.titulo} descricao={trilha.descricao}
        acao={etapaAtual && (
          // No desktop o botão fica no cabeçalho; no celular ele vai para a barra fixa (abaixo).
          // NAVEGA: player na etapa atual (D03).
          <Link href={hrefEtapa(trilha.id, etapaAtual.id)} className={classesBotao({ className: 'hidden lg:inline-flex' })}>
            {rotuloBotao}<ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )} />

      {/* Resumo: alcance (cor + nome), prazo, nota e progresso. */}
      <Card className="mb-6 space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-superficie-alt px-2.5 py-0.5 text-[12px] font-semibold text-tinta-suave">
            <span className="h-2 w-2 rounded-full" style={{ background: ALCANCE[trilha.alcance].cor }} aria-hidden />
            {ALCANCE[trilha.alcance].rotulo}
          </span>
          <PrazoTrilha trilha={t} />
          {t.nota !== undefined && (
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-tinta"><Star className="h-3.5 w-3.5 text-aviso" aria-hidden />Nota do quiz: {t.nota}</span>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] text-tinta-suave">{t.concluidas} de {t.total} etapas concluídas</p>
          <Progresso valor={t.pct} tom={concluida ? 'sucesso' : 'primaria'} rotulo={`Progresso: ${t.concluidas} de ${t.total} etapas`} />
        </div>
      </Card>

      {/* Veio de uma etapa bloqueada aberta pela URL (o player manda para cá com ?bloqueada=).
        * ⚠️ ATENÇÃO: o <Suspense> é obrigatório para useSearchParams (notas-next16 §2). */}
      {etapaAtual && (
        <Suspense>
          <AvisoEtapaBloqueada etapas={trilha.etapas} etapaAtual={etapaAtual.titulo} />
        </Suspense>
      )}

      {concluida && (
        <div className="mb-6"><Aviso tipo="sucesso" titulo="Trilha concluída">Você terminou todas as etapas{t.nota !== undefined ? ` com nota ${t.nota} no quiz` : ''}. Pode rever qualquer etapa quando quiser.</Aviso></div>
      )}

      <h2 className="mb-3 font-space text-base font-semibold text-tinta">Etapas</h2>
      <ol className="space-y-2">
        {trilha.etapas.map((e, i) => {
          const { icone: Icone, rotulo } = TIPOS_ETAPA[e.tipo];
          // As etapas são feitas EM ORDEM: antes da atual = concluída; a atual; depois = bloqueada.
          const estado = i < t.concluidas ? 'concluida' : i === t.concluidas ? 'atual' : 'bloqueada';
          const tentativas = e.tentativasMax ?? TENTATIVAS_PADRAO;
          const detalheQuiz = e.tipo === 'quiz' ? ` · Nota mínima ${e.notaMinima}% · ${tentativas === 0 ? 'tentativas sem limite' : `${tentativas} tentativa${tentativas > 1 ? 's' : ''}`}` : '';
          const conteudo = (
            <>
              {/* Número/ícone de estado à esquerda: ✓ concluída, número na atual, cadeado na bloqueada. */}
              <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                estado === 'concluida' ? 'bg-sucesso/12 text-sucesso' : estado === 'atual' ? 'bg-primaria text-white' : 'bg-superficie-alt text-tinta-fraca')} aria-hidden>
                {estado === 'concluida' ? <CircleCheck className="h-5 w-5" /> : estado === 'bloqueada' ? <Lock className="h-4 w-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cx('text-sm font-semibold', estado === 'bloqueada' ? 'text-tinta-suave' : 'text-tinta')}>{e.titulo}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[12px] text-tinta-suave">
                  <Icone className="h-3.5 w-3.5" aria-hidden />{rotulo}{detalheQuiz}{!e.obrigatoria && ' · opcional'}
                </p>
                {/* Bloqueada EXPLICA o motivo (§4). Como as etapas são em ordem, quem trava é a etapa atual. */}
                {estado === 'bloqueada' && etapaAtual && (
                  <p className="mt-1 text-[12px] text-tinta-suave">Conclua “{etapaAtual.titulo}” para liberar</p>
                )}
              </div>
              {/* Estado também em texto (cor nunca sozinha). */}
              <span className={cx('shrink-0 text-[12px] font-semibold', estado === 'concluida' ? 'text-sucesso' : estado === 'atual' ? 'text-primaria' : 'text-tinta-fraca')}>
                {estado === 'concluida' ? 'Concluída' : estado === 'atual' ? 'Próxima' : 'Bloqueada'}
              </span>
            </>
          );
          const base = 'flex min-h-[44px] items-center gap-3 rounded-xl border p-3';
          return (
            <li key={e.id}>
              {estado === 'bloqueada' ? (
                // Bloqueada não é link: não dá para abrir ainda. aria-disabled + o texto explicam por quê.
                <div aria-disabled="true" className={cx(base, 'border-dashed border-borda bg-fundo/50')}>{conteudo}</div>
              ) : (
                // NAVEGA: abre a etapa no player (rever uma concluída ou fazer a atual).
                <Link href={hrefEtapa(trilha.id, e.id)} aria-current={estado === 'atual' ? 'step' : undefined}
                  className={cx(base, 'transition-colors hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60',
                    estado === 'atual' ? 'border-primaria/40 bg-primaria-suave/40' : 'border-borda bg-superficie')}>
                  {conteudo}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* Barra fixa do rodapé, só no celular/tablet (lg:hidden): botão principal sempre à mão.
        * pb com env(safe-area-inset-bottom): não fica atrás da barrinha de início do iPhone
        * (precisa do viewportFit: 'cover' de app/layout.tsx). h-12 = 48 px, acima dos 44 px de alvo de toque. */}
      {etapaAtual && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-superficie/95 px-4 pt-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          {/* Título da etapa numa linha própria (truncate): no botão, um título longo estouraria os 375 px. */}
          <p className="mb-2 truncate text-[12px] text-tinta-suave">Próxima etapa: <span className="font-semibold text-tinta">{etapaAtual.titulo}</span></p>
          {/* NAVEGA: player na etapa atual (D03). */}
          <Link href={hrefEtapa(trilha.id, etapaAtual.id)} className={classesBotao({ tamanho: 'lg', larguraTotal: true })}>
            {rotuloBotao}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Aviso de etapa bloqueada: aparece quando a pessoa tentou abrir, pela URL, uma etapa
 * adiante da atual (o player redireciona para cá com ?bloqueada=<etapaId>). Explica o motivo (§4).
 * Fica num componente separado porque useSearchParams precisa estar dentro de <Suspense>.
 * @param props.etapas as etapas da trilha (para achar o título da bloqueada).
 * @param props.etapaAtual título da etapa que a pessoa precisa concluir.
 * @returns o aviso, ou nada se a URL não tiver ?bloqueada= válido.
 */
function AvisoEtapaBloqueada({ etapas, etapaAtual }: { etapas: Etapa[]; etapaAtual: string }) {
  const idBloqueada = useSearchParams().get('bloqueada');
  const bloqueada = etapas.find((e) => e.id === idBloqueada);
  if (!bloqueada) return null;
  return (
    // role="alert": anuncia o motivo assim que a página abre (a pessoa foi trazida para cá sem pedir).
    <div className="mb-6" role="alert">
      <Aviso tipo="aviso" titulo={`A etapa “${bloqueada.titulo}” ainda está bloqueada`}>
        As etapas são feitas em ordem. Conclua “{etapaAtual}” para liberar as próximas.
      </Aviso>
    </div>
  );
}
