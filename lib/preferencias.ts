/* ============================================================================
   PREFERENCIAS (PREFERÊNCIAS DA PESSOA LOGADA)
   O que é: hook que devolve a densidade das tabelas escolhida pela pessoa logada (confortável ou compacta).
   Onde é usado: components/ui/Tabela.tsx (aplica a densidade) e app/(sistema)/perfil/page.tsx (aba Preferências, que também grava a escolha).
   Depende de: lib/auth.tsx (useAuth: quem está logado), lib/store.tsx (useDados: a preferência fica no cadastro da pessoa) e lib/tipos.ts.
   Contexto: §8 (Onda 1: perfil e preferências) e §10 (tabelas densas).
   ============================================================================ */

"use client";

import { useAuth } from './auth';
import { useDados } from './store';
import type { Pessoa } from './tipos';

/** Densidade das tabelas: espaçamento das linhas. */
export type Densidade = NonNullable<Pessoa['densidadeTabela']>;

// [PV-1] Densidade das tabelas (confortável ou compacta): vem do cadastro da pessoa. Para mudar o padrão de quem nunca escolheu, troque o "confortavel" no fim.
/**
 * Densidade das tabelas da pessoa logada.
 * @returns 'compacta' ou 'confortavel' (padrão para quem nunca escolheu, para quem não está logado e enquanto os dados carregam).
 * @example const densidade = useDensidadeTabela(); // 'compacta'
 */
export function useDensidadeTabela(): Densidade {
  const { sessao } = useAuth();
  const d = useDados();
  // A preferência fica no cadastro da pessoa (Pessoa.densidadeTabela), por isso "por pessoa".
  const pessoa = sessao ? d.pessoa(sessao.pessoaId) : undefined;
  return pessoa?.densidadeTabela ?? 'confortavel';
}
