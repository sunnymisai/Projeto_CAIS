/* ============================================================================
   AUTH (AUTENTICAÇÃO)
   O que é: guarda quem está logado (a sessão), oferece entrar(), iniciarSessao(), atualizarSessao() e sair() e guarda as SENHAS SIMULADAS (definirSenha e conferirSenha).

   !!! SIMULADO, NUNCA PARA PRODUÇÃO !!!
   As senhas ficam em TEXTO PURO no localStorage ('cais-senhas-demo'), só para o protótipo
   funcionar sem back-end. Guardar, conferir e trocar senha é responsabilidade do back-end
   da PROGLOGIC (§7). Nada daqui pode ir para produção.

   Onde é usado: app/providers.tsx (monta o AuthProvider), app/(sistema)/layout.tsx (protege as rotas), app/(sistema)/painel/page.tsx, app/sem-permissao/page.tsx, components/LoginForm.tsx (useAuth e CONTAS_DEMO), components/RecuperarSenhaForm.tsx (definirSenha), components/PrimeiroAcessoForm.tsx (definirSenha e iniciarSessao), app/(sistema)/acessos/page.tsx (lerUltimosAcessos, definirSenha e SENHA_DEMO), components/shell/Topbar.tsx e components/projetos/DetalheTarefa.tsx.
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
 * - `motivo: 'inativo'`: e-mail e senha certos, mas a conta foi inativada pelo administrador (§11).
 * - `motivo: 'convidado'`: e-mail e senha certos, mas a pessoa ainda não fez o primeiro acesso (convite pendente).
 * Os dois últimos só aparecem para quem acertou a senha, para não revelar o status de contas alheias.
 */
type MotivoRecusa = 'credenciais' | 'inativo' | 'convidado';
type ResultadoLogin = { ok: true } | { ok: false; motivo: MotivoRecusa };

// [PV-1] Senha inicial de TODA conta ativa do seed ("Cais@2026"). Mudar aqui muda a senha de demonstração e o texto da tela de login.
// SIMULADO: senha inicial de TODA pessoa ativa do seed, até ela trocar a própria senha.
export const SENHA_DEMO = 'Cais@2026';

// [PV-2] Contas de demonstração do login (botões "Entrar como" e a lista na tela). Conta nova no botão: acrescente aqui e a pessoa em seed.ts.
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

// [PV-3] Chave onde a sessão fica no navegador. Trocar o nome desloga todo mundo e exige ajustar os testes e o script de tema.
// Nome da chave no localStorage/sessionStorage onde a sessão fica guardada.
const CHAVE = 'cais-sessao';

// [PV-4] Chave das senhas trocadas (texto puro, SÓ para o protótipo). TODO(API): apagar; a senha passa a existir só no back-end, com hash.
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

// [PV-5] Conferência da senha do login: vale a senha trocada ou, se nunca trocou, SENHA_DEMO. TODO(API): quem confere é a API.
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

// SIMULADO: chave do localStorage com o último login de cada pessoa, no formato { pessoaId: "AAAA-MM-DDTHH:mm:ss.sssZ" }.
// ⚠️ ATENÇÃO: só registrarUltimoAcesso e lerUltimosAcessos mexem nela; app/(sistema)/acessos mostra o valor.
// TODO(API): apagar; o "último acesso" vem da API junto com o cadastro da pessoa.
const CHAVE_ULTIMO_ACESSO = 'cais-ultimo-acesso';

/**
 * Anota agora como o último acesso da pessoa.
 * @param pessoaId - id da pessoa que acabou de entrar.
 */
// GRAVA: escreve a data-hora do login no localStorage (chave 'cais-ultimo-acesso').
function registrarUltimoAcesso(pessoaId: string) {
  try {
    const todos = lerUltimosAcessos();
    todos[pessoaId] = new Date().toISOString();
    localStorage.setItem(CHAVE_ULTIMO_ACESSO, JSON.stringify(todos));
  } catch { /* navegação privada: simplesmente não registra */ }
}

/**
 * Lê o último acesso de todas as pessoas (para a tela de Acessos).
 * @returns objeto pessoaId → data-hora ISO ({} se ninguém entrou ainda ou se o armazenamento falhar).
 * @example lerUltimosAcessos()['pes_ana'] // '2026-10-07T14:03:11.000Z'
 */
