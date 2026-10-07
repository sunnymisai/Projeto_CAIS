/* ============================================================================
   STORE (CAMADA DE DADOS)
   O que é: o "banco de dados" do protótipo — guarda empresas, pessoas, trilhas, projetos, alocações e tarefas e expõe ações para ler, salvar e apagar.
   Onde é usado: app/providers.tsx (monta o DadosProvider), lib/auth.tsx (lerPessoasSalvas, para o login saber quem existe) e, via useDados(), nas telas de app/(sistema)/ (painel, empresas, pessoas, projetos, projetos/[id], trilhas, trilhas/[id]) e nos componentes components/projetos/* (Quadro, CartaoTarefa, DetalheTarefa, Equipe, FormProjeto, Vistas) e components/shell/Topbar.tsx.
   Depende de: React (Context, useState, useEffect, useMemo, useRef, useCallback), lib/tipos.ts, lib/seed.ts (dados de demonstração), lib/utils.ts (hojeISO) e o localStorage do navegador.
   Contexto: §5 (Projetos, alocação e tarefas), §7 (back-end é da PROGLOGIC), §14 (no protótipo, "ligado à store"), §16 (semáforo de carga).
   ============================================================================ */

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import type { Alocacao, Dados, Empresa, Pessoa, Projeto, Tarefa, Trilha } from './tipos';
import { criarSeed } from './seed';
import { hojeISO } from './utils';

/*
 * Por que existe uma store?
 * Guarda tudo no navegador (localStorage) para o protótipo funcionar sem
 * back-end. Todas as telas usam apenas `useDados()`, então para ligar à API
 * basta reescrever as ações abaixo com fetch — as telas não mudam.
 */

// ⚠️ ATENÇÃO: mudar esta chave faz o navegador "esquecer" os dados já salvos
// (todo mundo volta para a demonstração). Troque o "v1" só se o formato de
// `Dados` mudar de um jeito incompatível com o que já está gravado.
const CHAVE = 'cais-dados-v1';

/** As seis coleções que todo `Dados` precisa ter (usadas para conferir o que veio do navegador). */
const COLECOES = ['empresas', 'pessoas', 'trilhas', 'projetos', 'alocacoes', 'tarefas'] as const;

/**
 * Confere se o que foi lido do navegador tem o formato mínimo de `Dados`:
 * um objeto com as seis coleções, cada uma sendo uma lista.
 * Não confere campo por campo; só pega o caso de dado quebrado ou de outro formato.
 * @param valor - o resultado do JSON.parse.
 * @returns true se dá para usar como `Dados`.
 * @example formatoValido({ empresas: [] }) // false (faltam as outras cinco)
 */
function formatoValido(valor: unknown): valor is Dados {
  return typeof valor === 'object' && valor !== null
    && COLECOES.every((c) => Array.isArray((valor as Record<string, unknown>)[c]));
}

/** Mensagem do estado de erro: diz o que houve, sem termo técnico. */
const ERRO_LEITURA = 'Os dados salvos neste navegador estão danificados e não puderam ser lidos.';

/**
 * Lê as pessoas cadastradas direto do navegador, SEM precisar do DadosProvider.
 * Existe porque o AuthProvider fica FORA do DadosProvider (app/providers.tsx) e
 * o login precisa saber quem existe, qual o perfil e o status de cada pessoa.
 * Se ainda não houver nada salvo, devolve as pessoas da demonstração.
 * @returns a lista de pessoas (a mesma que as telas veem em `useDados().pessoas`).
 * @example lerPessoasSalvas().find((p) => p.email === 'ana.souza@cais.example')
 */
// ⚠️ ATENÇÃO: usa a mesma CHAVE da store; se a chave mudar, o login passa a ver só o seed.
// TODO(API): apagar; o login será feito pela API e não precisa da lista local de pessoas.
export function lerPessoasSalvas(): Pessoa[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return (JSON.parse(bruto) as Dados).pessoas;
  } catch { /* dados corrompidos ou localStorage bloqueado: cai na demonstração */ }
  return criarSeed().pessoas;
}

/**
 * Nomes das coleções que podem ser salvas/apagadas pelas ações genéricas
 * `salvar` e `remover`. São exatamente as chaves de `Dados`.
 */
