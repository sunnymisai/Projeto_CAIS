/* ============================================================================
   TOAST (AVISOS RÁPIDOS)
   O que é: mostra pequenos avisos no canto da tela ("Empresa salva.", "Algo deu errado") que somem sozinhos.
   Onde é usado: app/providers.tsx (monta o ToastProvider) e, via useToast(), em app/(sistema)/design-system, empresas, pessoas, projetos/[id], trilhas/[id] e em components/projetos/DetalheTarefa, Equipe, FormProjeto, Quadro e components/shell/Topbar.
   Depende de: React (Context, useState, useCallback) e lucide-react (ícones).
   Contexto: §13 (toda ação dá retorno em menos de 1 s), §9 (cor tem significado, sempre com ícone).
   ============================================================================ */

"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CircleCheck, CircleAlert, X } from 'lucide-react';

/* Avisos rápidos (toasts): toda ação dá retorno em menos de um segundo. */

/** Tipo do aviso: decide a cor e o ícone (verde = sucesso, vermelho = erro). */
type Tipo = 'sucesso' | 'erro';
/** Um aviso na fila: `id` único para poder remover só ele. */
interface Toast { id: number; tipo: Tipo; texto: string }

/**
 * Contexto que entrega a função `avisar`. O valor padrão é uma função vazia:
 * fora do provider, chamar `avisar` simplesmente não faz nada (não quebra a tela).
 */
const Ctx = createContext<(texto: string, tipo?: Tipo) => void>(() => {});

/**
 * Provedor dos avisos. Guarda a fila e desenha os toasts no canto inferior direito.
 * @param children - a árvore que vai poder chamar `useToast()`.
 * @returns o Provider + a pilha de avisos.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Toast[]>([]);

  /**
   * Mostra um aviso por 3,8 s.
   * @param texto - mensagem em português, curta.
   * @param tipo - 'sucesso' (padrão) ou 'erro'.
   */
  const avisar = useCallback((texto: string, tipo: Tipo = 'sucesso') => {
    // Date.now() + Math.random(): evita id repetido se dois avisos saírem no mesmo milissegundo.
    const id = Date.now() + Math.random();
    setLista((l) => [...l, { id, tipo, texto }]);
    // [PV-1] Quanto tempo o aviso (toast) fica na tela: 3800 ms. Mude este número para deixar mais curto ou mais longo.
    // Agenda a saída automática deste aviso (só ele, pelo id) depois de 3,8 s.
    setTimeout(() => setLista((l) => l.filter((t) => t.id !== id)), 3800);
  }, []);

  return (
    <Ctx.Provider value={avisar}>
      {children}
      {/*
        * aria-live="polite": leitores de tela anunciam o aviso sem interromper.
        * pointer-events-none no contêiner: a área vazia não bloqueia cliques na tela;
        * cada aviso reativa os cliques com pointer-events-auto (para o botão fechar).
        * w-[min(360px,calc(100vw-2rem))]: 360 px no desktop, mas nunca passa da tela no celular.
        */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {lista.map((t) => (
          <div key={t.id} role="status"
            className="animate-card-in pointer-events-auto flex items-start gap-3 rounded-xl border border-borda bg-superficie px-4 py-3 text-sm text-tinta shadow-card">
            {/* Cor nunca sozinha (§9): cada tipo tem seu ícone; aria-hidden porque o texto já explica. */}
            {t.tipo === 'sucesso'
              ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-sucesso" aria-hidden />
              : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-erro" aria-hidden />}
            <span className="flex-1">{t.texto}</span>
            {/* Fechar antes do tempo: remove só este aviso da fila. */}
            <button onClick={() => setLista((l) => l.filter((x) => x.id !== t.id))} aria-label="Fechar aviso"
              className="rounded text-tinta-fraca hover:text-tinta"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/**
 * Hook para mostrar um aviso de qualquer tela.
 * @returns a função `avisar(texto, tipo?)`.
 * @example const avisar = useToast(); avisar('Empresa salva.'); avisar('Não deu para salvar.', 'erro');
 */
export const useToast = () => useContext(Ctx);
