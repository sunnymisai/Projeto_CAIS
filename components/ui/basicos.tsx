/* ============================================================================
   BASICOS.TSX — COMPONENTES BÁSICOS DO DESIGN SYSTEM CAIS
   O que é: peças pequenas e reaproveitáveis da interface: Card, Etiqueta,
   Avatar, Aviso, Abas, Paginação, Progresso, Esqueleto, Estado vazio e Estado de erro.
   Onde é usado: telas de app/(sistema) (painel, empresas, pessoas, projetos,
   trilhas, design-system), components/projetos/* (CartaoTarefa,
   DetalheTarefa, Equipe, Vistas) e components/shell/Topbar.tsx (Avatar).
   Depende de: react, lucide-react (ícones), lib/utils (cx, iniciais) e das
   classes .rolagem e .esqueleto de app/globals.css.
   Contexto: §9 (design system: componentes e seus estados), §10 (anatomia
   da tela: abas e paginação) e §13 (quatro estados: carregando e vazio).
   ============================================================================ */
"use client";

import { ReactNode, KeyboardEvent, useRef, HTMLAttributes } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { cx, iniciais } from '@/lib/utils';

// [PV-1] O cartão branco (borda, raio, sombra) que envolve todo bloco das telas. Para mudar o visual de TODOS os cartões, mude as classes aqui.
/* ---------------- Card ---------------- */
/**
 * Caixa com borda e cantos arredondados: o "fundo" padrão dos blocos de conteúdo.
 * Repassa qualquer atributo de <div> (id, onClick, aria-*) com `...rest`.
 * @param className classes extras, somadas às padrão pelo `cx`.
 * @param children conteúdo do card.
 * @returns uma <div> estilizada.
 */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-2xl border border-borda bg-superficie', className)} {...rest}>
      {children}
    </div>
  );
}

// [PV-2] O cabeçalho padrão de um cartão: título, descrição e o link ou botão de ação no canto.
/**
 * Cabeçalho de um Card: título, descrição opcional e uma ação à direita.
 * @param titulo texto principal (vira <h2>).
 * @param descricao linha de apoio abaixo do título (opcional).
 * @param acao elemento à direita, ex.: um botão "Ver todos" (opcional).
 * @returns a faixa de título do card.
 */
