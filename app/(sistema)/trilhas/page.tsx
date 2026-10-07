"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Plus, GraduationCap, Layers, Users, Clock } from 'lucide-react';
import { useDados } from '@/lib/store';
import { resumoTrilha } from '@/lib/metricas';
import { ALCANCE } from '@/lib/trilhas';
import { CabecalhoPagina, BarraFiltros } from '@/components/shell/Pagina';
import Button from '@/components/button';
import { Segmentado } from '@/components/ui/form';
import { Etiqueta, EstadoVazio, Esqueleto } from '@/components/ui/basicos';
import { BarraEmpilhada } from '@/components/ui/Graficos';
import { novoId } from '@/lib/utils';
import type { Trilha } from '@/lib/tipos';

export default function Trilhas() {
  const d = useDados();
  const router = useRouter();
  const [filtro, setFiltro] = useState<'todas' | Trilha['alcance'] | 'rascunho'>('todas');

  const lista = useMemo(() => d.trilhas.filter((t) =>
    filtro === 'todas' ? true : filtro === 'rascunho' ? t.status === 'rascunho' : t.alcance === filtro), [d.trilhas, filtro]);

  const nova = () => {
    const t: Trilha = { id: novoId('tri'), titulo: 'Nova trilha', descricao: '', alcance: 'geral', empresaId: '', pessoaIds: [], status: 'rascunho', prazoDias: 7, etapas: [], progresso: {} };
    d.salvar('trilhas', t);
    router.push(`/trilhas/${t.id}`);
  };

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Trilhas" descricao="Uma trilha, três formas de atribuir. Quem decide o alcance é o administrador, na hora de publicar."
        acao={<Button onClick={nova}><Plus className="h-4 w-4" aria-hidden />Nova trilha</Button>} />

      <BarraFiltros>
        <Segmentado rotulo="Filtrar trilhas" valor={filtro} onChange={setFiltro}
          opcoes={[{ valor: 'todas', rotulo: 'Todas' }, { valor: 'geral', rotulo: 'Gerais' }, { valor: 'empresa', rotulo: 'Da empresa' }, { valor: 'profissional', rotulo: 'Do profissional' }, { valor: 'rascunho', rotulo: 'Rascunhos' }]} />
      </BarraFiltros>

      {!d.pronto ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-56 rounded-2xl" />)}</div>
      ) : lista.length === 0 ? (
        <div className="rounded-2xl border border-borda bg-superficie">
          <EstadoVazio icone={<GraduationCap className="h-6 w-6" />} titulo="Nenhuma trilha aqui" descricao="Crie uma trilha, monte as etapas e escolha o público na hora de publicar."
            acao={<Button onClick={nova}><Plus className="h-4 w-4" />Nova trilha</Button>} />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((t) => {
            const r = resumoTrilha(t, d);
            const a = ALCANCE[t.alcance];
            const alvo = t.alcance === 'empresa' ? d.empresa(t.empresaId)?.nomeFantasia : t.alcance === 'profissional' ? `${t.pessoaIds.length} pessoa(s)` : 'Todos';
            return (
              <li key={t.id}>
                <Link href={`/trilhas/${t.id}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-borda bg-superficie p-5 pl-6 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
                  <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: a.cor }} aria-hidden />
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-tinta-suave">{a.rotulo}</span>
                    {t.status === 'rascunho' ? <Etiqueta tom="aviso">Rascunho</Etiqueta> : <Etiqueta tom="sucesso" ponto>Publicada</Etiqueta>}
                  </div>
                  <h2 className="font-space text-lg font-semibold text-tinta group-hover:text-primaria">{t.titulo}</h2>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-tinta-suave">{t.descricao || 'Sem descrição.'}</p>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-tinta-suave">
                    <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" aria-hidden />{t.etapas.length} etapas</span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden />{alvo}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden />{t.prazoDias} dias</span>
                  </div>
                  {t.status === 'publicada' && r.publico > 0 && (
                    <div className="mt-4">
                      <BarraEmpilhada altura={8} segmentos={[{ rotulo: 'Concluídas', valor: r.concluida, cor: '#10B981' }, { rotulo: 'Em andamento', valor: r.andamento, cor: '#7C5CFF' }, { rotulo: 'Não iniciadas', valor: r.nao_iniciada, cor: '#C9CCD8' }]} />
                      <p className="mt-1.5 text-[12px] text-tinta-suave">{r.concluida} de {r.publico} concluíram · {r.nao_iniciada} não iniciaram</p>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
