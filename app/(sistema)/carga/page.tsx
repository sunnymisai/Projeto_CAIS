/* ============================================================================
   APP/(SISTEMA)/CARGA/PAGE.TSX (CARGA DA EQUIPE)
   O que é: a tela do semáforo de carga para o admin: uma matriz com os
     profissionais ativos nas linhas e as semanas nas colunas, cada célula com o
     nível da semana (pico do dia mais cheio). Cada linha abre a contribuição de
     cada projeto, e cada célula abre um painel lateral com os dias e as alocações.
     No celular, a matriz vira cards com as próximas 4 semanas.
   Onde é usado: rota /carga (só admin, regra em lib/permissoes.ts). Chegam aqui o
     menu lateral (components/shell/navegacao.ts) e, no F04, o painel do admin.
   Depende de: lib/store.tsx (useDados), lib/carga.ts (ocupacaoNaSemana,
     segundaDaSemana, nivelDaOcupacao, ROTULO_NIVEL), lib/utils.ts (somaDias, hojeISO, normalizar,
     dataBR, cx), components/ui/Semaforo.tsx (IndicadorCarga, LinhaDeSemanas,
     LegendaSemaforo, descreverCarga, rotuloSemana), components/ui/ (basicos,
     form, Modal), components/button, components/input, components/checkbox e
     components/shell/Pagina.tsx.
   Contexto: §10 (anatomia da tela: filtros acima, contagem no rodapé, só o
     conteúdo rola), §13 (teclado, tabela acessível, quatro estados) e §16
     (semáforo de carga por período, "cada colaborador em cada projeto").
   ============================================================================ */
"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { useDados } from '@/lib/store';
import { nivelDaOcupacao, ocupacaoNaSemana, segundaDaSemana, ROTULO_NIVEL } from '@/lib/carga';
import { cx, dataBR, hojeISO, normalizar, somaDias } from '@/lib/utils';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { Card, EstadoVazio, Esqueleto } from '@/components/ui/basicos';
import { Select, Segmentado } from '@/components/ui/form';
import Modal from '@/components/ui/Modal';
import { IndicadorCarga, LinhaDeSemanas, LegendaSemaforo, descreverCarga, rotuloSemana } from '@/components/ui/Semaforo';
import Button from '@/components/button';
import Input from '@/components/input';
import Checkbox from '@/components/checkbox';
import type { Pessoa } from '@/lib/tipos';

/** Quantas semanas a matriz mostra (seletor do topo). */
type Quantidade = '4' | '8' | '12';
/** Nomes curtos dos dias úteis, na ordem de porDia (segunda a sexta). */
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

/**
 * Tela "Carga da equipe".
 * Os quatro estados: carregando (esqueleto), vazio (nenhum profissional ativo, com link
 * para Pessoas), vazio do filtro (com "Limpar filtros") e com dado. O erro de leitura dos
 * dados é tratado pelo layout de (sistema).
 * @returns a tela.
 */
