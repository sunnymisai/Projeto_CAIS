/* ============================================================================
   LOGODAMARCA.TSX — LOGO DO CABEÇALHO (EMPRESA DO TEMA OU CAIS)
   O que é: mostra a marca da empresa configurada no tema ativo (imagem e/ou nome); sem marca no tema, mostra o logo do CAIS de sempre. Também exporta `useNomeDaMarca`, o nome para leitor de tela.
   Onde é usado: components/shell/Sidebar.tsx, components/BrandPanel.tsx, components/home/TopoHome.tsx e components/AcessoLayout.tsx.
   Depende de: components/CaisLogo.tsx, lib/temaAtivo.tsx (useTemaAtivo), lib/temas.ts (logoDoTema, nomeDaMarca) e lib/utils.ts (cx).
   Contexto: docs/temas-contrato.md, "Identidade da empresa no tema (fase 2)".
   ============================================================================ */
"use client";

import CaisLogo from '@/components/CaisLogo';
import { useTemaAtivo } from '@/lib/temaAtivo';
import { logoDoTema, nomeDaMarca } from '@/lib/temas';
import { cx } from '@/lib/utils';

/**
 * Cor do fundo onde o logo é colocado:
 * - 'escuro': painéis `--noite` (sempre escuros nos dois modos);
 * - 'claro': fundo claro fixo;
 * - 'auto': fundo da página, que muda com o botão claro/escuro (usa o modo atual).
 */
export type FundoDaMarca = 'claro' | 'escuro' | 'auto';

/**
 * Lê do tema ativo o que o logo precisa: qual lado do fundo vale, a imagem e o nome.
 * @param fundo - onde o logo será desenhado.
 * @returns `{ lado, logo, nome }`; `logo` e `nome` são null quando o tema não os traz.
 */
function useMarcaDoTema(fundo: FundoDaMarca) {
  const { tema, modo } = useTemaAtivo();
  // 'auto' acompanha o modo claro/escuro; os outros dois são fixos.
  const lado = fundo === 'auto' ? modo : fundo;
  return { lado, logo: logoDoTema(tema, lado), nome: nomeDaMarca(tema) };
}

/**
 * Nome da marca para leitor de tela (usado no `aria-label` de links que só têm o logo dentro).
 * @returns o nome da empresa do tema; "Logo da empresa" se só há imagem; "CAIS" se o tema não tem marca.
 * @example <Link aria-label={`${useNomeDaMarca()}, ir para o painel`}>
 */
export function useNomeDaMarca(): string {
  const { tema } = useTemaAtivo();
  return nomeDaMarca(tema) ?? (logoDoTema(tema, 'claro') ? 'Logo da empresa' : 'CAIS');
}

/** Props do logo da marca. */
interface LogoDaMarcaProps {
  /** Fundo em que o logo aparece; escolhe a imagem certa (logo claro ou escuro) e a cor do nome. */
  fundo: FundoDaMarca;
  /** Altura do logo em px (padrão 30, a mesma do CaisLogo no menu). */
  tamanho?: number;
  /** Classes extras do elemento externo. */
  className?: string;
}

// [PV-1] O TAMANHO MÁXIMO do logo da empresa: a altura vem da prop `tamanho` e a largura é limitada por max-w-[8rem] (128 px), para um logo largo não empurrar os botões do topo no celular. O nome ao lado também é limitado (max-w-[10rem]) e vira "…" se for maior.
// [PV-2] O QUE APARECE sem logo: só com nome (sem imagem), mostra apenas o nome da empresa em texto; sem nada no tema, mostra o CaisLogo de hoje. O CAIS nunca some da tela: o SeloCais fica fixo em outro lugar.
/**
 * Logo do cabeçalho: marca da empresa do tema ou, sem marca, o logo do CAIS.
 * A imagem sai de `<img>` com o data URL já validado por `logoDoTema` (nunca HTML solto).
 * @param props.fundo - 'escuro' (painéis), 'claro' ou 'auto' (segue o modo claro/escuro).
 * @param props.tamanho - altura em px.
 * @param props.className - classes extras (ex.: `lg:hidden`).
 * @returns o logo, que ocupa só o espaço dele.
 * @example <LogoDaMarca fundo="escuro" tamanho={30} />
 */
export default function LogoDaMarca({ fundo, tamanho = 30, className }: LogoDaMarcaProps) {
  const { lado, logo, nome } = useMarcaDoTema(fundo);
  // Sobre painel escuro o texto é branco; sobre fundo claro usa o token de texto (que também acompanha o modo escuro).
  const corDoNome = lado === 'escuro' ? 'text-white' : 'text-tinta';

  // Tema sem marca nenhuma: o logo do CAIS de sempre (versão negativa em painel escuro).
  if (!logo && !nome) return <CaisLogo size={tamanho} tone={lado === 'escuro' ? 'claro' : 'auto'} className={className} />;

  return (
    // min-w-0: deixa o nome encolher (e virar "…") em vez de estourar a linha em 375 px.
    <span className={cx('inline-flex min-w-0 items-center gap-2.5', className)}>
      {logo && (
        // alt = nome da empresa (ou texto padrão); logo é data URL, então o otimizador do next/image não se aplica.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={nome ?? 'Logo da empresa'} style={{ height: tamanho }} className="w-auto max-w-[8rem] shrink-0 object-contain" />
      )}
      {/* aria-hidden só quando há imagem: o `alt` dela já diz o nome e o leitor de tela não lê duas vezes. */}
      {nome && (
        <span aria-hidden={logo ? true : undefined} className={cx('min-w-0 max-w-[10rem] truncate font-space text-base font-semibold', corDoNome)}>
          {nome}
        </span>
      )}
    </span>
  );
}
