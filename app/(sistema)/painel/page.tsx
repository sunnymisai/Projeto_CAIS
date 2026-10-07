"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { Building2, Users, FolderKanban, Clock, ArrowUpRight, CalendarClock } from 'lucide-react';
import { useDados } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { Card, CardTitulo, Esqueleto, Etiqueta, Avatar, Progresso } from '@/components/ui/basicos';
import { BarraEmpilhada, Legenda, Rosca, BarrasComLimite, Colunas } from '@/components/ui/Graficos';
import { resumoTrilha, progressoProjeto } from '@/lib/metricas';
import { cx, dataCurta, diasEntre, hojeISO } from '@/lib/utils';

const COR = { concluida: '#10B981', andamento: '#7C5CFF', nao: '#C9CCD8' };

export default function Painel() {
  const d = useDados();
  const { sessao } = useAuth();
  const hoje = hojeISO();

  const m = useMemo(() => {
    const profissionais = d.pessoas.filter((p) => p.perfil === 'profissional' && p.status !== 'inativo');
    const ativos = d.projetos.filter((p) => p.status === 'andamento');
    const atrasadas = d.tarefas.filter((t) => {
      const proj = d.projeto(t.projetoId);
      return t.prazo < hoje && t.colunaId !== proj?.colunas[proj.colunas.length - 1]?.id;
    });
    const trilhas = d.trilhas.filter((t) => t.status === 'publicada').map((t) => ({ t, r: resumoTrilha(t, d) }));
    const totalTrilhas = trilhas.reduce((s, x) => ({ c: s.c + x.r.concluida, a: s.a + x.r.andamento, n: s.n + x.r.nao_iniciada }), { c: 0, a: 0, n: 0 });

    const porColuna = ['A fazer', 'Fazendo', 'Revisão', 'Pronto'].map((rot, i) => ({
      rotulo: rot, cor: ['#9CA0B3', '#7C5CFF', '#F5A524', '#10B981'][i],
      valor: d.tarefas.filter((t) => d.projeto(t.projetoId)?.colunas[i]?.id === t.colunaId).length,
    }));

    const proximos = d.tarefas
      .filter((t) => t.prazo >= hoje && t.colunaId !== d.projeto(t.projetoId)?.colunas.at(-1)?.id)
      .sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 5);

    return { profissionais, ativos, atrasadas, trilhas, totalTrilhas, porColuna, proximos };
  }, [d, hoje]);

  if (!d.pronto) return <EsqueletoPainel />;

  const kpis = [
    { rotulo: 'Empresas ativas', valor: d.empresas.filter((e) => e.status === 'ativa').length, sub: `${d.empresas.filter((e) => e.status === 'negociacao').length} em negociação`, icone: Building2, href: '/empresas', cor: 'text-primaria bg-primaria-suave' },
    { rotulo: 'Profissionais', valor: m.profissionais.length, sub: `${m.profissionais.filter((p) => p.status === 'convidado').length} aguardando primeiro acesso`, icone: Users, href: '/pessoas', cor: 'text-sucesso bg-sucesso/12' },
    { rotulo: 'Projetos em andamento', valor: m.ativos.length, sub: (() => { const n = d.projetos.filter((p) => p.status === 'planejado').length; return `${n} planejado${n === 1 ? '' : 's'}`; })(), icone: FolderKanban, href: '/projetos', cor: 'text-aviso bg-aviso/12' },
    { rotulo: 'Tarefas atrasadas', valor: m.atrasadas.length, sub: m.atrasadas.length ? 'precisam de atenção' : 'nenhuma no momento', icone: Clock, href: '/projetos', cor: m.atrasadas.length ? 'text-erro bg-erro/12' : 'text-tinta-suave bg-superficie-alt' },
  ];

  const primeiroNome = sessao?.nome.split(' ')[0] ?? '';

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo={`Olá, ${primeiroNome === 'Administrador' ? 'administrador' : primeiroNome}`}
        descricao="Como estão formação, alocação e entregas do programa hoje." />

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.rotulo} href={k.href}
            className="group rounded-2xl border border-borda bg-superficie p-5 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
            <div className="flex items-start justify-between">
              <span className={cx('flex h-10 w-10 items-center justify-center rounded-xl', k.cor)}><k.icone className="h-5 w-5" aria-hidden /></span>
              <ArrowUpRight className="h-4 w-4 text-tinta-fraca opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </div>
            <p className="mt-4 font-space text-3xl font-semibold tabular-nums text-tinta">{k.valor}</p>
            <p className="text-sm font-medium text-tinta">{k.rotulo}</p>
            <p className="mt-0.5 text-[12px] text-tinta-suave">{k.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Trilhas */}
        <Card className="xl:col-span-2">
          <CardTitulo titulo="Trilhas" descricao="Concluídas, em andamento e nunca iniciadas, por trilha publicada."
            acao={<Link href="/trilhas" className="text-[13px] font-semibold text-primaria hover:underline">Ver trilhas</Link>} />
          <div className="grid gap-6 p-5 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex flex-col items-center gap-3">
              <Rosca centro={String(m.totalTrilhas.c)} subcentro="conclusões"
                segmentos={[{ rotulo: 'Concluídas', valor: m.totalTrilhas.c, cor: COR.concluida }, { rotulo: 'Em andamento', valor: m.totalTrilhas.a, cor: COR.andamento }, { rotulo: 'Não iniciadas', valor: m.totalTrilhas.n, cor: COR.nao }]} />
              <Legenda itens={[{ rotulo: 'Concluídas', valor: m.totalTrilhas.c, cor: COR.concluida }, { rotulo: 'Andamento', valor: m.totalTrilhas.a, cor: COR.andamento }, { rotulo: 'Não iniciadas', valor: m.totalTrilhas.n, cor: COR.nao }]} />
            </div>
            <ul className="space-y-4">
              {m.trilhas.map(({ t, r }) => (
                <li key={t.id}>
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

        {/* Próximos prazos */}
        <Card>
          <CardTitulo titulo="Próximos prazos" descricao="Tarefas abertas com entrega mais próxima." />
          <ul className="p-3">
            {m.proximos.map((t) => {
              const dias = diasEntre(hoje, t.prazo);
              const resp = d.pessoa(t.responsavelId);
              return (
                <li key={t.id}>
                  <Link href={`/projetos/${t.projetoId}?tarefa=${t.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-superficie-alt">
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
            {m.proximos.length === 0 && <li className="px-3 py-6 text-center text-sm text-tinta-suave">Nenhuma tarefa com prazo pela frente.</li>}
          </ul>
        </Card>

        {/* Projetos */}
        <Card className="xl:col-span-2">
          <CardTitulo titulo="Projetos por empresa" descricao="Percentual de tarefas prontas e atrasos."
            acao={<Link href="/projetos" className="text-[13px] font-semibold text-primaria hover:underline">Ver projetos</Link>} />
          <ul className="divide-y divide-borda p-2">
            {d.projetos.map((p) => {
              const pr = progressoProjeto(p.id, d);
              return (
                <li key={p.id}>
                  <Link href={`/projetos/${p.id}`} className="grid items-center gap-3 rounded-xl px-3 py-3 hover:bg-superficie-alt sm:grid-cols-[1.4fr_1fr_auto]">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-tinta">{p.nome}</span>
                      <span className="block truncate text-[12px] text-tinta-suave">{d.empresa(p.empresaId)?.nomeFantasia} · entrega {dataCurta(p.entrega)}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Progresso valor={pr.pct} tom={pr.atrasadas ? 'aviso' : 'primaria'} rotulo={`Progresso de ${p.nome}`} />
                      <span className="w-10 text-right text-[13px] font-semibold tabular-nums text-tinta">{Math.round(pr.pct)}%</span>
                    </span>
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

        {/* Tarefas por coluna */}
        <Card>
          <CardTitulo titulo="Tarefas por etapa" descricao="Todos os quadros somados." />
          <div className="p-5"><Colunas itens={m.porColuna} /></div>
        </Card>

        {/* Carga */}
        <Card className="xl:col-span-3">
          <CardTitulo titulo="Alocação e carga" descricao="Horas semanais somadas em todos os projetos ativos. A marca indica o limite de cada pessoa." />
          <div className="grid gap-x-10 p-5 md:grid-cols-2">
            <BarrasComLimite maximoEscala={50}
              itens={m.profissionais.map((p) => ({ rotulo: p.nome, sub: p.area, valor: d.cargaDaPessoa(p.id), limite: p.cargaMax }))
                .sort((a, b) => b.valor - a.valor).slice(0, Math.ceil(m.profissionais.length / 2))} />
            <BarrasComLimite maximoEscala={50}
              itens={m.profissionais.map((p) => ({ rotulo: p.nome, sub: p.area, valor: d.cargaDaPessoa(p.id), limite: p.cargaMax }))
                .sort((a, b) => b.valor - a.valor).slice(Math.ceil(m.profissionais.length / 2))} />
          </div>
        </Card>
      </div>
    </div>
  );
}

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
