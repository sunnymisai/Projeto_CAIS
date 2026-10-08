/* ============================================================================
   MÉTRICAS (CÁLCULOS DERIVADOS)
   O que é: funções puras que calculam as entregas por projeto (painel da empresa), público, situação e prazo das trilhas (inclusive a visão do profissional), progresso dos projetos, os grupos de "Minhas tarefas", a carga da semana e o histórico de entregas, e rótulos/cores de status e prioridade.
   Onde é usado: app/(sistema)/painel, pessoas, projetos, projetos/[id], trilhas, trilhas/[id] e components/projetos/Equipe.tsx e Vistas.tsx.
   Depende de: lib/tipos.ts (Alocacao, Dados, Perfil, Pessoa, Prioridade, Projeto, Tarefa, Trilha) e lib/utils.ts (hojeISO, somaDias, diasEntre).
   Contexto: §4 (alcance das trilhas), §5 (equipe e tarefas), §6 (dashboards).
   ============================================================================ */

// ⚠️ ATENÇÃO: os imports levam a extensão .ts de propósito (tsconfig: allowImportingTsExtensions):
// lib/permissoes.ts importa publicoDaTrilha daqui e é testado com Node (permissoes.casos.ts),
// que só acha o módulo com a extensão. Tirar o ".ts" quebra o teste, não o app.
import type { Alocacao, Dados, Perfil, Pessoa, Prioridade, Projeto, Tarefa, Trilha } from './tipos.ts';
import { diasEntre, hojeISO, somaDias } from './utils.ts';

/* Cálculos derivados usados no painel e nas fichas. Nada aqui é salvo:
   tudo é recalculado a partir dos dados, como faria a API. */

/**
 * Quem deve cumprir a trilha, conforme o alcance (slide 5 e §4).
 * - geral: todos os profissionais E todas as pessoas de perfil Empresa ("todas as
 *   empresas e todos os profissionais"), menos as inativas;
 * - profissional: só as pessoas escolhidas em `pessoaIds`;
 * - empresa: quem está alocado em algum projeto daquela empresa E as pessoas de
 *   perfil Empresa vinculadas a ela (`pessoa.empresaId`), menos as inativas.
 * O administrador nunca entra no público: ele opera o programa, não cumpre trilha.
 * @param t - a trilha.
 * @param d - todos os dados (vindos de `useDados()`).
 * @returns lista de ids de pessoas, sem repetição.
 * @example publicoDaTrilha(trilhaDaVertice, d).includes('pes_marcos') // true: ele é da Vértice
 */
// TODO(PROGLOGIC): confirmar que a pessoa de perfil Empresa cumpre a trilha geral e a da sua empresa (§3: "cumpre a trilha dela").
export function publicoDaTrilha(t: Trilha, d: Dados): string[] {
  // Inativo não recebe trilha nova (§11: inativar mantém o histórico, mas tira da operação).
  const ativas = d.pessoas.filter((p) => p.status !== 'inativo');
  if (t.alcance === 'geral') return ativas.filter((p) => p.perfil === 'profissional' || p.perfil === 'empresa').map((p) => p.id);
  if (t.alcance === 'profissional') return t.pessoaIds;
  // Alcance 'empresa', parte 1: o profissional está "ligado à empresa" quando está alocado num projeto dela.
  // Set dos ids de projeto para a busca `has` ser rápida.
  const projetos = new Set(d.projetos.filter((p) => p.empresaId === t.empresaId).map((p) => p.id));
  const alocados = d.alocacoes.filter((a) => projetos.has(a.projetoId)).map((a) => a.pessoaId);
  // Parte 2: as contas da própria empresa (perfil Empresa com o vínculo).
  const daEmpresa = ativas.filter((p) => p.perfil === 'empresa' && p.empresaId === t.empresaId).map((p) => p.id);
  // O Set tira repetidos (a mesma pessoa pode estar em dois projetos da empresa).
  return [...new Set([...alocados, ...daEmpresa])];
}

/**
 * Em que pé uma pessoa está numa trilha.
 * @param t - a trilha.
 * @param pessoaId - id da pessoa.
 * @returns 'nao_iniciada', 'andamento' ou 'concluida'.
 * @example situacaoNaTrilha(trilhaCom5Etapas, 'pes_elisa') // 'andamento' (3 de 5)
 */