type Salvavel = 'empresas' | 'pessoas' | 'trilhas' | 'projetos' | 'alocacoes' | 'tarefas';
/**
 * Tipo de UM item de uma coleção. Ex.: `ItemDe<'tarefas'>` é `Tarefa`.
 * (`Dados[K]` é um array; `[number]` pega o tipo de um elemento dele.)
 */
type ItemDe<K extends Salvavel> = Dados[K][number];

/**
 * Tudo o que `useDados()` devolve: as seis coleções de `Dados` + estado de
 * carregamento + ações + atalhos de leitura.
 */
interface DadosCtx extends Dados {
  /** false enquanto carrega — as telas mostram esqueleto nesse estado */
  pronto: boolean;
  /**
   * Mensagem quando a leitura falhou (dados danificados); null quando deu certo.
   * Com erro, o layout de (sistema) mostra o EstadoErro no lugar da tela.
   */
  erro: string | null;
  /** Tenta ler os dados de novo (volta a mostrar o esqueleto enquanto lê). */
  tentarDeNovo: () => void;
  /**
   * Cria o item se o `id` ainda não existe; se existe, substitui pelo novo.
   * @example d.salvar('empresas', { ...empresa, status: 'ativa' })
   */
  salvar: <K extends Salvavel>(colecao: K, item: ItemDe<K>) => void;
  /**
   * Apaga o item com esse `id`. Apagar um projeto apaga também as tarefas e
   * as alocações dele (cascata).
   * @example d.remover('tarefas', tarefa.id)
   */
  remover: (colecao: Salvavel, id: string) => void;
  /**
   * Move a tarefa para a coluna `colunaId` na posição `indice` (0 = topo).
   * @example d.moverTarefa('tar_1', 'col_pronto', 0)
   */
  moverTarefa: (tarefaId: string, colunaId: string, indice: number) => void;
  /** Joga fora tudo o que foi editado e volta aos dados de demonstração. */
  restaurarDemonstracao: () => void;
  /** Busca uma empresa pelo id (undefined se não existir). */
  empresa: (id: string) => Empresa | undefined;
  /** Busca uma pessoa pelo id (undefined se não existir). */
  pessoa: (id: string) => Pessoa | undefined;
  /** Busca um projeto pelo id (undefined se não existir). */
  projeto: (id: string) => Projeto | undefined;
  /**
   * Soma das horas semanais (`carga`) das alocações da pessoa que ainda não
   * terminaram. `ignorarAlocacaoId` serve para editar uma alocação sem contá-la
   * duas vezes.
   * @example d.cargaDaPessoa('pes_bruno') // 45 → passou de 40 h: mostra aviso
   */
  cargaDaPessoa: (pessoaId: string, ignorarAlocacaoId?: string) => number;
}

/** Contexto React que entrega os dados para quem estiver dentro do DadosProvider. */
const Ctx = createContext<DadosCtx | null>(null);

/**
 * Provedor da camada de dados. Deve envolver todas as telas internas
 * (é montado em app/providers.tsx).
 * @param children - a árvore de componentes que vai poder chamar `useDados()`.
 * @returns o Provider com dados + ações.
 */
