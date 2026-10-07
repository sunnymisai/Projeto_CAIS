/* ============================================================================
   AUTH (AUTENTICAÇÃO)
   O que é: guarda quem está logado (a sessão) e oferece entrar() e sair() para o resto do sistema.
   Onde é usado: app/providers.tsx (monta o AuthProvider), app/(sistema)/layout.tsx (protege as rotas), app/(sistema)/painel/page.tsx, app/sem-permissao/page.tsx, components/LoginForm.tsx (useAuth e CONTA_DEMO), components/shell/Topbar.tsx e components/projetos/DetalheTarefa.tsx.
   Depende de: React (Context, useState, useEffect, useCallback), lib/tipos.ts (Perfil), localStorage e sessionStorage do navegador.
   Contexto: §3 (Perfis), §7 (autenticação no back é da PROGLOGIC), §12 e §15 item 1 (Login e primeiro acesso).
   ============================================================================ */

"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import type { Perfil } from './tipos';

/*
 * Nesta versão só o perfil ADMINISTRADOR entra no sistema.
 *
 * >>> PARA LIGAR NA API DA PROGLOGIC <<<
 * Troque o corpo de `autenticar()` por um fetch para o endpoint de login.
 * A API deve devolver o token e o perfil; guarde o token em `Sessao.token`
 * e envie-o no cabeçalho Authorization das próximas chamadas.
 */

/** Dados de quem está logado. Fica salva no navegador enquanto a sessão durar. */
export interface Sessao {
  /** id da pessoa em `Dados.pessoas` (liga a sessão ao cadastro). */
  pessoaId: string;
  /** Nome exibido no topo e no menu de perfil. */
  nome: string;
  /** E-mail usado no login. */
  email: string;
  /** Perfil que decide o que a pessoa pode ver (§3). */
  perfil: Perfil;
  /** Token de acesso. No protótipo é falso; com a API, vai no cabeçalho Authorization. */
  token: string;
}

/**
 * Resposta de `entrar()`.
 * - `{ ok: true }`: logou.
 * - `motivo: 'credenciais'`: e-mail ou senha errados.
 * - `motivo: 'perfil'`: senha certa, mas o perfil ainda não tem acesso nesta versão.
 */
type ResultadoLogin = { ok: true } | { ok: false; motivo: 'credenciais' | 'perfil' };

/** Contas de demonstração. Remova quando a API estiver ligada. */
// SIMULADO: e-mail e senha fixos no código, exibidos na tela de login (LoginForm).
// ⚠️ ATENÇÃO: components/LoginForm.tsx importa CONTA_DEMO; apagar isto quebra o login.
export const CONTA_DEMO = { email: 'admin@cais.com.br', senha: 'Cais@2026' };

// SIMULADO: "banco" de usuários fixo, com senhas em texto puro — só serve para o protótipo.
// TODO(API): apagar esta lista; quem confere e-mail e senha passa a ser a API.
const CONTAS = [
  { ...CONTA_DEMO, pessoaId: 'pes_admin', nome: 'Administrador CAIS', perfil: 'admin' as Perfil },
  // Perfis ainda sem acesso nesta versão (servem para testar o bloqueio)
  { email: 'ana.souza@cais.example', senha: 'Cais@2026', pessoaId: 'pes_ana', nome: 'Ana Souza', perfil: 'profissional' as Perfil },
  { email: 'marcos@vertice.example', senha: 'Cais@2026', pessoaId: 'pes_marcos', nome: 'Marcos Vieira', perfil: 'empresa' as Perfil },
];

// Nome da chave no localStorage/sessionStorage onde a sessão fica guardada.
const CHAVE = 'cais-sessao';

/**
 * Confere e-mail e senha e devolve a sessão (ou null se não bater).
 * @param email - e-mail digitado (espaços e maiúsculas são ignorados).
 * @param senha - senha digitada (diferencia maiúsculas).
 * @returns a `Sessao` da conta encontrada, ou `null` se as credenciais estiverem erradas.
 */
async function autenticar(email: string, senha: string): Promise<Sessao | null> {
  // TODO(API): todo este corpo vira um fetch POST para o endpoint de login da
  // PROGLOGIC, que devolve o token e o perfil; tratar erro de rede à parte.
  // SIMULADO: espera 700 ms para a tela mostrar o estado "entrando...".
  await new Promise((r) => setTimeout(r, 700)); // simula a latência da rede
  // SIMULADO: procura a conta na lista fixa; trim/toLowerCase evitam erro por espaço ou maiúscula.
  const conta = CONTAS.find((c) => c.email === email.trim().toLowerCase() && c.senha === senha);
  if (!conta) return null;
  // SIMULADO: token falso, só para o formato da sessão já ficar igual ao da API.
  return { pessoaId: conta.pessoaId, nome: conta.nome, email: conta.email, perfil: conta.perfil, token: `demo.${Date.now()}` };
}

