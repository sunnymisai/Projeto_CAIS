/* ============================================================================
   TOPBAR.TSX — BARRA DO TOPO DO SHELL
   O que é: a faixa no alto de toda tela logada, com busca global (Ctrl+K),
   avisos (atrasos e sobrecarga), troca de tema e menu do perfil. Busca e avisos
   só mostram o que o perfil da sessão pode ver (lib/escopo.ts e lib/permissoes.ts).
   Onde é usado: app/(sistema)/layout.tsx (em todas as telas logadas).
   Depende de: lib/auth (useAuth), lib/store (useDados), lib/toast (useToast),
   lib/escopo (filtros por sessão), lib/permissoes (podeAcessar), lib/utils, next/navigation (useRouter), next/link, lucide-react,
   components/ThemeToggle, components/ui/Menu e components/ui/basicos (Avatar, Etiqueta).
   Contexto: §10 (anatomia: topo com busca, avisos e perfil), §5 (aviso de
   carga acima de 40 h: "é aviso, não bloqueio") e §15 (shell da aplicação).
   ============================================================================ */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Menu as MenuIcone, Search, LogOut, RotateCcw, UserRound, Building2, Users, FolderKanban, GraduationCap, Clock, Gauge } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Menu, { ItemMenu } from '@/components/ui/Menu';
import { Avatar, Etiqueta } from '@/components/ui/basicos';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { empresasVisiveis, pessoasVisiveis, projetosVisiveis, tarefasVisiveis } from '@/lib/escopo';
import { podeAcessar } from '@/lib/permissoes';
import type { Perfil } from '@/lib/tipos';
import { cx, hojeISO, normalizar, dataCurta } from '@/lib/utils';

/** Nome de cada perfil, em português, para a Etiqueta ao lado do nome. */
const NOME_PERFIL: Record<Perfil, string> = { admin: 'Administrador', empresa: 'Empresa', profissional: 'Profissional' };

/**
 * Topo da aplicação: busca, avisos e o seu perfil (§10).
 * @param onAbrirMenu abre a gaveta do menu lateral no celular (botão "hambúrguer").
 * @returns o <header> do shell.
 */
