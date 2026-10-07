/* ============================================================================
   AUTH (AUTENTICAÇÃO)
   O que é: guarda quem está logado (a sessão), oferece entrar() e sair() e guarda as SENHAS SIMULADAS (definirSenha e conferirSenha).

   !!! SIMULADO, NUNCA PARA PRODUÇÃO !!!
   As senhas ficam em TEXTO PURO no localStorage ('cais-senhas-demo'), só para o protótipo
   funcionar sem back-end. Guardar, conferir e trocar senha é responsabilidade do back-end
   da PROGLOGIC (§7). Nada daqui pode ir para produção.

   Onde é usado: app/providers.tsx (monta o AuthProvider), app/(sistema)/layout.tsx (protege as rotas), app/(sistema)/painel/page.tsx, app/sem-permissao/page.tsx, components/LoginForm.tsx (useAuth e CONTAS_DEMO), components/RecuperarSenhaForm.tsx (definirSenha), components/shell/Topbar.tsx e components/projetos/DetalheTarefa.tsx.
   Depende de: React (Context, useState, useEffect, useCallback), lib/tipos.ts (Perfil), lib/store.tsx (lerPessoasSalvas: quem existe e em que status), localStorage e sessionStorage do navegador.
   Contexto: §3 (Perfis), §7 (autenticação no back é da PROGLOGIC), §12 e §15 item 1 (Login, recuperação de senha e primeiro acesso).
   ============================================================================ */

"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import type { Perfil } from './tipos';
import { lerPessoasSalvas } from './store';

/*
 * Os três perfis (Administrador, Empresa e Profissional) entram no sistema.
 * O que cada um pode abrir é decidido por lib/permissoes.ts (podeAcessar),
 * conferido pelo layout protegido; aqui só se confere e-mail e senha.
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
 */
type ResultadoLogin = { ok: true } | { ok: false; motivo: 'credenciais' };

// SIMULADO: senha inicial de TODA pessoa ativa do seed, até ela trocar a própria senha.
export const SENHA_DEMO = 'Cais@2026';

/** Contas de demonstração, uma por perfil (a Empresa tem duas: Vértice e Aurora). */
// SIMULADO: e-mails e senha fixos no código, listados no seletor "Entrar como…" do LoginForm.
// ⚠️ ATENÇÃO: components/LoginForm.tsx importa CONTAS_DEMO; apagar isto quebra o seletor.
// ⚠️ ATENÇÃO: os pessoaId precisam existir em lib/seed.ts (pessoas); senão o escopo
// de lib/escopo.ts não acha a empresa/alocações da conta e a pessoa vê tudo vazio.
// A conferência de verdade usa o cadastro (lerPessoasSalvas) e as senhas simuladas; esta lista só alimenta o seletor.
// ⚠️ ATENÇÃO: o seletor sempre preenche a senha inicial; depois que a pessoa troca a senha, o preenchimento deixa de funcionar (digite a nova).
// TODO(API): apagar junto com o seletor quando a API estiver ligada.
export const CONTAS_DEMO = [
  { rotulo: 'Administrador', email: 'admin@cais.com.br', senha: SENHA_DEMO, pessoaId: 'pes_admin', nome: 'Administrador CAIS', perfil: 'admin' as Perfil },
  { rotulo: 'Profissional · Ana Souza', email: 'ana.souza@cais.example', senha: SENHA_DEMO, pessoaId: 'pes_ana', nome: 'Ana Souza', perfil: 'profissional' as Perfil },
  { rotulo: 'Empresa Vértice · Marcos Vieira', email: 'marcos@vertice.example', senha: SENHA_DEMO, pessoaId: 'pes_marcos', nome: 'Marcos Vieira', perfil: 'empresa' as Perfil },
  { rotulo: 'Empresa Aurora · Patrícia Melo', email: 'patricia@aurora.example', senha: SENHA_DEMO, pessoaId: 'pes_patricia', nome: 'Patrícia Melo', perfil: 'empresa' as Perfil },
];

// Nome da chave no localStorage/sessionStorage onde a sessão fica guardada.
const CHAVE = 'cais-sessao';

// SIMULADO, NUNCA PARA PRODUÇÃO: chave do localStorage com as senhas trocadas, em texto puro,
// no formato { "email@minusculo": "senha" }. Só as funções de senha logo abaixo mexem nela.
// ⚠️ ATENÇÃO: nenhuma tela lê ou grava esta chave direto; sempre por definirSenha/conferirSenha.
// TODO(API): apagar; a senha passa a existir só no back-end (com hash), nunca no navegador.
const CHAVE_SENHAS = 'cais-senhas-demo';

