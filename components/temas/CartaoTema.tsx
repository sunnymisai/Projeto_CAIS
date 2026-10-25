/* ============================================================================
   CARTAOTEMA.TSX — CARTÃO DE UM TEMA NA LISTA
   O que é: cartão com a miniatura do tema, o nome, as etiquetas (Base, Padrão do sistema, quantas empresas usam) e as ações (usar como padrão, duplicar, editar, apagar).
   Onde é usado: app/(sistema)/temas/page.tsx (lista de temas-base e de temas personalizados) e a seção "Temas" do /design-system.
   Depende de: components/ui/basicos (Card, Etiqueta), components/button, components/temas/PreviaTema, lucide-react e lib/temas (paletaDoTema, Tema).
   Contexto: docs/temas-contrato.md (lista de temas com cartão de prévia; apagar só personalizados); §9 (cor tem significado, nunca sozinha).
   ============================================================================ */
"use client";

import { Check, Copy, Pencil, Trash2 } from 'lucide-react';
import { Card, Etiqueta } from '@/components/ui/basicos';
import Button from '@/components/button';
import PreviaTema from '@/components/temas/PreviaTema';
import { paletaDoTema, type Tema } from '@/lib/temas';

/**
 * Cartão de um tema com prévia e ações.
 * Tema-base não tem "Editar" nem "Apagar" (regra do contrato: só se duplica); tema personalizado tem os dois.
 * @param tema o tema mostrado.
 * @param modo qual paleta mostrar na miniatura (o modo claro/escuro atual do sistema).
 * @param padrao true se este é o tema padrão do sistema.
 * @param empresasUsando quantas empresas têm este tema atribuído.
 * @param onUsarComoPadrao chamada ao clicar em "Usar como padrão".
 * @param onDuplicar chamada ao clicar em "Duplicar" (abre o editor com a cópia).
 * @param onEditar chamada ao clicar em "Editar" (só personalizados).
 * @param onApagar chamada ao clicar em "Apagar" (só personalizados; a tela pede confirmação).
 * @returns o item de lista (<li>) com o cartão.
 * @example <CartaoTema tema={t} modo="claro" padrao={t.id === padraoId} empresasUsando={2} onUsarComoPadrao={…} onDuplicar={…} />
 */
export default function CartaoTema({ tema, modo, padrao, empresasUsando, onUsarComoPadrao, onDuplicar, onEditar, onApagar }: {
  tema: Tema; modo: 'claro' | 'escuro'; padrao: boolean; empresasUsando: number;
  onUsarComoPadrao: () => void; onDuplicar: () => void; onEditar?: () => void; onApagar?: () => void;
}) {
  return (
    <li>
      <Card className="flex h-full flex-col gap-4 p-4">
        <PreviaTema compacta paleta={paletaDoTema(tema, modo)} nome={tema.nome} modo={modo} />
        <div className="min-w-0">
          <h3 className="truncate font-space text-[16px] font-semibold text-tinta">{tema.nome}</h3>
          {/* Etiquetas com texto: o estado nunca depende só da cor. */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tema.base && <Etiqueta>Tema-base</Etiqueta>}
            {padrao && <Etiqueta tom="primaria" ponto>Padrão do sistema</Etiqueta>}
            {empresasUsando > 0 && <Etiqueta tom="sucesso">{empresasUsando} {empresasUsando === 1 ? 'empresa' : 'empresas'}</Etiqueta>}
          </div>
        </div>
        {/* mt-auto empurra as ações para o pé do cartão, alinhando cartões de alturas diferentes. */}
        <div className="mt-auto flex flex-wrap gap-2">
          {padrao
            ? <Button tamanho="sm" variante="secundario" disabled><Check className="h-4 w-4" aria-hidden />Padrão atual</Button>
            : <Button tamanho="sm" onClick={onUsarComoPadrao}>Usar como padrão</Button>}
          <Button tamanho="sm" variante="secundario" onClick={onDuplicar} aria-label={`Duplicar o tema ${tema.nome}`}><Copy className="h-4 w-4" aria-hidden />Duplicar</Button>
          {onEditar && <Button tamanho="sm" variante="secundario" onClick={onEditar} aria-label={`Editar o tema ${tema.nome}`}><Pencil className="h-4 w-4" aria-hidden />Editar</Button>}
          {onApagar && <Button tamanho="sm" variante="fantasma" onClick={onApagar} aria-label={`Apagar o tema ${tema.nome}`}><Trash2 className="h-4 w-4" aria-hidden />Apagar</Button>}
        </div>
      </Card>
    </li>
  );
}
