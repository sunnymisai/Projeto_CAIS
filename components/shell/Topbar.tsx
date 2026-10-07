"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Menu as MenuIcone, Search, LogOut, RotateCcw, Building2, Users, FolderKanban, GraduationCap, Clock, Gauge } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Menu, { ItemMenu } from '@/components/ui/Menu';
import { Avatar } from '@/components/ui/basicos';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { cx, hojeISO, normalizar, dataCurta } from '@/lib/utils';

/** Topo: busca, avisos e o seu perfil (slide 15). */
export default function Topbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const { sessao, sair } = useAuth();
  const dados = useDados();
  const avisar = useToast();
  const router = useRouter();

  /* ---------- Busca global (atalho: Ctrl+K ou /) ---------- */
  const [busca, setBusca] = useState('');
  const [focado, setFocado] = useState(false);
  const [sel, setSel] = useState(0);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      const digitando = ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName);
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !digitando)) {
        e.preventDefault();
        campo.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const resultados = useMemo(() => {
    const q = normalizar(busca.trim());
    if (q.length < 2) return [];
    const m = (s: string) => normalizar(s).includes(q);
    return [
      ...dados.projetos.filter((p) => m(p.nome)).map((p) => ({ id: p.id, tipo: 'Projeto', titulo: p.nome, sub: dados.empresa(p.empresaId)?.nomeFantasia ?? '', href: `/projetos/${p.id}`, icone: FolderKanban })),
      ...dados.empresas.filter((e) => m(e.nomeFantasia) || m(e.razaoSocial) || m(e.cnpj)).map((e) => ({ id: e.id, tipo: 'Empresa', titulo: e.nomeFantasia, sub: e.cnpj, href: `/empresas?abrir=${e.id}`, icone: Building2 })),
      ...dados.pessoas.filter((p) => m(p.nome) || m(p.email)).map((p) => ({ id: p.id, tipo: 'Pessoa', titulo: p.nome, sub: p.email, href: `/pessoas?abrir=${p.id}`, icone: Users })),
      ...dados.trilhas.filter((t) => m(t.titulo)).map((t) => ({ id: t.id, tipo: 'Trilha', titulo: t.titulo, sub: `${t.etapas.length} etapas`, href: `/trilhas/${t.id}`, icone: GraduationCap })),
    ].slice(0, 8);
  }, [busca, dados]);

  const ir = useCallback((href: string) => { setBusca(''); (document.activeElement as HTMLElement | null)?.blur(); router.push(href); }, [router]);

  /* ---------- Avisos calculados a partir dos dados ---------- */
  const avisos = useMemo(() => {
    const hoje = hojeISO();
    const lista: { id: string; texto: string; sub: string; href: string; tipo: 'atraso' | 'carga' }[] = [];
    for (const t of dados.tarefas) {
      const proj = dados.projeto(t.projetoId);
      const ultima = proj?.colunas[proj.colunas.length - 1]?.id;
      if (t.prazo < hoje && t.colunaId !== ultima) {
        lista.push({ id: t.id, tipo: 'atraso', texto: `Tarefa atrasada: ${t.titulo}`, sub: `${proj?.nome} · prazo ${dataCurta(t.prazo)}`, href: `/projetos/${t.projetoId}?tarefa=${t.id}` });
      }
    }
    for (const p of dados.pessoas.filter((x) => x.perfil === 'profissional')) {
      const carga = dados.cargaDaPessoa(p.id);
      if (carga > p.cargaMax) lista.push({ id: p.id, tipo: 'carga', texto: `${p.nome} está com ${carga} h/sem`, sub: `Acima do limite de ${p.cargaMax} h`, href: `/pessoas?abrir=${p.id}` });
    }
    return lista;
  }, [dados]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-borda bg-superficie px-4 sm:px-6">
      <button onClick={onAbrirMenu} aria-label="Abrir menu" className="rounded-lg p-2 text-tinta-suave hover:bg-superficie-alt hover:text-tinta lg:hidden">
        <MenuIcone className="h-5 w-5" />
      </button>

      {/* Busca */}
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-fraca" aria-hidden />
        <input ref={campo} type="search" value={busca} placeholder="Buscar projeto, empresa, pessoa…"
          aria-label="Busca global" role="combobox" aria-expanded={focado && resultados.length > 0} aria-controls="busca-resultados"
          onChange={(e) => { setBusca(e.target.value); setSel(0); }}
          onFocus={() => setFocado(true)} onBlur={() => setTimeout(() => setFocado(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, resultados.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
            if (e.key === 'Enter' && resultados[sel]) ir(resultados[sel].href);
            if (e.key === 'Escape') { setBusca(''); campo.current?.blur(); }
          }}
          className="h-10 w-full rounded-xl border border-borda bg-fundo pl-9 pr-12 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-borda px-1.5 text-[11px] text-tinta-fraca sm:block">Ctrl K</kbd>

        {focado && busca.trim().length >= 2 && (
          <div id="busca-resultados" role="listbox" className="animate-modal-in absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-borda bg-superficie p-1.5 shadow-card">
            {resultados.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-tinta-suave">Nada encontrado para “{busca}”.</p>
            ) : resultados.map((r, i) => (
              <button key={r.tipo + r.id} role="option" aria-selected={i === sel} onMouseDown={(e) => e.preventDefault()} onClick={() => ir(r.href)} onMouseEnter={() => setSel(i)}
                className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left', i === sel && 'bg-superficie-alt')}>
                <r.icone className="h-4 w-4 shrink-0 text-tinta-fraca" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-tinta">{r.titulo}</span>
                  <span className="block truncate text-[12px] text-tinta-suave">{r.sub}</span>
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-tinta-fraca">{r.tipo}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Avisos */}
        <Menu largura="w-80" gatilho={(p) => (
          <button onClick={p.alternar} aria-expanded={p['aria-expanded']} aria-haspopup="menu"
            aria-label={avisos.length ? `Avisos: ${avisos.length} novos` : 'Avisos'}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-borda bg-superficie text-tinta-suave hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
            <Bell className="h-[18px] w-[18px]" />
            {avisos.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-erro px-1 text-[10px] font-bold text-white ring-2 ring-superficie dark:text-[#14161F]">{avisos.length}</span>
            )}
          </button>
        )}>
          {(fechar) => (
            <div>
              <p className="px-3 pb-2 pt-1.5 text-[12px] font-bold uppercase tracking-wider text-tinta-suave">Avisos</p>
              {avisos.length === 0 && <p className="px-3 py-4 text-sm text-tinta-suave">Tudo em dia. Nenhum atraso ou sobrecarga.</p>}
              <div className="rolagem max-h-80 overflow-y-auto">
                {avisos.map((a) => (
                  <Link key={a.tipo + a.id} href={a.href} onClick={fechar} role="menuitem"
                    className="flex gap-3 rounded-lg px-3 py-2.5 hover:bg-superficie-alt">
                    <span className={cx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', a.tipo === 'atraso' ? 'bg-erro/12 text-erro' : 'bg-aviso/12 text-aviso')}>
                      {a.tipo === 'atraso' ? <Clock className="h-3.5 w-3.5" /> : <Gauge className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-tinta">{a.texto}</span>
                      <span className="block text-[12px] text-tinta-suave">{a.sub}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Menu>

        <ThemeToggle />

        {/* Perfil */}
        <Menu gatilho={(p) => (
          <button onClick={p.alternar} aria-expanded={p['aria-expanded']} aria-haspopup="menu" aria-label="Menu do perfil"
            className="flex items-center gap-2 rounded-full p-0.5 pr-0.5 hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 sm:pr-3">
            <Avatar nome={sessao?.nome ?? 'Admin'} tamanho={36} />
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-semibold leading-tight text-tinta">{sessao?.nome}</span>
              <span className="block text-[11px] leading-tight text-tinta-suave">Administrador</span>
            </span>
          </button>
        )}>
          {(fechar) => (
            <>
              <div className="border-b border-borda px-3 pb-2.5 pt-1.5">
                <p className="text-sm font-semibold text-tinta">{sessao?.nome}</p>
                <p className="truncate text-[12px] text-tinta-suave">{sessao?.email}</p>
              </div>
              <div className="pt-1.5">
                <ItemMenu icone={<RotateCcw />} onClick={() => { dados.restaurarDemonstracao(); fechar(); avisar('Dados de demonstração restaurados.'); }}>
                  Restaurar dados de demonstração
                </ItemMenu>
                <ItemMenu perigo icone={<LogOut />} onClick={() => { sair(); router.replace('/'); }}>
                  Sair
                </ItemMenu>
              </div>
            </>
          )}
        </Menu>
      </div>
    </header>
  );
}
