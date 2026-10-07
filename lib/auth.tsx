"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import type { Perfil } from './tipos';

/* ============================================================================
   AUTENTICAÇÃO
   Nesta versão só o perfil ADMINISTRADOR entra no sistema.

   >>> PARA LIGAR NA API DA PROGLOGIC <<<
   Troque o corpo de `autenticar()` por um fetch para o endpoint de login.
   A API deve devolver o token e o perfil; guarde o token em `Sessao.token`
   e envie-o no cabeçalho Authorization das próximas chamadas.
   ============================================================================ */

export interface Sessao {
  pessoaId: string;
  nome: string;
  email: string;
  perfil: Perfil;
  token: string;
}

type ResultadoLogin = { ok: true } | { ok: false; motivo: 'credenciais' | 'perfil' };

/** Contas de demonstração. Remova quando a API estiver ligada. */
export const CONTA_DEMO = { email: 'admin@cais.com.br', senha: 'Cais@2026' };

const CONTAS = [
  { ...CONTA_DEMO, pessoaId: 'pes_admin', nome: 'Administrador CAIS', perfil: 'admin' as Perfil },
  // Perfis ainda sem acesso nesta versão (servem para testar o bloqueio)
  { email: 'ana.souza@cais.example', senha: 'Cais@2026', pessoaId: 'pes_ana', nome: 'Ana Souza', perfil: 'profissional' as Perfil },
  { email: 'marcos@vertice.example', senha: 'Cais@2026', pessoaId: 'pes_marcos', nome: 'Marcos Vieira', perfil: 'empresa' as Perfil },
];

const CHAVE = 'cais-sessao';

async function autenticar(email: string, senha: string): Promise<Sessao | null> {
  await new Promise((r) => setTimeout(r, 700)); // simula a latência da rede
  const conta = CONTAS.find((c) => c.email === email.trim().toLowerCase() && c.senha === senha);
  if (!conta) return null;
  return { pessoaId: conta.pessoaId, nome: conta.nome, email: conta.email, perfil: conta.perfil, token: `demo.${Date.now()}` };
}

interface AuthCtx {
  sessao: Sessao | null;
  /** false até ler o armazenamento do navegador (evita redirecionar cedo demais) */
  pronto: boolean;
  entrar: (email: string, senha: string, lembrar: boolean) => Promise<ResultadoLogin>;
  sair: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function lerSessao(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE) ?? sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    // Leitura única do armazenamento do navegador, depois da hidratação.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessao(lerSessao());
    setPronto(true);
  }, []);

  const entrar = useCallback(async (email: string, senha: string, lembrar: boolean): Promise<ResultadoLogin> => {
    const s = await autenticar(email, senha);
    if (!s) return { ok: false, motivo: 'credenciais' };
    if (s.perfil !== 'admin') return { ok: false, motivo: 'perfil' };
    try {
      // "Lembrar-me" → continua logado depois de fechar o navegador
      (lembrar ? localStorage : sessionStorage).setItem(CHAVE, JSON.stringify(s));
    } catch { /* navegação privada: sessão só em memória */ }
    setSessao(s);
    return { ok: true };
  }, []);

  const sair = useCallback(() => {
    try {
      localStorage.removeItem(CHAVE);
      sessionStorage.removeItem(CHAVE);
    } catch { /* ignora */ }
    setSessao(null);
  }, []);

  return <Ctx.Provider value={{ sessao, pronto, entrar, sair }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return c;
}
