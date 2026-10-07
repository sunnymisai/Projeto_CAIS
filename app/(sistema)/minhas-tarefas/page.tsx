/* ============================================================================
   APP/(SISTEMA)/MINHAS-TAREFAS/PAGE.TSX (MINHAS TAREFAS)
   O que é: as tarefas em que a pessoa logada é responsável, de todos os projetos,
     agrupadas por prazo (Atrasadas, Hoje, Esta semana, Depois) e as concluídas
     recentemente (recolhidas), com filtros de projeto e prioridade. Clicar abre o
     detalhe da tarefa por cima da lista (?tarefa= na URL, como no quadro).
   Onde é usado: rota /minhas-tarefas (só perfil Profissional). Chega aqui pelo menu
     lateral (components/shell/navegacao.ts).
   Depende de: next/navigation (useRouter, useSearchParams), lib/auth.tsx (useAuth),
     lib/store.tsx (useDados), lib/escopo.ts (tarefasVisiveis), lib/metricas.ts
     (agruparMinhasTarefas, ROTULO_PRIORIDADE, TOM_PRIORIDADE), components/projetos/
     DetalheTarefa.tsx e cores.ts (corQuadro), components/ui/ e components/shell/Pagina.tsx.
   Contexto: §5 (tarefa com responsável, prazo, prioridade e checklist), §12 fluxo 4
     ("vê o que é dele hoje → abre a tarefa → registra o avanço → move de coluna") e §13.
   ============================================================================ */

// "use client": lê a sessão, a store e a URL (?tarefa=).
"use client";

import Link from 'next/link';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, ChevronDown, CircleAlert, CircleCheck, Clock, ListChecks, ListTodo, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { tarefasVisiveis } from '@/lib/escopo';
import { agruparMinhasTarefas, DIAS_CONCLUIDA_RECENTE, ROTULO_PRIORIDADE, TOM_PRIORIDADE } from '@/lib/metricas';
import type { Prioridade, Projeto, Tarefa } from '@/lib/tipos';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { Card, Esqueleto, EstadoVazio, Etiqueta, Aviso } from '@/components/ui/basicos';
import { Select } from '@/components/ui/form';
import Button, { classesBotao } from '@/components/button';
import DetalheTarefa from '@/components/projetos/DetalheTarefa';
import { corQuadro } from '@/components/projetos/cores';
import { cx, dataCurta, diasEntre, hojeISO } from '@/lib/utils';

/** Os grupos abertos, na ordem da tela (o de concluídas fica à parte, recolhido). */
const GRUPOS = [
  { chave: 'atrasadas', titulo: 'Atrasadas' },
  { chave: 'hoje', titulo: 'Hoje' },
  { chave: 'semana', titulo: 'Esta semana' },
  { chave: 'depois', titulo: 'Depois' },
] as const;

/**
 * Página Minhas tarefas.
 * ⚠️ ATENÇÃO: o <Suspense> é obrigatório porque a lista lê ?tarefa= com useSearchParams
 * (sem ele, o `npm run build` falha; notas-next16 §2).
 * @returns a página.
 */
export default function PaginaMinhasTarefas() {
  return <Suspense><MinhasTarefas /></Suspense>;
}

/**
 * Conteúdo de Minhas tarefas.
 * Estados (§13): carregando (esqueleto), erro (cadastro da sessão não encontrado; o erro
 * de leitura dos dados é tratado pelo layout), vazio, vazio por filtro e com dado.
 * @returns a lista com filtros e o detalhe aberto por cima.
 */
