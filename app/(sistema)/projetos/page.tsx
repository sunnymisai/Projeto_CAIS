"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus, FolderKanban, Search, CalendarDays } from 'lucide-react';
import { useDados } from '@/lib/store';
import { progressoProjeto, ROTULO_STATUS_PROJETO, TOM_STATUS_PROJETO } from '@/lib/metricas';
import { CabecalhoPagina, BarraFiltros } from '@/components/shell/Pagina';
import Button from '@/components/button';
import { Select } from '@/components/ui/form';
import { Etiqueta, EstadoVazio, Esqueleto, GrupoAvatares, Progresso } from '@/components/ui/basicos';
import FormProjeto from '@/components/projetos/FormProjeto';
import { corQuadro } from '@/components/projetos/cores';
import { dataCurta, normalizar } from '@/lib/utils';

export default function Projetos() {
  const d = useDados();
  const [novo, setNovo] = useState(false);
  const [busca, setBusca] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [status, setStatus] = useState('');

  const lista = useMemo(() => d.projetos
    .filter((p) => !empresa || p.empresaId === empresa)
    .filter((p) => !status || p.status === status)
    .filter((p) => !busca.trim() || normalizar(p.nome).includes(normalizar(busca.trim()))), [d.projetos, empresa, status, busca]);

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Projetos" descricao="Da empresa à tarefa: cada projeto tem equipe alocada e um quadro próprio."
        acao={<Button onClick={() => setNovo(true)}><Plus className="h-4 w-4" aria-hidden />Novo projeto</Button>} />

      <BarraFiltros>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-fraca" aria-hidden />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar projeto" aria-label="Buscar projetos"
            className="h-10 w-full rounded-lg border border-borda bg-superficie pl-9 pr-3 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
        </div>
        <div className="w-48"><Select aria-label="Filtrar por empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Todas as empresas" opcoes={d.empresas.map((e) => ({ valor: e.id, rotulo: e.nomeFantasia }))} /></div>
        <div className="w-44"><Select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Todos os status" opcoes={Object.entries(ROTULO_STATUS_PROJETO).map(([valor, rotulo]) => ({ valor, rotulo }))} /></div>
      </BarraFiltros>

      {!d.pronto ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-64 rounded-2xl" />)}</div>
      ) : lista.length === 0 ? (
        <div className="rounded-2xl border border-borda bg-superficie">
          <EstadoVazio icone={<FolderKanban className="h-6 w-6" />} titulo={d.projetos.length ? 'Nenhum projeto com esses filtros' : 'Nenhum projeto ainda'}
            descricao={d.projetos.length ? 'Ajuste a busca ou os filtros.' : 'Crie o primeiro projeto a partir de uma empresa cadastrada.'}
            acao={<Button onClick={() => setNovo(true)}><Plus className="h-4 w-4" />Novo projeto</Button>} />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((p) => {
            const pr = progressoProjeto(p.id, d);
            const equipe = d.alocacoes.filter((a) => a.projetoId === p.id).map((a) => d.pessoa(a.pessoaId)?.nome ?? '');
            return (
              <li key={p.id}>
                <Link href={`/projetos/${p.id}`} className="group block overflow-hidden rounded-2xl border border-borda bg-superficie transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
                  {/* Capa no estilo "quadro" do Trello, com minicolunas */}
                  <div className="relative h-28 p-4" style={{ background: corQuadro(p.cor).fundo }}>
                    <div className="flex h-full items-end gap-1.5 opacity-90" aria-hidden>
                      {p.colunas.slice(0, 4).map((c) => {
                        const n = d.tarefas.filter((t) => t.colunaId === c.id && t.projetoId === p.id).length;
                        return (
                          <div key={c.id} className="flex w-14 flex-col gap-1 rounded-md bg-white/20 p-1 backdrop-blur-sm">
                            {Array.from({ length: Math.min(3, n) }, (_, i) => <span key={i} className="h-2 rounded-sm bg-white/80" />)}
                            {n === 0 && <span className="h-2" />}
                          </div>
                        );
                      })}
                    </div>
                    <span className="absolute right-3 top-3"><Etiqueta tom={TOM_STATUS_PROJETO[p.status]} className="bg-white/90 dark:bg-white/90">{ROTULO_STATUS_PROJETO[p.status]}</Etiqueta></span>
                  </div>
                  <div className="p-5">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-tinta-suave">{d.empresa(p.empresaId)?.nomeFantasia}</p>
                    <h2 className="mt-0.5 font-space text-lg font-semibold text-tinta group-hover:text-primaria">{p.nome}</h2>
                    <div className="mt-4 flex items-center gap-3">
                      <Progresso valor={pr.pct} tom={pr.atrasadas ? 'aviso' : 'primaria'} rotulo={`Progresso de ${p.nome}`} fino />
                      <span className="text-[12px] font-semibold tabular-nums text-tinta-suave">{pr.prontas}/{pr.total}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {equipe.length ? <GrupoAvatares nomes={equipe} tamanho={26} /> : <span className="text-[12px] text-tinta-suave">Sem equipe</span>}
                      <span className="flex items-center gap-1.5 text-[12px] text-tinta-suave"><CalendarDays className="h-3.5 w-3.5" aria-hidden />entrega {dataCurta(p.entrega)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {novo && <FormProjeto onFechar={() => setNovo(false)} />}
    </div>
  );
}