export function situacaoNaTrilha(t: Trilha, pessoaId: string) {
  const p = t.progresso[pessoaId];
  const total = t.etapas.length;
  // Sem registro de progresso ou com zero etapas feitas = ainda não começou.
  if (!p || p.concluidas === 0) return 'nao_iniciada' as const;
  // >= (e não ===) protege contra etapa removida depois que a pessoa já tinha concluído.
  if (p.concluidas >= total) return 'concluida' as const;
  return 'andamento' as const;
}

/**
 * Contagem do público da trilha por situação (para os cards e gráficos do painel).
 * @param t - a trilha.
 * @param d - todos os dados.
 * @returns `{ publico, concluida, andamento, nao_iniciada }` (números).
 */
export function resumoTrilha(t: Trilha, d: Dados) {
  const publico = publicoDaTrilha(t, d);
  const r = { publico: publico.length, concluida: 0, andamento: 0, nao_iniciada: 0 };
  // A situação devolvida é exatamente o nome do contador a somar.
  publico.forEach((id) => { r[situacaoNaTrilha(t, id)]++; });
  return r;
}

/**
 * Trilhas obrigatórias concluídas pela pessoa (coluna "Trilhas" da equipe).
 * Só conta trilhas publicadas em que a pessoa faz parte do público.
 * @param pessoaId - id da pessoa.
 * @param d - todos os dados.
 * @returns `{ total, concluidas }`, ex.: `{ total: 3, concluidas: 2 }` → "2/3".
 */
export function trilhasDaPessoa(pessoaId: string, d: Dados) {
  const minhas = d.trilhas.filter((t) => t.status === 'publicada' && publicoDaTrilha(t, d).includes(pessoaId));
  return { total: minhas.length, concluidas: minhas.filter((t) => situacaoNaTrilha(t, pessoaId) === 'concluida').length };
}

/**
 * Até quando a pessoa tem para concluir a trilha.
 * Conta a partir da data MAIS RECENTE entre a publicação da trilha e a entrada da pessoa:
 * quem já estava no programa conta da publicação; quem entrou depois, da própria entrada.
 * @param trilha - a trilha (precisa de `publicadaEm`).
 * @param pessoa - a pessoa (usa `dataEntrada`).
 * @returns a data limite (AAAA-MM-DD) ou null se a trilha nunca foi publicada.
 * @example prazoDaPessoaNaTrilha({ publicadaEm: '2026-10-01', prazoDias: 7 }, { dataEntrada: '2026-10-05' }) // '2026-10-12'
 */
// TODO(PROGLOGIC): confirmar regra (o deck diz "quando abre" e "até quando", mas não de onde o prazo conta).
export function prazoDaPessoaNaTrilha(trilha: Pick<Trilha, 'publicadaEm' | 'prazoDias'>, pessoa: Pick<Pessoa, 'dataEntrada'>): string | null {
  if (!trilha.publicadaEm) return null;
  // Comparar texto funciona porque o formato é AAAA-MM-DD; sem dataEntrada, vale a publicação.
  const inicio = pessoa.dataEntrada && pessoa.dataEntrada > trilha.publicadaEm ? pessoa.dataEntrada : trilha.publicadaEm;
  return somaDias(inicio, trilha.prazoDias);
}

/** Situação de um prazo: dentro, perto de vencer (3 dias ou menos) ou já vencido. */
export type SituacaoPrazo = 'no_prazo' | 'perto' | 'vencido';

/** Quantos dias antes do fim o prazo passa a contar como "perto" (§4: aviso quando está perto). */
export const DIAS_PRAZO_PERTO = 3;

/**
 * Classifica um prazo em relação a hoje.
 * @param prazo - data limite (AAAA-MM-DD).
 * @param hoje - data de referência (padrão: hoje); existe para facilitar teste.
 * @returns 'vencido' se já passou; 'perto' se faltam 3 dias ou menos (inclui hoje); senão 'no_prazo'.
 * @example situacaoDoPrazo('2026-10-09', '2026-10-07') // 'perto' (faltam 2 dias)
 */
export function situacaoDoPrazo(prazo: string, hoje: string = hojeISO()): SituacaoPrazo {
  const faltam = diasEntre(hoje, prazo);
  if (faltam < 0) return 'vencido';
  if (faltam <= DIAS_PRAZO_PERTO) return 'perto';
  return 'no_prazo';
}