export function DadosProvider({ children }: { children: ReactNode }) {
  // Começa com a demonstração para o primeiro desenho já ter conteúdo
  // (o servidor não tem localStorage; a leitura real acontece no useEffect).
  const [dados, setDados] = useState<Dados>(() => criarSeed());
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Muda a cada "Tentar de novo": é a dependência que faz o efeito de leitura rodar outra vez.
  const [tentativa, setTentativa] = useState(0);
  // Ref (e não state) porque só serve de "trava" para o efeito de salvar:
  // mudar um ref não provoca novo desenho da tela.
  const carregou = useRef(false);

  // Carrega do navegador (simula a latência da API para mostrar o esqueleto)
  // Roda ao abrir e de novo a cada "Tentar de novo" (dependência `tentativa`).
  // Limpeza: se o componente sair antes dos 450 ms, cancela o timer.
  // SIMULADO: o atraso de 450 ms finge o tempo de resposta de uma API.
  // TODO(API): trocar a leitura do localStorage por um fetch (GET) para a API da PROGLOGIC;
  // erro de rede ou 5xx também cai no setErro.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const bruto = localStorage.getItem(CHAVE);
        // Só substitui a demonstração se já houver algo salvo no navegador.
        if (bruto) {
          const lido: unknown = JSON.parse(bruto);
          // JSON válido mas sem as seis coleções também é dado danificado.
          if (!formatoValido(lido)) throw new Error('formato');
          setDados(lido);
        }
        setErro(null);
        // Libera o efeito de salvar (abaixo) somente depois de uma leitura que deu certo.
        carregou.current = true;
      } catch {
        // ⚠️ ATENÇÃO: com erro, `carregou` continua false de propósito: assim o efeito de
        // salvar NÃO grava a demonstração por cima do que estava no navegador.
        setErro(ERRO_LEITURA);
      }
      setPronto(true);
    }, 450);
    return () => clearTimeout(t);
  }, [tentativa]);

  /** Lê de novo: mostra o esqueleto e repete a leitura (o efeito acima roda outra vez). */
  const tentarDeNovo = useCallback(() => {
    setPronto(false);
    setTentativa((n) => n + 1);
  }, []);

  // Persiste a cada mudança, depois do carregamento inicial
  // Roda sempre que `dados` muda. Não tem limpeza.
  // GRAVA: escreve TODOS os dados no localStorage do navegador.
  // TODO(API): some daqui — cada ação (salvar/remover/moverTarefa) fará seu próprio fetch.
  useEffect(() => {
    // Sem esta trava, o primeiro desenho gravaria a demonstração por cima
    // do que a pessoa já tinha salvo, antes mesmo de ler.
    if (!carregou.current) return;
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch { /* cota cheia */ }
  }, [dados]);

  /**
   * Cria ou atualiza um item de qualquer coleção (o "upsert").
   * @param colecao - nome da coleção, ex.: 'empresas'.
   * @param item - o item completo; o `id` decide se é novo ou edição.
   */
  // GRAVA: altera a coleção na store (e, pelo efeito acima, no localStorage).
  // TODO(API): virar fetch POST (item novo) ou PUT/PATCH (item existente).
  const salvar = useCallback(<K extends Salvavel>(colecao: K, item: ItemDe<K>) => {
    setDados((d) => {
      const lista = d[colecao] as ItemDe<K>[];
      // Se já existe um item com o mesmo id, é edição; senão, é criação.
      const existe = lista.some((x) => x.id === item.id);
      // Nunca altera o array antigo: cria um novo (o React só redesenha se a referência mudar).
      return { ...d, [colecao]: existe ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item] };
    });
  }, []);

  /**
   * Apaga um item de qualquer coleção pelo id.
   * @param colecao - nome da coleção, ex.: 'projetos'.
   * @param id - id do item a apagar.
   */
  // APAGA: remove o item da coleção indicada. Cascata SÓ para 'projetos':
  // apagar um projeto apaga também TODAS as tarefas (tarefas.projetoId) e
  // TODAS as alocações (alocacoes.projetoId) daquele projeto.
  // Nenhuma outra coleção tem cascata: apagar empresa NÃO apaga os projetos
  // dela, e apagar pessoa NÃO apaga alocações nem tarefas em que ela aparece
  // (ficam apontando para um id que não existe mais).
  // TODO(API): virar fetch DELETE; a cascata passa a ser responsabilidade do back-end.
  const remover = useCallback((colecao: Salvavel, id: string) => {
    setDados((d) => {
      const prox = { ...d, [colecao]: (d[colecao] as { id: string }[]).filter((x) => x.id !== id) } as Dados;
      // Remoções em cascata
      // Tarefa e alocação sem projeto não fazem sentido e quebrariam o quadro e a equipe.
      if (colecao === 'projetos') {
        prox.tarefas = prox.tarefas.filter((t) => t.projetoId !== id);
        prox.alocacoes = prox.alocacoes.filter((a) => a.projetoId !== id);
      }
      return prox;
    });
  }, []);

  /** Move uma tarefa para outra coluna/posição e renumera a ordem. */
  // GRAVA: altera colunaId, ordem e concluidaEm das tarefas afetadas.
  // TODO(API): virar fetch PATCH; com WebSocket (§5) os colegas veem o cartão mudar.
  const moverTarefa = useCallback((tarefaId: string, colunaId: string, indice: number) => {
    setDados((d) => {
      const alvo = d.tarefas.find((t) => t.id === tarefaId);
      // Tarefa não encontrada (ex.: apagada por outra aba): não muda nada.
      if (!alvo) return d;
      const projeto = d.projetos.find((p) => p.id === alvo.projetoId);
      // A última coluna do projeto ("Pronto") é a que conta como concluída.
      const ultima = projeto?.colunas[projeto.colunas.length - 1]?.id;
      // Entrou na última coluna: guarda a data de conclusão (mantém a antiga
      // se já tinha). Saiu dela: apaga a data, porque voltou a estar aberta.
      const movida: Tarefa = {
        ...alvo,
        colunaId,
        concluidaEm: colunaId === ultima ? alvo.concluidaEm ?? hojeISO() : undefined,
      };
      // Cartões que já estão na coluna de destino, em ordem, sem a tarefa movida.
      const destino = d.tarefas
        .filter((t) => t.projetoId === alvo.projetoId && t.colunaId === colunaId && t.id !== tarefaId)
        .sort((a, b) => a.ordem - b.ordem);
      // Encaixa a tarefa na posição pedida; o min/max protege contra índice fora da lista.
      destino.splice(Math.max(0, Math.min(indice, destino.length)), 0, movida);
      // Renumera 0, 1, 2... para a ordem nunca ficar com buracos ou repetida.
      const novaOrdem = new Map(destino.map((t, i) => [t.id, i]));
      return {
        ...d,
        tarefas: d.tarefas.map((t) => {
          if (t.id === tarefaId) return { ...movida, ordem: novaOrdem.get(t.id)! };
          return novaOrdem.has(t.id) ? { ...t, ordem: novaOrdem.get(t.id)! } : t;
        }),
      };
    });
  }, []);

  // GRAVA: substitui tudo pela demonstração (o efeito de persistir grava no localStorage).
  // APAGA: tudo o que foi criado ou editado no navegador se perde.
  // Também é a saída do estado de erro: libera a gravação (carregou) e limpa o erro,
  // para a demonstração substituir os dados danificados.
  const restaurarDemonstracao = useCallback(() => {
    carregou.current = true;
    setErro(null);
    setDados(criarSeed());
  }, []);

  // useMemo: só cria um novo objeto quando algo da lista de dependências muda,
  // evitando redesenhar todas as telas a cada desenho do provider.
  const valor = useMemo<DadosCtx>(() => ({
    ...dados,
    pronto,
    erro,
    tentarDeNovo,
    salvar,
    remover,
    moverTarefa,
    restaurarDemonstracao,
    empresa: (id) => dados.empresas.find((e) => e.id === id),
    pessoa: (id) => dados.pessoas.find((p) => p.id === id),
    projeto: (id) => dados.projetos.find((p) => p.id === id),
    // Soma a carga (h/sem) das alocações da pessoa cujo fim é hoje ou depois.
    // ⚠️ ATENÇÃO: limitação atual — soma TODAS as alocações que terminam a
    // partir de hoje, mesmo as que nunca se sobrepõem no tempo (ex.: uma que
    // acaba em 7 dias e outra que só começa daqui a 1 mês contam juntas).
    // Por isso o aviso de "mais de 40 h" pode aparecer sem a pessoa estar de
    // fato sobrecarregada. Será substituída pelo semáforo de carga por período
    // (bloco F, §16). Quem usa: painel, pessoas, Equipe e Topbar — mudar a
    // assinatura quebra essas telas.
    cargaDaPessoa: (pessoaId, ignorar) => dados.alocacoes
      .filter((a) => a.pessoaId === pessoaId && a.id !== ignorar && a.fim >= hojeISO())
      .reduce((s, a) => s + a.carga, 0),
  }), [dados, pronto, erro, tentarDeNovo, salvar, remover, moverTarefa, restaurarDemonstracao]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/**
 * Hook que as telas usam para ler e alterar os dados.
 * @returns dados, `pronto`, ações (`salvar`, `remover`, `moverTarefa`...) e atalhos.
 * @example const d = useDados(); const empresa = d.empresa(projeto.empresaId);
 */
export function useDados() {
  const c = useContext(Ctx);
  // Sem provider o contexto é null: falha logo, com mensagem clara, em vez de quebrar depois.
  if (!c) throw new Error('useDados precisa estar dentro de <DadosProvider>');
  return c;
}

/* Tipos reexportados para as telas importarem de um lugar só */
export type { Alocacao, Empresa, Pessoa, Projeto, Tarefa, Trilha };
