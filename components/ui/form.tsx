/* ============================================================================
   FORM.TSX — CONTROLES DE FORMULÁRIO DO DESIGN SYSTEM CAIS
   O que é: Select, Área de texto, Controle segmentado, Interruptor e Seção de
   formulário, com os mesmos estados do Campo (padrão, foco, erro, desabilitado).
   Onde é usado: telas de app/(sistema) (empresas, pessoas, projetos, trilhas,
   design-system) e components/projetos (DetalheTarefa, Equipe, FormProjeto).
   Depende de: react (forwardRef, useId), lucide-react (ícone da seta) e
   lib/utils (cx). Segue as regras de components/input.tsx.
   Contexto: §9 (design system: campo e select) e §11 (regras de cadastro:
   erro mostrado ao sair do campo).
   ============================================================================ */
"use client";

import { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/utils';

/* Select, Área de texto, Controle segmentado e Interruptor.
   Seguem as mesmas regras de estado do Campo (components/input.tsx). */

// [PV-1] O visual base de todos os campos de formulário (borda, foco, desabilitado). Mude aqui para mudar Select e Área de texto juntos; o Input fica em components/input.tsx.
// Classes comuns a todos os controles. focus:ring-4 desenha o anel de foco
// grosso (acessibilidade: foco sempre visível, §13).
const base = 'w-full border bg-superficie text-sm text-tinta transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-superficie-alt disabled:text-tinta-fraca';
// [PV-2] As cores do estado do campo: normal e erro (borda vermelha). O sucesso é só do Input.
/**
 * Escolhe as classes de borda/anel conforme haja erro ou não.
 * @param erro mensagem de erro do campo (vazia = estado normal).
 * @returns classes Tailwind de borda e de anel de foco.
 */
const estado = (erro?: string) => erro
  ? 'border-erro focus:border-erro focus:ring-erro/25'
  : 'border-borda hover:border-tinta-fraca/60 focus:border-primaria focus:ring-primaria/25';

/**
 * Rótulo (<label>) ligado ao campo pelo htmlFor; mostra "*" se obrigatório.
 * @param htmlFor id do campo que o rótulo descreve.
 * @param children texto do rótulo.
 * @param required quando true, mostra o asterisco vermelho.
 * @returns o <label>.
 */
function Rotulo({ htmlFor, children, required }: { htmlFor: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-tinta">
      {/* O "*" é aria-hidden: o leitor de tela já anuncia "obrigatório" pelo atributo required do campo. */}
      {children}{required && <span className="ml-0.5 text-erro" aria-hidden>*</span>}
    </label>
  );
}

/**
 * Texto abaixo do campo: o erro tem prioridade sobre a dica.
 * @param id id usado no aria-describedby do campo (o leitor de tela lê a mensagem junto).
 * @param erro mensagem de erro (opcional).
 * @param dica texto de ajuda (opcional).
 * @returns o parágrafo, ou null se não houver nada para mostrar.
 */
function Mensagem({ id, erro, dica }: { id: string; erro?: string; dica?: string }) {
  // Com erro, mostra só o erro (em vermelho), mesmo que exista dica.
  if (erro) return <p id={id} className="text-[12px] font-medium text-erro">{erro}</p>;
  // Sem erro, mostra a dica (se houver).
  if (dica) return <p id={id} className="text-[12px] text-tinta-suave">{dica}</p>;
  return null;
}

/** Props do Select: tudo de um <select> comum, mais rótulo, erro, dica e opções. */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Texto do rótulo acima do campo. */
  label?: string;
  /** Mensagem de erro; quando presente, o campo fica vermelho. */
  error?: string;
  /** Texto de ajuda mostrado quando não há erro. */
  hint?: string;
  /** Lista de opções: `valor` vai para o formulário, `rotulo` aparece na tela. */
  opcoes: { valor: string; rotulo: string }[];
  /** Quando definido, cria uma 1ª opção vazia com este texto (ex.: "Selecione…"). */
  placeholder?: string;
}

// [PV-3] O select nativo estilizado (acessível e bom no celular), com rótulo, erro e dica. Todo "Escolha..." do sistema é este componente.
/**
 * Caixa de seleção (select nativo) com rótulo, erro e dica.
 * Usa forwardRef para que hooks de formulário possam focar o campo.
 * @param props ver SelectProps.
 * @returns o campo completo (rótulo + select + mensagem).
 * @example
 * <Select label="Status" opcoes={[{ valor: 'ativa', rotulo: 'Ativa' }]} placeholder="Selecione…" />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, opcoes, placeholder, id, className, required, ...rest }, ref) {
  // Gera um id único caso a tela não passe um; ele liga rótulo, campo e mensagem.
  const auto = useId();
  const sid = id ?? auto;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && <Rotulo htmlFor={sid} required={required}>{label}</Rotulo>}
      <div className="relative">
        <select ref={ref} id={sid} required={required} aria-invalid={error ? true : undefined}
          // Só aponta para a mensagem quando ela existe na tela.
          aria-describedby={error || hint ? `${sid}-msg` : undefined}
          // appearance-none esconde a seta nativa do navegador; pr-9 abre espaço para a nossa seta.
          className={cx(base, estado(error), 'h-10 appearance-none rounded-lg pl-3.5 pr-9', className)} {...rest}>
          {/* Opção vazia: força a pessoa a escolher conscientemente. */}
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
        </select>
        {/* pointer-events-none: o clique na seta "atravessa" e abre o select. */}
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-fraca" aria-hidden />
      </div>
      <Mensagem id={`${sid}-msg`} erro={error} dica={hint} />
    </div>
  );
});

