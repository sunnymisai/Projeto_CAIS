/* ============================================================================
   COMPONENTS/PAINEIS/PAINELEMPRESA.TSX (PAINEL DA EMPRESA)
   O que é: o painel do perfil Empresa com os quatro blocos do §6: andamento dos
     projetos próprios, quem está alocado e em quê (com período e as horas por semana no projeto
     dela), entregas aprovadas pela empresa × aguardando a aprovação dela por projeto e o progresso
     da trilha do time.
     O cabeçalho mostra o nome fantasia e o status da empresa no programa.
   Onde é usado: app/(sistema)/painel/page.tsx, quando o perfil da sessão é empresa.
   Depende de: lib/auth.tsx (useAuth), lib/store.tsx (useDados), lib/escopo.ts
     (projetosVisiveis, tarefasVisiveis, alocacoesVisiveis), lib/metricas.ts
     (progressoProjeto, entregasDoProjeto, resumoTrilha, rótulos de status de projeto e de empresa), components/paineis/Bloco.tsx,
     components/ui/ (basicos, Graficos) e components/shell/Pagina.tsx e components/ui/FiltroPeriodo.tsx (filtro e período da URL, G01).
   Contexto: §3 (empresa: "entra, entende, sai"), §6 (painel da empresa) e §13 (quatro estados).
   ============================================================================ */
"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { BookOpenCheck, CircleAlert, FolderKanban, PackageCheck, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { alocacoesVisiveis, projetosVisiveis, tarefasVisiveis } from '@/lib/escopo';
import { aprovadasNoPeriodo, colunaAceitaAprovacao, dentroDoPeriodo, entregasDoProjeto, progressoProjeto, resumoTrilha, ROTULO_STATUS_EMPRESA, ROTULO_STATUS_PROJETO, TOM_STATUS_EMPRESA, TOM_STATUS_PROJETO } from '@/lib/metricas';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { Avatar, EstadoVazio, Etiqueta, Progresso } from '@/components/ui/basicos';
import { BarraEmpilhada, Legenda, COR_GRAFICO } from '@/components/ui/Graficos';
import Bloco, { VerTodas } from './Bloco';
import { dataBR, dataCurta, hojeISO } from '@/lib/utils';
import FiltroPeriodo, { usePeriodo } from '@/components/ui/FiltroPeriodo';

/**
 * Painel da Empresa. Uma coluna no celular; grade de duas colunas a partir de 1024 px.
 * Tudo passa pelo escopo (lib/escopo.ts): a empresa só vê os próprios projetos e quem está neles.
 * @returns o painel.
 */
