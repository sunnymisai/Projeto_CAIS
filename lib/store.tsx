"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import type { Alocacao, Dados, Empresa, Pessoa, Projeto, Tarefa, Trilha } from './tipos';
import { criarSeed } from './seed';
import { hojeISO } from './utils';

/* ============================================================================
   CAMADA DE DADOS
   Guarda tudo no navegador (localStorage) para o protótipo funcionar sem
   back-end. Todas as telas usam apenas `useDados()`, então para ligar à API
   basta reescrever as ações abaixo com fetch — as telas não mudam.
   ============================================================================ */

const CHAVE = 'cais-dados-v1';

type Salvavel = 'empresas' | 'pessoas' | 'trilhas' | 'projetos' | 'alocacoes' | 'tarefas';
type ItemDe<K extends Salvavel> = Dados[K][number];

interface DadosCtx extends Dados {
  /** false enquanto carrega — as telas mostram esqueleto nesse estado */
  pronto: boolean;
  salvar: <K extends Salvavel>(colecao: K, item: ItemDe<K>) => void;
  remover: (colecao: Salvavel, id: string) => void;
  moverTarefa: (tarefaId: string, colunaId: string, indice: number) => void;
  restaurarDemonstracao: () => void;
  // atalhos de leitura
  empresa: (id: string) => Empresa | undefined;
  pessoa: (id: string) => Pessoa | undefined;
  projeto: (id: string) => Projeto | undefined;
  cargaDaPessoa: (pessoaId: string, ignorarAlocacaoId?: string) => number;
}

const Ctx = createContext<DadosCtx | null>(null);

export function DadosProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<Dados>(() => criarSeed());
  const [pronto, setPronto] = useState(false);
  const carregou = useRef(false);

  // Carrega do navegador (simula a latência da API para mostrar o esqueleto)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const bruto = localStorage.getItem(CHAVE);
        if (bruto) setDados(JSON.parse(bruto));
      } catch { /* dados corrompidos: fica com a demonstração */ }
      carregou.current = true;
      setPronto(true);
    }, 450);
    return () => clearTimeout(t);
  }, []);

  // Persiste a cada mudança, depois do carregamento inicial
  useEffect(() => {
    if (!carregou.current) return;
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch { /* cota cheia */ }
  }, [dados]);

  const salvar = useCallback(<K extends Salvavel>(colecao: K, item: ItemDe<K>) => {
    setDados((d) => {
      const lista = d[colecao] as ItemDe<K>[];
      const existe = lista.some((x) => x.id === item.id);
      return { ...d, [colecao]: existe ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item] };
    });
  }, []);

  const remover = useCallback((colecao: Salvavel, id: string) => {
    setDados((d) => {
      const prox = { ...d, [colecao]: (d[colecao] as { id: string }[]).filter((x) => x.id !== id) } as Dados;
      // Remoções em cascata
      if (colecao === 'projetos') {
        prox.tarefas = prox.tarefas.filter((t) => t.projetoId !== id);
        prox.alocacoes = prox.alocacoes.filter((a) => a.projetoId !== id);
      }
      return prox;
    });
  }, []);

  /** Move uma tarefa para outra coluna/posição e renumera a ordem. */
  const moverTarefa = useCallback((tarefaId: string, colunaId: string, indice: number) => {
    setDados((d) => {
      const alvo = d.tarefas.find((t) => t.id === tarefaId);
      if (!alvo) return d;
      const projeto = d.projetos.find((p) => p.id === alvo.projetoId);
      const ultima = projeto?.colunas[projeto.colunas.length - 1]?.id;
      const movida: Tarefa = {
        ...alvo,
        colunaId,
        concluidaEm: colunaId === ultima ? alvo.concluidaEm ?? hojeISO() : undefined,
      };
      const destino = d.tarefas
        .filter((t) => t.projetoId === alvo.projetoId && t.colunaId === colunaId && t.id !== tarefaId)
        .sort((a, b) => a.ordem - b.ordem);
      destino.splice(Math.max(0, Math.min(indice, destino.length)), 0, movida);
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

  const restaurarDemonstracao = useCallback(() => setDados(criarSeed()), []);

  const valor = useMemo<DadosCtx>(() => ({
    ...dados,
    pronto,
    salvar,
    remover,
    moverTarefa,
    restaurarDemonstracao,
    empresa: (id) => dados.empresas.find((e) => e.id === id),
    pessoa: (id) => dados.pessoas.find((p) => p.id === id),
    projeto: (id) => dados.projetos.find((p) => p.id === id),
    cargaDaPessoa: (pessoaId, ignorar) => dados.alocacoes
      .filter((a) => a.pessoaId === pessoaId && a.id !== ignorar && a.fim >= hojeISO())
      .reduce((s, a) => s + a.carga, 0),
  }), [dados, pronto, salvar, remover, moverTarefa, restaurarDemonstracao]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useDados() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDados precisa estar dentro de <DadosProvider>');
  return c;
}

/* Tipos reexportados para as telas importarem de um lugar só */
export type { Alocacao, Empresa, Pessoa, Projeto, Tarefa, Trilha };
