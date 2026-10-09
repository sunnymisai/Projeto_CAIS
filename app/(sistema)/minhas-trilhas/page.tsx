/* ============================================================================
   APP/(SISTEMA)/MINHAS-TRILHAS/PAGE.TSX (MINHAS TRILHAS)
   O que é: as trilhas que a pessoa logada recebe, com "Continue de onde parou"
     no topo e a lista agrupada por alcance (geral, empresa, profissional).
   Onde é usado: rota /minhas-trilhas (perfis Profissional e Empresa). Chegam aqui:
     o menu lateral (components/shell/navegacao.ts: "Minhas trilhas" e "Trilha da
     empresa") e o caminho de volta do detalhe (/minhas-trilhas/[id]).
   Depende de: lib/auth.tsx (useAuth: sessão), lib/store.tsx (useDados),
     lib/metricas.ts (trilhasDaPessoaDetalhadas), lib/trilhas.ts (ALCANCE,
     TIPOS_ETAPA, hrefEtapa), components/trilhas/PrazoTrilha.tsx, components/button.tsx
     (classesBotao), components/ui/basicos.tsx e components/shell/Pagina.tsx.
   Contexto: §3 (o profissional cumpre as trilhas; a empresa cumpre a dela), §4
     (progresso, próximo passo em destaque e prazo) e §13 (quatro estados).
   ============================================================================ */

// "use client": lê a sessão e a store, que só existem no navegador.
"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, BookOpenCheck, PartyPopper, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { trilhasDaPessoaDetalhadas, type TrilhaDaPessoa } from '@/lib/metricas';
import { ALCANCE, TIPOS_ETAPA, hrefEtapa } from '@/lib/trilhas';
import type { Trilha } from '@/lib/tipos';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { Card, Progresso, Esqueleto, EstadoVazio, Aviso } from '@/components/ui/basicos';
import { classesBotao } from '@/components/button';
import PrazoTrilha from '@/components/trilhas/PrazoTrilha';

// [PV-1] A ORDEM DOS GRUPOS na tela (§4): trilha geral, depois a da empresa e por último a do profissional. Grupo sem trilha não aparece.
/** Ordem dos grupos na tela (§4: geral → empresa → profissional). */
const ORDEM_ALCANCE: Trilha['alcance'][] = ['geral', 'empresa', 'profissional'];

/**
 * Página Minhas trilhas.
 * Estados (§13): carregando (esqueleto), erro (cadastro da sessão não encontrado;
 * o erro de leitura dos dados é tratado pelo layout), vazio e com dado.
 * @returns a página.
 */