/** Props da Área de texto: tudo de um <textarea>, mais rótulo, erro e dica. */
interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Texto do rótulo acima do campo. */
  label?: string;
  /** Mensagem de erro; quando presente, o campo fica vermelho. */
  error?: string;
  /** Texto de ajuda mostrado quando não há erro. */
  hint?: string;
}

// [PV-4] A caixa de texto de várias linhas, com rótulo, erro e dica (rows define a altura inicial).
/**
 * Área de texto de várias linhas com rótulo, erro e dica.
 * @param props ver AreaProps; `rows` define a altura inicial (padrão 3).
 * @returns o campo completo (rótulo + textarea + mensagem).
 */
export const AreaTexto = forwardRef<HTMLTextAreaElement, AreaProps>(function AreaTexto(
  { label, error, hint, id, className, required, rows = 3, ...rest }, ref) {
  // Mesmo esquema de id automático do Select.
  const auto = useId();
  const tid = id ?? auto;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && <Rotulo htmlFor={tid} required={required}>{label}</Rotulo>}
      <textarea ref={ref} id={tid} rows={rows} required={required} aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${tid}-msg` : undefined}
        // resize-y: a pessoa pode aumentar a altura, mas não a largura (não quebra o layout).
        className={cx(base, estado(error), 'resize-y rounded-lg px-3.5 py-2.5 placeholder:text-tinta-fraca', className)} {...rest} />
      <Mensagem id={`${tid}-msg`} erro={error} dica={hint} />
    </div>
  );
});

// [PV-5] O controle de escolha única entre poucas opções (perfil, período, vista), acessível como grupo de rádios.
/**
 * Controle segmentado: escolha única entre poucas opções (ex.: perfil de acesso).
 * Acessível como grupo de rádios (role="radiogroup" + role="radio").
 * @param opcoes lista de { valor, rotulo }.
 * @param valor opção selecionada.
 * @param onChange chamada com o valor clicado.
 * @param rotulo nome do grupo, lido pelo leitor de tela.
 * @returns a barra de botões.
 * @example <Segmentado rotulo="Perfil" opcoes={[{ valor: 'admin', rotulo: 'Admin' }]} valor={perfil} onChange={setPerfil} />
 */
export function Segmentado<T extends string>({ opcoes, valor, onChange, rotulo }: {
  opcoes: { valor: T; rotulo: string }[]; valor: T; onChange: (v: T) => void; rotulo: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex flex-wrap rounded-xl border border-borda bg-superficie-alt p-1">
      {opcoes.map((o) => {
        // Opção marcada ganha fundo claro e sombra, como um botão "pressionado".
        const sel = o.valor === valor;
        return (
          // type="button" evita que o clique envie o formulário em volta.
          <button key={o.valor} type="button" role="radio" aria-checked={sel} onClick={() => onChange(o.valor)}
            className={cx('rounded-lg px-4 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50',
              sel ? 'bg-superficie text-tinta shadow-sm' : 'text-tinta-suave hover:text-tinta')}>
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}

// [PV-6] O liga/desliga acessível (role="switch"), com rótulo e descrição. Usado em prazo indeterminado, preferências e interruptores de formulário.
/**
 * Interruptor liga/desliga, acessível como switch (role="switch" + aria-checked).
 * @param ligado estado atual.
 * @param onChange chamada com o novo estado (o inverso do atual).
 * @param rotulo texto à esquerda; também nomeia o botão (aria-labelledby).
 * @param descricao linha de apoio abaixo do rótulo (opcional).
 * @returns a linha com texto e o interruptor.
 */
export function Interruptor({ ligado, onChange, rotulo, descricao }: { ligado: boolean; onChange: (v: boolean) => void; rotulo: string; descricao?: string }) {
  // id do rótulo: o botão usa aria-labelledby para o leitor de tela ler o texto.
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p id={id} className="text-sm font-medium text-tinta">{rotulo}</p>
        {descricao && <p className="text-[12px] text-tinta-suave">{descricao}</p>}
      </div>
      <button type="button" role="switch" aria-checked={ligado} aria-labelledby={id} onClick={() => onChange(!ligado)}
        // ring-offset: separa o anel de foco do botão com um respiro da cor do fundo.
        className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie',
          ligado ? 'bg-primaria' : 'bg-borda')}>
        {/* A bolinha desliza 22 px para a direita quando ligado (transition-transform anima). */}
        <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', ligado ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

// [PV-7] O bloco com título que agrupa campos dentro de um formulário longo (cadastros de pessoa e empresa).
/**
 * Título de seção dentro de formulários (como no deck: "DADOS DA EMPRESA").
 * Usa <fieldset> + <legend> para o leitor de tela agrupar os campos.
 * @param titulo texto da seção.
 * @param children campos da seção.
 * @param className classes extras.
 * @returns o fieldset.
 */
export function SecaoForm({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cx('space-y-4', className)}>
      <legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-tinta-suave">{titulo}</legend>
      {children}
    </fieldset>
  );
}