export function CardTitulo({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div>
        <h2 className="font-space text-[17px] font-semibold text-tinta">{titulo}</h2>
        {/* Só desenha o parágrafo se houver descrição (evita espaço vazio). */}
        {descricao && <p className="mt-0.5 text-[13px] text-tinta-suave">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}

/* ---------------- Etiqueta (badge) ---------------- */
/** Tons possíveis da etiqueta. Cada tom tem um significado fixo (§9: "cor tem significado"). */
export type Tom = 'neutro' | 'primaria' | 'sucesso' | 'aviso' | 'erro';
// [PV-3] AS CORES DAS ETIQUETAS por tom (neutro, primária, sucesso, aviso, erro). Cor tem significado fixo no CAIS (§9): verde = sucesso, âmbar = atenção, vermelho = erro, roxo = ação.
// Tom → classes Tailwind. "bg-sucesso/12" = a cor de sucesso com 12% de opacidade (fundo suave).
const TONS: Record<Tom, string> = {
  neutro: 'bg-superficie-alt text-tinta-suave',
  primaria: 'bg-primaria-suave text-primaria',
  sucesso: 'bg-sucesso/12 text-sucesso',
  aviso: 'bg-aviso/12 text-aviso',
  erro: 'bg-erro/12 text-erro',
};

/**
 * Etiqueta (badge) arredondada para status e categorias.
 * @param tom cor com significado: neutro, primaria, sucesso, aviso ou erro (padrão: neutro).
 * @param children texto da etiqueta.
 * @param ponto quando true, mostra uma bolinha antes do texto.
 * @param className classes extras.
 * @returns um <span> estilizado.
 * @example <Etiqueta tom="sucesso" ponto>Ativa</Etiqueta>
 */
export function Etiqueta({ tom = 'neutro', children, ponto, className }: { tom?: Tom; children: ReactNode; ponto?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold', TONS[tom], className)}>
      {/* bg-current pinta a bolinha com a mesma cor do texto do tom escolhido. */}
      {ponto && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

// [PV-4] A paleta das etiquetas de tarefa (estilo Trello): seis cores sólidas com contraste AA. Cor nova entra na lista.
/* Cores sólidas das etiquetas de tarefa (estilo Trello). Todas com
   contraste AA para o texto, nos dois temas. */
const CORES_ETIQUETA = [
  { bg: '#6A4AF0', fg: '#FFFFFF' }, // roxo
  { bg: '#047857', fg: '#FFFFFF' }, // verde
  { bg: '#F5A524', fg: '#14161F' }, // âmbar
  { bg: '#2563EB', fg: '#FFFFFF' }, // azul
  { bg: '#BE185D', fg: '#FFFFFF' }, // rosa
  { bg: '#5B6075', fg: '#FFFFFF' }, // cinza
];
// [PV-5] Quais etiquetas conhecidas têm cor fixa (Front, UX, API, QA, Login, Gráfico, Back). Etiqueta nova da lista: acrescente aqui.
// Etiquetas comuns têm cor fixa (posição em CORES_ETIQUETA) para ficarem iguais em todo o sistema.
const FIXAS: Record<string, number> = { Front: 0, UX: 4, API: 3, QA: 1, Login: 5, Gráfico: 2, Back: 3 };

// [PV-6] Como uma etiqueta ganha cor: as da lista FIXAS usam a cor combinada; as outras recebem uma cor estável calculada pelo nome.
/**
 * Escolhe a cor de uma etiqueta de tarefa a partir do nome.
 * Nomes conhecidos (FIXAS) usam a cor combinada; os demais recebem uma cor
 * "sorteada" de forma estável: o mesmo nome sempre gera a mesma cor.
 * @param nome texto da etiqueta (ex.: "Front").
 * @returns objeto { bg, fg } com a cor de fundo e a cor do texto.
 * @example corEtiqueta('Front') // { bg: '#6A4AF0', fg: '#FFFFFF' }
 */
export function corEtiqueta(nome: string) {
  // Nome conhecido: devolve a cor fixa e encerra.
  if (nome in FIXAS) return CORES_ETIQUETA[FIXAS[nome]];
  // Hash simples: para cada letra, multiplica o acumulado por 31 e soma o código
  // da letra. O ">>> 0" mantém o número inteiro e positivo (32 bits). O resto da
  // divisão (%) pelo total de cores escolhe sempre a mesma cor para o mesmo nome.
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CORES_ETIQUETA[h % CORES_ETIQUETA.length];
}

/**
 * Etiqueta colorida de tarefa (estilo Trello), usada nos cartões do quadro.
 * @param nome texto da etiqueta; também define a cor (ver corEtiqueta).
 * @param compacta versão menor, para cartões densos.
 * @returns um <span> com a cor calculada.
 */
export function EtiquetaTarefa({ nome, compacta }: { nome: string; compacta?: boolean }) {
  const c = corEtiqueta(nome);
  // A cor vai em "style" (e não em classe) porque é calculada em tempo de
  // execução: o Tailwind só gera as classes que encontra no código no build.
  return (
    <span style={{ background: c.bg, color: c.fg }}
      className={cx('inline-flex items-center rounded-md font-semibold', compacta ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-[12px]')}>
      {nome}
    </span>
  );
}

// [PV-7] A paleta das bolinhas com iniciais (avatares): cores escuras o bastante para o texto branco.
/* ---------------- Avatar ---------------- */
// Paleta dos avatares: cores escuras o bastante para o texto branco ter contraste.
const CORES_AVATAR = ['#6A4AF0', '#047857', '#B45309', '#2563EB', '#BE185D', '#0E7490'];

/**
 * Círculo com as iniciais da pessoa (não usamos foto no protótipo).
 * @param nome nome completo; gera as iniciais e a cor.
 * @param tamanho diâmetro em px (padrão 32).
 * @param anel quando true, desenha um anel da cor do fundo (para sobrepor avatares).
 * @returns um <span role="img"> com as iniciais.
 * @example <Avatar nome="Ana Souza" tamanho={36} /> // mostra "AS"
 */
export function Avatar({ nome, tamanho = 32, anel }: { nome: string; tamanho?: number; anel?: boolean }) {
  // Mesmo truque de hash de corEtiqueta: a mesma pessoa sempre recebe a mesma cor.
  let h = 0;
  for (const c of nome) h = (h * 17 + c.charCodeAt(0)) >>> 0;
  return (
    <span
      title={nome}
      aria-label={nome}
      role="img"
      // ring-2 ring-superficie: anel da cor do fundo que "recorta" um avatar do outro no grupo.
      className={cx('inline-flex shrink-0 select-none items-center justify-center rounded-full font-archivo font-semibold text-white', anel && 'ring-2 ring-superficie')}
      // Medidas por style porque são números livres. A fonte é 38% do diâmetro,
      // mas nunca menor que 10 px (para continuar legível).
      style={{ width: tamanho, height: tamanho, fontSize: Math.max(10, tamanho * 0.38), background: CORES_AVATAR[h % CORES_AVATAR.length] }}
    >
      {iniciais(nome)}
    </span>
  );
}

/**
 * Avatares sobrepostos (ex.: equipe de um projeto) com um selo "+N" para o excedente.
 * @param nomes lista de nomes.
 * @param max quantos avatares mostrar antes do "+N" (padrão 4).
 * @param tamanho diâmetro de cada avatar em px (padrão 28).
 * @returns a fileira de avatares.
 * @example <GrupoAvatares nomes={['Ana', 'Bia', 'Caio', 'Davi', 'Eva']} max={3} /> // 3 avatares + "+2"
 */
export function GrupoAvatares({ nomes, max = 4, tamanho = 28 }: { nomes: string[]; max?: number; tamanho?: number }) {
  // Quantas pessoas ficaram de fora do limite (vira o selo "+N").
  const extra = nomes.length - max;
  // -space-x-2 puxa cada avatar 8 px para a esquerda, sobrepondo-os.
  return (
    <div className="flex -space-x-2">
      {nomes.slice(0, max).map((n) => <Avatar key={n} nome={n} tamanho={tamanho} anel />)}
      {/* Só aparece quando há mais nomes do que o máximo. */}
      {extra > 0 && (
        <span className="inline-flex items-center justify-center rounded-full bg-superficie-alt text-[11px] font-semibold text-tinta-suave ring-2 ring-superficie"
          style={{ width: tamanho, height: tamanho }}>+{extra}</span>
      )}
    </div>
  );
}

// [PV-8] O visual de cada tipo de aviso (info, sucesso, aviso, erro): caixa, ícone e cor. Aviso de erro é anunciado na hora pelo leitor de tela.
/* ---------------- Aviso (alert) ---------------- */
// Visual de cada tipo de aviso: classes da caixa, ícone e cor do ícone.
const AVISO = {
  info: { cls: 'border-primaria/25 bg-primaria-suave text-tinta', icone: Info, cor: 'text-primaria' },
  sucesso: { cls: 'border-sucesso/25 bg-sucesso/10 text-tinta', icone: CircleCheck, cor: 'text-sucesso' },
  aviso: { cls: 'border-aviso/30 bg-aviso/10 text-tinta', icone: TriangleAlert, cor: 'text-aviso' },
  erro: { cls: 'border-erro/30 bg-erro/10 text-tinta', icone: CircleAlert, cor: 'text-erro' },
};

/**
 * Caixa de aviso (alert) com ícone, título, texto e ação opcional.
 * @param tipo info, sucesso, aviso ou erro (padrão: info).
 * @param titulo frase curta em negrito (opcional).
 * @param children texto explicativo (opcional).
 * @param acao elemento à direita, ex.: botão "Tentar de novo" (opcional).
 * @returns a caixa de aviso.
 * @example <Aviso tipo="erro" titulo="Não foi possível salvar">Tente de novo.</Aviso>
 */
export function Aviso({ tipo = 'info', titulo, children, acao }: { tipo?: keyof typeof AVISO; titulo?: string; children?: ReactNode; acao?: ReactNode }) {
  const a = AVISO[tipo];
  const Icone = a.icone;
  // Erro usa role="alert": o leitor de tela anuncia na hora. Os demais usam
  // role="status": anúncio "educado", sem interromper o que a pessoa ouve.
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={cx('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', a.cls)}>
      <Icone className={cx('mt-0.5 h-4 w-4 shrink-0', a.cor)} aria-hidden />
      <div className="flex-1">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {/* Com título, o texto ganha um pequeno respiro acima (mt-0.5). */}
        {children && <div className={cx(titulo && 'mt-0.5', 'text-tinta-suave')}>{children}</div>}
      </div>
      {acao}
    </div>
  );
}

// [PV-9] As abas do sistema: navegáveis pelas setas do teclado, com contagem opcional. Todas as telas com abas usam este componente.
/* ---------------- Abas (tabs) — navegação por setas ---------------- */
/**
 * Abas acessíveis (padrão WAI-ARIA "tabs") com navegação pelas setas.
 * Só a aba ativa entra na ordem do Tab (tabIndex 0); as outras ficam com -1.
 * Assim o Tab entra e sai do grupo de abas de uma vez, e as setas ← → andam
 * entre elas (técnica chamada "roving tabindex").
 * @param abas lista de { id, rotulo, contagem? }.
 * @param ativa id da aba selecionada.
 * @param onChange chamada com o id da nova aba (por clique ou seta).
 * @param rotulo nome do grupo de abas, lido pelo leitor de tela.
 * @returns a barra de abas (role="tablist").
 * @example
 * <Abas rotulo="Seções do projeto" abas={[{ id: 'equipe', rotulo: 'Equipe' }, { id: 'quadro', rotulo: 'Quadro' }]}
 *   ativa={aba} onChange={setAba} />
 */
export function Abas<T extends string>({ abas, ativa, onChange, rotulo }: {
  abas: { id: T; rotulo: string; contagem?: number }[]; ativa: T; onChange: (id: T) => void; rotulo: string;
}) {
  // Guarda a referência de cada botão para conseguir mover o foco com as setas.
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  // Teclado: → vai para a próxima aba e ← para a anterior, dando a volta nas pontas.
  const onKey = (e: KeyboardEvent, i: number) => {
    // Outras teclas (Tab, Enter, Espaço) seguem o comportamento normal do navegador.
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    // Impede que a seta role a barra/página de lado.
    e.preventDefault();
    // Índice circular: soma +1 (→) ou -1 (←) e usa o resto (%) para dar a volta.
    // O "+ abas.length" evita número negativo na 1ª aba: com 3 abas, ← na
    // aba 0 dá (0 - 1 + 3) % 3 = 2, ou seja, vai para a última.
    const prox = (i + (e.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length;
    // Move o foco E já seleciona a aba (ativação automática, sem precisar de Enter).
    refs.current[prox]?.focus();
    onChange(abas[prox].id);
  };
  // "rolagem overflow-x-auto": no celular, se as abas não couberem, a barra
  // rola de lado em vez de quebrar a linha.
  return (
    <div role="tablist" aria-label={rotulo} className="rolagem flex shrink-0 gap-1 overflow-x-auto border-b border-borda">
      {abas.map((a, i) => {
        const sel = a.id === ativa;
        // Roving tabindex: só a aba selecionada (sel) é alcançável pelo Tab.
        return (
          <button key={a.id} ref={(el) => { refs.current[i] = el; }} role="tab" aria-selected={sel} tabIndex={sel ? 0 : -1}
            // id + aria-controls ligam a aba ao painel com id "painel-<id>" que a tela desenha.
            id={`aba-${a.id}`} aria-controls={`painel-${a.id}`}
            onClick={() => onChange(a.id)} onKeyDown={(e) => onKey(e, i)}
            // -mb-px + border-b-2: a borda colorida da aba ativa fica por cima da linha da barra.
            className={cx('relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 rounded-t-md',
              sel ? 'border-primaria text-tinta' : 'border-transparent text-tinta-suave hover:text-tinta')}>
            {a.rotulo}
            {/* Contador opcional (ex.: quantidade de itens naquela aba). */}
            {a.contagem !== undefined && (
              <span className={cx('rounded-full px-1.5 text-[11px]', sel ? 'bg-primaria-suave text-primaria' : 'bg-superficie-alt text-tinta-suave')}>{a.contagem}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// [PV-10] A paginação das listas: quantos itens por página (porPagina), a contagem do resultado e o nome do item no rodapé.
/* ---------------- Paginação ---------------- */
/**
 * Rodapé de lista com contagem ("1–10 de 42 itens") e botões de página (§10).
 * @param pagina página atual, começando em 1.
 * @param total quantidade total de itens.
 * @param porPagina itens por página.
 * @param onChange chamada com o número da nova página.
 * @param rotuloItem palavra usada na contagem (padrão "itens").
 * @returns um <nav> de paginação.
 * @example <Paginacao pagina={2} total={42} porPagina={10} onChange={setPagina} rotuloItem="empresas" />
 */
export function Paginacao({ pagina, total, porPagina, onChange, rotuloItem = 'itens' }: {
  pagina: number; total: number; porPagina: number; onChange: (p: number) => void; rotuloItem?: string;
}) {
  // Total de páginas; no mínimo 1, para nunca mostrar "página 1 de 0".
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  // Faixa exibida "de–até". Ex.: página 2 com 10 por página → 11–20.
  // Lista vazia mostra 0–0.
  const de = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  // A última página pode ter menos itens: o "até" nunca passa do total.
  const ate = Math.min(total, pagina * porPagina);
  // Classes comuns a todos os botões; disabled:opacity-40 apaga Anterior/Próxima nas pontas.
  const btn = 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 disabled:opacity-40';
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-tinta-suave">
      <span>{de}–{ate} de {total} {rotuloItem}</span>
      <div className="flex items-center gap-1">
        {/* Anterior: desabilitado na 1ª página. */}
        <button className={cx(btn, 'hover:bg-superficie-alt')} disabled={pagina <= 1} onClick={() => onChange(pagina - 1)} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
        {/* Um botão por página; aria-current="page" marca a atual para o leitor de tela. */}
        {Array.from({ length: paginas }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onChange(p)} aria-current={p === pagina ? 'page' : undefined}
            className={cx(btn, p === pagina ? 'bg-primaria-suave text-primaria' : 'hover:bg-superficie-alt')}>{p}</button>
        ))}
        {/* Próxima: desabilitado na última página. */}
        <button className={cx(btn, 'hover:bg-superficie-alt')} disabled={pagina >= paginas} onClick={() => onChange(pagina + 1)} aria-label="Próxima página"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </nav>
  );
}

// [PV-11] A barra de progresso com texto para leitor de tela. Os tons seguem o significado das cores (primária, sucesso, aviso, erro).
/* ---------------- Progresso ---------------- */
/**
 * Barra de progresso (role="progressbar") de 0 a 100%.
 * @param valor percentual; valores fora de 0–100 são ajustados e arredondados.
 * @param tom cor da barra (padrão primaria).
 * @param rotulo nome lido pelo leitor de tela (ex.: "Progresso da trilha").
 * @param fino versão mais baixa (6 px em vez de 8 px).
 * @returns a barra.
 * @example <Progresso valor={72.4} rotulo="Trilha LGPD" /> // mostra 72%
 */
export function Progresso({ valor, tom = 'primaria', rotulo, fino }: { valor: number; tom?: 'primaria' | 'sucesso' | 'aviso' | 'erro'; rotulo?: string; fino?: boolean }) {
  // Traduz o tom na classe de cor de fundo da barra.
  const cor = { primaria: 'bg-primaria', sucesso: 'bg-sucesso', aviso: 'bg-aviso', erro: 'bg-erro' }[tom];
  // Arredonda e prende o valor entre 0 e 100 (um 130% não estoura a barra).
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  return (
    <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={rotulo}
      className={cx('w-full overflow-hidden rounded-full bg-superficie-alt', fino ? 'h-1.5' : 'h-2')}>
      {/* Largura em % via style; transition-[width] anima a barra quando o valor muda. */}
      <div className={cx('h-full rounded-full transition-[width] duration-500', cor)} style={{ width: `${v}%` }} />
    </div>
  );
}

// [PV-12] O bloco cinza animado do estado "carregando" (nunca tela em branco); a animação é a classe .esqueleto de app/globals.css. O formato é dado por quem usa, pela classe.
/* ---------------- Esqueleto (estado carregando) ---------------- */
/**
 * Bloco cinza animado que ocupa o lugar do conteúdo enquanto ele carrega (estado "carregando", §13).
 * A animação de brilho vem da classe .esqueleto em app/globals.css.
 * @param className define tamanho e forma (ex.: "h-12 w-full").
 * @returns uma <div> decorativa (aria-hidden).
 */
export function Esqueleto({ className }: { className?: string }) {
  return <div className={cx('esqueleto rounded-lg', className)} aria-hidden />;
}

/**
 * Lista de esqueletos pronta para o estado "carregando" de tabelas e listas.
 * @param linhas quantos blocos mostrar (padrão 5).
 * @returns um bloco com role="status" que anuncia "Carregando…".
 */
export function EsqueletoLista({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => <Esqueleto key={i} className="h-12 w-full" />)}
      {/* Texto só para leitor de tela, já que os blocos cinza são aria-hidden. */}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

// [PV-13] O estado vazio padrão: ícone, o que significa estar vazio e a próxima ação. Toda lista e todo bloco vazio usa este componente.
/* ---------------- Estado vazio ---------------- */
/**
 * Estado vazio (§13): explica por que não há nada e oferece o próximo passo.
 * @param icone ícone grande no topo.
 * @param titulo frase curta (ex.: "Nenhuma empresa cadastrada").
 * @param descricao o que fazer a seguir.
 * @param acao botão opcional (ex.: "Cadastrar empresa").
 * @returns o bloco centralizado.
 */
export function EstadoVazio({ icone, titulo, descricao, acao }: { icone: ReactNode; titulo: string; descricao: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-superficie-alt text-tinta-fraca">{icone}</div>
      <p className="font-space text-base font-semibold text-tinta">{titulo}</p>
      <p className="mt-1 max-w-sm text-sm text-tinta-suave">{descricao}</p>
      {/* A ação só aparece quando a tela passa uma. */}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

// [PV-14] O estado de erro padrão: diz o que houve, em português, e oferece como tentar de novo. É o que o layout mostra quando os dados não carregam.
/* ---------------- Estado de erro ---------------- */
/**
 * Estado de erro (§13): diz o que houve, em português, e como tentar de novo.
 * Mesmo desenho do EstadoVazio, com o ícone em vermelho (cor de erro + ícone + texto,
 * nunca só a cor). role="alert" faz o leitor de tela anunciar assim que aparece.
 * @param titulo o que deu errado, curto (ex.: "Não foi possível carregar os dados").
 * @param descricao o detalhe e o que a pessoa pode fazer.
 * @param acoes botões (ex.: "Tentar de novo"); quem chama decide quais.
 * @returns o bloco centralizado.
 * @example <EstadoErro titulo="Não foi possível carregar" descricao={d.erro} acoes={<Button onClick={d.tentarDeNovo}>Tentar de novo</Button>} />
 */
export function EstadoErro({ titulo, descricao, acoes }: { titulo: string; descricao: string; acoes?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-erro/10 text-erro">
        <CircleAlert className="h-6 w-6" aria-hidden />
      </div>
      <p className="font-space text-base font-semibold text-tinta">{titulo}</p>
      <p className="mt-1 max-w-md text-sm text-tinta-suave">{descricao}</p>
      {/* flex-wrap: no celular os botões descem um embaixo do outro em vez de estourar a largura. */}
      {acoes && <div className="mt-5 flex flex-wrap justify-center gap-2">{acoes}</div>}
    </div>
  );
}
