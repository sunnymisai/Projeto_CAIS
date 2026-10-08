/* ============================================================================
   COMPONENTS/PAINEIS/PAINELEMPRESA.TSX (PAINEL DA EMPRESA)
   O que é: o painel do perfil Empresa com os quatro blocos do §6: andamento dos
     projetos próprios, quem está alocado e em quê (com período, sem horas), entregas
     aprovadas × aguardando revisão por projeto e o progresso da trilha do time.
     O cabeçalho mostra o nome fantasia e o status da empresa no programa.
   Onde é usado: app/(sistema)/painel/page.tsx, quando o perfil da sessão é empresa.
   Depende de: lib/auth.tsx (useAuth), lib/store.tsx (useDados), lib/escopo.ts
     (projetosVisiveis, tarefasVisiveis, alocacoesVisiveis), lib/metricas.ts
     (progressoProjeto, entregasDoProjeto, resumoTrilha, rótulos de status de projeto e de empresa), components/paineis/Bloco.tsx,
     components/ui/ (basicos, Graficos) e components/shell/Pagina.tsx.
   Contexto: §3 (empresa: "entra, entende, sai"), §6 (painel da empresa) e §13 (quatro estados).
   ============================================================================ */
"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { BookOpenCheck, CircleAlert, FolderKanban, PackageCheck, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { alocacoesVisiveis, projetosVisiveis, tarefasVisiveis } from '@/lib/escopo';
import { entregasDoProjeto, progressoProjeto, resumoTrilha, ROTULO_STATUS_EMPRESA, ROTULO_STATUS_PROJETO, TOM_STATUS_EMPRESA, TOM_STATUS_PROJETO } from '@/lib/metricas';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { Avatar, EstadoVazio, Etiqueta, Progresso } from '@/components/ui/basicos';
import { BarraEmpilhada, Legenda, COR_GRAFICO } from '@/components/ui/Graficos';
import Bloco, { VerTodas } from './Bloco';
import { dataCurta, hojeISO } from '@/lib/utils';

/**
 * Painel da Empresa. Uma coluna no celular; grade de duas colunas a partir de 1024 px.
 * Tudo passa pelo escopo (lib/escopo.ts): a empresa só vê os próprios projetos e quem está neles.
 * @returns o painel.
 */