export default function Topbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  // Sessão de quem está logado (nome, e-mail) e a função de sair (lib/auth).
  const { sessao, sair } = useAuth();
  // Dados do protótipo (lib/store): projetos, empresas, pessoas, trilhas e tarefas.
  const dados = useDados();
  // Mostra mensagens rápidas (toast) de confirmação.
  const avisar = useToast();
  const router = useRouter();

  /* ---------- Busca global (atalho: Ctrl+K ou /) ---------- */
  // Texto digitado na busca.
  const [busca, setBusca] = useState('');
  // Se o campo está focado: a lista de resultados só aparece com foco.
  const [focado, setFocado] = useState(false);
  // Índice do resultado destacado (as setas ↑ ↓ mudam).
  const [sel, setSel] = useState(0);
  // Referência ao campo, para o atalho conseguir focá-lo.
  const campo = useRef<HTMLInputElement>(null);

  // Atalho de teclado da busca. Roda uma vez, quando o Topbar aparece ([]);
  // a limpeza remove o ouvinte quando ele sai da tela.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      // Está digitando num campo? Então "/" é só uma barra, não um atalho.
      const digitando = ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName);
      // Ctrl+K (Cmd+K no Mac) funciona sempre; "/" só fora de campos de texto.
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !digitando)) {
        // Impede a ação padrão do navegador (Ctrl+K em alguns navegadores vai para a barra de endereço).
        e.preventDefault();
        campo.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Resultados da busca: recalcula só quando o texto ou os dados mudam (useMemo).
  // ESCOPO: cada tipo só entra se o perfil PODE abrir a tela dele (podeAcessar) e,
  // dentro do tipo, só o que lib/escopo.ts deixa a sessão ver. Assim a busca nunca
  // sugere um link que levaria a /sem-permissao nem revela dado de outra empresa.
  // TODO(API): hoje a busca roda no navegador sobre a store; com a API da
  // PROGLOGIC vira uma chamada ao servidor (com debounce para não chamar a cada letra).
  const resultados = useMemo(() => {
    // normalizar tira acentos e maiúsculas: "sao" encontra "São".
    const q = normalizar(busca.trim());
    // Menos de 2 letras: não busca (1 letra traria quase tudo).
    if (q.length < 2) return [];
    // Sem sessão não há escopo: não mostra nada (o layout já teria redirecionado).
    if (!sessao) return [];
    const perfil = sessao.perfil;
    // Atalho: "este texto contém o que foi buscado?".
    const m = (s: string) => normalizar(s).includes(q);
    // Junta os quatro tipos num formato único { tipo, titulo, sub, href, icone }
    // e mostra no máximo 8. Empresas e pessoas não têm página própria: o
    // "?abrir=<id>" pede à lista que abra o modal daquele item.
    return [
      ...projetosVisiveis(sessao, dados).filter((p) => m(p.nome)).map((p) => ({ id: p.id, tipo: 'Projeto', titulo: p.nome, sub: dados.empresa(p.empresaId)?.nomeFantasia ?? '', href: `/projetos/${p.id}`, icone: FolderKanban })),
      ...(podeAcessar(perfil, '/empresas') ? empresasVisiveis(sessao, dados) : []).filter((e) => m(e.nomeFantasia) || m(e.razaoSocial) || m(e.cnpj)).map((e) => ({ id: e.id, tipo: 'Empresa', titulo: e.nomeFantasia, sub: e.cnpj, href: `/empresas?abrir=${e.id}`, icone: Building2 })),
      ...(podeAcessar(perfil, '/pessoas') ? pessoasVisiveis(sessao, dados) : []).filter((p) => m(p.nome) || m(p.email)).map((p) => ({ id: p.id, tipo: 'Pessoa', titulo: p.nome, sub: p.email, href: `/pessoas?abrir=${p.id}`, icone: Users })),
      ...(podeAcessar(perfil, '/trilhas') ? dados.trilhas : []).filter((t) => m(t.titulo)).map((t) => ({ id: t.id, tipo: 'Trilha', titulo: t.titulo, sub: `${t.etapas.length} etapas`, href: `/trilhas/${t.id}`, icone: GraduationCap })),
    ].slice(0, 8);
  }, [busca, dados, sessao]);

  // NAVEGA: limpa a busca, tira o foco do campo (fecha a lista) e vai para o resultado.
  const ir = useCallback((href: string) => { setBusca(''); (document.activeElement as HTMLElement | null)?.blur(); router.push(href); }, [router]);

  /* ---------- Avisos calculados a partir dos dados ---------- */
  // Avisos calculados na hora a partir dos dados (recalcula quando os dados mudam).
  // TODO(API): no sistema real virão do servidor como notificações, em tempo real.
  // ESCOPO: só tarefas dos projetos que a sessão enxerga; o aviso de sobrecarga de
  // pessoas é do Administrador (a tela /pessoas, para onde ele leva, é só dele).
  const avisos = useMemo(() => {
    // Sem sessão não há o que avisar.
    if (!sessao) return [];
    // Data de hoje como "AAAA-MM-DD": nesse formato dá para comparar datas como texto.
    const hoje = hojeISO();
    const lista: { id: string; texto: string; sub: string; href: string; tipo: 'atraso' | 'carga' }[] = [];
    for (const t of tarefasVisiveis(sessao, dados)) {
      const proj = dados.projeto(t.projetoId);
      // A última coluna do quadro (ex.: "Pronto") significa tarefa concluída.
      const ultima = proj?.colunas[proj.colunas.length - 1]?.id;
      // Atrasada = prazo já passou e a tarefa ainda não está na última coluna.
      if (t.prazo < hoje && t.colunaId !== ultima) {
        lista.push({ id: t.id, tipo: 'atraso', texto: `Tarefa atrasada: ${t.titulo}`, sub: `${proj?.nome} · prazo ${dataCurta(t.prazo)}`, href: `/projetos/${t.projetoId}?tarefa=${t.id}` });
      }
    }
    // Sobrecarga: só profissionais têm carga semanal.
    for (const p of podeAcessar(sessao.perfil, '/pessoas') ? dados.pessoas.filter((x) => x.perfil === 'profissional') : []) {
      const carga = dados.cargaDaPessoa(p.id);
      // Passou do limite da pessoa → aviso (nunca bloqueio, §5).
      if (carga > p.cargaMax) lista.push({ id: p.id, tipo: 'carga', texto: `${p.nome} está com ${carga} h/sem`, sub: `Acima do limite de ${p.cargaMax} h`, href: `/pessoas?abrir=${p.id}` });
    }
    return lista;
  }, [dados, sessao]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-borda bg-superficie px-4 sm:px-6">
      {/* Botão "hambúrguer": só no celular (lg:hidden), abre a gaveta do menu lateral. */}
      <button onClick={onAbrirMenu} aria-label="Abrir menu" className="rounded-lg p-2 text-tinta-suave hover:bg-superficie-alt hover:text-tinta lg:hidden">
        <MenuIcone className="h-5 w-5" />
      </button>

      {/* Busca global: Ctrl+K ou "/" focam o campo; resultados aparecem a partir de 2 letras. */}
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-fraca" aria-hidden />
        <input ref={campo} type="search" value={busca} placeholder="Buscar projeto, empresa, pessoa…"
          // role="combobox" + aria-expanded/aria-controls: o leitor de tela entende
          // que o campo abre uma lista de sugestões.
          aria-label="Busca global" role="combobox" aria-expanded={focado && resultados.length > 0} aria-controls="busca-resultados"
          // Ao digitar, o destaque volta para o 1º resultado.
          onChange={(e) => { setBusca(e.target.value); setSel(0); }}
          // onBlur espera 150 ms para esconder a lista: dá tempo de o clique no resultado acontecer.
          onFocus={() => setFocado(true)} onBlur={() => setTimeout(() => setFocado(false), 150)}
          // Teclado na busca: ↓/↑ movem o destaque sem passar das pontas, Enter abre o
          // resultado destacado e Esc limpa o texto e sai do campo.
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, resultados.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
            if (e.key === 'Enter' && resultados[sel]) ir(resultados[sel].href);
            if (e.key === 'Escape') { setBusca(''); campo.current?.blur(); }
          }}
          className="h-10 w-full rounded-xl border border-borda bg-fundo pl-9 pr-12 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
        {/* Dica visual do atalho (escondida no celular, onde não há teclado físico). */}
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-borda px-1.5 text-[11px] text-tinta-fraca sm:block">Ctrl K</kbd>

        {/* Lista de resultados: só com o campo focado e 2+ letras digitadas. */}
        {focado && busca.trim().length >= 2 && (
          <div id="busca-resultados" role="listbox" className="animate-modal-in absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-borda bg-superficie p-1.5 shadow-card">
            {/* Nenhum resultado: diz o que foi buscado, em vez de uma caixa vazia. */}
            {resultados.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-tinta-suave">Nada encontrado para “{busca}”.</p>
            ) : resultados.map((r, i) => (
              <button key={r.tipo + r.id} role="option" aria-selected={i === sel} onMouseDown={(e) => e.preventDefault()} onClick={() => ir(r.href)} onMouseEnter={() => setSel(i)}
                // onMouseDown + preventDefault (linha acima): o clique não tira o foco do campo
                // antes de o onClick rodar. onMouseEnter sincroniza o destaque com o mouse.
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
        {/* Avisos: o sino abre um menu com tarefas atrasadas e pessoas sobrecarregadas. */}
        <Menu largura="w-80" gatilho={(p) => (
          <button onClick={p.alternar} aria-expanded={p['aria-expanded']} aria-haspopup="menu"
            // O leitor de tela ouve a quantidade ("Avisos: 3 novos"), não só "sino".
            aria-label={avisos.length ? `Avisos: ${avisos.length} novos` : 'Avisos'}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-borda bg-superficie text-tinta-suave hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
            <Bell className="h-[18px] w-[18px]" />
            {/* Selo vermelho com a quantidade; dark:text-[#14161F] mantém o contraste no tema escuro. */}
            {avisos.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-erro px-1 text-[10px] font-bold text-white ring-2 ring-superficie dark:text-[#14161F]">{avisos.length}</span>
            )}
          </button>
        )}>
          {/* O conteúdo recebe "fechar" para fechar o menu ao escolher um aviso. */}
          {(fechar) => (
            <div>
              <p className="px-3 pb-2 pt-1.5 text-[12px] font-bold uppercase tracking-wider text-tinta-suave">Avisos</p>
              {/* Estado vazio: tudo em dia. */}
              {avisos.length === 0 && <p className="px-3 py-4 text-sm text-tinta-suave">Tudo em dia. Nenhum atraso ou sobrecarga.</p>}
              <div className="rolagem max-h-80 overflow-y-auto">
                {avisos.map((a) => (
                  <Link key={a.tipo + a.id} href={a.href} onClick={fechar} role="menuitem"
                    // NAVEGA: abre a tela do problema (tarefa no quadro ou pessoa na lista) e fecha o menu.
                    className="flex gap-3 rounded-lg px-3 py-2.5 hover:bg-superficie-alt">
                    {/* Ícone muda pelo tipo: relógio vermelho (atraso) ou medidor âmbar (carga). */}
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

        {/* Troca de tema claro/escuro (GRAVA a escolha no localStorage; ver ThemeToggle). */}
        <ThemeToggle />

        {/* Menu do perfil: nome, e-mail e ações da conta. */}
        <Menu gatilho={(p) => (
          <button onClick={p.alternar} aria-expanded={p['aria-expanded']} aria-haspopup="menu" aria-label="Menu do perfil"
            className="flex items-center gap-2 rounded-full p-0.5 pr-0.5 hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 sm:pr-3">
            <Avatar nome={sessao?.nome ?? 'Usuário'} tamanho={36} />
            {/* Nome e perfil ficam escondidos no celular; lá aparece só o avatar. */}
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-semibold leading-tight text-tinta">{sessao?.nome}</span>
              {/* Etiqueta com o perfil da sessão (texto, não só cor: §9). */}
              {sessao && <span className="mt-0.5 block"><Etiqueta tom="neutro">{NOME_PERFIL[sessao.perfil]}</Etiqueta></span>}
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
                {/* NAVEGA: "Meu perfil" abre /perfil (liberado aos três perfis) e fecha o menu. */}
                <Link href="/perfil" onClick={fechar} role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-tinta hover:bg-superficie-alt focus-visible:bg-superficie-alt focus-visible:outline-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-tinta-suave">
                  <UserRound aria-hidden />
                  Meu perfil
                </Link>
                {/* APAGA: descarta tudo o que foi criado ou alterado no protótipo.
                 * GRAVA: recoloca os dados de demonstração originais (seed) na store, que os
                 * salva no localStorage. Depois fecha o menu e confirma com um aviso (toast).
                 * SIMULADO: só existe no protótipo; sai quando a API real estiver ligada. */}
                <ItemMenu icone={<RotateCcw />} onClick={() => { dados.restaurarDemonstracao(); fechar(); avisar('Dados de demonstração restaurados.'); }}>
                  Restaurar dados de demonstração
                </ItemMenu>
                {/* APAGA: sair() remove a sessão salva (localStorage e sessionStorage).
                 * NAVEGA: replace('/login') vai para o login (a raiz "/" agora é a homepage)
                 * sem deixar a tela atual no histórico do "voltar". */}
                <ItemMenu perigo icone={<LogOut />} onClick={() => { sair(); router.replace('/login'); }}>
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