/** Uma trilha vista pela pessoa: o que as telas do profissional precisam, já calculado. */
export interface TrilhaDaPessoa {
  trilha: Trilha;
  situacao: ReturnType<typeof situacaoNaTrilha>;
  /** Quantas etapas, das primeiras, a pessoa já concluiu (limitado ao total). */
  concluidas: number;
  total: number;
  /** Percentual de 0 a 100. */
  pct: number;
  /** Índice da próxima etapa a fazer, ou null se concluiu tudo. */
  proximaEtapa: number | null;
  /** Data limite (AAAA-MM-DD), ou null se a trilha não tem `publicadaEm`. */
  prazo: string | null;
  /** Situação do prazo; null quando concluída (prazo não importa mais) ou sem prazo. */
  situacaoPrazo: SituacaoPrazo | null;
  nota?: number;
  tentativas: number;
}

/**
 * Trilhas publicadas que a pessoa recebe, com progresso, próxima etapa e prazo.
 * Usada pelas telas do profissional (Minhas trilhas, player, painel).
 * Ordem: primeiro as não concluídas (prazo mais curto antes), depois as concluídas.
 * @param pessoaId - id da pessoa.
 * @param d - todos os dados.
 * @returns lista de `TrilhaDaPessoa` ([] se a pessoa não existir).
 * @example trilhasDaPessoaDetalhadas('pes_elisa', d)[0].proximaEtapa // 3 (a 4ª etapa)
 */
export function trilhasDaPessoaDetalhadas(pessoaId: string, d: Dados): TrilhaDaPessoa[] {
  const pessoa = d.pessoas.find((p) => p.id === pessoaId);
  if (!pessoa) return [];
  const lista = d.trilhas
    .filter((t) => t.status === 'publicada' && publicoDaTrilha(t, d).includes(pessoaId))
    .map((trilha): TrilhaDaPessoa => {
      const prog = trilha.progresso[pessoaId];
      const total = trilha.etapas.length;
      // Math.min: etapa removida depois da conclusão não pode dar "6 de 5".
      const concluidas = Math.min(prog?.concluidas ?? 0, total);
      const situacao = situacaoNaTrilha(trilha, pessoaId);
      const prazo = prazoDaPessoaNaTrilha(trilha, pessoa);
      return {
        trilha, situacao, concluidas, total,
        // Trilha sem etapas conta como 0% (evita divisão por zero).
        pct: total ? (concluidas / total) * 100 : 0,
        proximaEtapa: concluidas < total ? concluidas : null,
        prazo,
        situacaoPrazo: situacao !== 'concluida' && prazo ? situacaoDoPrazo(prazo) : null,
        nota: prog?.nota,
        tentativas: prog?.tentativas ?? 0,
      };
    });
  // Concluídas por último; entre as abertas, o prazo mais curto primeiro (sem prazo vai para o fim).
  return lista.sort((a, b) => {
    const fimA = a.situacao === 'concluida' ? 1 : 0;
    const fimB = b.situacao === 'concluida' ? 1 : 0;
    if (fimA !== fimB) return fimA - fimB;
    return (a.prazo ?? '9999-12-31').localeCompare(b.prazo ?? '9999-12-31');
  });
}

/**
 * Andamento de um projeto pelas tarefas.
 * @param projetoId - id do projeto.
 * @param d - todos os dados.
 * @returns `{ total, prontas, atrasadas, pct }` — `pct` vai de 0 a 100.
 */
export function progressoProjeto(projetoId: string, d: Dados) {
  const proj = d.projetos.find((p) => p.id === projetoId);
  const tarefas = d.tarefas.filter((t) => t.projetoId === projetoId);
  // ⚠️ ATENÇÃO: "pronta" = está na ÚLTIMA coluna do quadro (mesma regra de moverTarefa em lib/store.tsx).
  const ultima = proj?.colunas[proj.colunas.length - 1]?.id;
  const prontas = tarefas.filter((t) => t.colunaId === ultima).length;
  const hoje = hojeISO();
  // Atrasada = não está pronta e o prazo já passou. Comparar texto funciona porque o formato é AAAA-MM-DD.
  const atrasadas = tarefas.filter((t) => t.colunaId !== ultima && t.prazo < hoje).length;
  // Projeto sem tarefas fica em 0% (evita divisão por zero).
  return { total: tarefas.length, prontas, atrasadas, pct: tarefas.length ? (prontas / tarefas.length) * 100 : 0 };
}

