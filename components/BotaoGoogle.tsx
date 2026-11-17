/* ============================================================================
   BOTAOGOOGLE.TSX — BOTÃO "ENTRAR COM GOOGLE" (GOOGLE IDENTITY SERVICES)
   O que é: carrega a biblioteca oficial accounts.google.com/gsi/client e desenha o botão
   com google.accounts.id.renderButton(). O Google devolve um ID token (credential); ele é
   enviado ao Auth.js (provedor "google-gis" em auth.ts), que o valida no servidor.
   Onde é usado: components/LoginForm.tsx.
   Depende de: next-auth/react (signIn) e do script https://accounts.google.com/gsi/client.
   Contexto: docs/GOOGLE-AUTH.md. A origem http://localhost:3000 precisa estar em
     "Origens JavaScript autorizadas" no Google Cloud.
   ============================================================================ */
"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

type RespostaGoogle = { credential?: string };
type GoogleId = {
  initialize: (cfg: { client_id: string; callback: (r: RespostaGoogle) => void; ux_mode?: string }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, string | number>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

/**
 * Desenha o botão oficial do Google e conclui o login quando a pessoa escolhe a conta.
 * @param clientId - AUTH_GOOGLE_ID (o ID do cliente OAuth é público).
 * @param desabilitado - true ignora o clique (outro login em andamento).
 * @param aoConcluir - chamado depois que o Auth.js aceitou o token; quem chama navega.
 * @param aoFalhar - chamado se o Google não devolveu token ou o servidor o recusou.
 */
export function BotaoGoogle({
  clientId,
  desabilitado = false,
  aoConcluir,
  aoFalhar,
}: {
  clientId: string;
  desabilitado?: boolean;
  aoConcluir: () => void;
  aoFalhar: () => void;
}) {
  const alvo = useRef<HTMLDivElement>(null);
  // Moldura com a cara do Button do design system; o iframe do Google fica dentro dela.
  const moldura = useRef<HTMLDivElement>(null);
  // Mantém os callbacks mais recentes sem reinicializar o Google a cada render.
  const ref = useRef({ desabilitado, aoConcluir, aoFalhar });
  // Atualiza depois de cada render (efeito), não durante: regra do React para refs.
  useEffect(() => {
    ref.current = { desabilitado, aoConcluir, aoFalhar };
  });

  useEffect(() => {
    let cancelado = false;

    /** Inicializa o Google Identity Services e desenha o botão oficial dentro de `alvo` (só se o script já carregou). */
    const desenhar = () => {
      const id = window.google?.accounts.id;
      if (cancelado || !id || !alvo.current) return;
      id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (ref.current.desabilitado) return;
          if (!credential) return ref.current.aoFalhar();
          // Valida o ID token no servidor (auth.ts) e abre a sessão-ponte do Auth.js.
          const r = await signIn("google-gis", { credential, redirect: false });
          if (r?.error) ref.current.aoFalhar();
          else ref.current.aoConcluir();
        },
      });
      id.renderButton(alvo.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        locale: "pt-BR",
        // +2: o iframe fica 1px maior de cada lado para a borda do próprio Google ser cortada pela moldura (ver return).
        width: Math.min((moldura.current?.clientWidth || 320) + 2, 400),
      });
    };

    if (window.google?.accounts.id) {
      desenhar();
    } else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
      if (!s) {
        s = document.createElement("script");
        s.src = GSI_SRC;
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
      }
      s.addEventListener("load", desenhar);
      return () => {
        cancelado = true;
        s.removeEventListener("load", desenhar);
      };
    }
    return () => {
      cancelado = true;
    };
  }, [clientId]);

  return (
    // [PV-1] A CARA DO BOTÃO: a moldura copia o Button md do design system (h-10, rounded-xl, border-borda) e fundo branco nos dois temas, no mesmo tom do botão do Google (outline). O Google não deixa mudar o raio do iframe; por isso a moldura corta (overflow-hidden) e o iframe fica 1px maior de cada lado (-m-px) para esconder a borda dele. Para outra curvatura, troque o rounded-xl.
    <div
      ref={moldura}
      aria-disabled={desabilitado}
      className={`h-10 w-full overflow-hidden rounded-xl border border-borda bg-white ${desabilitado ? "pointer-events-none opacity-60" : ""}`}
    >
      <div ref={alvo} className="-m-px flex justify-center" />
    </div>
  );
}
