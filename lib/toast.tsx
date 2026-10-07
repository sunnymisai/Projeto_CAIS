"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CircleCheck, CircleAlert, X } from 'lucide-react';

/* Avisos rápidos (toasts): toda ação dá retorno em menos de um segundo. */

type Tipo = 'sucesso' | 'erro';
interface Toast { id: number; tipo: Tipo; texto: string }

const Ctx = createContext<(texto: string, tipo?: Tipo) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Toast[]>([]);

  const avisar = useCallback((texto: string, tipo: Tipo = 'sucesso') => {
    const id = Date.now() + Math.random();
    setLista((l) => [...l, { id, tipo, texto }]);
    setTimeout(() => setLista((l) => l.filter((t) => t.id !== id)), 3800);
  }, []);

  return (
    <Ctx.Provider value={avisar}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {lista.map((t) => (
          <div key={t.id} role="status"
            className="animate-card-in pointer-events-auto flex items-start gap-3 rounded-xl border border-borda bg-superficie px-4 py-3 text-sm text-tinta shadow-card">
            {t.tipo === 'sucesso'
              ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-sucesso" aria-hidden />
              : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-erro" aria-hidden />}
            <span className="flex-1">{t.texto}</span>
            <button onClick={() => setLista((l) => l.filter((x) => x.id !== t.id))} aria-label="Fechar aviso"
              className="rounded text-tinta-fraca hover:text-tinta"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
