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
const FORGOT_PASSWORD_HREF = "#";
const CREATE_ACCOUNT_HREF = "#";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Erros = { email?: string; password?: string };

function validar(email: string, password: string): Erros {
  const e: Erros = {};
  if (!email.trim()) e.email = COPY.emailRequired;
  else if (!EMAIL_REGEX.test(email.trim())) e.email = COPY.emailInvalid;
  if (!password) e.password = COPY.passwordRequired;
  return e;
}

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [tocado, setTocado] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const { entrar, sessao, pronto } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const destino = params.get("voltar") || "/painel";

  // Já está logado? Vai direto para o sistema.
  useEffect(() => {
    if (pronto && sessao?.perfil === "admin") router.replace(destino);
  }, [pronto, sessao, router, destino]);

  const emailValido = tocado.email && !erros.email && EMAIL_REGEX.test(email.trim());

  // Revalida em tempo real, mas só depois que o campo foi "tocado"
  // (assim o usuário não vê erro vermelho antes de começar a digitar).
  const revalidar = (campo: keyof Erros, novoEmail = email, novaSenha = password) => {
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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setTocado({ email: true, password: true });

    const v = validar(email, password);
    setErros(v);
    if (v.email || v.password) {
      setShakeKey((k) => k + 1);
      return;
    }

    setLoading(true);
    try {
      // A autenticação fica em lib/auth.tsx — é lá que entra a API real.
      const r = await entrar(email, password, remember);
      if (r.ok) {
        router.replace(destino);
        return; // mantém o botão carregando até a troca de página
      }
      setAuthError(r.motivo === "perfil" ? COPY.perfilSemAcesso : COPY.authFailed);
      setShakeKey((k) => k + 1);
    } catch {
      setAuthError("Não foi possível conectar. Verifique sua internet e tente de novo.");
      setShakeKey((k) => k + 1);
    }
    setLoading(false);
  };

  const linkClass =
    "rounded-sm font-semibold text-primaria underline-offset-4 transition-colors hover:text-primaria-forte hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50";

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

      <form onSubmit={handleLogin} noValidate className="mt-8 space-y-5">
        <Input
          id="email"
          type="email"
          inputMode="email"
          label={COPY.emailLabel}
          placeholder={COPY.emailPlaceholder}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            revalidar("email", e.target.value);
          }}
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

        <div className="flex items-center justify-between gap-4">
          <Checkbox
            id="remember"
            label={COPY.rememberMe}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            disabled={loading}
          />
          <a href={FORGOT_PASSWORD_HREF} className={`text-sm !font-medium ${linkClass}`}>
            {COPY.forgotPassword}
          </a>
        </div>

        <Button type="submit" tamanho="lg" larguraTotal isLoading={loading} loadingText={COPY.submitting} className="mt-1">
          {COPY.submit}
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Button>
      </form>

      {/* Acesso de demonstração — remova quando a API real estiver ligada */}
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-borda bg-superficie-alt/60 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primaria" aria-hidden="true" />
        <div className="min-w-0 flex-1 text-[13px] leading-snug">
          <p className="font-semibold text-tinta">{COPY.demoTitle}</p>
          <p className="truncate text-tinta-suave">{CONTA_DEMO.email} · {CONTA_DEMO.senha}</p>
        </div>
        <button type="button" onClick={() => { setEmail(CONTA_DEMO.email); setPassword(CONTA_DEMO.senha); setErros({}); setAuthError(""); }}
          className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-primaria hover:bg-primaria-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
          {COPY.demoFill}
        </button>
      </div>

      <p className="mt-6 border-t border-borda pt-5 text-center text-sm text-tinta-suave">
        {COPY.noAccount}{" "}
        <a href={CREATE_ACCOUNT_HREF} className={linkClass}>
          {COPY.createAccount}
        </a>
      </p>
    </div>
  );
};