/**
 * Entregas de um projeto para o painel da empresa (§6): aprovadas × aguardando revisão.
 * - aprovadas: tarefas na ÚLTIMA coluna do quadro (mesma regra de "pronta" em progressoProjeto);
 * - revisao: tarefas na PENÚLTIMA coluna, que no quadro padrão é "Revisão" (§5);
 * - emProducao: o resto (A fazer, Fazendo...).
 * Quadro com menos de 3 colunas não tem etapa de revisão: a penúltima seria "A fazer",
 * então `temRevisao` fica false e tudo que não está pronto conta como em produção.
 * TODO(PROGLOGIC): o deck fala em "entregas aprovadas"; não há passo de aprovação, então Pronto = aprovada.
 * @param projetoId - id do projeto.
 * @param d - todos os dados (só `projetos` e `tarefas` são lidos).
 * @returns `{ total, aprovadas, revisao, emProducao, temRevisao }`.
 * @example entregasDoProjeto('prj_portal', d) // { total: 8, aprovadas: 3, revisao: 1, emProducao: 4, temRevisao: true }
 */
export function entregasDoProjeto(projetoId: string, d: Pick<Dados, 'projetos' | 'tarefas'>) {
  const proj = d.projetos.find((p) => p.id === projetoId);
  const colunas = proj?.colunas ?? [];
  const ultima = colunas[colunas.length - 1]?.id;
  const temRevisao = colunas.length >= 3;
  const penultima = temRevisao ? colunas[colunas.length - 2].id : undefined;
  const tarefas = d.tarefas.filter((t) => t.projetoId === projetoId);
  const aprovadas = tarefas.filter((t) => t.colunaId === ultima).length;
  const revisao = penultima ? tarefas.filter((t) => t.colunaId === penultima).length : 0;
  return { total: tarefas.length, aprovadas, revisao, emProducao: tarefas.length - aprovadas - revisao, temRevisao };
}

/** Janela padrão de "Próximas entregas" na Visão geral do projeto, em dias (E02). */
export const DIAS_PROXIMAS_ENTREGAS = 14;

/**
 * Tarefas que vencem logo: ainda não estão prontas e o prazo cai entre hoje e hoje + `dias`.
 * Atrasadas ficam de fora de propósito (já aparecem no Andamento como "atrasadas").
 * @param projetoId - id do projeto.
 * @param d - todos os dados (só `projetos` e `tarefas` são lidos).
 * @param dias - tamanho da janela (padrão 14).
 * @param hoje - data de referência (padrão: hoje); existe para facilitar teste.
 * @returns as tarefas, do prazo mais próximo para o mais distante.
 * @example proximasEntregas('prj_portal', d) // tarefas com prazo de hoje até daqui a 14 dias
 */
export function proximasEntregas(projetoId: string, d: Pick<Dados, 'projetos' | 'tarefas'>, dias: number = DIAS_PROXIMAS_ENTREGAS, hoje: string = hojeISO()) {
  const proj = d.projetos.find((p) => p.id === projetoId);
  const ultima = proj?.colunas[proj.colunas.length - 1]?.id;
  const limite = somaDias(hoje, dias);
  // Comparar texto funciona porque as datas estão em AAAA-MM-DD.
  return d.tarefas
    .filter((t) => t.projetoId === projetoId && t.colunaId !== ultima && t.prazo >= hoje && t.prazo <= limite)
    .sort((a, b) => a.prazo.localeCompare(b.prazo));
}

/** Nome de cada perfil de acesso, em português (Meu perfil, Acessos). */
export const ROTULO_PERFIL: Record<Perfil, string> = { admin: 'Administrador', empresa: 'Empresa', profissional: 'Profissional' };

/**
 * Rótulos dos três status de empresa definidos no §11.
 * A chave (negociacao, ativa, encerrada) é o valor gravado; o texto é o que aparece na tela.
 * Usado em /empresas e no cabeçalho do painel da empresa.
 */
export const ROTULO_STATUS_EMPRESA = { negociacao: 'Em negociação', ativa: 'Ativa', encerrada: 'Encerrada' } as const;
/**
 * Cor da etiqueta por status de empresa: no CAIS cor tem significado (§9).
 * aviso = ainda negociando, sucesso = ativa, neutro = encerrada (não pede ação).
 */
export const TOM_STATUS_EMPRESA = { negociacao: 'aviso', ativa: 'sucesso', encerrada: 'neutro' } as const;

/** Texto exibido para cada status de projeto. */
export const ROTULO_STATUS_PROJETO = { planejado: 'Planejado', andamento: 'Em andamento', pausado: 'Pausado', concluido: 'Concluído' } as const;
/** Tom (cor semântica da etiqueta) de cada status de projeto. */
export const TOM_STATUS_PROJETO = { planejado: 'neutro', andamento: 'primaria', pausado: 'aviso', concluido: 'sucesso' } as const;
/** Texto exibido para cada prioridade. */
export const ROTULO_PRIORIDADE = { baixa: 'Baixa', media: 'Média', alta: 'Alta' } as const;
/** Tom de cada prioridade: alta usa a cor de erro para chamar atenção. */
export const TOM_PRIORIDADE = { baixa: 'neutro', media: 'aviso', alta: 'erro' } as const;

