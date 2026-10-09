/* ============================================================================
   TRILHAPENDENTE.TSX — AVISO "CONCLUA SUA TRILHA DE BOAS-VINDAS"
   O que é: tela mostrada no lugar de uma rota bloqueada enquanto o profissional tem trilha obrigatória pendente, com botão para a trilha.
   Onde é usado: app/(sistema)/layout.tsx (só quando EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO está ligada).
   Depende de: components/ui/basicos (Card, EstadoVazio), components/button, next/navigation (useRouter) e lucide-react.
   Contexto: §12 fluxo 1 (convite → define senha → cai na trilha obrigatória → conclui e libera o sistema) e §13 (os quatro estados: aqui, o "bloqueado" explica e oferece a próxima ação).
   ============================================================================ */
"use client";

import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import Button from '@/components/button';
import { Card, EstadoVazio } from '@/components/ui/basicos';

// [PV-1] O texto do bloqueio gentil quando a trava da trilha obrigatória impede abrir uma tela (título e explicação). Quem decide bloquear é lib/permissoes.ts.
/**
 * Bloqueio gentil: explica por que a tela não abriu e leva à trilha.
 * @returns o card com a mensagem e o botão "Ir para minhas trilhas".
 */
export default function TrilhaPendente() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-[720px] p-4 sm:p-6 lg:p-8">
      <Card>
        <EstadoVazio icone={<Lock className="h-6 w-6" aria-hidden />} titulo="Conclua sua trilha de boas-vindas para liberar o sistema"
          descricao="Antes de usar as outras telas, termine as etapas obrigatórias da sua trilha. Leva poucos minutos e o resto do sistema abre em seguida."
          // [PV-2] Para onde o bloqueio leva: /minhas-trilhas. Troque o endereço se a tela das trilhas mudar de lugar.
          // NAVEGA: leva às trilhas do profissional.
          acao={<Button onClick={() => router.push('/minhas-trilhas')}>Ir para minhas trilhas</Button>} />
      </Card>
    </div>
  );
}