export default function PaginaCarga() {
  const d = useDados();
  const atual = segundaDaSemana(hojeISO());
  // Primeira semana mostrada (sempre uma segunda) e quantas semanas.
  const [inicio, setInicio] = useState(atual);
  const [qtd, setQtd] = useState<Quantidade>('8');
  // Filtros (§10: ficam acima da tabela).
  const [busca, setBusca] = useState('');
  const [area, setArea] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [soAcima, setSoAcima] = useState(false);
  // Linhas abertas (quebra por projeto) e a célula aberta no painel lateral.
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const [celula, setCelula] = useState<{ pessoaId: string; segunda: string } | null>(null);

  // Segundas das semanas mostradas.
  const semanas = useMemo(() => Array.from({ length: Number(qtd) }, (_, i) => somaDias(inicio, i * 7)), [inicio, qtd]);
  const fimDoPeriodo = somaDias(semanas[semanas.length - 1], 4);

  // Profissionais ativos (convidado ainda não trabalha; inativo saiu da operação, §11).
  const profissionais = useMemo(() => d.pessoas.filter((p) => p.perfil === 'profissional' && p.status === 'ativo'), [d.pessoas]);
  // Ocupação de cada pessoa em cada semana (recalcula quando os dados ou as semanas mudam).
  const linhas = useMemo(() => profissionais.map((p) => ({ p, semanas: semanas.map((s) => ocupacaoNaSemana(p, s, d)) })), [profissionais, semanas, d]);

  // Opções dos filtros: áreas dos profissionais e projetos que não estão concluídos.
  const areas = [...new Set(profissionais.map((p) => p.area).filter(Boolean))].sort();
  const projetos = d.projetos.filter((p) => p.status !== 'concluido');

  // Aplica os filtros. Projeto: a pessoa tem alocação nele que cruza o período mostrado.
  const filtradas = linhas.filter(({ p, semanas: ss }) =>
    (!busca.trim() || normalizar(p.nome).includes(normalizar(busca)))
    && (!area || p.area === area)
    && (!projetoId || d.alocacoes.some((a) => a.pessoaId === p.id && a.projetoId === projetoId && a.inicio <= fimDoPeriodo && a.fim >= inicio))
    && (!soAcima || ss.some((s) => s.nivel === 'vermelho')));
  const temFiltro = !!(busca.trim() || area || projetoId || soAcima);
  /** Limpa todos os filtros (ação do estado vazio do filtro). */
  const limpar = () => { setBusca(''); setArea(''); setProjetoId(''); setSoAcima(false); };
  /** Abre ou fecha a quebra por projeto de uma pessoa. */
  const alternar = (id: string) => setAbertas((atualSet) => { const n = new Set(atualSet); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  // Estado "carregando" (§13): esqueleto enquanto a store lê os dados.
  if (!d.pronto) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <Esqueleto className="mb-2 h-8 w-64" /><Esqueleto className="mb-6 h-4 w-96 max-w-full" />
        <Esqueleto className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Carga da equipe"
        descricao="Quanto cada profissional está ocupado, semana a semana. Cada semana mostra o dia mais cheio: duas alocações que não acontecem ao mesmo tempo não se somam." />

      {/* Estado vazio geral: sem profissional ativo não há o que mostrar. */}
      {profissionais.length === 0 ? (
        <Card><EstadoVazio icone={<Users className="h-6 w-6" aria-hidden />} titulo="Nenhum profissional ativo"
          descricao="Quando houver profissionais ativos, a carga de cada um aparece aqui, semana a semana."
          acao={<Link href="/pessoas" className="inline-flex h-10 items-center rounded-xl border border-borda bg-superficie px-4 text-sm font-semibold text-tinta hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">Ir para Pessoas</Link>} /></Card>
      ) : (
        <>
          {/* Período: semana anterior / Hoje / próxima e quantas semanas. */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button variante="secundario" tamanho="sm" onClick={() => setInicio(somaDias(inicio, -7))} aria-label="Semana anterior"><ChevronLeft className="h-4 w-4" aria-hidden /></Button>
            <Button variante="secundario" tamanho="sm" onClick={() => setInicio(atual)} disabled={inicio === atual}>Hoje</Button>
            <Button variante="secundario" tamanho="sm" onClick={() => setInicio(somaDias(inicio, 7))} aria-label="Próxima semana"><ChevronRight className="h-4 w-4" aria-hidden /></Button>
            <p className="text-sm font-medium text-tinta" aria-live="polite">{dataBR(inicio).slice(0, 5)} a {dataBR(fimDoPeriodo).slice(0, 5)}</p>
            <div className="ml-auto"><Segmentado rotulo="Quantas semanas mostrar" valor={qtd} onChange={setQtd} opcoes={[{ valor: '4', rotulo: '4 semanas' }, { valor: '8', rotulo: '8 semanas' }, { valor: '12', rotulo: '12 semanas' }]} /></div>
          </div>

          {/* Filtros (§10: acima do conteúdo). */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_240px_auto] lg:items-end">
            <Input compacto label="Buscar por nome" placeholder="Ex.: Bruno" value={busca} onChange={(e) => setBusca(e.target.value)} icon={<Search className="h-4 w-4" />} />
            <Select label="Área" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Todas as áreas" opcoes={areas.map((a) => ({ valor: a, rotulo: a }))} />
            <Select label="Projeto" value={projetoId} onChange={(e) => setProjetoId(e.target.value)} placeholder="Todos os projetos" opcoes={projetos.map((p) => ({ valor: p.id, rotulo: p.nome }))} />
            <div className="pb-2"><Checkbox id="so-acima" label="Só acima do limite" checked={soAcima} onChange={(e) => setSoAcima(e.target.checked)} /></div>
          </div>

          <div className="mb-3"><LegendaSemaforo /></div>

          {filtradas.length === 0 ? (
            // Estado vazio do filtro: explica e oferece a saída.
            <Card><EstadoVazio icone={<Search className="h-6 w-6" aria-hidden />} titulo="Ninguém com esses filtros"
              descricao="Tente outro nome, área ou projeto, ou desmarque &quot;Só acima do limite&quot;."
              acao={temFiltro ? <Button variante="secundario" onClick={limpar}>Limpar filtros</Button> : undefined} /></Card>
          ) : (
            <>
              {/* DESKTOP E TABLET (md+): a matriz. max-h + overflow-auto: só esta caixa rola (nos dois sentidos),
                * e por isso o cabeçalho (sticky top) e a coluna dos nomes (sticky left) ficam presos. */}
              <Card className="hidden overflow-hidden md:block">
                <div className="rolagem max-h-[65vh] overflow-auto">
                  <table className="w-full border-separate border-spacing-0 text-sm">
                    <caption className="sr-only">Carga de cada profissional por semana, a partir de {dataBR(inicio)}. Cada célula abre o detalhe da semana.</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="sticky left-0 top-0 z-20 min-w-[220px] border-b border-borda bg-superficie px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-tinta-suave">Profissional</th>
                        {semanas.map((s) => (
                          <th key={s} scope="col" className={cx('sticky top-0 z-10 border-b border-borda bg-superficie px-2 py-3 text-center text-[12px] font-semibold tabular-nums text-tinta-suave', s === atual && 'text-primaria')}>
                            {rotuloSemana(s)}{s === atual && <span className="block text-[10px] font-medium uppercase">esta semana</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtradas.map(({ p, semanas: ss }) => {
                        const aberta = abertas.has(p.id);
                        // Alocações da pessoa que aparecem em alguma semana mostrada (para a quebra por projeto).
                        const alocacoesNoPeriodo = d.alocacoes.filter((a) => a.pessoaId === p.id && a.inicio <= fimDoPeriodo && a.fim >= inicio);
                        return (
                          <LinhaPessoa key={p.id} pessoa={p} semanas={ss} aberta={aberta} onAlternar={() => alternar(p.id)}
                            alocacoes={alocacoesNoPeriodo} nomeDoProjeto={(id) => d.projeto(id)?.nome ?? 'Projeto removido'}
                            onAbrir={(segunda) => setCelula({ pessoaId: p.id, segunda })} />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* CELULAR (< md): um card por pessoa com as próximas 4 semanas (a partir da primeira mostrada). */}
              <ul className="space-y-3 md:hidden">
                {filtradas.map(({ p, semanas: ss }) => (
                  <li key={p.id}>
                    <Card className="p-4">
                      <p className="font-semibold text-tinta">{p.nome}</p>
                      <p className="mb-3 text-[12px] text-tinta-suave">{p.area || 'Sem área'} · limite {p.cargaMax} h/sem</p>
                      <LinhaDeSemanas quem={p.nome} rotulo={`Carga de ${p.nome} nas próximas 4 semanas`}
                        semanas={ss.slice(0, 4).map((s) => ({ segunda: s.segunda, pct: s.pct, nivel: s.nivel }))}
                        onSelecionar={(segunda) => setCelula({ pessoaId: p.id, segunda })} />
                    </Card>
                  </li>
                ))}
              </ul>

              {/* Contagem no rodapé (§10). */}
              <p className="mt-3 text-[13px] text-tinta-suave" aria-live="polite">Mostrando {filtradas.length} de {profissionais.length} {profissionais.length !== 1 ? 'profissionais' : 'profissional'}.</p>
            </>
          )}
        </>
      )}

      {/* Painel lateral com o detalhe da semana (abre pelo clique ou Enter numa célula). */}
      {celula && <PainelDaSemana pessoaId={celula.pessoaId} segunda={celula.segunda} onFechar={() => setCelula(null)} />}
    </div>
  );
}

/**
 * Uma linha da matriz (a pessoa) e, quando aberta, as sub-linhas por projeto.
 * @param props.pessoa - o profissional.
 * @param props.semanas - ocupação dele em cada semana mostrada.
 * @param props.aberta - se a quebra por projeto está visível.
 * @param props.onAlternar - abre/fecha a quebra.
 * @param props.alocacoes - alocações dele que cruzam o período mostrado.
 * @param props.nomeDoProjeto - nome do projeto pelo id.
 * @param props.onAbrir - abre o painel da semana clicada.
 * @returns as linhas da tabela.
 */
function LinhaPessoa({ pessoa, semanas, aberta, onAlternar, alocacoes, nomeDoProjeto, onAbrir }: {
  pessoa: Pessoa; semanas: ReturnType<typeof ocupacaoNaSemana>[]; aberta: boolean; onAlternar: () => void;
  alocacoes: { id: string; projetoId: string; papel: string }[]; nomeDoProjeto: (id: string) => string; onAbrir: (segunda: string) => void;
}) {
  const idSub = `projetos-${pessoa.id}`;
  return (
    <>
      <tr className="group">
        {/* Cabeçalho da linha: nome fixo à esquerda (sticky left) + botão que abre a quebra por projeto. */}
        <th scope="row" className="sticky left-0 z-10 border-b border-borda bg-superficie px-2 py-2 text-left font-normal group-hover:bg-superficie-alt">
          <button type="button" onClick={onAlternar} aria-expanded={aberta} aria-controls={idSub}
            aria-label={`${aberta ? 'Esconder' : 'Mostrar'} a carga de ${pessoa.nome} por projeto`}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
            <ChevronDown className={cx('h-4 w-4 shrink-0 text-tinta-fraca transition-transform', aberta && 'rotate-180')} aria-hidden />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-tinta">{pessoa.nome}</span>
              <span className="block truncate text-[12px] text-tinta-suave">{pessoa.area || 'Sem área'} · {pessoa.cargaMax} h/sem</span>
            </span>
          </button>
        </th>
        {semanas.map((s) => (
          <td key={s.segunda} className="border-b border-borda px-1 py-2 text-center group-hover:bg-superficie-alt/60">
            {/* A célula é um botão: Tab chega nela e Enter abre o painel da semana. */}
            <button type="button" onClick={() => onAbrir(s.segunda)} aria-label={`${pessoa.nome}, semana de ${rotuloSemana(s.segunda)}: ${descreverCarga(s.pct, s.nivel)}`}
              className="rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
              <IndicadorCarga nivel={s.nivel} pct={s.pct} compacto decorativo />
            </button>
          </td>
        ))}
      </tr>
      {/* Quebra por projeto (§16: "cada colaborador em cada projeto"): uma sub-linha por alocação,
        * com as horas dela em cada semana (e os dias, quando não é a semana inteira). */}
      {aberta && (alocacoes.length === 0 ? (
        <tr id={idSub}>
          <td colSpan={semanas.length + 1} className="border-b border-borda bg-fundo/40 px-12 py-2 text-[12px] text-tinta-suave">Sem alocação no período mostrado.</td>
        </tr>
      ) : alocacoes.map((a, i) => (
        <tr key={a.id} id={i === 0 ? idSub : undefined} className="bg-fundo/40">
          <th scope="row" className="sticky left-0 z-10 border-b border-borda bg-fundo px-4 py-1.5 pl-12 text-left text-[12px] font-normal text-tinta-suave">
            <span className="block truncate font-medium text-tinta">{nomeDoProjeto(a.projetoId)}</span>{a.papel}
          </th>
          {semanas.map((s) => {
            const parte = s.porProjeto.find((x) => x.alocacaoId === a.id);
            return (
              <td key={s.segunda} className="border-b border-borda px-1 py-1.5 text-center text-[12px] tabular-nums text-tinta-suave">
                {parte ? <>{parte.carga} h{parte.diasAtivos < 5 && <span className="block text-[11px]">{parte.diasAtivos} dia{parte.diasAtivos > 1 ? 's' : ''}</span>}</> : <span aria-label="sem alocação nesta semana">—</span>}
              </td>
            );
          })}
        </tr>
      )))}
    </>
  );
}

/**
 * Painel lateral de uma célula: a ocupação de cada dia útil da semana e as alocações ativas.
 * @param props.pessoaId - quem.
 * @param props.segunda - a semana.
 * @param props.onFechar - fecha o painel.
 * @returns o Modal lateral.
 */
function PainelDaSemana({ pessoaId, segunda, onFechar }: { pessoaId: string; segunda: string; onFechar: () => void }) {
  const d = useDados();
  const pessoa = d.pessoa(pessoaId);
  if (!pessoa) return null;
  const s = ocupacaoNaSemana(pessoa, segunda, d);
  return (
    <Modal aberto lateral onFechar={onFechar} titulo={`${pessoa.nome} · semana de ${rotuloSemana(segunda)}`}
      descricao={`Pico de ${Math.round(s.pct)}% (${ROTULO_NIVEL[s.nivel].toLowerCase()}) · limite de ${pessoa.cargaMax} h por semana`}>
      <div className="space-y-6">
        <section aria-labelledby="dias-da-semana">
          <h3 id="dias-da-semana" className="mb-2 text-sm font-semibold text-tinta">Dia a dia</h3>
          <ul className="space-y-1.5">
            {s.porDia.map((dia, i) => (
              <li key={dia.dia} className="flex items-center justify-between gap-3 rounded-lg bg-superficie-alt/60 px-3 py-2 text-sm">
                <span className="text-tinta">{DIAS[i]} {dataBR(dia.dia).slice(0, 5)}</span>
                <span className="flex items-center gap-2 text-[12px] text-tinta-suave">{dia.horas} h/sem ativas
                  <IndicadorCarga nivel={nivelDaOcupacao(dia.pct)} pct={dia.pct} compacto rotulo={`${DIAS[i]} ${dataBR(dia.dia).slice(0, 5)}: ${descreverCarga(dia.pct, nivelDaOcupacao(dia.pct))}`} />
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="alocacoes-da-semana">
          <h3 id="alocacoes-da-semana" className="mb-2 text-sm font-semibold text-tinta">Alocações nesta semana</h3>
          {s.porProjeto.length === 0 ? <p className="text-sm text-tinta-suave">Sem alocação nesta semana: a pessoa está livre.</p> : (
            <ul className="space-y-2">
              {s.porProjeto.map((parte) => {
                const aloc = d.alocacoes.find((a) => a.id === parte.alocacaoId);
                const proj = d.projeto(parte.projetoId);
                return (
                  <li key={parte.alocacaoId} className="rounded-xl border border-borda p-3 text-sm">
                    <p className="font-semibold text-tinta">{proj?.nome ?? 'Projeto removido'}</p>
                    <p className="text-[13px] text-tinta-suave">{parte.papel} · {parte.carga} h/sem{aloc ? ` · ${dataBR(aloc.inicio).slice(0, 5)} a ${dataBR(aloc.fim).slice(0, 5)}` : ''}{parte.diasAtivos < 5 ? ` · ${parte.diasAtivos} dia${parte.diasAtivos > 1 ? 's' : ''} nesta semana` : ''}</p>
                    {/* NAVEGA: aba Equipe do projeto, onde a alocação é editada. */}
                    {proj && <Link href={`/projetos/${proj.id}?aba=equipe`} className="mt-1 inline-block rounded text-[13px] font-semibold text-primaria hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">Ver equipe do projeto</Link>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}

