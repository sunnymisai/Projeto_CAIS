/* ============================================================================
   COMPONENTS/PAINEIS/PAINELADMIN.TSX (PAINEL DO ADMINISTRADOR)
   O que é: a tela inicial do admin, com números e gráficos de formação,
     alocação e entregas do programa.
   Onde é usado: app/(sistema)/painel/page.tsx, que escolhe este painel quando
     o perfil da sessão é admin. Rota /painel. Chegam aqui: o item "Painel" do menu
     (components/shell/navegacao.ts), o login sem ?voltar=
     (components/LoginForm.tsx) e o botão "Ir para o painel" da 404
     (app/not-found.tsx).
   Depende de: lib/store.tsx (useDados: empresas, pessoas, projetos, tarefas,
     trilhas), lib/carga.ts (ocupacaoNaSemana e os níveis do semáforo), lib/auth.tsx (useAuth: nome de quem entrou),
     lib/metricas.ts (resumoTrilha, progressoProjeto e, no bloco "No período", evolucaoDaTurma,
     trilhasConcluidasNoPeriodo e tarefasConcluidasPorEmpresa), lib/utils.ts (datas e cx),
     components/ui/FiltroPeriodo.tsx (filtro e período da URL), components/ui/basicos.tsx e components/ui/Graficos.tsx.
   Contexto: §6 (Dashboards: painel do admin — trilhas, projetos, pessoas),
     §15 item 2 (painel por perfil), §16 (semáforo de carga) e §13 (quatro
     estados: esqueleto enquanto carrega).
   ============================================================================ */

// "use client": usa os hooks useDados/useAuth, que leem o navegador.
"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { Building2, Users, FolderKanban, Clock, ArrowUpRight, CalendarClock } from 'lucide-react';
import { useDados } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { Card, CardTitulo, Esqueleto, Etiqueta, Avatar, Progresso } from '@/components/ui/basicos';
import { BarraEmpilhada, Legenda, Rosca, BarrasComLimite, Colunas, COR_GRAFICO, TONS_COLUNA } from '@/components/ui/Graficos';
import { resumoTrilha, progressoProjeto, evolucaoDaTurma, tarefasConcluidasPorEmpresa, trilhasConcluidasNoPeriodo } from '@/lib/metricas';
import FiltroPeriodo, { usePeriodo } from '@/components/ui/FiltroPeriodo';
import { cx, dataBR, dataCurta, diasEntre, hojeISO } from '@/lib/utils';
import { ocupacaoNaSemana, segundaDaSemana, ROTULO_NIVEL, TOM_NIVEL } from '@/lib/carga';

// [PV-1] AS CORES dos gráficos de trilha (verde = concluída, roxo = em andamento, cinza = não iniciada), vindas de COR_GRAFICO. A tela /trilhas usa as mesmas.
/*
 * Cores dos gráficos de trilha (verde = concluída, roxo = em andamento,
 * cinza = nunca iniciada), seguindo "cor tem significado" (§9).
 * Vêm dos tokens --grafico-* (COR_GRAFICO), que trocam com o tema claro/escuro;
 * trilhas/page.tsx usa as mesmas, então as legendas das duas telas batem.
 */
const COR = { concluida: COR_GRAFICO.concluida, andamento: COR_GRAFICO.andamento, nao: COR_GRAFICO.naoIniciada };

// [PV-2] O PAINEL DO ADMINISTRADOR (/painel): 4 cartões de número, o bloco "No período" e cinco cartões de detalhe. Tudo é recalculado dos dados; nada é guardado.
/**
 * Painel do Administrador (mostrado em /painel só para o perfil admin).
 * Mostra 4 cartões de número (KPIs) e 5 cartões de detalhe: trilhas,
 * próximos prazos, projetos por empresa, tarefas por etapa e carga.
 * Nada aqui é salvo: todos os números são recalculados a partir da store
 * sempre que os dados mudam (regra "nada calculado é armazenado").
 *
 * @returns o esqueleto (enquanto carrega) ou o painel completo.
 */
