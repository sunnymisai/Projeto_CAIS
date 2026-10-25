/* ============================================================================
   PREVIATEMA.TSX — PRÉVIA ISOLADA DE UM TEMA
   O que é: um bloco de amostra (lateral, cartão, botões, etiquetas) que aplica as variáveis de cor de uma paleta SÓ dentro dele, via `style`, sem mudar o sistema.
   Onde é usado: components/temas/CartaoTema.tsx (miniatura de cada tema), components/temas/EditorTema.tsx (prévia ao vivo) e a seção "Temas" do /design-system.
   Depende de: react (CSSProperties), lib/temas (Paleta) e lib/utils (cx). As classes Tailwind são as mesmas do sistema (bg-fundo, bg-noite, bg-botao...), que leem as variáveis CSS.
   Contexto: docs/temas-contrato.md (prévia ao vivo isolada); §9 (design system).
   ============================================================================ */
"use client";

import type { CSSProperties } from 'react';
import type { IdentidadeTema, Paleta } from '@/lib/temas';
import { cx } from '@/lib/utils';

// [PV-1] O FORMATO DE COR que a prévia aceita (#RRGGBB). Valor fora disso é ignorado na prévia (ela usa a cor do sistema no lugar) e o aviso de hex inválido aparece no editor.
/** Reconhece um hexadecimal completo, ex.: #7052F2. */
const HEX_COMPLETO = /^#[0-9a-fA-F]{6}$/;

/**
 * Transforma uma paleta em estilo inline, descartando valores que não são hex válido.
 * Por que descartar: uma variável CSS com valor inválido faria `bg-fundo` virar transparente
 * e a prévia "sumiria" enquanto a pessoa digita; sem a variável, o bloco herda a cor do sistema.
 * @param paleta variáveis de cor do tema (chave "--fundo" → valor "#F6F7FB").
 * @returns objeto aceito pelo atributo `style` do React.
 * @example estiloDaPaleta({ '--fundo': '#fff', '--tinta': '#14161F' }) // { '--tinta': '#14161F' }
 */
function estiloDaPaleta(paleta: Paleta): CSSProperties {
  const estilo: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(paleta)) {
    // Só variáveis (começam com "--") com hex completo entram no estilo.
    if (chave.startsWith('--') && HEX_COMPLETO.test(valor)) estilo[chave] = valor;
  }
  return estilo as CSSProperties;
}

/**
 * Bloco de amostra que mostra como o sistema fica com a paleta recebida.
 * ⚠️ ATENÇÃO: não use classes `dark:` aqui dentro. Elas obedeceriam ao tema da PÁGINA e não ao da paleta;
 * como a paleta já traz todas as cores do modo escolhido, não há necessidade.
 * @param paleta cores a aplicar (use `paletaDoTema(tema, modo)`).
 * @param nome nome do tema, usado no texto alternativo para leitor de tela.
 * @param modo 'claro' ou 'escuro' (só para o texto alternativo).
 * @param compacta versão menor para miniaturas nos cartões da lista.
 * @param className classes extras do bloco externo.
 * @returns a amostra visual (role="img", com a descrição em texto).
 * @example <PreviaTema paleta={paletaDoTema(tema, 'claro')} nome={tema.nome} modo="claro" compacta />
 */
export default function PreviaTema({ paleta, nome, modo, compacta, className, identidade }: {
  paleta: Paleta; nome: string; modo: 'claro' | 'escuro'; compacta?: boolean; className?: string; identidade?: IdentidadeTema;
}) {
  // A lateral é sempre escura: usa o logo "para fundo escuro" (ou o claro, se for o único enviado).
  const logo = identidade?.logoEscuro ?? identidade?.logoClaro;
  const nomeEmpresa = identidade?.nomeEmpresa?.trim();
  return (
    // role="img" + aria-label: o conteúdo é só uma amostra visual; o leitor de tela recebe uma descrição única.
    // text-tinta e bg-fundo ficam NO MESMO elemento das variáveis, então já leem os valores da paleta.
    <div role="img" aria-label={`Prévia do tema ${nome} no modo ${modo}: lateral, cartão, botões e etiquetas de exemplo`}
      style={estiloDaPaleta(paleta)}
      className={cx('flex overflow-hidden rounded-xl border border-borda bg-fundo font-archivo text-tinta', className)}>
      {/* Lateral escura: usa o token --noite (painéis) e o logo usa --marca, que o tema não altera. */}
      <div className={cx('flex shrink-0 flex-col bg-noite', compacta ? 'w-9 gap-1.5 p-2' : 'w-28 gap-2 p-3')} aria-hidden>
        {/* Com identidade: o logo e o nome da empresa no lugar do símbolo do CAIS. Sem ela, o símbolo de sempre. */}
        {logo || nomeEmpresa ? (
          <span className="flex min-w-0 items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL local. */}
            {logo && <img src={logo} alt="" className={cx('shrink-0 object-contain', compacta ? 'h-3 max-w-6' : 'h-5 max-w-10')} />}
            {nomeEmpresa && !compacta && <span className="truncate text-[10px] font-semibold text-white">{nomeEmpresa}</span>}
          </span>
        ) : (
          <span className={cx('rounded-md bg-marca', compacta ? 'h-3 w-3' : 'h-5 w-5')} />
        )}
        {/* Itens de menu fingidos: o primeiro é o "ativo" (mais claro). */}
        <span className={cx('rounded bg-white/70', compacta ? 'h-1.5' : 'h-2')} />
        <span className={cx('rounded bg-white/25', compacta ? 'h-1.5' : 'h-2')} />
        <span className={cx('rounded bg-white/25', compacta ? 'h-1.5' : 'h-2')} />
      </div>
      <div className={cx('min-w-0 flex-1', compacta ? 'space-y-2 p-2.5' : 'space-y-3 p-4')} aria-hidden>
        <p className={cx('font-space font-semibold text-tinta', compacta ? 'text-[12px]' : 'text-[15px]')}>Painel</p>
        <div className={cx('rounded-lg border border-borda bg-superficie', compacta ? 'space-y-1 p-2' : 'space-y-2 p-3')}>
          <p className={cx('font-semibold text-tinta', compacta ? 'text-[11px]' : 'text-[13px]')}>Cartão de exemplo</p>
          <p className={cx('text-tinta-suave', compacta ? 'text-[10px]' : 'text-[12px]')}>Texto de apoio e <span className="text-primaria underline">link</span></p>
          {/* Etiquetas de estado: cada uma com TEXTO, nunca só a cor (regra do design system). */}
          {!compacta && (
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-sucesso/12 px-2 py-0.5 text-[11px] font-semibold text-sucesso">Sucesso</span>
              <span className="rounded-full bg-aviso/12 px-2 py-0.5 text-[11px] font-semibold text-aviso">Atenção</span>
              <span className="rounded-full bg-erro/12 px-2 py-0.5 text-[11px] font-semibold text-erro">Erro</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={cx('rounded-md bg-botao font-semibold text-white', compacta ? 'px-2 py-0.5 text-[10px]' : 'rounded-lg px-3 py-1.5 text-[12px]')}>Salvar</span>
          <span className={cx('rounded-md border border-borda bg-superficie-alt font-semibold text-tinta', compacta ? 'px-2 py-0.5 text-[10px]' : 'rounded-lg px-3 py-1.5 text-[12px]')}>Cancelar</span>
        </div>
      </div>
    </div>
  );
}