export default function PainelEmpresa() {
  const { sessao } = useAuth();
  const d = useDados();
  // Período das entregas aprovadas (G01): vem da URL (?de=&ate=) para o link poder ser compartilhado.
  const { periodo, definir } = usePeriodo();
  const pronto = d.pronto && !!sessao;
  const pessoa = pronto ? d.pessoa(sessao!.pessoaId) : undefined;
  const estado = !pronto ? 'carregando' : pessoa ? 'pronto' : 'erro';
  const empresa = pessoa?.empresaId ? d.empresa(pessoa.empresaId) : undefined;

  // Recalcula só quando os dados ou a sessão mudam.
  const projetos = useMemo(() => (pronto ? projetosVisiveis(sessao!, d) : []), [pronto, sessao, d]);
  const tarefas = useMemo(() => (pronto ? tarefasVisiveis(sessao!, d) : []), [pronto, sessao, d]);
  const alocacoes = useMemo(() => (pronto ? alocacoesVisiveis(sessao!, d) : []), [pronto, sessao, d]);

  // [PV-1] O QUE É ENTREGUE E APROVADA (decisão da PROGLOGIC, 09/10/2026): entregue = tarefa em Revisão ou Pronto; aprovada = a empresa registrou a aprovação no detalhe da tarefa.
  // Entregas: a EMPRESA aprova (decisão da PROGLOGIC, 09/10/2026). "Entregue" = tarefa em Revisão ou Pronto
  // (colunaAceitaAprovacao); "aprovada" = a empresa registrou aprovadaEm no detalhe da tarefa.
  const entregues = tarefas.filter((t) => colunaAceitaAprovacao(d.projeto(t.projetoId), t.colunaId));
  // Aguardando a aprovação DESTA empresa: a bola está com ela, então vem em destaque no bloco.
  const aguardando = entregues.filter((t) => !t.aprovadaEm).sort((a, b) => a.prazo.localeCompare(b.prazo));
  // [PV-2] AS ÚLTIMAS ENTREGAS do período: aprovadas com data dentro do filtro, as mais recentes primeiro.
  // Últimas entregas DO PERÍODO (G01): aprovadas com aprovadaEm dentro do período, as mais recentes primeiro.
  const feitas = entregues.filter((t) => !!t.aprovadaEm && dentroDoPeriodo(t.aprovadaEm, periodo))
    .sort((a, b) => b.aprovadaEm!.localeCompare(a.aprovadaEm!));

  // [PV-3] QUAIS TRILHAS aparecem em "Trilha do time": só as publicadas, com alcance "empresa" e da empresa desta pessoa.
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

      {/* Filtro de período (G01, §10: acima do conteúdo): muda as entregas aprovadas no período. */}
      <div className="mb-4"><FiltroPeriodo periodo={periodo} onChange={definir} /></div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* [PV-4] O ANDAMENTO dos projetos da empresa: percentual pronto, tarefas prontas e atrasadas (progressoProjeto, lib/metricas.ts). Cada linha leva à ficha do projeto. */}
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

        {/* [PV-5] AS HORAS DO TIME: a empresa vê as horas semanais de cada pessoa NO PROJETO DELA (decisão da PROGLOGIC, 09/10/2026), nunca a soma nem os outros projetos da pessoa. O recorte vem de alocacoesVisiveis (lib/escopo.ts). */}
        {/* 2) Quem está alocado e em quê: pessoa, papel, projeto, período e as horas por semana.
          * DECISÃO DA PROGLOGIC (09/10/2026): a empresa aloca o time nos projetos dela, então vê as horas
          * semanais de cada pessoa NO PROJETO DELA (a.carga). PRIVACIDADE que continua: ela não vê os
          * outros projetos da pessoa nem a soma das horas (são de outros clientes); alocacoesVisiveis
          * (lib/escopo.ts) já traz só as alocações dos projetos desta empresa. */}
        <Bloco titulo="Quem está no time" estado={estado} acao={<VerTodas href="/projetos" rotulo="Gerenciar equipes" />}>
          {alocacoes.length === 0 ? (
            <EstadoVazio icone={<Users className="h-6 w-6" aria-hidden />} titulo="Ninguém alocado ainda" descricao="Abra um projeto, vá na aba Equipe e aloque os profissionais. Eles aparecem aqui com o papel e as horas." />
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
                      <span className="block font-semibold tabular-nums text-tinta">{a.carga} h/sem</span>
                      {a.inicio > hojeISO() ? <>A partir de {dataCurta(a.inicio)}</> : <>{dataCurta(a.inicio)} a {dataCurta(a.fim)}</>}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Bloco>

        {/* [PV-6] AS ENTREGAS por projeto: aprovadas × aguardando a aprovação da empresa × em produção (entregasDoProjeto), a lista "Aguardando a sua aprovação" (até 4) e as últimas entregas do período (até 4). */}
        {/* 3) Entregas por projeto: aprovadas pela empresa × aguardando a aprovação dela × em produção, §6.
          * A conta fica em entregasDoProjeto (lib/metricas.ts); a empresa aprova no detalhe da tarefa.
          * Vazio quando nenhum projeto tem tarefa (ex.: a Aurora, com o projeto ainda planejado). */}
        <Bloco titulo="Entregas" estado={estado}>
          {tarefas.length === 0 ? (
            <EstadoVazio icone={<PackageCheck className="h-6 w-6" aria-hidden />} titulo="Nenhuma entrega ainda" descricao="Quando o time começar as tarefas dos seus projetos, você vê aqui o que já foi aprovado e o que está esperando a sua aprovação." />
          ) : (
            <div className="space-y-4">
              <ul className="space-y-4">
                {projetos.map((p) => {
                  const e = entregasDoProjeto(p.id, d);
                  // Barra: aprovadas (verde), aguardando a aprovação da empresa (âmbar) e o resto ainda em produção (cinza).
                  const seg = [
                    { rotulo: 'Aprovadas', valor: e.aprovadas, cor: COR_GRAFICO.concluida },
                    { rotulo: 'Aguardando sua aprovação', valor: e.aguardando, cor: COR_GRAFICO.revisao },
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
                      {/* Aprovadas no período escolhido (o resto da linha é a situação de hoje). */}
                      {e.total > 0 && <p className="text-[12px] text-tinta-suave"><strong className="font-semibold text-sucesso">{aprovadasNoPeriodo(p.id, d, periodo)}</strong> aprovada{aprovadasNoPeriodo(p.id, d, periodo) !== 1 ? 's' : ''} de {dataBR(periodo.de)} a {dataBR(periodo.ate)}</p>}
                    </li>
                  );
                })}
              </ul>
              {/* Aguardando a sua aprovação: o que a empresa precisa fazer. Cada linha abre a tarefa, onde ela aprova. */}
              {aguardando.length > 0 && (
                <div>
                  <p className="text-[12px] font-semibold text-aviso">Aguardando a sua aprovação · {aguardando.length}</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {aguardando.slice(0, 4).map((t) => (
                      <li key={t.id}>
                        {/* NAVEGA: abre a tarefa por cima do quadro; lá fica o botão "Aprovar entrega". */}
                        <Link href={`/projetos/${t.projetoId}?aba=tarefas&tarefa=${t.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-aviso/30 bg-aviso/5 px-2 py-1.5 text-sm hover:bg-aviso/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
                          <span className="min-w-0 truncate text-tinta">{t.titulo}</span>
                          <span className="shrink-0 text-[12px] font-semibold text-aviso">Aprovar</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Vazio do período: tem tarefa, mas nenhuma aprovada nas datas escolhidas. */}
              {feitas.length === 0 && <p className="rounded-xl border border-dashed border-borda px-4 py-4 text-center text-[13px] text-tinta-suave">Nenhuma entrega aprovada de {dataBR(periodo.de)} a {dataBR(periodo.ate)}. Aprove as entregas no detalhe de cada tarefa ou escolha um período maior.</p>}
              {feitas.length > 0 && (
                <>
                  <p className="text-[12px] font-semibold text-tinta-suave">Últimas entregas no período</p>
                  <ul className="space-y-1.5">
                    {feitas.slice(0, 4).map((t) => (
                      <li key={t.id}>
                        {/* NAVEGA: abre a tarefa por cima do quadro do projeto. */}
                        <Link href={`/projetos/${t.projetoId}?tarefa=${t.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
                          <span className="min-w-0 truncate text-tinta">{t.titulo}</span>
                          <span className="shrink-0 text-[12px] text-tinta-suave">{t.aprovadaEm ? dataCurta(t.aprovadaEm) : '—'}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </Bloco>

        {/* [PV-7] O PROGRESSO DA TRILHA do time: concluíram, em andamento e não iniciaram, por trilha da empresa (resumoTrilha). */}
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