/** O que `useAuth()` devolve. */
interface AuthCtx {
  /** Sessão atual, ou null se ninguém estiver logado. */
  sessao: Sessao | null;
  /** false até ler o armazenamento do navegador (evita redirecionar cedo demais) */
  pronto: boolean;
  /**
   * Tenta logar.
   * @example const r = await entrar(email, senha, true); if (!r.ok && r.motivo === 'perfil') ...
   */
  entrar: (email: string, senha: string, lembrar: boolean) => Promise<ResultadoLogin>;
  /** Desloga e apaga a sessão do navegador. */
  sair: () => void;
}

/** Contexto React que entrega a sessão para quem estiver dentro do AuthProvider. */
const Ctx = createContext<AuthCtx | null>(null);

/**
 * Lê a sessão salva no navegador.
 * Procura primeiro no localStorage ("Lembrar-me") e depois no sessionStorage.
 * @returns a sessão salva, ou null se não houver (ou se estiver corrompida).
 */
function lerSessao(): Sessao | null {
  // try/catch: navegação privada ou JSON corrompido não podem derrubar o app.
  try {
    const bruto = localStorage.getItem(CHAVE) ?? sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    return null;
  }
}

/**
 * Provedor da autenticação. Envolve o app inteiro (montado em app/providers.tsx).
 * @param children - a árvore que vai poder chamar `useAuth()`.
 * @returns o Provider com sessão, `pronto`, `entrar` e `sair`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [pronto, setPronto] = useState(false);

  // Roda UMA vez, depois que o componente aparece no navegador ([] = sem dependências).
  // Não tem limpeza. Fica num efeito porque o servidor não tem localStorage.
  useEffect(() => {
    // Leitura única do armazenamento do navegador, depois da hidratação.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessao(lerSessao());
    setPronto(true);
  }, []);

  /**
   * Faz o login.
   * @param email - e-mail digitado.
   * @param senha - senha digitada.
   * @param lembrar - true guarda no localStorage (sobrevive a fechar o navegador).
   * @returns `{ ok: true }` ou `{ ok: false, motivo }`.
   */
  const entrar = useCallback(async (email: string, senha: string, lembrar: boolean): Promise<ResultadoLogin> => {
    const s = await autenticar(email, senha);
    // Credenciais erradas: o LoginForm mostra o erro de e-mail/senha.
    if (!s) return { ok: false, motivo: 'credenciais' };
    // Nesta versão só o admin entra; os outros perfis vão para a mensagem de bloqueio.
    if (s.perfil !== 'admin') return { ok: false, motivo: 'perfil' };
    // GRAVA: salva a sessão no navegador (localStorage ou sessionStorage).
    // TODO(API): guardar o token devolvido pela API (de preferência em cookie httpOnly definido pelo back).
    try {
      // "Lembrar-me" → continua logado depois de fechar o navegador
      (lembrar ? localStorage : sessionStorage).setItem(CHAVE, JSON.stringify(s));
    } catch { /* navegação privada: sessão só em memória */ }
    setSessao(s);
    return { ok: true };
  }, []);

  /** Desloga: limpa a sessão da memória e dos dois armazenamentos. */
  const sair = useCallback(() => {
    // APAGA: remove a sessão dos dois lugares, porque não sabemos onde ela foi salva.
    // TODO(API): avisar a API para invalidar o token (logout no servidor).
    try {
      localStorage.removeItem(CHAVE);
      sessionStorage.removeItem(CHAVE);
    } catch { /* ignora */ }
    setSessao(null);
  }, []);

  return <Ctx.Provider value={{ sessao, pronto, entrar, sair }}>{children}</Ctx.Provider>;
}

/**
 * Hook para ler a sessão e chamar entrar/sair em qualquer tela.
 * @returns `{ sessao, pronto, entrar, sair }`.
 * @example const { sessao, sair } = useAuth();
 */
export function useAuth() {
  const c = useContext(Ctx);
  // Sem provider o contexto é null: falha logo, com mensagem clara.
  if (!c) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return c;
}