function MinhasTarefas() {
  const { sessao } = useAuth();
  const d = useDados();
  const router = useRouter();
  const params = useSearchParams();
  // Filtros ('' = todos). Ficam só no estado: recarregar a página limpa os filtros.
  const [fProjeto, setFProjeto] = useState('');
  const [fPrioridade, setFPrioridade] = useState('');
  // A seção "Concluídas recentemente" começa recolhida (o foco é o que falta fazer).
  const [verConcluidas, setVerConcluidas] = useState(false);

  // Tarefas da pessoa: responsável = ela, dentro do que o perfil enxerga (lib/escopo.ts).
  const minhas = useMemo(
    () => (sessao && d.pronto ? tarefasVisiveis(sessao, d).filter((t) => t.responsavelId === sessao.pessoaId) : []),
    [sessao, d],
  );
  // Filtros aplicados antes de agrupar (a contagem do rodapé usa as duas listas).
  const filtradas = useMemo(
    () => minhas.filter((t) => (!fProjeto || t.projetoId === fProjeto) && (!fPrioridade || t.prioridade === fPrioridade)),
    [minhas, fProjeto, fPrioridade],
  );
  const grupos = useMemo(() => agruparMinhasTarefas(filtradas, d.projetos), [filtradas, d.projetos]);
  // Total mostrado = os quatro grupos + as concluídas recentes (as antigas não entram na lista).
  const mostradas = grupos.atrasadas.length + grupos.hoje.length + grupos.semana.length + grupos.depois.length + grupos.concluidas.length;
  const totalSemFiltro = useMemo(() => {
    const g = agruparMinhasTarefas(minhas, d.projetos);
    return g.atrasadas.length + g.hoje.length + g.semana.length + g.depois.length + g.concluidas.length;
  }, [minhas, d.projetos]);

  // Detalhe aberto: só se a tarefa do ?tarefa= for mesmo da pessoa (URL digitada não abre tarefa alheia).
  const idAberta = params.get('tarefa');
  const tarefaAberta = idAberta && minhas.some((t) => t.id === idAberta) ? idAberta : null;
  /**
   * Abre (id) ou fecha (null) o detalhe mexendo só no ?tarefa= da URL.
   * NAVEGA: replace, para abrir/fechar o detalhe não encher o histórico do "voltar".
   * scroll: false mantém a lista onde estava.
   */
  const abrir = useCallback((id: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (id) q.set('tarefa', id); else q.delete('tarefa');
    const busca = q.toString();
    router.replace(busca ? `/minhas-tarefas?${busca}` : '/minhas-tarefas', { scroll: false });
  }, [params, router]);

  const cabecalho = <CabecalhoPagina titulo="Minhas tarefas" descricao="Tudo o que está com você, de todos os projetos, pelo prazo." />;
  const largura = 'mx-auto max-w-[960px] p-4 sm:p-6 lg:p-8';

  // Estado carregando: esqueleto no formato da lista.
  if (!d.pronto || !sessao) {
    return (
      <div className={largura}>
        {cabecalho}
        <div className="mb-5 grid gap-3 sm:grid-cols-2"><Esqueleto className="h-10" /><Esqueleto className="h-10" /></div>
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-20 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  // Estado de erro: a sessão aponta para uma pessoa que não está no cadastro.
  if (!d.pessoa(sessao.pessoaId)) {
    return <div className={largura}>{cabecalho}<Aviso tipo="erro" titulo="Não encontramos o seu cadastro">Saia e entre de novo. Se continuar, fale com o administrador do programa.</Aviso></div>;
  }

  // Estado vazio: nenhuma tarefa com a pessoa (nem concluída recente).
  if (totalSemFiltro === 0) {
    return (
      <div className={largura}>
        {cabecalho}
        <Card><EstadoVazio icone={<ListTodo className="h-6 w-6" aria-hidden />} titulo="Nenhuma tarefa com você. Bom trabalho!"
          descricao="Quando alguém atribuir uma tarefa a você num projeto, ela aparece aqui pelo prazo."
          acao={<Link href="/projetos" className={classesBotao({ variante: 'secundario' })}>Ver projetos</Link>} /></Card>
      </div>
    );
  }

  // Projetos das tarefas da pessoa (opções do filtro), em ordem alfabética.
  const projetosDasTarefas = [...new Set(minhas.map((t) => t.projetoId))].map((id) => d.projeto(id)).filter((p): p is Projeto => !!p)
    .sort((a, b) => a.nome.localeCompare(b.nome));
  const temFiltro = !!(fProjeto || fPrioridade);
  const limpar = () => { setFProjeto(''); setFPrioridade(''); };

  return (
    <div className={largura}>
      {cabecalho}

      {/* Filtros: um embaixo do outro no celular; lado a lado a partir de 640 px. */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Select label="Projeto" placeholder="Todos os projetos" value={fProjeto} onChange={(e) => setFProjeto(e.target.value)}
          opcoes={projetosDasTarefas.map((p) => ({ valor: p.id, rotulo: p.nome }))} />
        <Select label="Prioridade" placeholder="Todas as prioridades" value={fPrioridade} onChange={(e) => setFPrioridade(e.target.value)}
          opcoes={(['alta', 'media', 'baixa'] as Prioridade[]).map((p) => ({ valor: p, rotulo: ROTULO_PRIORIDADE[p] }))} />
      </div>

      {mostradas === 0 ? (
        // Vazio por filtro: explica e oferece a saída.
        <Card><EstadoVazio icone={<Search className="h-6 w-6" aria-hidden />} titulo="Nenhuma tarefa com esses filtros"
          descricao="Tente outro projeto ou outra prioridade." acao={<Button variante="secundario" onClick={limpar}>Limpar filtros</Button>} /></Card>
      ) : (
        <div className="space-y-8">
          {/* Grupos abertos; grupo vazio não aparece. */}
          {GRUPOS.map(({ chave, titulo }) => grupos[chave].length > 0 && (
            <section key={chave} aria-labelledby={`grupo-${chave}`}>
              <h2 id={`grupo-${chave}`} className={cx('mb-3 flex items-center gap-2 font-space text-base font-semibold', chave === 'atrasadas' ? 'text-erro' : 'text-tinta')}>
                {chave === 'atrasadas' && <CircleAlert className="h-4 w-4" aria-hidden />}
                {titulo} <span className="text-sm font-normal text-tinta-suave">({grupos[chave].length})</span>
              </h2>
              <ul className="space-y-2">
                {grupos[chave].map((t) => <li key={t.id}><ItemTarefa t={t} projeto={d.projeto(t.projetoId)!} onAbrir={abrir} /></li>)}
              </ul>
            </section>
          ))}

          {/* Concluídas recentemente: recolhida; o botão diz quantas há e se está aberta (aria-expanded). */}
          {grupos.concluidas.length > 0 && (
            <section aria-labelledby="grupo-concluidas">
              <h2 id="grupo-concluidas">
                <button type="button" onClick={() => setVerConcluidas((v) => !v)} aria-expanded={verConcluidas} aria-controls="lista-concluidas"
                  className="flex w-full items-center gap-2 rounded-lg py-1 text-left font-space text-base font-semibold text-tinta hover:text-primaria focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
                  <ChevronDown className={cx('h-4 w-4 transition-transform', verConcluidas && 'rotate-180')} aria-hidden />
                  Concluídas recentemente <span className="text-sm font-normal text-tinta-suave">({grupos.concluidas.length}, últimos {DIAS_CONCLUIDA_RECENTE} dias)</span>
                </button>
              </h2>
              {verConcluidas && (
                <ul id="lista-concluidas" className="mt-3 space-y-2">
                  {grupos.concluidas.map((t) => <li key={t.id}><ItemTarefa t={t} projeto={d.projeto(t.projetoId)!} onAbrir={abrir} concluida /></li>)}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      {/* Rodapé: contagem (e saída rápida quando há filtro). aria-live: avisa quando o filtro muda o número. */}
      <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-borda pt-4 text-[13px] text-tinta-suave" aria-live="polite">
        <span>Mostrando {mostradas} de {totalSemFiltro} tarefa{totalSemFiltro > 1 ? 's' : ''}</span>
        {temFiltro && <button type="button" onClick={limpar} className="rounded font-semibold text-primaria hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">Limpar filtros</button>}
      </p>

      {/* Detalhe por cima da lista (mesmo componente do quadro). Mudar o Status lá move a tarefa
        * (moverTarefa, respeitando podeFazer('mover_tarefa')); a lista se reorganiza sozinha. */}
      {tarefaAberta && <DetalheTarefa tarefaId={tarefaAberta} onFechar={() => abrir(null)} />}
    </div>
  );
}

/**
 * Texto, tom e ícone do prazo de uma tarefa (cor sempre com ícone e texto).
 * @param t - a tarefa.
 * @param concluida - true na seção de concluídas (mostra a data de conclusão).
 * @returns `{ texto, classe, Icone }`.
 */
function prazoDaTarefa(t: Tarefa, concluida: boolean) {
  if (concluida) return { texto: `Concluída${t.concluidaEm ? ` em ${dataCurta(t.concluidaEm)}` : ''}`, classe: 'text-sucesso', Icone: CircleCheck };
  const faltam = diasEntre(hojeISO(), t.prazo);
  if (faltam < 0) return { texto: `Atrasada há ${-faltam} dia${faltam < -1 ? 's' : ''}`, classe: 'text-erro font-semibold', Icone: CircleAlert };
  if (faltam === 0) return { texto: 'Vence hoje', classe: 'text-aviso font-semibold', Icone: Clock };
  if (faltam === 1) return { texto: 'Amanhã', classe: 'text-tinta-suave', Icone: CalendarDays };
  return { texto: dataCurta(t.prazo), classe: 'text-tinta-suave', Icone: CalendarDays };
}

/**
 * Um item da lista: um <button> (Enter/Espaço abrem o detalhe) com título, projeto,
 * prazo, prioridade e checklist.
 * @param props.t a tarefa.
 * @param props.projeto o projeto dela (cor do quadro como acento + nome em texto).
 * @param props.onAbrir abre o detalhe.
 * @param props.concluida true na seção de concluídas.
 * @returns o item.
 */
function ItemTarefa({ t, projeto, onAbrir, concluida = false }: { t: Tarefa; projeto: Projeto; onAbrir: (id: string) => void; concluida?: boolean }) {
  const prazo = prazoDaTarefa(t, concluida);
  const feitos = t.checklist.filter((c) => c.feito).length;
  // Cor do quadro do projeto (paleta escolhida pelo usuário em projetos/cores.ts): só acento.
  const cor = corQuadro(projeto.cor).solida;
  return (
    <button type="button" onClick={() => onAbrir(t.id)}
      // border-l-4 + borderLeftColor: a cor do projeto como faixa lateral; min-h 44 px de alvo de toque.
      className={cx('block min-h-[44px] w-full rounded-xl border border-l-4 border-borda bg-superficie p-3 text-left shadow-card transition-colors hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60',
        concluida && 'opacity-80')}
      style={{ borderLeftColor: cor }}>
      <span className={cx('block text-sm font-semibold text-tinta', concluida && 'line-through decoration-tinta-fraca')}>{t.titulo}</span>
      <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
        {/* Projeto: bolinha com a cor + nome escrito (cor nunca sozinha). */}
        <span className="inline-flex items-center gap-1.5 text-tinta-suave">
          <span className="h-2 w-2 rounded-full" style={{ background: cor }} aria-hidden />{projeto.nome}
        </span>
        <span className={cx('inline-flex items-center gap-1', prazo.classe)}><prazo.Icone className="h-3.5 w-3.5" aria-hidden />{prazo.texto}</span>
        <Etiqueta tom={TOM_PRIORIDADE[t.prioridade]}>Prioridade {ROTULO_PRIORIDADE[t.prioridade].toLowerCase()}</Etiqueta>
        {/* Checklist só quando existe. */}
        {t.checklist.length > 0 && (
          <span className="inline-flex items-center gap-1 text-tinta-suave"><ListChecks className="h-3.5 w-3.5" aria-hidden />{feitos}/{t.checklist.length}<span className="sr-only"> itens do checklist feitos</span></span>
        )}
      </span>
    </button>
  );
}
