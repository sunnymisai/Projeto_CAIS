/* ============================================================================
   LOGINFORM.TSX — FORMULÁRIO DE LOGIN
   O que é: o cartão de login (e-mail, senha, "Lembrar-me"), com validação ao
   sair do campo, mensagens de erro claras e acesso de demonstração.
   Onde é usado: app/page.tsx (tela de login, ao lado do BrandPanel).
   Depende de: lib/auth (useAuth, CONTA_DEMO), next/navigation (useRouter,
   useSearchParams), lucide-react e dos componentes ./input, ./button,
   ./checkbox e ./CaisLogo.
   Contexto: §15 (organograma: Login → Shell; Esqueci a senha; Primeiro
   acesso), §11 (erro mostrado ao sair do campo) e §13 (acessível).
   ============================================================================ */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight, CircleAlert, ShieldCheck } from "lucide-react";
import { useAuth, CONTA_DEMO } from "@/lib/auth";

import Input from "./input";
import Button from "./button";
import Checkbox from "./checkbox";
import { CaisMark } from "./CaisLogo";

/* ============================================================================
   1) TEXTOS DA TELA — centralizados para facilitar a customização
   ============================================================================ */
const COPY = {
  title: "Bem-vindo de volta",
  subtitle: "Acesso do administrador do programa.",
  emailLabel: "E-mail",
  emailPlaceholder: "voce@empresa.com",
  passwordLabel: "Senha",
  rememberMe: "Lembrar-me",
  forgotPassword: "Esqueceu a senha?",
  submit: "Entrar",
  submitting: "Entrando…",
  noAccount: "Ainda não tem conta?",
  createAccount: "Criar conta",
  // Mensagens de validação: dizem o que houve e como corrigir
  emailRequired: "Informe seu e-mail.",
  emailInvalid: "Use um e-mail no formato nome@empresa.com.",
  passwordRequired: "Informe sua senha.",
  authFailed: "E-mail ou senha incorretos. Confira os dados e tente de novo.",
  perfilSemAcesso: "Seu perfil ainda não tem acesso nesta versão. Por enquanto, só administradores entram no sistema.",
  demoTitle: "Acesso de demonstração",
  demoFill: "Preencher",
};

/* ============================================================================
   2) LINKS — troque os "#" pelas rotas reais do app
   ============================================================================ */
// TODO(API): trocar "#" pelas rotas de recuperação de senha e de cadastro
// quando essas telas existirem (§15).
const FORGOT_PASSWORD_HREF = "#";
const CREATE_ACCOUNT_HREF = "#";

// Formato mínimo de e-mail: algo@algo.xx (sem espaços e com final de 2+ letras).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mensagens de erro por campo; campo sem erro fica sem a chave (undefined). */
type Erros = { email?: string; password?: string };

/**
 * Valida os campos do login sem mexer na tela (função "pura").
 * @param email e-mail digitado.
 * @param password senha digitada.
 * @returns objeto com a mensagem de erro de cada campo inválido.
 * @example validar('ana@', '') // { email: 'Use um e-mail no formato…', password: 'Informe sua senha.' }
 */
function validar(email: string, password: string): Erros {
  const e: Erros = {};
  // E-mail vazio e e-mail mal formatado têm mensagens diferentes, cada uma dizendo como corrigir.
  if (!email.trim()) e.email = COPY.emailRequired;
  else if (!EMAIL_REGEX.test(email.trim())) e.email = COPY.emailInvalid;
  if (!password) e.password = COPY.passwordRequired;
  return e;
}

/**
 * Cartão de login do CAIS.
 * Fluxo: valida → chama `entrar` (lib/auth) → em caso de sucesso, NAVEGA para
 * o endereço de ?voltar= (ou /painel); em caso de erro, mostra o aviso e balança o cartão.
 * @returns o cartão com o formulário.
 */