export default function PainelAdmin() {
  const d = useDados();
  // Período dos blocos "No período" (G01): vem da URL (?de=&ate=) para o link poder ser compartilhado.
  const { periodo, definir } = usePeriodo();
  const { sessao } = useAuth();
  // Data de hoje no formato "AAAA-MM-DD"; comparar textos nesse formato
  // funciona como comparar datas ("2026-10-01" < "2026-10-07").
  const hoje = hojeISO();

  // Todos os números do painel calculados de uma vez.
  // useMemo: só recalcula quando os dados (d) ou o dia (hoje) mudam, e não a
  // cada render (ex.: passar o mouse num cartão).
  const m = useMemo(() => {
    // Profissionais que contam no programa: perfil "profissional" e não
    // inativados (inativo some dos números, mas o histórico fica — §11).
    const profissionais = d.pessoas.filter((p) => p.perfil === 'profissional' && p.status !== 'inativo');
    // Projetos com status "Em andamento" (planejado, pausado e concluído
    // ficam de fora).
    const ativos = d.projetos.filter((p) => p.status === 'andamento');
    // [PV-3] O QUE É TAREFA ATRASADA no painel: prazo vencido e fora da última coluna. É a mesma regra de progressoProjeto (lib/metricas.ts): mude nos dois.
    // Tarefa atrasada = prazo já passou E ainda não está na ÚLTIMA coluna do
    // quadro do projeto dela (a última coluna é sempre "Pronto").
    // ⚠️ ATENÇÃO: mesma regra de progressoProjeto() em lib/metricas.ts; se
    // mudar a definição de "atrasada", mude nos dois lugares.
    const atrasadas = d.tarefas.filter((t) => {
      const proj = d.projeto(t.projetoId);
      return t.prazo < hoje && t.colunaId !== proj?.colunas[proj.colunas.length - 1]?.id;
    });
    // Só trilhas publicadas entram (rascunho ainda não tem público).
    // resumoTrilha() (lib/metricas.ts) conta, dentro do público da trilha,
    // quantas pessoas concluíram, estão em andamento ou nunca começaram.
    const trilhas = d.trilhas.filter((t) => t.status === 'publicada').map((t) => ({ t, r: resumoTrilha(t, d) }));
    // Soma das três contagens de TODAS as trilhas publicadas (c = concluídas,
    // a = em andamento, n = não iniciadas), para a rosca do cartão "Trilhas".
    // Uma mesma pessoa conta uma vez em cada trilha que recebeu.
    const totalTrilhas = trilhas.reduce((s, x) => ({ c: s.c + x.r.concluida, a: s.a + x.r.andamento, n: s.n + x.r.nao_iniciada }), { c: 0, a: 0, n: 0 });

    // [PV-4] TAREFAS POR ETAPA: conta pela POSIÇÃO da coluna (1ª a 4ª) e não pelo id; os rótulos são os padrão do §5 (A fazer, Fazendo, Revisão, Pronto).
    // Tarefas por etapa, somando todos os quadros. Usa a POSIÇÃO da coluna
    // (1ª, 2ª, 3ª, 4ª) e não o id, porque cada projeto tem colunas com ids
    // próprios. As cores seguem: cinza, roxo, âmbar (revisão), verde (pronto).
    // ⚠️ ATENÇÃO: se um projeto renomear ou reordenar colunas, a contagem
    // continua pela posição; os rótulos aqui são os padrão do §5.
    const porColuna = ['A fazer', 'Fazendo', 'Revisão', 'Pronto'].map((rot, i) => ({
      rotulo: rot, cor: i === 3 ? COR_GRAFICO.concluida : TONS_COLUNA[i],
      valor: d.tarefas.filter((t) => d.projeto(t.projetoId)?.colunas[i]?.id === t.colunaId).length,
    }));

    // [PV-5] PRÓXIMOS PRAZOS: tarefas abertas com prazo de hoje em diante, da mais urgente para a menos, e só as 5 primeiras (slice(0, 5)).
    // Próximos prazos: tarefas ainda abertas (fora da última coluna) com
    // prazo de hoje em diante, da mais urgente para a menos urgente.
    // localeCompare ordena as datas "AAAA-MM-DD" como texto. Mostra só 5.
    const proximos = d.tarefas
      .filter((t) => t.prazo >= hoje && t.colunaId !== d.projeto(t.projetoId)?.colunas.at(-1)?.id)
      .sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 5);

    return { profissionais, ativos, atrasadas, trilhas, totalTrilhas, porColuna, proximos };
  }, [d, hoje]);

  // Estado "carregando" (§13): enquanto a store não terminou de ler os dados,
  // mostra o esqueleto no lugar dos cartões, nunca uma tela em branco.
  // SIMULADO: a store finge a demora da API para este esqueleto aparecer.
  if (!d.pronto) return <EsqueletoPainel />;

  // Semáforo da semana atual por profissional (card "Alocação e carga"), da maior ocupação para a menor.
  // Horas = pico diário em horas (pct × limite ÷ 100), arredondado para caber no "45 / 40 h".
  const segunda = segundaDaSemana(hojeISO());
  // [PV-6] A CARGA DA SEMANA ATUAL por profissional, da maior para a menor ocupação: horas do dia mais cheio, limite (cargaMax) e nível do semáforo (lib/carga.ts).
  const cargas = m.profissionais
    .map((p) => ({ p, o: ocupacaoNaSemana(p, segunda, d) }))
    .sort((a, b) => b.o.pct - a.o.pct)
    .map(({ p, o }) => ({ rotulo: p.nome, sub: p.area, valor: Math.round((o.pct * p.cargaMax) / 100), limite: p.cargaMax, nivel: { rotulo: ROTULO_NIVEL[o.nivel], tom: TOM_NIVEL[o.nivel] } }));

  // Blocos "No período" (G01): conclusões de trilha por semana (evolução da turma) e tarefas
  // concluídas por empresa. Tudo recalculado a partir do período escolhido no filtro.
  const evolucao = evolucaoDaTurma(d, periodo);
  const conclusoes = trilhasConcluidasNoPeriodo(d, periodo).length;
  const porEmpresa = tarefasConcluidasPorEmpresa(d, periodo);
  const tarefasNoPeriodo = porEmpresa.reduce((s, e) => s + e.total, 0);
  const faixa = `de ${dataBR(periodo.de)} a ${dataBR(periodo.ate)}`;

  // [PV-7] OS 4 CARTÕES DE NÚMERO do topo (empresas ativas, profissionais, projetos em andamento, tarefas atrasadas): rótulo, valor, apoio, ícone, para onde o clique leva e a cor.
  // Os 4 cartões de número (KPIs) do topo. Cada um tem: rótulo, número
  // grande (valor), linha de apoio (sub), ícone, para onde o clique leva
  // (href) e as classes de cor do ícone.
  const kpis = [
    // Cartão "Empresas ativas": conta empresas com status "ativa" em
    // d.empresas (lib/store). Linha de apoio: quantas estão "em negociação".
    // NAVEGA: clique leva para /empresas.
    { rotulo: 'Empresas ativas', valor: d.empresas.filter((e) => e.status === 'ativa').length, sub: `${d.empresas.filter((e) => e.status === 'negociacao').length} em negociação`, icone: Building2, href: '/empresas', cor: 'text-primaria bg-primaria-suave' },
    // Cartão "Profissionais": tamanho de m.profissionais (perfil profissional
    // e não inativo). Linha de apoio: quantos têm status "convidado", ou seja,
    // receberam o convite e ainda não fizeram o primeiro acesso (§12, fluxo 1).
    // NAVEGA: clique leva para /pessoas.
    { rotulo: 'Profissionais', valor: m.profissionais.length, sub: `${m.profissionais.filter((p) => p.status === 'convidado').length} aguardando primeiro acesso`, icone: Users, href: '/pessoas', cor: 'text-sucesso bg-sucesso/12' },
    // Cartão "Projetos em andamento": tamanho de m.ativos (status "andamento").
    // Linha de apoio: conta os "planejado" numa função que roda na hora
    // ((() => {...})()) só para acertar o plural ("1 planejado", "2 planejados").
    // NAVEGA: clique leva para /projetos.
    { rotulo: 'Projetos em andamento', valor: m.ativos.length, sub: (() => { const n = d.projetos.filter((p) => p.status === 'planejado').length; return `${n} planejado${n === 1 ? '' : 's'}`; })(), icone: FolderKanban, href: '/projetos', cor: 'text-aviso bg-aviso/12' },
    // Cartão "Tarefas atrasadas": tamanho de m.atrasadas (prazo vencido e fora
    // da coluna "Pronto"). Com atraso, o ícone fica vermelho (erro); sem
    // atraso, fica neutro, para não chamar atenção à toa (§9: cor tem
    // significado). NAVEGA: clique leva para /projetos.
    { rotulo: 'Tarefas atrasadas', valor: m.atrasadas.length, sub: m.atrasadas.length ? 'precisam de atenção' : 'nenhuma no momento', icone: Clock, href: '/projetos', cor: m.atrasadas.length ? 'text-erro bg-erro/12' : 'text-tinta-suave bg-superficie-alt' },
  ];

  // Primeiro nome de quem entrou, para a saudação ("Olá, Ana").
  const primeiroNome = sessao?.nome.split(' ')[0] ?? '';

  return (
    // max-w-[1400px] + mx-auto: em telas muito largas o painel não estica
    // demais e fica centralizado. O padding cresce com a tela (p-4 → p-8).
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      {/* A conta de demonstração se chama "Administrador ..."; nesse caso a
        * saudação vira "Olá, administrador" (minúsculo), que soa mais natural. */}
      <CabecalhoPagina titulo={`Olá, ${primeiroNome === 'Administrador' ? 'administrador' : primeiroNome}`}
        descricao="Como estão formação, alocação e entregas do programa hoje." />

      {/* KPIs: 1 coluna no celular, 2 a partir de sm e 4 lado a lado em xl.
        * Cada cartão inteiro é um link (fácil de tocar no celular). */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.rotulo} href={k.href}
            // group: permite que os filhos reajam ao hover do cartão inteiro
            // (group-hover). focus-visible:ring: anel de foco só no teclado.
            className="group rounded-2xl border border-borda bg-superficie p-5 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
            <div className="flex items-start justify-between">
              {/* k.icone é um componente guardado no objeto; por isso pode ser
                * usado como tag (<k.icone />). */}
              <span className={cx('flex h-10 w-10 items-center justify-center rounded-xl', k.cor)}><k.icone className="h-5 w-5" aria-hidden /></span>
              {/* Seta "abrir" invisível (opacity-0) que aparece no hover do
                * cartão (group-hover:opacity-100): dica de que é clicável. */}
              <ArrowUpRight className="h-4 w-4 text-tinta-fraca opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </div>
            {/* tabular-nums: todos os algarismos com a mesma largura, para os
              * números não "dançarem" quando mudam. */}
            <p className="mt-4 font-space text-3xl font-semibold tabular-nums text-tinta">{k.valor}</p>
            <p className="text-sm font-medium text-tinta">{k.rotulo}</p>
            <p className="mt-0.5 text-[12px] text-tinta-suave">{k.sub}</p>
          </Link>
        ))}
      </div>

      {/* [PV-8] O BLOCO "No período": o filtro de período e os dois gráficos que ele muda (evolução da turma e tarefas concluídas por empresa). */}
      {/* NO PERÍODO (G01, §6 e §8 Onda 4): o filtro fica acima dos blocos que ele muda (§10).
        * Cada gráfico tem um resumo em texto que muda junto com o período. */}
      <section aria-labelledby="no-periodo" className="mb-6">
        <h2 id="no-periodo" className="mb-3 font-space text-[17px] font-semibold text-tinta">No período</h2>
        <div className="mb-4"><FiltroPeriodo periodo={periodo} onChange={definir} /></div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardTitulo titulo="Turma: evolução ao longo do tempo" descricao="Trilhas concluídas por semana: cada pessoa que terminou uma trilha conta uma vez." />
            <div className="p-5">
              {conclusoes === 0 ? (
                // Vazio do período: explica e sugere o que fazer.
                <p className="rounded-xl border border-dashed border-borda px-4 py-6 text-center text-sm text-tinta-suave">Nenhuma trilha concluída {faixa}. Escolha um período maior para ver a evolução.</p>
              ) : (
                <>
                  <Colunas altura={110} itens={evolucao.map((s) => ({ rotulo: s.rotulo, valor: s.valor, cor: COR_GRAFICO.concluida }))} />
                  <p className="mt-2 text-[13px] text-tinta-suave">{conclusoes} trilha{conclusoes > 1 ? 's' : ''} concluída{conclusoes > 1 ? 's' : ''} {faixa}.</p>
                </>
              )}
            </div>
          </Card>
          <Card>
            <CardTitulo titulo="Tarefas concluídas por empresa" descricao="Tarefas que chegaram em Pronto no período." />
            <div className="p-5">
              {porEmpresa.length === 0 ? (
                <p className="rounded-xl border border-dashed border-borda px-4 py-6 text-center text-sm text-tinta-suave">Nenhuma tarefa concluída {faixa}.</p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {porEmpresa.map((e) => (
                      <li key={e.empresaId}>
                        <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]"><span className="truncate font-medium text-tinta">{e.nome}</span><span className="shrink-0 font-semibold tabular-nums text-tinta-suave">{e.total}</span></div>
                        {/* A barra é relativa à empresa com mais tarefas concluídas (a maior fica cheia). */}
                        <Progresso valor={(e.total / porEmpresa[0].total) * 100} fino rotulo={`${e.nome}: ${e.total} tarefa${e.total > 1 ? 's' : ''} concluída${e.total > 1 ? 's' : ''}`} />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[13px] text-tinta-suave">{tarefasNoPeriodo} tarefa{tarefasNoPeriodo > 1 ? 's' : ''} concluída{tarefasNoPeriodo > 1 ? 's' : ''} {faixa}.</p>
                </>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Grade dos cartões de detalhe: 1 coluna até xl; em xl, 3 colunas.
        * xl:col-span-2 faz um cartão ocupar 2 das 3 colunas. */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Trilhas (§6: concluídas, em atraso, nunca iniciadas).
          * Rosca: m.totalTrilhas, a soma de resumoTrilha() de todas as trilhas
          * publicadas. Lista: uma barra empilhada por trilha, com o r (resumo)
          * daquela trilha. "X de Y concluíram": Y = r.publico, quantas
          * pessoas a trilha alcança (publicoDaTrilha em lib/metricas.ts). */}
        <Card className="xl:col-span-2">
          <CardTitulo titulo="Trilhas" descricao="Concluídas, em andamento e nunca iniciadas, por trilha publicada."
            acao={<Link href="/trilhas" className="text-[13px] font-semibold text-primaria hover:underline">Ver trilhas</Link>} />
          {/* md:grid-cols-[auto_1fr]: a rosca ocupa só a largura dela e a lista
            * de trilhas fica com todo o resto. */}
          <div className="grid gap-6 p-5 md:grid-cols-[auto_1fr] md:items-center">
            {/* A legenda repete os números em texto: gráfico nunca fica sem
              * resumo legível (acessibilidade, §13). */}
            <div className="flex flex-col items-center gap-3">
              <Rosca centro={String(m.totalTrilhas.c)} subcentro="conclusões"
                segmentos={[{ rotulo: 'Concluídas', valor: m.totalTrilhas.c, cor: COR.concluida }, { rotulo: 'Em andamento', valor: m.totalTrilhas.a, cor: COR.andamento }, { rotulo: 'Não iniciadas', valor: m.totalTrilhas.n, cor: COR.nao }]} />
              <Legenda itens={[{ rotulo: 'Concluídas', valor: m.totalTrilhas.c, cor: COR.concluida }, { rotulo: 'Andamento', valor: m.totalTrilhas.a, cor: COR.andamento }, { rotulo: 'Não iniciadas', valor: m.totalTrilhas.n, cor: COR.nao }]} />
            </div>
            <ul className="space-y-4">
              {m.trilhas.map(({ t, r }) => (
                <li key={t.id}>
                  {/* NAVEGA: abre o editor da trilha (/trilhas/[id]). */}
                  <Link href={`/trilhas/${t.id}`} className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-tinta group-hover:text-primaria">{t.titulo}</span>
                      <span className="shrink-0 text-[12px] text-tinta-suave">{r.concluida} de {r.publico} concluíram</span>
                    </div>
                    <BarraEmpilhada segmentos={[{ rotulo: 'Concluídas', valor: r.concluida, cor: COR.concluida }, { rotulo: 'Em andamento', valor: r.andamento, cor: COR.andamento }, { rotulo: 'Não iniciadas', valor: r.nao_iniciada, cor: COR.nao }]} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Próximos prazos: as 5 tarefas de m.proximos (abertas, prazo de hoje
          * em diante, mais urgente primeiro). */}
        <Card>
          <CardTitulo titulo="Próximos prazos" descricao="Tarefas abertas com entrega mais próxima." />
          <ul className="p-3">
            {m.proximos.map((t) => {
              // Quantos dias faltam (diasEntre em lib/utils.ts): 0 = vence hoje.
              const dias = diasEntre(hoje, t.prazo);
              const resp = d.pessoa(t.responsavelId);
              return (
                <li key={t.id}>
                  {/* NAVEGA: abre o projeto já com o detalhe da tarefa por cima
                    * do quadro (?tarefa=, lido em projetos/[id]/page.tsx). */}
                  <Link href={`/projetos/${t.projetoId}?tarefa=${t.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-superficie-alt">
                    {/* [PV-9] O SELO DE DIAS dos próximos prazos: âmbar quando faltam 3 dias ou menos, neutro no resto; mostra "hoje" ou "Nd". */}
                    {/* Selo de dias: âmbar (atenção) quando faltam 3 dias ou
                      * menos; neutro no resto. Mostra "hoje" ou "Nd". */}
                    <span className={cx('flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-[11px] font-bold leading-none', dias <= 3 ? 'bg-aviso/12 text-aviso' : 'bg-superficie-alt text-tinta-suave')}>
                      <CalendarClock className="mb-0.5 h-3.5 w-3.5" aria-hidden />{dias === 0 ? 'hoje' : `${dias}d`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-tinta">{t.titulo}</span>
                      <span className="block truncate text-[12px] text-tinta-suave">{d.projeto(t.projetoId)?.nome} · {dataCurta(t.prazo)}</span>
                    </span>
                    {resp && <Avatar nome={resp.nome} tamanho={26} />}
                  </Link>
                </li>
              );
            })}
            {/* Estado vazio do cartão: explica em vez de ficar em branco. */}
            {m.proximos.length === 0 && <li className="px-3 py-6 text-center text-sm text-tinta-suave">Nenhuma tarefa com prazo pela frente.</li>}
          </ul>
        </Card>

        {/* Projetos por empresa (§6: andamento por empresa).
          * Uma linha por projeto de d.projetos. Os números vêm de
          * progressoProjeto() (lib/metricas.ts): pct = tarefas na última
          * coluna ÷ total de tarefas × 100; atrasadas = prazo vencido e fora
          * da última coluna. */}
        <Card className="xl:col-span-2">
          <CardTitulo titulo="Projetos por empresa" descricao="Percentual de tarefas prontas e atrasos."
            acao={<Link href="/projetos" className="text-[13px] font-semibold text-primaria hover:underline">Ver projetos</Link>} />
          <ul className="divide-y divide-borda p-2">
            {d.projetos.map((p) => {
              const pr = progressoProjeto(p.id, d);
              return (
                <li key={p.id}>
                  {/* NAVEGA: abre a ficha do projeto. No celular as 3 partes
                    * empilham; a partir de sm viram 3 colunas (nome, barra,
                    * etiqueta) com sm:grid-cols-[1.4fr_1fr_auto]. */}
                  <Link href={`/projetos/${p.id}`} className="grid items-center gap-3 rounded-xl px-3 py-3 hover:bg-superficie-alt sm:grid-cols-[1.4fr_1fr_auto]">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-tinta">{p.nome}</span>
                      <span className="block truncate text-[12px] text-tinta-suave">{d.empresa(p.empresaId)?.nomeFantasia} · entrega {dataCurta(p.entrega)}</span>
                    </span>
                    {/* Barra fica âmbar (aviso) se o projeto tem tarefa atrasada. */}
                    <span className="flex items-center gap-3">
                      <Progresso valor={pr.pct} tom={pr.atrasadas ? 'aviso' : 'primaria'} rotulo={`Progresso de ${p.nome}`} />
                      <span className="w-10 text-right text-[13px] font-semibold tabular-nums text-tinta">{Math.round(pr.pct)}%</span>
                    </span>
                    {/* Etiqueta: "N atrasada(s)" em vermelho ou "Em dia" em verde
                      * (cor sempre acompanhada de texto, §9). */}
                    <span className="flex justify-end">
                      {pr.atrasadas > 0 ? <Etiqueta tom="erro" ponto>{pr.atrasadas} atrasada{pr.atrasadas > 1 ? 's' : ''}</Etiqueta>
                        : <Etiqueta tom="sucesso" ponto>Em dia</Etiqueta>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Tarefas por coluna: gráfico de colunas com m.porColuna, a contagem
          * de tarefas em cada etapa (A fazer, Fazendo, Revisão, Pronto)
          * somando os quadros de todos os projetos. */}
        <Card>
          <CardTitulo titulo="Tarefas por etapa" descricao="Todos os quadros somados." />
          <div className="p-5"><Colunas itens={m.porColuna} /></div>
        </Card>

        {/* [PV-10] O CARTÃO "Alocação e carga": divide a lista ao meio em duas colunas e a barra cheia vale 50 h (maximoEscala). Passar do limite é aviso, não bloqueio (§5). */}
        {/* Carga (§6: pessoas — alocação e carga; §16: semáforo de carga por período, F02).
          * Para cada profissional, a SEMANA ATUAL (ocupacaoNaSemana, lib/carga.ts): valor = horas
          * do dia mais cheio da semana (pico), limite = p.cargaMax, e o nível do semáforo em texto.
          * Conta o QUANDO de cada alocação: duas que não se cruzam no tempo não se somam
          * (o caso do Diego). Passar do limite é AVISO, NÃO BLOQUEIO (§5). */}
        <Card className="xl:col-span-3">
          {/* NAVEGA: "Ver carga da equipe" leva à matriz completa, semana a semana (/carga). */}
          <CardTitulo titulo="Alocação e carga" descricao="Semana atual: as horas do dia mais cheio de cada pessoa, somando só os projetos ativos naquele dia. A marca indica o limite."
            acao={<Link href="/carga" className="inline-flex items-center gap-1 rounded text-[13px] font-semibold text-primaria hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">Ver carga da equipe<ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></Link>} />
          {/* Lista ordenada da maior para a menor ocupação e cortada ao meio:
            * a 1ª metade vai na coluna da esquerda e o resto na da direita.
            * Math.ceil: com número ímpar, a coluna da esquerda fica com 1 a mais.
            * maximoEscala={50}: a barra cheia vale 50 h, folga acima das 40 h. */}
          <div className="grid gap-x-10 p-5 md:grid-cols-2">
            <BarrasComLimite maximoEscala={50} itens={cargas.slice(0, Math.ceil(cargas.length / 2))} />
            <BarrasComLimite maximoEscala={50} itens={cargas.slice(Math.ceil(cargas.length / 2))} />
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Esqueleto do painel: blocos cinza no formato dos cartões, mostrados
 * enquanto os dados carregam (estado "carregando", §13).
 * role="status" + aria-label avisam leitores de tela que algo está carregando.
 *
 * @returns a silhueta do painel (título, 4 KPIs e 2 cartões).
 */
function EsqueletoPainel() {
  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8" role="status" aria-label="Carregando painel">
      <Esqueleto className="mb-2 h-8 w-64" />
      <Esqueleto className="mb-6 h-4 w-96 max-w-full" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-40 rounded-2xl" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Esqueleto className="h-72 rounded-2xl xl:col-span-2" />
        <Esqueleto className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
