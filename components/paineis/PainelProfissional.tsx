/* ============================================================================
   COMPONENTS/PAINEIS/PAINELPROFISSIONAL.TSX (PAINEL DO PROFISSIONAL)
   O que é: o painel do perfil Profissional com os quatro blocos do §6: minhas
     trilhas e progresso, minhas tarefas e prazos, minha carga da semana e meu
     histórico de entregas; saudação com o primeiro nome e a data de hoje.
   Onde é usado: app/(sistema)/painel/page.tsx, quando o perfil da sessão é profissional.
   Depende de: lib/auth.tsx (useAuth), lib/store.tsx (useDados), lib/escopo.ts
     (tarefasVisiveis), lib/metricas.ts (trilhasDaPessoaDetalhadas, agruparMinhasTarefas,
     entregasPorSemana), lib/carga.ts (linhaDoTempo: semáforo de carga), lib/trilhas.ts (TIPOS_ETAPA, hrefEtapa),
     components/trilhas/PrazoTrilha.tsx, components/paineis/Bloco.tsx, components/ui/ (basicos, Graficos, Semaforo),
     components/button.tsx (classesBotao) e components/shell/Pagina.tsx e components/ui/FiltroPeriodo.tsx (filtro e período da URL, G01).
   Contexto: §6 (Dashboards: painel do profissional), §3 (funciona no celular) e §13 (quatro estados).
   ============================================================================ */
"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, BookOpenCheck, CalendarDays, CircleAlert, Clock, Gauge, ListTodo, PackageCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { tarefasVisiveis } from '@/lib/escopo';
import { agruparMinhasTarefas, entregasPorSemana, trilhasDaPessoaDetalhadas } from '@/lib/metricas';
import { linhaDoTempo, segundaDaSemana, ROTULO_NIVEL } from '@/lib/carga';
import { IndicadorCarga, LinhaDeSemanas } from '@/components/ui/Semaforo';
import { TIPOS_ETAPA, hrefEtapa } from '@/lib/trilhas';
import type { Tarefa } from '@/lib/tipos';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { EstadoVazio, Progresso } from '@/components/ui/basicos';
import Bloco, { VerTodas } from './Bloco';
import { Colunas, COR_GRAFICO } from '@/components/ui/Graficos';
import { classesBotao } from '@/components/button';
import PrazoTrilha from '@/components/trilhas/PrazoTrilha';
import { cx, dataBR, dataCurta, diasEntre, hojeISO } from '@/lib/utils';
import FiltroPeriodo, { usePeriodo } from '@/components/ui/FiltroPeriodo';

/**
 * Painel do Profissional. Uma coluna no celular; grade de duas colunas a partir de 1024 px.
 * Os números vêm das MESMAS funções de /minhas-trilhas e /minhas-tarefas, então batem com elas.
 * @returns o painel.
 */