export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // "Lembrar-me": decide se a sessão fica no localStorage (sobrevive ao fechar
  // o navegador) ou no sessionStorage (some ao fechar).
  const [remember, setRemember] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  // "Tocado" = a pessoa já saiu do campo ao menos uma vez; só então mostramos erro.
  const [tocado, setTocado] = useState({ email: false, password: false });
  // true enquanto a autenticação está em andamento (spinner e campos travados).
  const [loading, setLoading] = useState(false);
  // Erro que vem da autenticação (senha errada, sem conexão), mostrado no topo do cartão.
  const [authError, setAuthError] = useState("");
  // Contador de erros: muda a cada erro para tocar de novo a animação de "balançar".
  const [shakeKey, setShakeKey] = useState(0);
  const { entrar, sessao, pronto } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  // Lê ?voltar= da URL. O layout do sistema manda para "/login?voltar=/projetos/p1"
  // quando alguém sem sessão tenta abrir uma tela; depois do login a pessoa
  // volta para onde queria ir. Sem o parâmetro, vai para o painel.
  const voltar = params.get("voltar");
  // Só aceita caminho interno ("/algo", mas não "//site.com", que o navegador
  // trataria como outro site) e nunca o próprio /login (cairia em laço).
  // Qualquer outro valor vira /painel.
  const destino =
    voltar && voltar.startsWith("/") && !voltar.startsWith("//") && !voltar.startsWith("/login")
      ? voltar
      : "/painel";

  // Já está logado? Vai direto para o sistema.
  // Roda quando a sessão termina de carregar (pronto) ou muda; não há o que limpar.
  // NAVEGA: replace (e não push) para a tela de login não ficar no histórico do "voltar".
  useEffect(() => {
    if (pronto && sessao?.perfil === "admin") router.replace(destino);
  }, [pronto, sessao, router, destino]);

  // Estado "sucesso" (borda verde) só depois de tocado e com formato válido.
  const emailValido = tocado.email && !erros.email && EMAIL_REGEX.test(email.trim());

  // Revalida em tempo real, mas só depois que o campo foi "tocado"
  // (assim o usuário não vê erro vermelho antes de começar a digitar).
  const revalidar = (campo: keyof Erros, novoEmail = email, novaSenha = password) => {
    // Campo ainda não tocado: não mostra erro enquanto a pessoa digita pela 1ª vez.
    if (!tocado[campo]) return;
    const v = validar(novoEmail, novaSenha);
    setErros((prev) => ({ ...prev, [campo]: v[campo] }));
  };

  /* ==========================================================================
     3) AUTENTICAÇÃO — é aqui que você pluga sua API real
     ==========================================================================
     Troque o bloco "simulação" pela chamada real, por exemplo:

       const res = await fetch('/api/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, password, remember }),
       });
       if (!res.ok) throw new Error('credenciais');

     Qualquer erro lançado cai no catch e mostra o aviso vermelho no topo.
     ========================================================================== */
  /**
   * Envia o formulário: valida, chama a autenticação e trata o resultado.
   * @param e evento de envio do <form>.
   */
  // TODO(API): a chamada real fica em lib/auth.tsx (entrar). Quando a API da
  // PROGLOGIC chegar, aqui só muda o tratamento dos novos motivos de erro.
  const handleLogin = async (e: React.FormEvent) => {
    // Impede o recarregamento da página (comportamento padrão de um <form>).
    e.preventDefault();
    // Limpa o erro anterior e marca os dois campos como tocados, para exibir todos os erros de uma vez.
    setAuthError("");
    setTocado({ email: true, password: true });

    const v = validar(email, password);
    setErros(v);
    // Algum campo inválido: balança o cartão e nem chama a autenticação.
    if (v.email || v.password) {
      setShakeKey((k) => k + 1);
      return;
    }

    // Mostra o spinner e trava os campos durante a tentativa.
    setLoading(true);
    try {
      // A autenticação fica em lib/auth.tsx — é lá que entra a API real.
      const r = await entrar(email, password, remember);
      // NAVEGA: login aceito → vai para o destino (?voltar= ou /painel).
      if (r.ok) {
        router.replace(destino);
        return; // mantém o botão carregando até a troca de página
      }
      // Login recusado: perfil sem acesso nesta versão ou e-mail/senha errados.
      setAuthError(r.motivo === "perfil" ? COPY.perfilSemAcesso : COPY.authFailed);
      setShakeKey((k) => k + 1);
    } catch {
      // Falha de rede ou servidor (a promessa deu erro): mensagem diferente de "senha errada".
      setAuthError("Não foi possível conectar. Verifique sua internet e tente de novo.");
      setShakeKey((k) => k + 1);
    }
    // Só chega aqui quando deu erro: libera o botão para tentar de novo.
    setLoading(false);
  };

  // Classes compartilhadas pelos dois links da tela.
  const linkClass =
    "rounded-sm font-semibold text-primaria underline-offset-4 transition-colors hover:text-primaria-forte hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50";

  // key={shakeKey}: trocar a key faz o React recriar o cartão, o que reinicia a
  // animação "animate-erro" (balançar) a cada novo erro.
  return (
    <div
      key={shakeKey}
      className={`animate-card-in w-full max-w-[440px] rounded-[28px] border border-borda bg-superficie p-7 shadow-card sm:p-10 ${
        shakeKey > 0 ? "animate-erro" : ""
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex flex-col items-center text-center">
        {/* No celular o logo já aparece no topo da página, então o selo fica só no desktop */}
        <div className="mb-6 hidden h-16 w-16 items-center justify-center rounded-2xl bg-primaria-suave lg:flex">
          <CaisMark size={32} />
        </div>
        <h1 className="font-space text-[28px] font-semibold leading-tight tracking-tight text-tinta">
          {COPY.title}
        </h1>
        <p className="mt-2 text-[15px] text-tinta-suave">{COPY.subtitle}</p>
      </div>

      {/* Erro de autenticação (vindo da API) */}
      {authError && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-erro/30 bg-erro/10 px-3.5 py-3 text-sm text-erro"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{authError}</span>
        </div>
      )}

      {/* noValidate desliga os balões de erro do navegador: usamos as nossas mensagens. */}
      <form onSubmit={handleLogin} noValidate className="mt-8 space-y-5">
        <Input
          id="email"
          type="email"
          inputMode="email"
          label={COPY.emailLabel}
          placeholder={COPY.emailPlaceholder}
          value={email}
          // Ao digitar: atualiza o valor e revalida (se o campo já foi tocado).
          onChange={(e) => {
            setEmail(e.target.value);
            revalidar("email", e.target.value);
          }}
          // Ao sair do campo: marca como tocado e valida (§11: erro ao sair do campo).
          onBlur={() => {
            setTocado((t) => ({ ...t, email: true }));
            setErros((prev) => ({ ...prev, email: validar(email, password).email }));
          }}
          icon={<Mail className="h-[18px] w-[18px]" />}
          error={erros.email}
          valid={emailValido}
          required
          autoComplete="email"
          disabled={loading}
        />

        <Input
          id="password"
          type="password"
          label={COPY.passwordLabel}
          placeholder="Sua senha"
          value={password}
          // Mesmas regras do e-mail: revalida ao digitar e valida ao sair do campo.
          onChange={(e) => {
            setPassword(e.target.value);
            revalidar("password", email, e.target.value);
          }}
          onBlur={() => {
            setTocado((t) => ({ ...t, password: true }));
            setErros((prev) => ({ ...prev, password: validar(email, password).password }));
          }}
          icon={<Lock className="h-[18px] w-[18px]" />}
          error={erros.password}
          required
          autoComplete="current-password"
          disabled={loading}
        />

        {/* "Lembrar-me": marcado, a sessão é salva no localStorage; senão, no sessionStorage. */}
        <div className="flex items-center justify-between gap-4">
          <Checkbox
            id="remember"
            label={COPY.rememberMe}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            disabled={loading}
          />
          {/* TODO(API): link de recuperação de senha (ainda "#"). */}
          <a href={FORGOT_PASSWORD_HREF} className={`text-sm !font-medium ${linkClass}`}>
            {COPY.forgotPassword}
          </a>
        </div>

        {/* isLoading troca o texto por "Entrando…" com spinner e desabilita o botão (evita envio duplo). */}
        <Button type="submit" tamanho="lg" larguraTotal isLoading={loading} loadingText={COPY.submitting} className="mt-1">
          {COPY.submit}
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Button>
      </form>

      {/* SIMULADO: acesso de demonstração com a conta fictícia de lib/auth (CONTA_DEMO).
       * TODO(API): remover esta caixa quando a API real estiver ligada. */}
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-borda bg-superficie-alt/60 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primaria" aria-hidden="true" />
        <div className="min-w-0 flex-1 text-[13px] leading-snug">
          <p className="font-semibold text-tinta">{COPY.demoTitle}</p>
          <p className="truncate text-tinta-suave">{CONTA_DEMO.email} · {CONTA_DEMO.senha}</p>
        </div>
        {/* SIMULADO: "Preencher" coloca o e-mail e a senha da conta demo nos campos e
         * limpa erros antigos. Não entra sozinho: a pessoa ainda clica em Entrar. */}
        <button type="button" onClick={() => { setEmail(CONTA_DEMO.email); setPassword(CONTA_DEMO.senha); setErros({}); setAuthError(""); }}
          className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-primaria hover:bg-primaria-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
          {COPY.demoFill}
        </button>
      </div>

      <p className="mt-6 border-t border-borda pt-5 text-center text-sm text-tinta-suave">
        {COPY.noAccount}{" "}
        {/* TODO(API): link de cadastro/convite (primeiro acesso, §12) ainda "#". */}
        <a href={CREATE_ACCOUNT_HREF} className={linkClass}>
          {COPY.createAccount}
        </a>
      </p>
    </div>
  );
};