/* ---------------- Minhas tarefas (D04) ---------------- */

/** Ordem de urgência da prioridade (menor = mais urgente), para ordenar dentro de um grupo. */
const PESO_PRIORIDADE: Record<Prioridade, number> = { alta: 0, media: 1, baixa: 2 };

/** Quantos dias para trás uma tarefa concluída ainda aparece em "Concluídas recentemente". */
export const DIAS_CONCLUIDA_RECENTE = 7;

/** As tarefas de uma pessoa separadas pelo prazo (§12 fluxo 4: "vê o que é dele hoje"). */
export interface GruposDeTarefas {
  atrasadas: Tarefa[];
  hoje: Tarefa[];
  /** De amanhã até domingo desta semana. */
  semana: Tarefa[];
  depois: Tarefa[];
  /** Na última coluna do projeto, concluídas nos últimos DIAS_CONCLUIDA_RECENTE dias. */
  concluidas: Tarefa[];
}

/**
 * Domingo da semana de uma data (a semana vai de segunda a domingo).
 * @param iso - data AAAA-MM-DD.
 * @returns o domingo (AAAA-MM-DD); se a data já é domingo, ela mesma.
 * @example fimDaSemana('2026-10-07') // '2026-10-11' (quarta → domingo)
 */
export function fimDaSemana(iso: string): string {
  // getDay(): 0 = domingo, 1 = segunda... Meio-dia (T12) evita erro de fuso.
  const diaDaSemana = new Date(iso + 'T12:00:00').getDay();
  // Dias até domingo: domingo (0) → 0; segunda (1) → 6; sábado (6) → 1.
  return somaDias(iso, (7 - diaDaSemana) % 7);
}

/**
 * Separa as tarefas de uma pessoa em Atrasadas, Hoje, Esta semana, Depois e Concluídas recentemente.
 * "Concluída" = está na ÚLTIMA coluna do projeto (mesma regra de progressoProjeto e do quadro).
 * Dentro de cada grupo: prazo mais próximo primeiro e, no mesmo dia, prioridade alta antes.
 * Concluídas: as mais recentes primeiro.
 * @param tarefas - as tarefas da pessoa (já filtradas por responsável e escopo).
 * @param projetos - os projetos (para saber a última coluna de cada um).
 * @param hoje - data de referência (padrão: hoje); existe para facilitar teste.
 * @returns os cinco grupos.
 * @example agruparMinhasTarefas(tarefasDaAna, d.projetos).atrasadas.length // 1
 */
export function agruparMinhasTarefas(tarefas: Tarefa[], projetos: Projeto[], hoje: string = hojeISO()): GruposDeTarefas {
  const g: GruposDeTarefas = { atrasadas: [], hoje: [], semana: [], depois: [], concluidas: [] };
  const domingo = fimDaSemana(hoje);
  const limiteConcluida = somaDias(hoje, -DIAS_CONCLUIDA_RECENTE);
  for (const t of tarefas) {
    const projeto = projetos.find((p) => p.id === t.projetoId);
    // Tarefa de projeto que não existe mais: não mostra (não dá para abrir o detalhe).
    if (!projeto) continue;
    const pronta = t.colunaId === projeto.colunas[projeto.colunas.length - 1]?.id;
    if (pronta) {
      // Só as recentes; sem data de conclusão (dados antigos), usa o prazo como referência.
      if ((t.concluidaEm ?? t.prazo) >= limiteConcluida) g.concluidas.push(t);
      continue;
    }
    // Comparar texto funciona porque o formato é AAAA-MM-DD.
    if (t.prazo < hoje) g.atrasadas.push(t);
    else if (t.prazo === hoje) g.hoje.push(t);
    else if (t.prazo <= domingo) g.semana.push(t);
    else g.depois.push(t);
  }
  const porPrazo = (a: Tarefa, b: Tarefa) => a.prazo.localeCompare(b.prazo) || PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade];
  g.atrasadas.sort(porPrazo); g.hoje.sort(porPrazo); g.semana.sort(porPrazo); g.depois.sort(porPrazo);
  g.concluidas.sort((a, b) => (b.concluidaEm ?? b.prazo).localeCompare(a.concluidaEm ?? a.prazo));
  return g;
}

