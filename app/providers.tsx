/* ============================================================================
   APP/PROVIDERS.TSX
   O que é: junta os "provedores" (contextos React) que todas as telas usam.
   Onde é usado: app/layout.tsx, que envolve todas as páginas com <Providers>.
   Depende de: lib/auth.tsx (sessão: useAuth), lib/store.tsx (dados: useDados),
     lib/temaAtivo.tsx (tema de cores: useTemaAtivo) e lib/toast.tsx (avisos: useToast).
   Contexto: §7 (front é do time; dados vêm da API, no protótipo da store) e
     docs/notas-next16.md §1 (Providers são Client Components e envolvem só
     o {children}).
   ============================================================================ */

// "use client" é obrigatório: contextos usam useState/useEffect e
// localStorage, que só existem no navegador (notas-next16 §1).
"use client";

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { DadosProvider } from '@/lib/store';
import { TemaProvider } from '@/lib/temaAtivo';
import { ToastProvider } from '@/lib/toast';

// [PV-1] A ORDEM DOS PROVEDORES: sessão (lib/auth.tsx), dados (lib/store.tsx), tema (lib/temaAtivo.tsx) e avisos (lib/toast.tsx), de fora para dentro. Provedor novo entra aqui, e quem usa precisa ficar dentro dele.
/**
 * Envolve a aplicação com sessão, dados, tema e avisos, nesta ordem.
 *
 * @param props.children as páginas do sistema (vêm do app/layout.tsx).
 * @returns os quatro provedores aninhados em volta das páginas.
 *
 * @example
 * // Qualquer página dentro deles pode chamar:
 * const { sessao } = useAuth();
 * const d = useDados();
 * const avisar = useToast();
 */
export default function Providers({ children }: { children: ReactNode }) {
  // ⚠️ ATENÇÃO: a ordem importa. Quem está mais "por fora" pode ser usado por
  // quem está dentro. Se um hook for chamado fora do seu provedor, ele lança
  // erro (ex.: "useDados precisa estar dentro de <DadosProvider>").
  return (
    <AuthProvider>
      <DadosProvider>
        {/* O tema precisa da sessão (perfil) e dos dados (tema por empresa), por isso fica dentro dos dois. */}
        <TemaProvider>
          <ToastProvider>{children}</ToastProvider>
        </TemaProvider>
      </DadosProvider>
    </AuthProvider>
  );
}