export function lerUltimosAcessos(): Record<string, string> {
  try {
    const bruto = localStorage.getItem(CHAVE_ULTIMO_ACESSO);
    return bruto ? (JSON.parse(bruto) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

// [PV-6] Regras do login, nesta ordem: senha certa, pessoa existe, conta inativa, convite pendente. Latência simulada de 700 ms. Aqui entra o fetch da API.
/**
 * Confere e-mail e senha e devolve a sessão (ou o motivo da recusa).
 * @param email - e-mail digitado (espaços e maiúsculas são ignorados).
 * @param senha - senha digitada (diferencia maiúsculas).
 * @returns a `Sessao` da pessoa encontrada, ou o motivo da recusa: 'credenciais' (e-mail ou senha errados),
 *   'inativo' (conta inativada) ou 'convidado' (ainda não fez o primeiro acesso).
 */
async function autenticar(email: string, senha: string): Promise<Sessao | MotivoRecusa> {
  // TODO(API): todo este corpo vira um fetch POST para o endpoint de login da
  // PROGLOGIC, que devolve o token e o perfil; tratar erro de rede à parte.
  // SIMULADO: espera 700 ms para a tela mostrar o estado "entrando...".
  await new Promise((r) => setTimeout(r, 700)); // simula a latência da rede
  // trim/toLowerCase evitam erro por espaço ou maiúscula no e-mail.
  const emailLimpo = email.trim().toLowerCase();
  // Senha primeiro: assim ninguém descobre o status de uma conta sem saber a senha.
  if (!conferirSenha(emailLimpo, senha)) return 'credenciais';
  // SIMULADO: a pessoa vem do cadastro salvo no navegador (a mesma lista que /pessoas e /acessos editam).
  const pessoa = lerPessoasSalvas().find((p) => p.email.toLowerCase() === emailLimpo);
  // E-mail desconhecido: mesma resposta de senha errada (não revela quem tem conta).
  if (!pessoa) return 'credenciais';
  // Conta inativada pelo administrador (§11): senha certa, mas não entra. É ESTE o portão que
  // barra o login; o layout de (sistema) só cuida de quem já estava com a sessão aberta.
  // TODO(API): a API responde 403 com o motivo; a tela só mostra a mensagem.
  if (pessoa.status === 'inativo') return 'inativo';
  // Convite ainda não usado: a senha só existe depois do primeiro acesso.
  if (pessoa.status === 'convidado') return 'convidado';
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
  /** Abre a sessão de uma pessoa sem pedir senha (só no fim do primeiro acesso, quando ela acabou de criá-la). */
  iniciarSessao: (pessoa: { id: string; nome: string; email: string; perfil: Perfil }, lembrar: boolean) => void;
  /** Atualiza nome, e-mail ou perfil da sessão aberta (ex.: depois de editar Meu perfil). Não mexe no token. */
  atualizarSessao: (parcial: Partial<Pick<Sessao, 'nome' | 'email' | 'perfil'>>) => void;
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

// [PV-7] Onde a sessão é gravada: localStorage com "Lembrar-me", senão sessionStorage. TODO(API): guardar o token que a API devolver.
/**
 * Grava a sessão no navegador.
 * @param s - a sessão a guardar.
 * @param lembrar - true usa o localStorage ("Lembrar-me": continua logado depois de fechar o navegador); false usa o sessionStorage.
 */
// GRAVA: escreve a sessão no localStorage ou no sessionStorage.
// TODO(API): guardar o token devolvido pela API (de preferência em cookie httpOnly definido pelo back).
function guardarSessao(s: Sessao, lembrar: boolean) {
  try {
    (lembrar ? localStorage : sessionStorage).setItem(CHAVE, JSON.stringify(s));
  } catch { /* navegação privada: sessão só em memória */ }
}

/**
 * Provedor da autenticação. Envolve o app inteiro (montado em app/providers.tsx).
 * @param children - a árvore que vai poder chamar `useAuth()`.
 * @returns o Provider com sessão, `pronto`, `entrar`, `iniciarSessao`, `atualizarSessao` e `sair`.
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

  // [PV-8] Fluxo do login: autentica, registra o último acesso e grava a sessão. Os três perfis entram; o que cada um vê é decidido em lib/permissoes.ts.
  /**
   * Faz o login.
   * @param email - e-mail digitado.
   * @param senha - senha digitada.
   * @param lembrar - true guarda no localStorage (sobrevive a fechar o navegador).
   * @returns `{ ok: true }` ou `{ ok: false, motivo }`.
   */
  const entrar = useCallback(async (email: string, senha: string, lembrar: boolean): Promise<ResultadoLogin> => {
    const s = await autenticar(email, senha);
    // Recusado (senha errada, conta inativa ou convite pendente): o LoginForm mostra a mensagem do motivo.
    if (typeof s === 'string') return { ok: false, motivo: s };
    // GRAVA: registra o último acesso desta pessoa (aparece em /acessos).
    registrarUltimoAcesso(s.pessoaId);
    // Os três perfis entram; o que cada um vê é decidido depois, por rota (lib/permissoes.ts).
    // GRAVA: salva a sessão no navegador (localStorage ou sessionStorage).
    guardarSessao(s, lembrar);
    setSessao(s);
    return { ok: true };
  }, []);

  // [PV-9] Abre a sessão SEM pedir senha: só pode ser usada depois de uma prova de identidade (hoje, o fim do primeiro acesso por convite).
  /**
   * Abre a sessão de uma pessoa SEM pedir senha: usada logo depois de ela definir a senha
   * no primeiro acesso (a senha acabou de ser conferida pela própria tela).
   * @param pessoa - quem entra (id, nome, e-mail e perfil do cadastro).
   * @param lembrar - true guarda no localStorage (sobrevive a fechar o navegador).
   * @example iniciarSessao({ id: p.id, nome: p.nome, email: p.email, perfil: p.perfil }, false)
   */
  // GRAVA: salva a sessão no navegador, como o login.
  // ⚠️ ATENÇÃO: só chame depois de uma prova real de identidade (hoje: o convite + a senha criada).
  // TODO(API): a API devolve o token já na resposta do "definir senha" do convite.
  const iniciarSessao = useCallback((pessoa: { id: string; nome: string; email: string; perfil: Perfil }, lembrar: boolean) => {
    const s: Sessao = { pessoaId: pessoa.id, nome: pessoa.nome, email: pessoa.email, perfil: pessoa.perfil, token: `demo.${Date.now()}` };
    guardarSessao(s, lembrar);
    // GRAVA: o primeiro acesso também conta como último acesso.
    registrarUltimoAcesso(s.pessoaId);
    setSessao(s);
  }, []);

  /**
   * Atualiza campos da sessão aberta e regrava onde ela já estava guardada.
   * Existe porque a sessão guarda uma CÓPIA do nome e do perfil: sem isto, trocar o nome
   * em Meu perfil não mudaria o topo da tela até o próximo login.
   * @param parcial - só os campos que mudaram.
   * @example atualizarSessao({ nome: 'Ana Souza Lima' })
   */
  // GRAVA: reescreve a sessão no storage em que ela estava (localStorage ou sessionStorage).
  // TODO(API): com a API, o nome vem do perfil do usuário; a sessão guarda só o token.
  const atualizarSessao = useCallback((parcial: Partial<Pick<Sessao, 'nome' | 'email' | 'perfil'>>) => {
    setSessao((atual) => {
      // Sem sessão aberta não há o que atualizar.
      if (!atual) return atual;
      const nova = { ...atual, ...parcial };
      try {
        // Regrava onde a sessão já estava ("lembrar-me" = localStorage; senão sessionStorage).
        const storage = localStorage.getItem(CHAVE) !== null ? localStorage : sessionStorage;
        storage.setItem(CHAVE, JSON.stringify(nova));
      } catch { /* navegação privada: só em memória */ }
      return nova;
    });
  }, []);

  // [PV-10] Logout: apaga a sessão dos dois armazenamentos. TODO(API): avisar a API para invalidar o token.
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

  return <Ctx.Provider value={{ sessao, pronto, entrar, iniciarSessao, atualizarSessao, sair }}>{children}</Ctx.Provider>;
}

/**
 * Hook para ler a sessão e chamar entrar/sair em qualquer tela.
 * @returns `{ sessao, pronto, entrar, iniciarSessao, atualizarSessao, sair }`.
 * @example const { sessao, sair } = useAuth();
 */
export function useAuth() {
  const c = useContext(Ctx);
  // Sem provider o contexto é null: falha logo, com mensagem clara.
  if (!c) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return c;
}