/* ---------------- Painel do profissional (D05) ---------------- */

/**
 * Segunda-feira da semana de uma data (a semana vai de segunda a domingo).
 * @param iso - data AAAA-MM-DD.
 * @returns a segunda (AAAA-MM-DD); se a data já é segunda, ela mesma.
 * @example inicioDaSemana('2026-10-07') // '2026-10-05' (quarta → segunda)
 */
export function inicioDaSemana(iso: string): string {
  // getDay(): 0 = domingo... 6 = sábado. Dias desde a segunda: domingo → 6; segunda → 0; quarta → 2.
  const diaDaSemana = new Date(iso + 'T12:00:00').getDay();
  return somaDias(iso, -((diaDaSemana + 6) % 7));
}

/** Um projeto na carga da semana. */
export interface ItemCarga { alocacao: Alocacao; projeto: Projeto }

/**
 * Carga da pessoa na semana de hoje: soma as horas semanais (`carga`) das alocações
 * cujo período cruza a semana (segunda a domingo).
 * Não julga se está alto ou baixo: o semáforo de carga por período é do bloco F (§16).
 * @param pessoaId - id da pessoa.
 * @param d - todos os dados.
 * @param hoje - data de referência (padrão: hoje).
 * @returns `{ total, limite, itens }`: total em h/sem, o limite da pessoa (`cargaMax`) e os projetos.
 * @example cargaDaSemana('pes_ana', d).total // 20
 */
export function cargaDaSemana(pessoaId: string, d: Dados, hoje: string = hojeISO()) {
  const seg = inicioDaSemana(hoje);
  const dom = fimDaSemana(hoje);
  const itens: ItemCarga[] = d.alocacoes
    // Cruza a semana = começa até domingo E termina a partir de segunda.
    .filter((a) => a.pessoaId === pessoaId && a.inicio <= dom && a.fim >= seg)
    .map((alocacao) => ({ alocacao, projeto: d.projetos.find((p) => p.id === alocacao.projetoId)! }))
    // Alocação de projeto apagado não conta.
    .filter((i) => !!i.projeto)
    // Maior carga primeiro.
    .sort((a, b) => b.alocacao.carga - a.alocacao.carga);
  const limite = d.pessoas.find((p) => p.id === pessoaId)?.cargaMax ?? 40;
  return { total: itens.reduce((s, i) => s + i.alocacao.carga, 0), limite, itens };
}

/** Entregas de uma semana (para o gráfico de histórico). */
export interface EntregasDaSemana {
  /** Segunda-feira da semana (AAAA-MM-DD). */
  inicio: string;
  /** Rótulo curto: dia/mês da segunda, ex.: "21/9". */
  rotulo: string;
  valor: number;
}

/**
 * Tarefas que a pessoa concluiu por semana, nas últimas `semanas` semanas (a atual é a última).
 * "Concluída" = está na última coluna do projeto e tem `concluidaEm` (sem a data, não dá para saber a semana).
 * @param pessoaId - id da pessoa (responsável pela tarefa).
 * @param d - todos os dados.
 * @param semanas - quantas semanas (padrão 8). Ignorado quando há `periodo`.
 * @param hoje - data de referência (padrão: hoje).
 * @param periodo - opcional (G01): as semanas que tocam o período, e só as entregas dentro dele.
 *   Sem período, o comportamento é o de antes (as últimas `semanas` semanas).
 * @returns uma entrada por semana, da mais antiga para a atual.
 * @example entregasPorSemana('pes_ana', d).at(-1) // { inicio: '2026-10-05', rotulo: '5/10', valor: 1 }
 */
export function entregasPorSemana(pessoaId: string, d: Dados, semanas = 8, hoje: string = hojeISO(), periodo?: Periodo): EntregasDaSemana[] {
  const segAtual = inicioDaSemana(hoje);
  // Segundas das semanas: as do período (G01) ou as N últimas, da mais antiga para a atual.
  const lista = periodo ? semanasDoPeriodo(periodo) : Array.from({ length: semanas }, (_, i) => somaDias(segAtual, -7 * (semanas - 1 - i)));
  const concluidas = d.tarefas.filter((t) => {
    if (t.responsavelId !== pessoaId || !t.concluidaEm) return false;
    const projeto = d.projetos.find((p) => p.id === t.projetoId);
    // Só conta se ainda está na última coluna (se voltou para "Fazendo", não é entrega).
    return !!projeto && t.colunaId === projeto.colunas[projeto.colunas.length - 1]?.id;
  });
  return lista.map((inicio) => {
    const fim = somaDias(inicio, 6);
    const [, m, dia] = inicio.split('-');
    return {
      inicio,
      rotulo: `${Number(dia)}/${Number(m)}`,
      // Comparar texto funciona porque o formato é AAAA-MM-DD. Com período, a semana é cortada nas pontas dele.
      valor: concluidas.filter((t) => t.concluidaEm! >= inicio && t.concluidaEm! <= fim && (!periodo || dentroDoPeriodo(t.concluidaEm!, periodo))).length,
    };
  });
}