/**
 * Lê o "banco" de senhas simuladas.
 * @returns o objeto e-mail → senha ({} se não houver nada salvo ou se estiver corrompido).
 */
function lerSenhas(): Record<string, string> {
  // try/catch: navegação privada ou JSON corrompido não podem derrubar o login.
  try {
    const bruto = localStorage.getItem(CHAVE_SENHAS);
    return bruto ? (JSON.parse(bruto) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * Define (ou troca) a senha de uma pessoa. Usada na recuperação de senha, no primeiro acesso e em Meu perfil.
 * @param email - e-mail de login da pessoa (espaços e maiúsculas são ignorados).
 * @param senha - a nova senha (as regras de força ficam em lib/senha.ts, conferidas pela tela).
 * @returns true se salvou; false se o navegador não deixou gravar (ex.: navegação privada).
 * @example definirSenha('ana.souza@cais.example', 'NovaSenha1') // a antiga Cais@2026 deixa de funcionar
 */
// GRAVA: escreve a senha em TEXTO PURO no localStorage (SIMULADO, NUNCA PARA PRODUÇÃO).
// TODO(API): virar POST/PATCH na API da PROGLOGIC; o back-end guarda só o hash.
export function definirSenha(email: string, senha: string): boolean {
  try {
    const todas = lerSenhas();
    todas[email.trim().toLowerCase()] = senha;
    localStorage.setItem(CHAVE_SENHAS, JSON.stringify(todas));
    return true;
  } catch {
    return false;
  }
}

/**
 * Confere se a senha bate com a da pessoa.
 * Quem nunca trocou a senha usa a senha inicial de demonstração (SENHA_DEMO).
 * @param email - e-mail de login da pessoa.
 * @param senha - senha digitada (diferencia maiúsculas).
 * @returns true se a senha confere.
 * @example conferirSenha('ana.souza@cais.example', 'Cais@2026') // true, até a Ana trocar a senha
 */
// TODO(API): apagar; quem confere a senha é a API.
export function conferirSenha(email: string, senha: string): boolean {
  const salva = lerSenhas()[email.trim().toLowerCase()];
  // Sem senha trocada: vale a senha inicial de demonstração.
  return senha === (salva ?? SENHA_DEMO);
}

/**
 * Confere e-mail e senha e devolve a sessão (ou null se não bater).
 * @param email - e-mail digitado (espaços e maiúsculas são ignorados).
 * @param senha - senha digitada (diferencia maiúsculas).
 * @returns a `Sessao` da pessoa encontrada, ou `null` se as credenciais estiverem erradas
 *   ou se a pessoa não estiver ativa (convidada ou inativa ainda não entram).
 */
async function autenticar(email: string, senha: string): Promise<Sessao | null> {
  // TODO(API): todo este corpo vira um fetch POST para o endpoint de login da
  // PROGLOGIC, que devolve o token e o perfil; tratar erro de rede à parte.
  // SIMULADO: espera 700 ms para a tela mostrar o estado "entrando...".
  await new Promise((r) => setTimeout(r, 700)); // simula a latência da rede
  // trim/toLowerCase evitam erro por espaço ou maiúscula no e-mail.
  const emailLimpo = email.trim().toLowerCase();
  // Senha primeiro: assim ninguém descobre o status de uma conta sem saber a senha.
  if (!conferirSenha(emailLimpo, senha)) return null;
  // SIMULADO: a pessoa vem do cadastro salvo no navegador (a mesma lista que /pessoas edita).
  const pessoa = lerPessoasSalvas().find((p) => p.email.toLowerCase() === emailLimpo);
  // E-mail desconhecido ou pessoa que ainda não é "ativa": não entra.
  if (!pessoa || pessoa.status !== 'ativo') return null;
  // SIMULADO: token falso, só para o formato da sessão já ficar igual ao da API.
  return { pessoaId: pessoa.id, nome: pessoa.nome, email: pessoa.email, perfil: pessoa.perfil, token: `demo.${Date.now()}` };
}

/** O que `useAuth()` devolve. */
interface AuthCtx {
  /** Sessão atual, ou null se ninguém estiver logado. */
  sessao: Sessao | null;
  /** false até ler o armazenamento do navegador (evita redirecionar cedo demais) */
  pronto: boolean;
  /**
   * Tenta logar.
   * @example const r = await entrar(email, senha, true); if (!r.ok) mostrarErro(r.motivo)
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
    // Os três perfis entram; o que cada um vê é decidido depois, por rota (lib/permissoes.ts).
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