export default function PainelEmpresa() {
  const { sessao } = useAuth();
  const d = useDados();
  const pronto = d.pronto && !!sessao;
  const pessoa = pronto ? d.pessoa(sessao!.pessoaId) : undefined;
  const estado = !pronto ? 'carregando' : pessoa ? 'pronto' : 'erro';
  const empresa = pessoa?.empresaId ? d.empresa(pessoa.empresaId) : undefined;

  // Recalcula só quando os dados ou a sessão mudam.
  const projetos = useMemo(() => (pronto ? projetosVisiveis(sessao!, d) : []), [pronto, sessao, d]);
  const tarefas = useMemo(() => (pronto ? tarefasVisiveis(sessao!, d) : []), [pronto, sessao, d]);
  const alocacoes = useMemo(() => (pronto ? alocacoesVisiveis(sessao!, d) : []), [pronto, sessao, d]);

  // Entregas: "feita" = está na última coluna do projeto (mesma regra do quadro).
  // TODO(PROGLOGIC): o deck fala em "entregas aprovadas"; hoje não há aprovação, então Pronto conta como entregue.
  const ultimaColuna = (projetoId: string) => { const p = d.projeto(projetoId); return p?.colunas[p.colunas.length - 1]?.id; };
  // Últimas entregas: as aprovadas mais recentes primeiro (concluidaEm; sem ela, o prazo).
  const feitas = tarefas.filter((t) => t.colunaId === ultimaColuna(t.projetoId))
    .sort((a, b) => (b.concluidaEm ?? b.prazo).localeCompare(a.concluidaEm ?? a.prazo));

  // Trilhas da empresa (alcance "empresa", publicadas): o progresso do time dela (§6).
  const trilhasDaEmpresa = pronto && pessoa?.empresaId
    ? d.trilhas.filter((t) => t.status === 'publicada' && t.alcance === 'empresa' && t.empresaId === pessoa.empresaId)
    : [];

  const primeiroNome = sessao?.nome.split(' ')[0] ?? '';

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
      {/* Cabeçalho: a empresa da sessão é o assunto do painel (nome fantasia + status no programa, §11).
        * Sem empresa encontrada (carregando ou cadastro sem vínculo), cai no "Olá" com o nome da pessoa. */}
      <CabecalhoPagina
        titulo={empresa
          ? <span className="flex flex-wrap items-center gap-3">{empresa.nomeFantasia}<Etiqueta tom={TOM_STATUS_EMPRESA[empresa.status]} ponto>{ROTULO_STATUS_EMPRESA[empresa.status]}</Etiqueta></span>
          : `Olá, ${primeiroNome}`}
        descricao={empresa ? `Olá, ${primeiroNome}. Veja como estão os projetos da ${empresa.nomeFantasia} no programa.` : 'Como estão os projetos da sua empresa no programa.'} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1) Andamento dos projetos próprios */}
        <Bloco titulo="Andamento dos projetos" estado={estado} acao={<VerTodas href="/projetos" rotulo="Ver projetos" />}>
          {projetos.length === 0 ? (
            <EstadoVazio icone={<FolderKanban className="h-6 w-6" aria-hidden />} titulo="Nenhum projeto da sua empresa ainda" descricao="Quando a coordenação cadastrar um projeto para vocês, o andamento aparece aqui." />
          ) : (
            <ul className="space-y-3">
              {projetos.map((p) => {
                const pr = progressoProjeto(p.id, d);
                return (
                  <li key={p.id}>
                    {/* NAVEGA: ficha do projeto (quadro). */}
                    <Link href={`/projetos/${p.id}`} className="block rounded-xl border border-borda p-3 hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-tinta">{p.nome}</span>
                        <Etiqueta tom={TOM_STATUS_PROJETO[p.status]}>{ROTULO_STATUS_PROJETO[p.status]}</Etiqueta>
                      </span>
                      <span className="mt-2 block"><Progresso valor={pr.pct} fino rotulo={`Andamento de ${p.nome}: ${Math.round(pr.pct)}%`} /></span>
                      <span className="mt-1.5 flex flex-wrap gap-x-3 text-[12px] text-tinta-suave">
                        {/* O % também em texto: a barra sozinha não diz o número para quem bate o olho. */}
                        <span className="font-semibold text-tinta">{Math.round(pr.pct)}% pronto</span>
                        <span>{pr.prontas} de {pr.total} tarefas prontas</span>
                        <span>Entrega {dataCurta(p.entrega)}</span>
                        {pr.atrasadas > 0 && <span className="inline-flex items-center gap-1 font-semibold text-erro"><CircleAlert className="h-3.5 w-3.5" aria-hidden />{pr.atrasadas} atrasada{pr.atrasadas > 1 ? 's' : ''}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Bloco>

        {/* 2) Quem está alocado e em quê: pessoa, papel, projeto e período.
          * PRIVACIDADE (decisão do E01): a empresa NÃO vê a carga em horas nem os outros projetos
          * da pessoa. Esses dados mostram quanto ela trabalha para OUTROS clientes do programa.
          * alocacoesVisiveis (lib/escopo.ts) já traz só as alocações dos projetos desta empresa;
          * aqui também não mostramos as horas (a.carga), que só o admin vê (Equipe e /carga).
          * TODO(PROGLOGIC): confirmar se a empresa pode ver ao menos as horas no projeto dela. */}
        <Bloco titulo="Quem está no time" estado={estado}>
          {alocacoes.length === 0 ? (
            <EstadoVazio icone={<Users className="h-6 w-6" aria-hidden />} titulo="Ninguém alocado ainda" descricao="Quando a coordenação alocar profissionais nos seus projetos, eles aparecem aqui com o papel." />
          ) : (
            <ul className="divide-y divide-borda">
              {alocacoes.map((a) => {
                const p = d.pessoa(a.pessoaId);
                if (!p) return null;
                return (
                  <li key={a.id} className="flex items-center gap-3 py-2">
                    <Avatar nome={p.nome} tamanho={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-tinta">{p.nome}</span>
                      <span className="block truncate text-[12px] text-tinta-suave">{a.papel} · {d.projeto(a.projetoId)?.nome}</span>
                    </span>
                    {/* Período da alocação; quem ainda não começou ganha o "a partir de" para não parecer que já está no time. */}
                    <span className="shrink-0 text-right text-[12px] text-tinta-suave">
                      {a.inicio > hojeISO() ? <>A partir de {dataCurta(a.inicio)}</> : <>{dataCurta(a.inicio)} a {dataCurta(a.fim)}</>}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Bloco>

        {/* 3) Entregas por projeto: aprovadas (última coluna) × aguardando revisão (penúltima), §6.
          * A conta fica em entregasDoProjeto (lib/metricas.ts). Vazio quando nenhum projeto tem tarefa
          * (ex.: a Aurora, com o projeto ainda planejado). */}
        <Bloco titulo="Entregas" estado={estado}>
          {tarefas.length === 0 ? (
            <EstadoVazio icone={<PackageCheck className="h-6 w-6" aria-hidden />} titulo="Nenhuma entrega ainda" descricao="Quando o time começar as tarefas dos seus projetos, você vê aqui o que já foi aprovado e o que está aguardando revisão." />
          ) : (
            <div className="space-y-4">
              <ul className="space-y-4">
                {projetos.map((p) => {
                  const e = entregasDoProjeto(p.id, d);
                  // Barra: aprovadas (verde), em revisão (âmbar) e o resto ainda em produção (cinza).
                  const seg = [
                    { rotulo: 'Aprovadas', valor: e.aprovadas, cor: COR_GRAFICO.concluida },
                    ...(e.temRevisao ? [{ rotulo: 'Aguardando revisão', valor: e.revisao, cor: COR_GRAFICO.revisao }] : []),
                    { rotulo: 'Em produção', valor: e.emProducao, cor: COR_GRAFICO.naoIniciada },
                  ];
                  return (
                    <li key={p.id} className="space-y-2">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                        <span className="font-semibold text-tinta">{p.nome}</span>
                        <span className="text-[12px] text-tinta-suave">{e.total} tarefa{e.total !== 1 ? 's' : ''}</span>
                      </p>
                      {/* Projeto sem tarefas no meio de outros: uma linha explicando, sem barra vazia. */}
                      {e.total === 0 ? <p className="text-[12px] text-tinta-suave">Ainda sem tarefas: o projeto não começou.</p> : (
                        <>
                          {/* Barra (role="img" com resumo) + legenda com os números em texto. */}
                          <BarraEmpilhada segmentos={seg} />
                          <Legenda itens={seg} />
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
              {feitas.length > 0 && (
                <>
                  <p className="text-[12px] font-semibold text-tinta-suave">Últimas entregas</p>
                  <ul className="space-y-1.5">
                    {feitas.slice(0, 4).map((t) => (
                      <li key={t.id}>
                        {/* NAVEGA: abre a tarefa por cima do quadro do projeto. */}
                        <Link href={`/projetos/${t.projetoId}?tarefa=${t.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
                          <span className="min-w-0 truncate text-tinta">{t.titulo}</span>
                          <span className="shrink-0 text-[12px] text-tinta-suave">{t.concluidaEm ? dataCurta(t.concluidaEm) : '—'}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </Bloco>

        {/* 4) Progresso da trilha do time */}
        <Bloco titulo="Trilha do time" estado={estado} acao={<VerTodas href="/minhas-trilhas" rotulo="Minha trilha" />}>
          {trilhasDaEmpresa.length === 0 ? (
            <EstadoVazio icone={<BookOpenCheck className="h-6 w-6" aria-hidden />} titulo="Nenhuma trilha da sua empresa publicada" descricao="Quando a coordenação publicar a trilha com as regras da sua empresa, o progresso do time aparece aqui." />
          ) : (
            <ul className="space-y-4">
              {trilhasDaEmpresa.map((t) => {
                const r = resumoTrilha(t, d);
                const seg = [
                  { rotulo: 'Concluíram', valor: r.concluida, cor: COR_GRAFICO.concluida },
                  { rotulo: 'Em andamento', valor: r.andamento, cor: COR_GRAFICO.andamento },
                  { rotulo: 'Não iniciaram', valor: r.nao_iniciada, cor: COR_GRAFICO.naoIniciada },
                ];
                return (
                  <li key={t.id} className="space-y-2">
                    <p className="text-sm font-semibold text-tinta">{t.titulo} <span className="font-normal text-tinta-suave">· {r.publico} pessoa{r.publico !== 1 ? 's' : ''}</span></p>
                    {/* Barra (role="img" com resumo) + legenda com os números em texto. */}
                    <BarraEmpilhada segmentos={seg} />
                    <Legenda itens={seg} />
                  </li>
                );
              })}
            </ul>
          )}
        </Bloco>
      </div>
    </div>
  );
}