/* ============================================================================
   PERÍODO (G01: filtros por período nos painéis)
   As funções abaixo recebem um período { de, ate } (datas AAAA-MM-DD, as duas
   pontas valem). Nas que já existiam, o período é OPCIONAL: sem ele, o
   comportamento continua o de antes.
   ============================================================================ */

/** Um intervalo de datas, com as duas pontas incluídas. */
export interface Periodo {
  /** Primeiro dia (AAAA-MM-DD). */
  de: string;
  /** Último dia (AAAA-MM-DD). */
  ate: string;
}

/**
 * Diz se uma data cai dentro do período (pontas incluídas).
 * @param data - AAAA-MM-DD.
 * @param p - o período.
 * @returns true se de <= data <= ate.
 * @example dentroDoPeriodo('2026-10-01', { de: '2026-09-08', ate: '2026-10-08' }) // true
 */
export function dentroDoPeriodo(data: string, p: Periodo): boolean {
  return data >= p.de && data <= p.ate;
}

/** Máximo de semanas num gráfico semanal (um período personalizado muito longo é cortado nas últimas). */
const MAX_SEMANAS = 52;

/**
 * Segundas-feiras das semanas que tocam o período (no máximo 52, as mais recentes).
 * @param p - o período.
 * @returns lista de segundas, da mais antiga para a mais recente.
 * @example semanasDoPeriodo({ de: '2026-10-01', ate: '2026-10-08' }) // ['2026-09-28', '2026-10-05']
 */
export function semanasDoPeriodo(p: Periodo): string[] {
  const lista: string[] = [];
  for (let s = inicioDaSemana(p.de); s <= p.ate; s = somaDias(s, 7)) lista.push(s);
  return lista.slice(-MAX_SEMANAS);
}

/** Uma conclusão de trilha: quem concluiu qual trilha e quando. */
export interface ConclusaoDeTrilha { trilhaId: string; pessoaId: string; data: string }

/**
 * Trilhas concluídas no período (cada pessoa que terminou uma trilha conta uma vez).
 * Só entram conclusões com data (`progresso.concluidaEm`); dados antigos sem a data ficam de fora.
 * @param d - todos os dados.
 * @param periodo - opcional; sem ele, todas as conclusões com data.
 * @returns as conclusões, da mais recente para a mais antiga.
 * @example trilhasConcluidasNoPeriodo(d, { de: '2026-09-08', ate: '2026-10-08' }).length // 3
 */
export function trilhasConcluidasNoPeriodo(d: Pick<Dados, 'trilhas'>, periodo?: Periodo): ConclusaoDeTrilha[] {
  const lista: ConclusaoDeTrilha[] = [];
  for (const t of d.trilhas) {
    for (const [pessoaId, p] of Object.entries(t.progresso)) {
      // Concluiu = fez todas as etapas e a data foi registrada.
      if (!p.concluidaEm || p.concluidas < t.etapas.length) continue;
      if (periodo && !dentroDoPeriodo(p.concluidaEm, periodo)) continue;
      lista.push({ trilhaId: t.id, pessoaId, data: p.concluidaEm });
    }
  }
  return lista.sort((a, b) => b.data.localeCompare(a.data));
}

/**
 * Turma: evolução ao longo do tempo (§6) = trilhas concluídas por semana do período.
 * @param d - todos os dados.
 * @param periodo - o período (as semanas que tocam ele).
 * @returns uma entrada por semana, no mesmo formato do histórico de entregas.
 * @example evolucaoDaTurma(d, ultimosDias(30)).map((s) => s.valor) // [0, 1, 0, 2, 0]
 */
export function evolucaoDaTurma(d: Pick<Dados, 'trilhas'>, periodo: Periodo): EntregasDaSemana[] {
  const conclusoes = trilhasConcluidasNoPeriodo(d, periodo);
  return semanasDoPeriodo(periodo).map((inicio) => {
    const fim = somaDias(inicio, 6);
    const [, m, dia] = inicio.split('-');
    return { inicio, rotulo: `${Number(dia)}/${Number(m)}`, valor: conclusoes.filter((c) => c.data >= inicio && c.data <= fim).length };
  });
}

