/* ============================================================================
   MENU.TSX — MENU SUSPENSO (DROPDOWN)
   O que é: caixinha de opções que abre abaixo de um botão e fecha com Esc ou
   com um clique fora dela.
   Onde é usado: components/shell/Topbar.tsx (avisos e perfil) e
   components/projetos/Quadro.tsx.
   Depende de: react (useState, useRef, useEffect) e lib/utils (cx).
   Contexto: §10 (topo da tela: avisos e perfil) e §9 (design system).
   ============================================================================ */
"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '@/lib/utils';

/**
 * Menu suspenso (dropdown). Fecha com Esc e ao clicar fora.
 * Usa "render props": em vez de receber o botão pronto, recebe uma FUNÇÃO
 * `gatilho` que monta o botão com as props de acessibilidade e o controle de
 * abertura. O conteúdo também é uma função, que recebe `fechar`.
 * @param gatilho função que desenha o botão que abre/fecha o menu.
 * @param children função que recebe `fechar` e desenha os itens.
 * @param alinhar lado em que a caixa encosta no botão (padrão: direita).
 * @param largura classe Tailwind de largura da caixa (padrão w-56).
 * @param flutuante quando true, a caixa usa posição fixa (position: fixed) calculada a partir do botão:
 *   necessário dentro de tabelas, cujo contêiner rola (overflow) e cortaria a caixa. Fecha ao rolar ou redimensionar.
 * @returns o botão e, quando aberto, a caixa de opções.
 * @example
 * <Menu gatilho={(p) => <button onClick={p.alternar} aria-expanded={p['aria-expanded']}>Opções</button>}>
 *   {(fechar) => <ItemMenu onClick={() => { editar(); fechar(); }}>Editar</ItemMenu>}
 * </Menu>
 */
export default function Menu({ gatilho, children, alinhar = 'direita', largura = 'w-56', flutuante = false }: {
  gatilho: (p: { aberto: boolean; alternar: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu' }) => ReactNode;
  children: (fechar: () => void) => ReactNode;
  alinhar?: 'direita' | 'esquerda';
  largura?: string;
  flutuante?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  // Envolve botão + caixa: serve para saber se um clique foi "dentro" ou "fora".
  const ref = useRef<HTMLDivElement>(null);
  // Só no modo flutuante: a caixa e a posição (em px da janela) calculada ao abrir.
  const caixa = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  // Modo flutuante: ao abrir, mede o botão e a caixa para posicionar abaixo do botão (ou acima, se faltar espaço
  // na janela). useLayoutEffect para posicionar antes de pintar (sem a caixa "pular"). Fecha ao rolar/redimensionar,
  // pois a posição fixa ficaria desalinhada do botão.
  useLayoutEffect(() => {
    if (!aberto || !flutuante || !ref.current) return;
    const b = ref.current.getBoundingClientRect();
    const altura = caixa.current?.offsetHeight ?? 0;
    const cabeEmbaixo = b.bottom + 8 + altura <= window.innerHeight;
    setPos({ top: cabeEmbaixo ? b.bottom + 8 : Math.max(8, b.top - 8 - altura), right: Math.max(8, window.innerWidth - b.right) });
    const fechar = () => setAberto(false);
    window.addEventListener('scroll', fechar, true);
    window.addEventListener('resize', fechar);
    return () => { window.removeEventListener('scroll', fechar, true); window.removeEventListener('resize', fechar); };
  }, [aberto, flutuante]);

  // Roda quando o menu abre: liga os ouvintes de clique fora e de Esc.
  // A limpeza (return) desliga os dois quando o menu fecha ou sai da tela.
  useEffect(() => {
    // Fechado: não precisa ouvir nada (economiza ouvintes na página).
    if (!aberto) return;
    // Clique fora: se o alvo não está dentro do contêiner, fecha. Usa "mousedown"
    // para fechar antes de o clique chegar a outro botão.
    const fora = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false); };
    // Esc fecha o menu.
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  return (
    <div ref={ref} className="relative">
      {/* Chama a função do gatilho entregando o estado e o "alternar" (abre/fecha). */}
      {gatilho({ aberto, alternar: () => setAberto((v) => !v), 'aria-expanded': aberto, 'aria-haspopup': 'menu' })}
      {aberto && (
        <div role="menu" ref={caixa}
          style={flutuante ? { position: 'fixed', top: pos?.top ?? -9999, right: pos?.right ?? 0 } : undefined}
          // absolute + mt-2: a caixa flutua logo abaixo do botão; right-0/left-0 escolhe o lado.
          className={cx('animate-modal-in z-50 overflow-hidden rounded-xl border border-borda bg-superficie p-1.5 shadow-card', largura, !flutuante && cx('absolute mt-2', alinhar === 'direita' ? 'right-0' : 'left-0'))}>
          {/* Entrega ao conteúdo uma função que fecha o menu (ex.: depois de escolher um item). */}
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  );
}

/**
 * Item clicável dentro do Menu (role="menuitem").
 * @param onClick ação do item.
 * @param children texto do item.
 * @param perigo pinta de vermelho (ações destrutivas, ex.: "Sair", "Excluir").
 * @param icone ícone opcional à esquerda.
 * @returns um botão de item de menu.
 */
export function ItemMenu({ onClick, children, perigo, icone }: { onClick: () => void; children: ReactNode; perigo?: boolean; icone?: ReactNode }) {
  return (
    <button role="menuitem" onClick={onClick}
      className={cx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:bg-superficie-alt',
        perigo ? 'text-erro hover:bg-erro/10' : 'text-tinta hover:bg-superficie-alt')}>
      {/* [&>svg]:h-4: ajusta o tamanho de qualquer ícone SVG passado, sem a tela se preocupar. */}
      {icone && <span className="text-tinta-fraca [&>svg]:h-4 [&>svg]:w-4">{icone}</span>}
      {children}
    </button>
  );
}