export default function PainelProfissional() {
  const { sessao } = useAuth();
  const d = useDados();
  // Período do histórico de entregas (G01): vem da URL (?de=&ate=) para o link poder ser compartilhado.
  const { periodo, definir } = usePeriodo();
  const pessoaId = sessao?.pessoaId ?? '';
  const pronto = d.pronto && !!sessao;
  const estado = !pronto ? 'carregando' : d.pessoa(pessoaId) ? 'pronto' : 'erro';

  // Recalcula só quando os dados ou a pessoa mudam.
  const trilhas = useMemo(() => (pronto ? trilhasDaPessoaDetalhadas(pessoaId, d) : []), [pronto, pessoaId, d]);
  const grupos = useMemo(() => {
    const minhas = pronto ? tarefasVisiveis(sessao!, d).filter((t) => t.responsavelId === pessoaId) : [];
    return agruparMinhasTarefas(minhas, d.projetos);
  }, [pronto, sessao, pessoaId, d]);
  // Semáforo de carga (F04): as próximas 8 semanas a partir da atual; a primeira é "esta semana".
  const semanasCarga = useMemo(() => {
    const p = pronto ? d.pessoa(pessoaId) : undefined;
    return p ? linhaDoTempo(p, segundaDaSemana(hojeISO()), 8, d) : [];
  }, [pronto, pessoaId, d]);
  const estaSemana = semanasCarga[0];
  const limite = d.pessoa(pessoaId)?.cargaMax ?? 40;
  // Semanas do período escolhido (G01), com só as entregas dentro dele.
  const entregas = useMemo(() => (pronto ? entregasPorSemana(pessoaId, d, 8, hojeISO(), periodo) : []), [pronto, pessoaId, d, periodo]);

  // Saudação: primeiro nome e a data por extenso ("quarta-feira, 7 de outubro de 2026").
  const primeiroNome = sessao?.nome.split(' ')[0] ?? '';
  const hojeExtenso = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(hojeISO() + 'T12:00:00'));

  // ---- Bloco 1: trilhas ----
  const concluidas = trilhas.filter((t) => t.situacao === 'concluida').length;
  const emAndamento = trilhas.length - concluidas;
  const perto = trilhas.filter((t) => t.situacaoPrazo === 'perto').length;
  const vencidas = trilhas.filter((t) => t.situacaoPrazo === 'vencido').length;
  const atual = trilhas.find((t) => t.situacao !== 'concluida');
  const etapaAtual = atual && atual.proximaEtapa !== null ? atual.trilha.etapas[atual.proximaEtapa] : undefined;

  // ---- Bloco 2: as 5 próximas tarefas abertas, na ordem da tela de tarefas ----
  const abertas: Tarefa[] = [...grupos.atrasadas, ...grupos.hoje, ...grupos.semana, ...grupos.depois];
  const proximas = abertas.slice(0, 5);

  // ---- Bloco 4: resumo em texto do gráfico ----
  const totalEntregas = entregas.reduce((s, e) => s + e.valor, 0);
  const melhor = { valor: Math.max(0, ...entregas.map((e) => e.valor)) };

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo={`Olá, ${primeiroNome}`} descricao={<span className="first-letter:uppercase">{hojeExtenso}</span>} />

      {/* Filtro de período (G01, §10: acima do conteúdo): muda o histórico de entregas. */}
      <div className="mb-4"><FiltroPeriodo periodo={periodo} onChange={definir} /></div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1) Minhas trilhas e meu progresso */}
        <Bloco titulo="Minhas trilhas e meu progresso" estado={estado} acao={<VerTodas href="/minhas-trilhas" />}>
          {trilhas.length === 0 ? (
            <EstadoVazio icone={<BookOpenCheck className="h-6 w-6" aria-hidden />} titulo="Nenhuma trilha atribuída a você ainda." descricao="Quando o administrador publicar uma trilha para você, ela aparece aqui." />
          ) : (
            <div className="space-y-4">
              {/* Três números (e o vencido, quando houver), sempre com rótulo escrito. */}
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-superficie-alt p-3"><dt className="text-[12px] text-tinta-suave">Concluídas</dt><dd className="font-space text-2xl font-semibold text-sucesso">{concluidas}</dd></div>
                <div className="rounded-xl bg-superficie-alt p-3"><dt className="text-[12px] text-tinta-suave">Em andamento</dt><dd className="font-space text-2xl font-semibold text-primaria">{emAndamento}</dd></div>
                <div className="rounded-xl bg-superficie-alt p-3"><dt className="text-[12px] text-tinta-suave">Prazo perto</dt><dd className={cx('font-space text-2xl font-semibold', perto ? 'text-aviso' : 'text-tinta')}>{perto}</dd></div>
              </dl>
              {vencidas > 0 && <p className="flex items-center gap-1.5 text-[13px] font-semibold text-erro"><CircleAlert className="h-4 w-4" aria-hidden />{vencidas} trilha{vencidas > 1 ? 's' : ''} com prazo vencido</p>}
              {atual && etapaAtual ? (
                // Próxima etapa em destaque (§4) com o botão que abre o player.
                <div className="rounded-xl border border-primaria/30 bg-primaria-suave/40 p-3">
                  <p className="text-[12px] font-semibold text-primaria">Próxima etapa</p>
                  <p className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-tinta">
                    {(() => { const I = TIPOS_ETAPA[etapaAtual.tipo].icone; return <I className="h-4 w-4 shrink-0 text-primaria" aria-hidden />; })()}
                    <span className="truncate">{etapaAtual.titulo}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-tinta-suave">{atual.trilha.titulo} · {atual.concluidas} de {atual.total} etapas</p>
                  <div className="mt-2"><Progresso valor={atual.pct} fino rotulo={`Progresso em ${atual.trilha.titulo}`} /></div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {/* NAVEGA: player na próxima etapa. */}
                    <Link href={hrefEtapa(atual.trilha.id, etapaAtual.id)} className={classesBotao({ className: 'w-full sm:w-auto' })}>
                      {atual.concluidas === 0 ? 'Começar' : 'Continuar'}<ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                    <PrazoTrilha trilha={atual} />
                  </div>
                </div>
              ) : <p className="text-sm text-sucesso">Você está em dia com todas as trilhas.</p>}
            </div>
          )}
        </Bloco>

        {/* 2) Minhas tarefas e meus prazos */}
        <Bloco titulo="Minhas tarefas e meus prazos" estado={estado} acao={<VerTodas href="/minhas-tarefas" />}>
          {abertas.length === 0 ? (
            <EstadoVazio icone={<ListTodo className="h-6 w-6" aria-hidden />} titulo="Nenhuma tarefa aberta. Bom trabalho!" descricao="As tarefas atribuídas a você nos projetos aparecem aqui pelo prazo." />
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] text-tinta-suave">
                {abertas.length} aberta{abertas.length > 1 ? 's' : ''}
                {grupos.atrasadas.length > 0 && <> · <span className="font-semibold text-erro">{grupos.atrasadas.length} atrasada{grupos.atrasadas.length > 1 ? 's' : ''}</span></>}
                {grupos.hoje.length > 0 && <> · <span className="font-semibold text-aviso">{grupos.hoje.length} para hoje</span></>}
              </p>
              <ul className="space-y-2">
                {proximas.map((t) => {
                  const faltam = diasEntre(hojeISO(), t.prazo);
                  const prazo = faltam < 0 ? { texto: `Atrasada há ${-faltam} dia${faltam < -1 ? 's' : ''}`, cls: 'text-erro font-semibold', I: CircleAlert }
                    : faltam === 0 ? { texto: 'Vence hoje', cls: 'text-aviso font-semibold', I: Clock }
                    : { texto: faltam === 1 ? 'Amanhã' : dataCurta(t.prazo), cls: 'text-tinta-suave', I: CalendarDays };
                  return (
                    <li key={t.id}>
                      {/* NAVEGA: abre a tarefa por cima de Minhas tarefas. */}
                      <Link href={`/minhas-tarefas?tarefa=${t.id}`} className="flex min-h-[44px] flex-col justify-center rounded-xl border border-borda px-3 py-2 hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
                        <span className="truncate text-sm font-semibold text-tinta">{t.titulo}</span>
                        <span className="mt-0.5 flex flex-wrap gap-x-3 text-[12px] text-tinta-suave">
                          <span className={cx('inline-flex items-center gap-1', prazo.cls)}><prazo.I className="h-3.5 w-3.5" aria-hidden />{prazo.texto}</span>
                          <span>{d.projeto(t.projetoId)?.nome}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Bloco>

        {/* 3) Minha carga da semana: semáforo (F04, lib/carga.ts). O nível desta semana vem do dia mais
          * cheio; a linha mostra as próximas 8 semanas; a lista quebra esta semana por projeto. */}
        <Bloco titulo="Minha carga da semana" estado={estado}>
          {semanasCarga.every((s) => s.porProjeto.length === 0) ? (
            <EstadoVazio icone={<Gauge className="h-6 w-6" aria-hidden />} titulo="Sem alocação nas próximas semanas" descricao="Quando você for alocado num projeto, a sua carga semana a semana aparece aqui." />
          ) : (
            <div className="space-y-4">
              {estaSemana && (
                <div className="flex flex-wrap items-center gap-3">
                  <IndicadorCarga nivel={estaSemana.nivel} pct={estaSemana.pct} rotulo={`Esta semana: ${Math.round(estaSemana.pct)}%, ${ROTULO_NIVEL[estaSemana.nivel].toLowerCase()}`} />
                  <span className="text-sm text-tinta-suave">dia mais cheio: {Math.round((estaSemana.pct * limite) / 100)} h de {limite} h por semana</span>
                </div>
              )}
              <div>
                <p className="mb-1.5 text-[12px] font-semibold text-tinta-suave">Próximas 8 semanas</p>
                <LinhaDeSemanas rotulo="Minha carga nas próximas 8 semanas" semanas={semanasCarga.map((s) => ({ segunda: s.segunda, pct: s.pct, nivel: s.nivel }))} />
              </div>
              {estaSemana && estaSemana.porProjeto.length > 0 && (
                <ul className="divide-y divide-borda">
                  {estaSemana.porProjeto.map((parte) => {
                    const projeto = d.projeto(parte.projetoId);
                    const aloc = d.alocacoes.find((a) => a.id === parte.alocacaoId);
                    return (
                      <li key={parte.alocacaoId} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="min-w-0"><span className="block truncate font-semibold text-tinta">{projeto?.nome ?? 'Projeto removido'}</span><span className="text-[12px] text-tinta-suave">{parte.papel}{aloc ? ` · até ${dataCurta(aloc.fim)}` : ''}{parte.diasAtivos < 5 ? ` · ${parte.diasAtivos} dia${parte.diasAtivos > 1 ? 's' : ''} nesta semana` : ''}</span></span>
                        <span className="shrink-0 font-semibold text-tinta">{parte.carga} h/sem</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </Bloco>

        {/* 4) Meu histórico de entregas */}
        <Bloco titulo="Meu histórico de entregas" estado={estado}>
          {totalEntregas === 0 ? (
            <EstadoVazio icone={<PackageCheck className="h-6 w-6" aria-hidden />} titulo="Nenhuma entrega no período" descricao={`De ${dataBR(periodo.de)} a ${dataBR(periodo.ate)}, nenhuma tarefa sua chegou em Pronto. Escolha um período maior.`} />
          ) : (
            <div className="space-y-3">
              {/* Gráfico (role="img" com aria-label) + o mesmo resumo em texto visível. */}
              <Colunas altura={110} itens={entregas.map((e) => ({ rotulo: e.rotulo, valor: e.valor, cor: COR_GRAFICO.concluida }))} />
              <p className="text-[13px] text-tinta-suave">
                {totalEntregas} entrega{totalEntregas > 1 ? 's' : ''} de {dataBR(periodo.de)} a {dataBR(periodo.ate)}, no máximo {melhor.valor} por semana.
              </p>
            </div>
          )}
        </Bloco>
      </div>
    </div>
  );
}