/**
 * Tarefas concluídas (na última coluna, com `concluidaEm`) no período, somadas por empresa.
 * @param d - todos os dados.
 * @param periodo - opcional; sem ele, todas as concluídas com data.
 * @returns `{ empresaId, nome, total }` por empresa com pelo menos uma, do maior para o menor.
 * @example tarefasConcluidasPorEmpresa(d, ultimosDias(30))[0] // { empresaId: 'emp_vertice', nome: 'Vértice Logística', total: 5 }
 */
export function tarefasConcluidasPorEmpresa(d: Pick<Dados, 'tarefas' | 'projetos' | 'empresas'>, periodo?: Periodo) {
  const porEmpresa = new Map<string, number>();
  for (const t of d.tarefas) {
    const proj = d.projetos.find((p) => p.id === t.projetoId);
    // "Concluída" = está na última coluna e tem a data (a mesma regra do histórico de entregas).
    if (!proj || !t.concluidaEm || t.colunaId !== proj.colunas[proj.colunas.length - 1]?.id) continue;
    if (periodo && !dentroDoPeriodo(t.concluidaEm, periodo)) continue;
    porEmpresa.set(proj.empresaId, (porEmpresa.get(proj.empresaId) ?? 0) + 1);
  }
  return [...porEmpresa.entries()]
    .map(([empresaId, total]) => ({ empresaId, nome: d.empresas.find((e) => e.id === empresaId)?.nomeFantasia ?? 'Empresa removida', total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Entregas aprovadas de um projeto no período (painel da empresa, G01).
 * "Aprovada" = tarefa na última coluna com `concluidaEm` dentro do período (mesma regra de entregasDoProjeto).
 * @param projetoId - id do projeto.
 * @param d - todos os dados (só `projetos` e `tarefas` são lidos).
 * @param periodo - o período.
 * @returns quantas.
 * @example aprovadasNoPeriodo('prj_portal', d, ultimosDias(30)) // 4
 */
export function aprovadasNoPeriodo(projetoId: string, d: Pick<Dados, 'projetos' | 'tarefas'>, periodo: Periodo): number {
  const proj = d.projetos.find((p) => p.id === projetoId);
  const ultima = proj?.colunas[proj.colunas.length - 1]?.id;
  return d.tarefas.filter((t) => t.projetoId === projetoId && t.colunaId === ultima && !!t.concluidaEm && dentroDoPeriodo(t.concluidaEm, periodo)).length;
}

/** Atalhos do filtro de período (FiltroPeriodo). */
export type AtalhoPeriodo = '7' | '30' | '90' | 'mes' | 'personalizado';

/**
 * Os últimos N dias, contando hoje.
 * @param n - quantos dias.
 * @param hoje - data de referência (padrão: hoje).
 * @returns o período.
 * @example ultimosDias(7, '2026-10-08') // { de: '2026-10-02', ate: '2026-10-08' }
 */
export function ultimosDias(n: number, hoje: string = hojeISO()): Periodo {
  return { de: somaDias(hoje, -(n - 1)), ate: hoje };
}

/**
 * Do dia 1 do mês atual até hoje.
 * @param hoje - data de referência (padrão: hoje).
 * @returns o período.
 * @example esteMes('2026-10-08') // { de: '2026-10-01', ate: '2026-10-08' }
 */
export function esteMes(hoje: string = hojeISO()): Periodo {
  return { de: `${hoje.slice(0, 8)}01`, ate: hoje };
}

/**
 * Qual atalho gera exatamente este período (para o filtro marcar a opção certa ao abrir pela URL).
 * @param p - o período.
 * @param hoje - data de referência (padrão: hoje).
 * @returns o atalho, ou 'personalizado' se nenhum bate.
 * @example atalhoDoPeriodo(ultimosDias(30)) // '30'
 */
export function atalhoDoPeriodo(p: Periodo, hoje: string = hojeISO()): AtalhoPeriodo {
  for (const n of [7, 30, 90] as const) {
    const a = ultimosDias(n, hoje);
    if (a.de === p.de && a.ate === p.ate) return String(n) as AtalhoPeriodo;
  }
  const m = esteMes(hoje);
  // "Este mês" no dia 7 é igual a "últimos 7 dias"; os dias fixos acima têm a preferência.
  if (m.de === p.de && m.ate === p.ate) return 'mes';
  return 'personalizado';
}