export default function PaginaMinhasTrilhas() {
  const { sessao } = useAuth();
  const d = useDados();
  // Recalcula só quando os dados ou a pessoa mudam (a lista percorre trilhas, pessoas e alocações).
  const minhas = useMemo(() => (sessao && d.pronto ? trilhasDaPessoaDetalhadas(sessao.pessoaId, d) : []), [sessao, d]);

  const cabecalho = <CabecalhoPagina titulo="Minhas trilhas" descricao="As trilhas atribuídas a você, o seu progresso e os prazos." />;

  // Estado carregando: esqueleto no formato da tela (cartão de destaque + dois cards).
  if (!d.pronto || !sessao) {
    return (
      <div className="mx-auto max-w-[960px] p-4 sm:p-6 lg:p-8">
        {cabecalho}
        <Esqueleto className="mb-6 h-40 w-full rounded-2xl" />
        <div className="grid gap-3 md:grid-cols-2"><Esqueleto className="h-32 rounded-2xl" /><Esqueleto className="h-32 rounded-2xl" /></div>
      </div>
    );
  }

  // Estado de erro: a sessão aponta para uma pessoa que não está no cadastro.
  if (!d.pessoa(sessao.pessoaId)) {
    return (
      <div className="mx-auto max-w-[960px] p-4 sm:p-6 lg:p-8">
        {cabecalho}
        <Aviso tipo="erro" titulo="Não encontramos o seu cadastro">Saia e entre de novo. Se continuar, fale com o administrador do programa.</Aviso>
      </div>
    );
  }

  // Estado vazio: explica e diz o que acontece depois.
  if (minhas.length === 0) {
    return (
      <div className="mx-auto max-w-[960px] p-4 sm:p-6 lg:p-8">
        {cabecalho}
        <Card><EstadoVazio icone={<BookOpenCheck className="h-6 w-6" aria-hidden />} titulo="Nenhuma trilha atribuída a você ainda."
          descricao="Quando o administrador publicar uma trilha para você, ela aparece aqui com o prazo." /></Card>
      </div>
    );
  }

  // [PV-2] O "CONTINUE DE ONDE PAROU": a primeira trilha não concluída; a lista já vem com o prazo mais curto primeiro (trilhasDaPessoaDetalhadas).
  // "Continue de onde parou": a primeira não concluída (a lista já vem com o prazo mais curto primeiro).
  const atual = minhas.find((t) => t.situacao !== 'concluida');

  return (
    <div className="mx-auto max-w-[960px] p-4 sm:p-6 lg:p-8">
      {cabecalho}

      {atual ? <ContinueDeOndeParou t={atual} /> : (
        // Tudo concluído: o destaque vira uma mensagem de "em dia" (verde + ícone + texto).
        <Card className="mb-8 flex items-center gap-3 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sucesso/12 text-sucesso"><PartyPopper className="h-5 w-5" aria-hidden /></span>
          <div>
            <p className="font-space font-semibold text-tinta">Você está em dia</p>
            <p className="text-sm text-tinta-suave">Concluiu todas as trilhas atribuídas. Novas trilhas aparecem aqui quando forem publicadas.</p>
          </div>
        </Card>
      )}

      {/* Grupos por alcance; grupo sem trilha não aparece. */}
      <div className="space-y-8">
        {ORDEM_ALCANCE.map((alcance) => {
          const doGrupo = minhas.filter((t) => t.trilha.alcance === alcance);
          if (doGrupo.length === 0) return null;
          return (
            <section key={alcance} aria-labelledby={`grupo-${alcance}`}>
              <h2 id={`grupo-${alcance}`} className="mb-3 flex items-center gap-2 font-space text-base font-semibold text-tinta">
                {/* Cor do alcance (§4) como acento; o nome vem escrito ao lado (cor nunca sozinha). */}
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: ALCANCE[alcance].cor }} aria-hidden />
                {ALCANCE[alcance].rotulo}
                <span className="text-sm font-normal text-tinta-suave">({doGrupo.length})</span>
              </h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {doGrupo.map((t) => <li key={t.trilha.id}><CartaoMinhaTrilha t={t} /></li>)}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// [PV-3] O DESTAQUE DO TOPO: trilha, próxima etapa e botão; o texto muda entre "Comece por aqui" e "Continue de onde parou". A faixa usa a cor do alcance da trilha.
/**
 * Destaque do topo (§4: "próximo passo em destaque"): trilha, próxima etapa e botão.
 * @param props.t a trilha não concluída de prazo mais curto.
 * @returns o cartão.
 */
function ContinueDeOndeParou({ t }: { t: TrilhaDaPessoa }) {
  // proximaEtapa nunca é null aqui (a trilha não está concluída), mas o TypeScript não sabe disso.
  const etapa = t.proximaEtapa !== null ? t.trilha.etapas[t.proximaEtapa] : undefined;
  if (!etapa) return null;
  const { icone: Icone, rotulo } = TIPOS_ETAPA[etapa.tipo];
  const comecou = t.concluidas > 0;
  return (
    <Card className="mb-8 overflow-hidden">
      {/* Faixa com a cor do alcance no topo do cartão (acento, não informação). */}
      <div className="h-1" style={{ background: ALCANCE[t.trilha.alcance].cor }} aria-hidden />
      <div className="p-5">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primaria">{comecou ? 'Continue de onde parou' : 'Comece por aqui'}</p>
        <h2 className="mt-1 font-space text-lg font-semibold text-tinta">{t.trilha.titulo}</h2>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-superficie-alt p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaria-suave text-primaria"><Icone className="h-[18px] w-[18px]" aria-hidden /></span>
          <div className="min-w-0">
            <p className="text-[12px] text-tinta-suave">Próxima etapa · {t.proximaEtapa! + 1} de {t.total} · {rotulo}</p>
            <p className="truncate text-sm font-semibold text-tinta">{etapa.titulo}</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <span className="text-tinta-suave">{t.concluidas} de {t.total} etapas</span>
            <PrazoTrilha trilha={t} />
          </div>
          <Progresso valor={t.pct} rotulo={`Progresso em ${t.trilha.titulo}: ${t.concluidas} de ${t.total} etapas`} />
        </div>
        {/* NAVEGA: abre o player na próxima etapa (D03). No celular ocupa a largura toda (alvo grande). */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link href={hrefEtapa(t.trilha.id, etapa.id)} className={classesBotao({ tamanho: 'lg', className: 'w-full sm:w-auto' })}>
            {comecou ? 'Continuar' : 'Começar'}<ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {/* NAVEGA: detalhe da trilha (todas as etapas). */}
          <Link href={`/minhas-trilhas/${t.trilha.id}`} className={classesBotao({ variante: 'secundario', tamanho: 'lg', className: 'w-full sm:w-auto' })}>Ver etapas</Link>
        </div>
      </div>
    </Card>
  );
}

/**
 * Card de uma trilha na lista: o card inteiro é o link para o detalhe.
 * @param props.t a trilha vista pela pessoa.
 * @returns o card.
 */
function CartaoMinhaTrilha({ t }: { t: TrilhaDaPessoa }) {
  const concluida = t.situacao === 'concluida';
  return (
    // NAVEGA: detalhe da trilha. border-l-4 + borderLeftColor: a cor do alcance como acento lateral.
    <Link href={`/minhas-trilhas/${t.trilha.id}`}
      className="block h-full rounded-2xl border border-l-4 border-borda bg-superficie p-4 shadow-card transition-colors hover:bg-superficie-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60"
      style={{ borderLeftColor: ALCANCE[t.trilha.alcance].cor }}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-space text-[15px] font-semibold leading-snug text-tinta">{t.trilha.titulo}</h3>
        <PrazoTrilha trilha={t} />
      </div>
      {t.trilha.descricao && <p className="mt-1 line-clamp-2 text-[13px] text-tinta-suave">{t.trilha.descricao}</p>}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <span className="text-tinta-suave">{t.concluidas} de {t.total} etapas</span>
          {/* Nota do quiz só quando existe (§4: nota acompanhada). */}
          {t.nota !== undefined && (
            <span className="flex items-center gap-1 font-semibold text-tinta"><Star className="h-3.5 w-3.5 text-aviso" aria-hidden />Nota {t.nota}</span>
          )}
        </div>
        <Progresso valor={t.pct} tom={concluida ? 'sucesso' : 'primaria'} rotulo={`Progresso: ${t.concluidas} de ${t.total} etapas`} />
      </div>
      {/* Próxima etapa em texto, para quem ainda não terminou. */}
      {!concluida && t.proximaEtapa !== null && (
        <p className="mt-3 truncate text-[13px] text-tinta-suave">Próxima: <span className="font-medium text-tinta">{t.trilha.etapas[t.proximaEtapa].titulo}</span></p>
      )}
    </Link>
  );
}
