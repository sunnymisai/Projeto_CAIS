"use client";

import { ReactNode, KeyboardEvent, useRef, HTMLAttributes } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { cx, iniciais } from '@/lib/utils';

/* ============================================================================
   COMPONENTES BÁSICOS DO DESIGN SYSTEM CAIS
   Card · Etiqueta · Avatar · Aviso · Abas · Paginação · Progresso ·
   Esqueleto · Estado vazio · Estado de erro
   ============================================================================ */

/* ---------------- Card ---------------- */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-2xl border border-borda bg-superficie', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitulo({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div>
        <h2 className="font-space text-[17px] font-semibold text-tinta">{titulo}</h2>
        {descricao && <p className="mt-0.5 text-[13px] text-tinta-suave">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}

/* ---------------- Etiqueta (badge) ---------------- */
export type Tom = 'neutro' | 'primaria' | 'sucesso' | 'aviso' | 'erro';
const TONS: Record<Tom, string> = {
  neutro: 'bg-superficie-alt text-tinta-suave',
  primaria: 'bg-primaria-suave text-primaria',
  sucesso: 'bg-sucesso/12 text-sucesso',
  aviso: 'bg-aviso/12 text-aviso',
  erro: 'bg-erro/12 text-erro',
};

export function Etiqueta({ tom = 'neutro', children, ponto, className }: { tom?: Tom; children: ReactNode; ponto?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold', TONS[tom], className)}>
      {ponto && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

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
const FIXAS: Record<string, number> = { Front: 0, UX: 4, API: 3, QA: 1, Login: 5, Gráfico: 2, Back: 3 };

export function corEtiqueta(nome: string) {
  if (nome in FIXAS) return CORES_ETIQUETA[FIXAS[nome]];
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CORES_ETIQUETA[h % CORES_ETIQUETA.length];
}

export function EtiquetaTarefa({ nome, compacta }: { nome: string; compacta?: boolean }) {
  const c = corEtiqueta(nome);
  return (
    <span style={{ background: c.bg, color: c.fg }}
      className={cx('inline-flex items-center rounded-md font-semibold', compacta ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-[12px]')}>
      {nome}
    </span>
  );
}

/* ---------------- Avatar ---------------- */
const CORES_AVATAR = ['#6A4AF0', '#047857', '#B45309', '#2563EB', '#BE185D', '#0E7490'];

export function Avatar({ nome, tamanho = 32, anel }: { nome: string; tamanho?: number; anel?: boolean }) {
  let h = 0;
  for (const c of nome) h = (h * 17 + c.charCodeAt(0)) >>> 0;
  return (
    <span
      title={nome}
      aria-label={nome}
      role="img"
      className={cx('inline-flex shrink-0 select-none items-center justify-center rounded-full font-archivo font-semibold text-white', anel && 'ring-2 ring-superficie')}
      style={{ width: tamanho, height: tamanho, fontSize: Math.max(10, tamanho * 0.38), background: CORES_AVATAR[h % CORES_AVATAR.length] }}
    >
      {iniciais(nome)}
    </span>
  );
}

export function GrupoAvatares({ nomes, max = 4, tamanho = 28 }: { nomes: string[]; max?: number; tamanho?: number }) {
  const extra = nomes.length - max;
  return (
    <div className="flex -space-x-2">
      {nomes.slice(0, max).map((n) => <Avatar key={n} nome={n} tamanho={tamanho} anel />)}
      {extra > 0 && (
        <span className="inline-flex items-center justify-center rounded-full bg-superficie-alt text-[11px] font-semibold text-tinta-suave ring-2 ring-superficie"
          style={{ width: tamanho, height: tamanho }}>+{extra}</span>
      )}
    </div>
  );
}

/* ---------------- Aviso (alert) ---------------- */
const AVISO = {
  info: { cls: 'border-primaria/25 bg-primaria-suave text-tinta', icone: Info, cor: 'text-primaria' },
  sucesso: { cls: 'border-sucesso/25 bg-sucesso/10 text-tinta', icone: CircleCheck, cor: 'text-sucesso' },
  aviso: { cls: 'border-aviso/30 bg-aviso/10 text-tinta', icone: TriangleAlert, cor: 'text-aviso' },
  erro: { cls: 'border-erro/30 bg-erro/10 text-tinta', icone: CircleAlert, cor: 'text-erro' },
};

export function Aviso({ tipo = 'info', titulo, children, acao }: { tipo?: keyof typeof AVISO; titulo?: string; children?: ReactNode; acao?: ReactNode }) {
  const a = AVISO[tipo];
  const Icone = a.icone;
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={cx('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', a.cls)}>
      <Icone className={cx('mt-0.5 h-4 w-4 shrink-0', a.cor)} aria-hidden />
      <div className="flex-1">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={cx(titulo && 'mt-0.5', 'text-tinta-suave')}>{children}</div>}
      </div>
      {acao}
    </div>
  );
}

/* ---------------- Abas (tabs) — navegação por setas ---------------- */
export function Abas<T extends string>({ abas, ativa, onChange, rotulo }: {
  abas: { id: T; rotulo: string; contagem?: number }[]; ativa: T; onChange: (id: T) => void; rotulo: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const prox = (i + (e.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length;
    refs.current[prox]?.focus();
    onChange(abas[prox].id);
  };
  return (
    <div role="tablist" aria-label={rotulo} className="rolagem flex shrink-0 gap-1 overflow-x-auto border-b border-borda">
      {abas.map((a, i) => {
        const sel = a.id === ativa;
        return (
          <button key={a.id} ref={(el) => { refs.current[i] = el; }} role="tab" aria-selected={sel} tabIndex={sel ? 0 : -1}
            id={`aba-${a.id}`} aria-controls={`painel-${a.id}`}
            onClick={() => onChange(a.id)} onKeyDown={(e) => onKey(e, i)}
            className={cx('relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 rounded-t-md',
              sel ? 'border-primaria text-tinta' : 'border-transparent text-tinta-suave hover:text-tinta')}>
            {a.rotulo}
            {a.contagem !== undefined && (
              <span className={cx('rounded-full px-1.5 text-[11px]', sel ? 'bg-primaria-suave text-primaria' : 'bg-superficie-alt text-tinta-suave')}>{a.contagem}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Paginação ---------------- */
export function Paginacao({ pagina, total, porPagina, onChange, rotuloItem = 'itens' }: {
  pagina: number; total: number; porPagina: number; onChange: (p: number) => void; rotuloItem?: string;
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const de = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const ate = Math.min(total, pagina * porPagina);
  const btn = 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 disabled:opacity-40';
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-tinta-suave">
      <span>{de}–{ate} de {total} {rotuloItem}</span>
      <div className="flex items-center gap-1">
        <button className={cx(btn, 'hover:bg-superficie-alt')} disabled={pagina <= 1} onClick={() => onChange(pagina - 1)} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
        {Array.from({ length: paginas }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onChange(p)} aria-current={p === pagina ? 'page' : undefined}
            className={cx(btn, p === pagina ? 'bg-primaria-suave text-primaria' : 'hover:bg-superficie-alt')}>{p}</button>
        ))}
        <button className={cx(btn, 'hover:bg-superficie-alt')} disabled={pagina >= paginas} onClick={() => onChange(pagina + 1)} aria-label="Próxima página"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </nav>
  );
}

/* ---------------- Progresso ---------------- */
export function Progresso({ valor, tom = 'primaria', rotulo, fino }: { valor: number; tom?: 'primaria' | 'sucesso' | 'aviso' | 'erro'; rotulo?: string; fino?: boolean }) {
  const cor = { primaria: 'bg-primaria', sucesso: 'bg-sucesso', aviso: 'bg-aviso', erro: 'bg-erro' }[tom];
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  return (
    <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={rotulo}
      className={cx('w-full overflow-hidden rounded-full bg-superficie-alt', fino ? 'h-1.5' : 'h-2')}>
      <div className={cx('h-full rounded-full transition-[width] duration-500', cor)} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ---------------- Esqueleto (estado carregando) ---------------- */
export function Esqueleto({ className }: { className?: string }) {
  return <div className={cx('esqueleto rounded-lg', className)} aria-hidden />;
}

export function EsqueletoLista({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => <Esqueleto key={i} className="h-12 w-full" />)}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

/* ---------------- Estado vazio ---------------- */
export function EstadoVazio({ icone, titulo, descricao, acao }: { icone: ReactNode; titulo: string; descricao: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-superficie-alt text-tinta-fraca">{icone}</div>
      <p className="font-space text-base font-semibold text-tinta">{titulo}</p>
      <p className="mt-1 max-w-sm text-sm text-tinta-suave">{descricao}</p>
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}
