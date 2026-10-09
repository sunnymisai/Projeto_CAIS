/* ============================================================================
   MODAL.TSX — JANELA MODAL DO DESIGN SYSTEM CAIS
   O que é: caixa de diálogo que abre por cima da tela, com título, conteúdo
   rolável e rodapé de ações (e foco do teclado preso dentro dela).
   Onde é usado: telas de empresas, pessoas, projetos/[id], trilhas/[id] e
   design-system; components/projetos (DetalheTarefa, Equipe, FormProjeto).
   Depende de: react (useEffect, useRef, useId, useSyncExternalStore),
   react-dom (createPortal), lucide-react (ícone X) e lib/utils (cx).
   Contexto: §5 (detalhe da tarefa abre por cima do quadro), §9 (modal no
   design system) e §13 (acessível: teclado e foco visível).
   ============================================================================ */
"use client";

import { ReactNode, useEffect, useRef, useId, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '@/lib/utils';

// [PV-1] O MODAL padrão: prende o foco, fecha com Esc ou clique fora, devolve o foco a quem abriu e trava a rolagem. "lateral" vira painel pela direita. Todo diálogo do sistema usa este componente.
/**
 * Modal acessível do Design System CAIS.
 * - Fecha com Esc, com o botão × e clicando no fundo escurecido.
 * - Prende o foco do teclado dentro do modal (Tab/Shift+Tab dão a volta) e,
 *   ao fechar, devolve o foco ao elemento que o abriu.
 * - Trava a rolagem da página por trás enquanto está aberto.
 * - É desenhado num portal (direto no <body>) para ficar acima de tudo.
 * @param aberto controla se o modal aparece.
 * @param onFechar chamada quando a pessoa pede para fechar (Esc, ×, fundo).
 * @param titulo título do diálogo (também nomeia o diálogo para o leitor de tela).
 * @param descricao linha de apoio abaixo do título (opcional).
 * @param children conteúdo; é a única parte que rola.
 * @param rodape botões de ação no rodapé (opcional).
 * @param tamanho largura máxima: sm, md (padrão), lg ou xl.
 * @param cabecalho substitui o cabeçalho padrão (opcional).
 * @param lateral true = painel que entra pela direita, com a altura toda da tela (ex.: detalhe de
 *   uma célula da tela /carga). Mesmo comportamento de foco, Esc e fundo; só muda o desenho.
 * @returns o modal via portal, ou null quando fechado.
 * @example
 * <Modal aberto={aberto} onFechar={() => setAberto(false)} titulo="Nova empresa"
 *   rodape={<Button onClick={salvar}>Salvar</Button>}>…campos…</Modal>
 */
export default function Modal({ aberto, onFechar, titulo, descricao, children, rodape, tamanho = 'md', cabecalho, lateral = false }: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  rodape?: ReactNode;
  tamanho?: 'sm' | 'md' | 'lg' | 'xl';
  /** Substitui o cabeçalho padrão (usado no detalhe da tarefa). */
  cabecalho?: ReactNode;
  /** Painel lateral (entra pela direita, altura toda) em vez da caixa central. */
  lateral?: boolean;
}) {
  // Referência à caixa do diálogo: usada para achar os elementos focáveis dentro dela.
  const ref = useRef<HTMLDivElement>(null);
  // id único do título; o diálogo aponta para ele com aria-labelledby.
  const idTitulo = useId();
  // true só no navegador; no servidor (SSR) é false. O portal precisa de
  // document.body, que não existe no servidor.
  const montado = useSyncExternalStore(() => () => {}, () => true, () => false);
  // Guarda a função em ref: assim o efeito abaixo roda só ao abrir/fechar,
  // e não a cada renderização (o que roubaria o foco de quem está digitando).
  const fecharRef = useRef(onFechar);
  // Lembra se o modal veio com cabeçalho próprio (decide onde cai o 1º foco).
  const cabecalhoProprio = useRef(!!cabecalho);
  // Roda após toda renderização: mantém a ref sempre com o onFechar mais recente.
  useEffect(() => { fecharRef.current = onFechar; });

  // Efeito principal: roda quando o modal ABRE (aberto vira true) e a limpeza
  // (return lá embaixo) roda quando ele FECHA ou sai da tela.
  // ⚠️ ATENÇÃO: a dependência é só [aberto]. Colocar onFechar nela faria o efeito
  // rodar a cada renderização e roubar o foco de quem está digitando (por isso a fecharRef).
  useEffect(() => {
    // Fechado: nada a preparar.
    if (!aberto) return;
    // Guarda quem tinha o foco antes de abrir (ex.: o botão "Nova empresa")
    // para devolver o foco a ele quando o modal fechar.
    const anterior = document.activeElement as HTMLElement | null;
    // Guarda o overflow original do <body> e trava a rolagem da página de trás.
    const overflow = document.body.style.overflow;
    // [PV-2] Trava a rolagem da página enquanto o modal está aberto (e destrava ao fechar).
    document.body.style.overflow = 'hidden';

    // Foca o primeiro campo, ou o próprio modal. O requestAnimationFrame espera
    // o navegador desenhar o modal; antes disso não há o que focar.
    requestAnimationFrame(() => {
      // Com cabeçalho próprio (detalhe da tarefa) o foco vai para o diálogo,
      // para não abrir já editando o título. Nos formulários, vai ao 1º campo.
      const primeiro = cabecalhoProprio.current ? null : ref.current?.querySelector<HTMLElement>('[data-autofocus], input, select, textarea');
      (primeiro ?? ref.current)?.focus();
    });

    // Ouve o teclado na página inteira enquanto o modal está aberto.
    const onKey = (e: KeyboardEvent) => {
      // Esc fecha o modal. stopPropagation evita que outro ouvinte (ex.: um menu
      // aberto por trás) também reaja ao mesmo Esc.
      if (e.key === 'Escape') { e.stopPropagation(); fecharRef.current(); }
      // PRISÃO DE FOCO: daqui para baixo só interessa a tecla Tab.
      if (e.key !== 'Tab' || !ref.current) return;
      // Lista tudo que pode receber foco dentro do modal (botões e campos
      // habilitados, links e quem tem tabindex diferente de -1).
      const focaveis = ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      // Nada focável: deixa o Tab seguir normalmente.
      if (!focaveis.length) return;
      // Primeiro e último elementos focáveis: as "paredes" da prisão.
      const [pri, ult] = [focaveis[0], focaveis[focaveis.length - 1]];
      // Shift+Tab no PRIMEIRO elemento: em vez de sair do modal, pula para o último.
      // Tab no ÚLTIMO elemento: em vez de sair do modal, volta para o primeiro.
      // Nos demais casos, o navegador move o foco normalmente.
      if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
      else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
    };
    // Liga o ouvinte de teclado no documento (desligado na limpeza abaixo).
    document.addEventListener('keydown', onKey);
    // Limpeza (roda ao fechar): tira o ouvinte, destrava a rolagem e devolve o
    // foco ao elemento que abriu o modal ("anterior"). O "?." protege caso ele
    // já não exista mais na tela.
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [aberto]);

  // Fechado, ou ainda no servidor: não desenha nada.
  if (!aberto || !montado) return null;

  // [PV-3] As larguras do modal: sm, md (padrão), lg e xl. Para um tamanho novo, acrescente aqui e no tipo da prop tamanho.
  // Tamanho do modal → largura máxima em Tailwind.
  const largura = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[tamanho];

  // O portal desenha o modal direto no <body>, fora da árvore da página: assim
  // nenhum overflow/z-index de um pai consegue cortá-lo. z-[70] fica acima do menu (z-[60]).
  // No celular o modal "sobe" do rodapé (items-end, cantos de cima arredondados);
  // a partir de sm fica centralizado.
  return createPortal(
    // Lateral: encosta na direita (justify-end) e ocupa a altura toda; central: como descrito acima.
    <div className={cx('fixed inset-0 z-[70] flex', lateral ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-6')}>
      {/* [PV-4] O fundo escurecido do modal (veil). Clicar nele fecha o modal. Cor em hex fixo: item cosmético pendente da revisão H01 (virar token). */}
      {/* Fundo escurecido: clicar fora da caixa fecha o modal. */}
      <div className="animate-fade-in absolute inset-0 bg-[#0B0C12]/55 backdrop-blur-[2px]" onClick={onFechar} aria-hidden />
      {/* tabIndex={-1} deixa a própria caixa receber foco (quando não há campo para focar). */}
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={idTitulo} tabIndex={-1}
        // max-h-[92vh] + flex-col: o modal nunca passa da altura da tela; só o meio rola.
        className={cx('animate-modal-in relative flex w-full flex-col overflow-hidden border border-borda bg-superficie shadow-card focus:outline-none',
          lateral ? 'h-full max-w-md sm:rounded-l-3xl' : cx('max-h-[92vh] rounded-t-3xl sm:rounded-3xl', largura))}>
        {/* Usa o cabeçalho próprio se veio um; senão, o padrão com título e botão ×. */}
        {cabecalho ?? (
          <div className="flex items-start justify-between gap-4 border-b border-borda px-6 py-4">
            <div>
              <h2 id={idTitulo} className="font-space text-lg font-semibold text-tinta">{titulo}</h2>
              {descricao && <p className="mt-0.5 text-[13px] text-tinta-suave">{descricao}</p>}
            </div>
            <button onClick={onFechar} aria-label="Fechar" className="-mr-2 rounded-lg p-2 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {/* Com cabeçalho próprio, o título continua existindo, só que invisível
         * (sr-only), para o aria-labelledby do diálogo ter o que ler. */}
        {cabecalho && <h2 id={idTitulo} className="sr-only">{titulo}</h2>}
        {/* Só esta área rola (flex-1 ocupa o espaço que sobra). */}
        <div className="rolagem flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {rodape && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-borda bg-superficie-alt/50 px-6 py-3">{rodape}</div>}
      </div>
    </div>,
    document.body
  );
}
