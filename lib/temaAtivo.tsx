/* ============================================================================
   TEMA ATIVO (PROVIDER QUE APLICA O TEMA NA PÁGINA)
   O que é: descobre qual tema vale para quem está na tela, escolhe a paleta do modo claro/escuro e grava as cores como variáveis CSS no <html>.
   Onde é usado: app/providers.tsx (monta o TemaProvider) e, via useTemaAtivo(), a tela do administrador em app/(sistema)/temas/ e components/temas/*.
   Depende de: lib/temas.ts (regras puras), lib/store.tsx (useDados: temas, pessoas, alocações), lib/auth.tsx (useAuth: perfil), lib/tema.ts (useTema: modo claro/escuro), lib/utils.ts (hojeISO) e o localStorage.
   Contexto: docs/temas-contrato.md (provider e anti-piscada) e §9 (design system).
   ============================================================================ */

"use client";

import { createContext, useContext, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useAuth } from './auth';
import { useDados } from './store';
import { useTema as useModoClaroEscuro } from './tema';
import { hojeISO } from './utils';
import { CHAVES_DO_TEMA, TEMAS_BASE, empresaDoTema, listaDeTemas, paletaDoTema, resolverTemaId } from './temas';
import type { ModoTema, Tema } from './temas';

/*
 * Por que o nome é "temaAtivo" e não "tema"?
 * Já existe lib/tema.ts (o botão claro/escuro). Os dois arquivos com o mesmo nome base (tema.ts e
 * tema.tsx) se confundiriam no import '@/lib/tema', que sempre acharia o .ts. Aqui vive só o tema
 * de CORES; o modo claro/escuro continua em lib/tema.ts e é lido por este arquivo.
 */

// [PV-1] A CHAVE do último conjunto de cores aplicado, usada contra o "piscar" ao abrir a página. O <script> de app/layout.tsx repete este nome: mude os dois juntos, senão a tela pisca no tema errado.
// ⚠️ ATENÇÃO: app/layout.tsx (themeScript) lê esta chave antes do React carregar. Quem grava é só este arquivo.
/** Chave do localStorage com `{ escuro, mapa }`: o último mapa de variáveis aplicado e para qual modo. */
export const CHAVE_TEMA_APLICADO = 'cais-tema-aplicado';

/** O que `useTemaAtivo()` devolve. */
export interface TemaCtx {
  /** O tema que está valendo para quem está na tela. */
  tema: Tema;
  /** Qual paleta está sendo usada agora. */
  modo: ModoTema;
  /** Todos os temas: os três base + os personalizados. */
  temas: Tema[];
}

/** Contexto com o tema ativo. Começa null: o hook avisa se faltar o provider. */
const Ctx = createContext<TemaCtx | null>(null);

/**
 * Provedor do tema. Deve ficar DENTRO do AuthProvider e do DadosProvider (app/providers.tsx).
 * Escolhe o tema, aplica as cores no <html> e guarda o último mapa para a próxima abertura.
 * @param children - a árvore de componentes.
 * @returns o Provider com `{ tema, modo, temas }`.
 */
export function TemaProvider({ children }: { children: ReactNode }) {
  const { sessao } = useAuth();
  const { temas: dadosTemas, pessoas, alocacoes, projetos, pronto, erro } = useDados();
  const { escuro } = useModoClaroEscuro();
  const modo: ModoTema = escuro ? 'escuro' : 'claro';
  // Ref (e não state): só lembra quais variáveis ESTE provider pôs no <html>, para limpar as que sobrarem. Mudar ref não redesenha.
  const aplicadas = useRef<string[]>([]);

  // [PV-2] QUEM VÊ QUAL TEMA: Administrador e telas públicas usam o padrão; Empresa usa o tema da sua empresa; Profissional usa o da empresa da primeira alocação ativa (sem alocação, o padrão). A regra mora em empresaDoTema e resolverTemaId (lib/temas.ts).
  // Recalcula só quando a sessão ou os dados mudam. Tema que não existe mais (apagado) cai no 'cais'.
  const tema = useMemo<Tema>(() => {
    const empresaId = empresaDoTema({ perfil: sessao?.perfil, pessoaId: sessao?.pessoaId, hoje: hojeISO(), pessoas, alocacoes, projetos });
    const id = resolverTemaId({ padraoId: dadosTemas.padraoId, porEmpresa: dadosTemas.porEmpresa, empresaId });
    const todos = listaDeTemas(dadosTemas.personalizados);
    return todos.find((t) => t.id === id) ?? TEMAS_BASE[0];
  }, [sessao, pessoas, alocacoes, projetos, dadosTemas]);

  const temas = useMemo(() => listaDeTemas(dadosTemas.personalizados), [dadosTemas.personalizados]);

  // Aplica as cores no <html>. Roda quando o tema, o modo ou o carregamento mudam. Não tem limpeza:
  // o tema continua valendo mesmo se o provider sair (ele só sai junto com a página).
  // Espera `pronto` (e sem erro): antes disso `dados` é a demonstração, e aplicar o tema dela apagaria
  // o que o script de app/layout.tsx já pôs, trazendo de volta o "piscar".
  // GRAVA: variáveis CSS em document.documentElement.style e o mapa em localStorage['cais-tema-aplicado'].
  useEffect(() => {
    if (!pronto || erro) return;
    const mapa = paletaDoTema(tema, modo);
    const estilo = document.documentElement.style;
    // APAGA: tira do <html> as variáveis do tema anterior que o tema novo não define
    // (as do contrato mais as que este provider pôs, caso o tema tenha trazido alguma extra).
    for (const chave of [...CHAVES_DO_TEMA, ...aplicadas.current]) {
      if (!(chave in mapa)) estilo.removeProperty(chave);
    }
    for (const [chave, valor] of Object.entries(mapa)) estilo.setProperty(chave, valor);
    aplicadas.current = Object.keys(mapa);
    try {
      localStorage.setItem(CHAVE_TEMA_APLICADO, JSON.stringify({ escuro, mapa }));
    } catch { /* localStorage bloqueado ou cheio: só perde a proteção contra o piscar */ }
  }, [tema, modo, escuro, pronto, erro]);

  const valor = useMemo<TemaCtx>(() => ({ tema, modo, temas }), [tema, modo, temas]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/**
 * Hook para ler o tema ativo, o modo (claro/escuro) e a lista de todos os temas.
 * Não confundir com `useTema` de lib/tema.ts, que só escolhe claro/escuro/sistema.
 * @returns `{ tema, modo, temas }`.
 * @example const { tema, temas } = useTemaAtivo(); temas.find((t) => t.id !== tema.id)
 */
export function useTemaAtivo(): TemaCtx {
  const c = useContext(Ctx);
  // Sem provider o contexto é null: falha logo, com mensagem clara.
  if (!c) throw new Error('useTemaAtivo precisa estar dentro de <TemaProvider>');
  return c;
}
