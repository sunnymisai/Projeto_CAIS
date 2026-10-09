/* ============================================================================
   EQUIPE.TSX
   O que é: a aba Equipe do projeto (tabela de alocações + modal para alocar/editar).
               Editar e remover alocação só aparecem para quem pode alocar (Admin).
               A Empresa aloca o time nos projetos dela e vê as horas por pessoa; só o admin vê o
               semáforo e as trilhas das pessoas (privacidade).
   Onde é usado: app/(sistema)/projetos/[id]/page.tsx, na aba "Equipe".
               O modal de alocar mostra a prévia do semáforo (antes × depois por semana)
               e sugere a primeira data livre quando alguma semana fica acima do limite.
   Depende de: lib/store (useDados: alocacoes, pessoa, salvar, remover), lib/auth (useAuth),
               lib/permissoes (podeFazer), lib/escopo (podeVerProjeto), lib/toast, lib/useFormulario, lib/metricas
               (trilhasDaPessoa), lib/carga (picoNoPeriodo, simularAlocacao, proximaJanelaLivre e
               afins), components/ui (Modal, form, basicos, Tabela, Semaforo),
               components/button, components/input e lib/utils.
   Contexto: §5 Projetos (Alocação: pessoa, papel, período, carga, trilhas;
             acima do limite "É AVISO, NÃO BLOQUEIO"), §12 fluxo 3 (alocar alguém)
             e §16 (semáforo de carga por período).
   ============================================================================ */
"use client";

import { useCallback, useState } from 'react';
import { UserPlus, Pencil, Trash2, Users } from 'lucide-react';
import { useDados, Alocacao, Projeto } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { podeFazer } from '@/lib/permissoes';
import { podeVerProjeto } from '@/lib/escopo';
import { useToast } from '@/lib/toast';
import { useFormulario } from '@/lib/useFormulario';
import { trilhasDaPessoa } from '@/lib/metricas';
import { BLOQUEAR_SOBRECARGA, diasUteisEntre, fimAposDiasUteis, picoNoPeriodo, proximaJanelaLivre, ROTULO_NIVEL, simularAlocacao } from '@/lib/carga';
import { IndicadorCarga, LinhaDeSemanas, descreverCarga, rotuloSemana } from '@/components/ui/Semaforo';
import Modal from '@/components/ui/Modal';
import Button from '@/components/button';
import Input from '@/components/input';
import { Select, AreaTexto } from '@/components/ui/form';
import { Avatar, Aviso, EstadoVazio } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import { cx, dataBR, novoId } from '@/lib/utils';

// [PV-1] OS PAPÉIS possíveis de uma pessoa no projeto (Líder, Front-end, Back-end, UX, QA, Dados). Papel novo entra nesta lista.
// Papéis possíveis de uma pessoa dentro do projeto.
const PAPEIS = ['Líder', 'Front-end', 'Back-end', 'UX', 'QA', 'Dados'];

/**
 * Equipe do projeto: a pessoa formada vira pessoa alocada (slide 19).
 * Colunas: pessoa, papel, período, carga e trilhas concluídas (§5). O perfil Empresa vê as horas de cada
 * pessoa neste projeto e aloca o time; o semáforo e as trilhas ficam só com o administrador
 * (privacidade: ver verSemaforoETrilhas).
 *
 * O botão "Alocar pessoa" fica no cabeçalho da página; por isso o estado
 * `alocando` vem de fora (a página controla, este componente abre o modal).
 *
 * @param projeto projeto cuja equipe é exibida.
 * @param alocando true quando a página pediu para abrir o modal de alocar.
 * @param setAlocando liga/desliga o modal de alocar.
 * @returns tabela da equipe (ou estado vazio) e o modal, quando aberto.
 */
export default function Equipe({ projeto, alocando, setAlocando }: { projeto: Projeto; alocando: boolean; setAlocando: (v: boolean) => void }) {
  const d = useDados();
  const { sessao } = useAuth();
  const avisar = useToast();
  // [PV-2] QUEM ALOCA (decisão da PROGLOGIC, 09/10/2026): o administrador em qualquer projeto e a empresa nos projetos dela, por podeFazer "alocar". Para os outros, os botões nem aparecem.
  // Só quem pode alocar vê os botões de alocar, editar e remover: o Administrador (qualquer projeto) e a
  // EMPRESA nos projetos dela (decisão da PROGLOGIC, 09/10/2026). São ESCONDIDOS, não desabilitados:
  // para o profissional a tabela é só leitura e um botão sem uso geraria dúvida (e seria anunciado
  // como "indisponível" por leitores de tela). podeVerProjeto garante que a empresa só aloca no que é dela.
  const podeAlocar = !!sessao && podeFazer(sessao.perfil, 'alocar', { enxergaProjeto: podeVerProjeto(sessao, projeto.id, d) });
  // [PV-3] PRIVACIDADE: a empresa vê as horas de cada pessoa neste projeto, mas não o semáforo nem as trilhas (somariam projetos e trilhas de outros clientes). Só o administrador vê os dois.
  // PRIVACIDADE: o perfil Empresa vê as HORAS de cada pessoa neste projeto (ela aloca o time), mas NÃO o
  // semáforo (o pico soma os outros projetos da pessoa, que são de outros clientes) nem as trilhas (a
  // contagem inclui trilhas de outras empresas). Só o administrador vê esses dois.
  const verSemaforoETrilhas = sessao?.perfil !== 'empresa';
  // Alocação aberta no modal de edição (null = nenhuma).
  const [editando, setEditando] = useState<Alocacao | null>(null);
  const equipe = d.alocacoes.filter((a) => a.projetoId === projeto.id);

  return (
    <>
      <div className="rounded-2xl border border-borda bg-superficie">
        {/* Estado vazio: explica o que é alocar e oferece a ação. */}
        {equipe.length === 0 ? (
          <EstadoVazio icone={<Users className="h-6 w-6" />} titulo="Ninguém alocado ainda"
            descricao={podeAlocar ? 'Aloque as pessoas que vão trabalhar no projeto, com papel, período e carga semanal.' : 'Quando a coordenação alocar pessoas neste projeto, a equipe aparece aqui.'}
            acao={podeAlocar ? <Button onClick={() => setAlocando(true)}><UserPlus className="h-4 w-4" />Alocar pessoa</Button> : undefined} />
        ) : (
          <>
            <Tabela rotulo="Equipe do projeto">
              {/* sr-only: o título "Ações" existe só para leitores de tela. */}
              <thead><tr><Th>Pessoa</Th><Th>Papel</Th><Th>Período</Th><Th>Carga</Th>{verSemaforoETrilhas && <Th>Trilhas</Th>}{podeAlocar && <Th className="w-24"><span className="sr-only">Ações</span></Th>}</tr></thead>
              <tbody>
                {equipe.map((a) => {
                  // Alocação de pessoa que não existe mais: pula a linha.
                  const p = d.pessoa(a.pessoaId); if (!p) return null;
                  /*
                   * Semáforo (F04): o PICO da pessoa, somando TODOS os projetos, no período
                   * DESTA alocação (picoNoPeriodo, lib/carga.ts). Conta o quando de cada
                   * alocação: duas que não se cruzam no tempo não se somam. Acima do limite
                   * é AVISO, NÃO BLOQUEIO (§5).
                   */
                  const pico = picoNoPeriodo(p, a.inicio, a.fim, d);
                  // Trilhas concluídas das obrigatórias (coluna "Trilhas", §5).
                  const tr = trilhasDaPessoa(p.id, d);
                  return (
                    <Tr key={a.id}>
                      <Td><span className="flex items-center gap-2.5"><Avatar nome={p.nome} tamanho={32} /><span><span className="block font-semibold">{p.nome}</span><span className="block text-[12px] text-tinta-suave">{p.area} · {p.nivel}</span></span></span></Td>
                      <Td>{a.papel}</Td>
                      {/* slice(0, 5) corta o ano: "dd/mm/aaaa" vira "dd/mm". */}
                      <Td className="tabular-nums text-tinta-suave">{dataBR(a.inicio).slice(0, 5)} a {dataBR(a.fim).slice(0, 5)}</Td>
                      {/* As horas DESTE projeto (todos os perfis) e, só para quem vê o semáforo, o pico da pessoa
                        * no período da alocação. */}
                      <Td>
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <span className="tabular-nums">{a.carga} h/sem</span>
                          {verSemaforoETrilhas && <IndicadorCarga nivel={pico.nivel} pct={pico.pct} compacto rotulo={`Pico de ${p.nome} no período desta alocação: ${descreverCarga(pico.pct, pico.nivel)}`} />}
                        </span>
                      </Td>
                      {/* Trilhas: só o administrador (ver verSemaforoETrilhas). Âmbar quando faltam trilhas obrigatórias. */}
                      {verSemaforoETrilhas && <Td className={cx('tabular-nums', tr.concluidas < tr.total && 'text-aviso')}>{tr.concluidas} de {tr.total}</Td>}
                      {podeAlocar && <Td>
                        <div className="flex justify-end gap-0.5">
                          <button onClick={() => setEditando(a)} aria-label={`Editar alocação de ${p.nome}`} className="rounded-lg p-1.5 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta"><Pencil className="h-4 w-4" /></button>
                          {/*
                            * APAGA: tira a pessoa da equipe (remove só a alocação; a
                            * pessoa e as tarefas dela continuam existindo).
                            * TODO(API): trocar por DELETE da alocação.
                            */}
                          <button onClick={() => { d.remover('alocacoes', a.id); avisar(`${p.nome} saiu da equipe.`); }} aria-label={`Remover ${p.nome} da equipe`} className="rounded-lg p-1.5 text-tinta-fraca hover:bg-erro/10 hover:text-erro"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </Td>}
                    </Tr>
                  );
                })}
              </tbody>
            </Tabela>
            {/* Legenda das colunas (o ícone nunca aparece sem explicação). A empresa vê só a explicação das horas. */}
            <p className="flex items-center gap-1.5 px-4 py-3 text-[12px] text-tinta-suave">
              {verSemaforoETrilhas ? (
                <><strong className="text-tinta">Carga:</strong> horas neste projeto e o pico da pessoa, somando todos os projetos, no período da alocação. Acima do limite é aviso, não bloqueio. <strong className="ml-1 text-tinta">Trilhas:</strong> quantas concluídas das atribuídas.</>
              ) : (
                <><strong className="text-tinta">Carga:</strong> horas por semana que cada pessoa dedica a este projeto.</>
              )}
            </p>
          </>
        )}
      </div>

      {/* Mesmo modal serve para alocar (sem alocação) e editar (com alocação). */}
      {podeAlocar && (alocando || editando) && <FormAlocacao projeto={projeto} alocacao={editando} onFechar={() => { setAlocando(false); setEditando(null); }} />}
    </>
  );
}

/** Valores do formulário: a alocação sem id e projetoId (esses vêm de fora). */
type Val = Omit<Alocacao, 'id' | 'projetoId'>;

// [PV-4] O FORMULÁRIO DE ALOCAÇÃO: escolher pessoa, papel, período e carga semanal, com a prévia do semáforo antes de gravar.
/**
 * Modal para alocar uma pessoa no projeto ou editar uma alocação.
 * @param projeto projeto que recebe a pessoa (período padrão = do projeto).
 * @param alocacao alocação em edição, ou null para criar uma nova.
 * @param onFechar fecha o modal.
 * @returns o modal com o formulário de alocação.
 */
function FormAlocacao({ projeto, alocacao, onFechar }: { projeto: Projeto; alocacao: Alocacao | null; onFechar: () => void }) {
  const d = useDados();
  const avisar = useToast();

  // [PV-5] AS REGRAS DA ALOCAÇÃO: pessoa, papel, início e carga (mínimo 1 h) obrigatórios; fim opcional (vazio vale a entrega do projeto). Não há carga máxima: é aviso, não bloqueio (§5).
  /*
   * Regras de validação (o erro aparece ao sair do campo, via useFormulario).
   * useCallback com [] mantém a mesma função entre renders, para o hook
   * não revalidar à toa.
   */
  const validar = useCallback((v: Val) => {
    const e: Partial<Record<keyof Val, string>> = {};
    if (!v.pessoaId) e.pessoaId = 'Escolha quem será alocado.';
    if (!v.papel) e.papel = 'Escolha o papel no projeto.';
    if (!v.inicio) e.inicio = 'Informe o início.';
    // Fim é opcional, mas se vier não pode ser antes do início.
    if (v.fim && v.inicio && v.fim < v.inicio) e.fim = 'O fim não pode vir antes do início.';
    if (!v.carga || v.carga < 1) e.carga = 'Informe a carga semanal em horas.';
    // Não há regra de carga máxima aqui de propósito: é aviso, não bloqueio (§5).
    return e;
  }, []);

  // [PV-6] OS VALORES INICIAIS de uma alocação nova: o período do projeto e 20 h por semana.
  // Editando: parte da alocação existente. Nova: período do projeto e 20 h/sem.
  const f = useFormulario<Val>(alocacao ? { ...alocacao } : { pessoaId: '', papel: '', inicio: projeto.inicio, fim: projeto.entrega, carga: 20, obs: '' }, validar);
  const v = f.valores;
  // Quem já está no projeto não aparece de novo na lista (exceto a própria alocação em edição).
  const jaNaEquipe = new Set(d.alocacoes.filter((a) => a.projetoId === projeto.id && a.id !== alocacao?.id).map((a) => a.pessoaId));
  // [PV-7] QUEM PODE SER ALOCADO: profissionais não inativos que ainda não estão na equipe deste projeto.
  // Só profissionais ativos (ou convidados) que ainda não estão na equipe.
  const disponiveis = d.pessoas.filter((p) => p.perfil === 'profissional' && p.status !== 'inativo' && !jaNaEquipe.has(p.id));
  const pessoa = d.pessoa(v.pessoaId);
  /*
   * Prévia do semáforo (F04, lib/carga.ts): como fica cada semana do período ANTES e DEPOIS
   * desta alocação, recalculada ao mudar pessoa, datas ou carga. Fim vazio = entrega do projeto.
   * Na edição, a alocação antiga sai do "depois" (ignorar = alocacao.id) para não contar duas vezes.
   */
  const carga = Number(v.carga) || 0;
  const fimEfetivo = v.fim || projeto.entrega;
  const periodoValido = !!pessoa && !!v.inicio && fimEfetivo >= v.inicio && carga > 0;
  const previa = periodoValido ? simularAlocacao(pessoa!, { inicio: v.inicio, fim: fimEfetivo, carga }, d, alocacao?.id) : [];
  // Semanas que ficam vermelhas com esta alocação.
  const vermelhas = previa.filter((s) => s.depois.nivel === 'vermelho');
  // Duração em dias úteis (mantida ao usar a data sugerida) e a primeira data em que a alocação cabe.
  const duracao = periodoValido ? diasUteisEntre(v.inicio, fimEfetivo).length : 0;
  const sugestao = vermelhas.length && pessoa ? proximaJanelaLivre(pessoa, carga, duracao, v.inicio, d, alocacao?.id) : null;
  // [PV-8] A TRAVA DE SOBRECARGA: com BLOQUEAR_SOBRECARGA (lib/carga.ts) ligada, o botão Alocar recusa semana vermelha. Hoje está desligada (§5: aviso, não bloqueio).
  // BLOQUEAR_SOBRECARGA = false (§5: é aviso, não bloqueio). Se o time ligar, "Alocar" recusa.
  const bloqueado = BLOQUEAR_SOBRECARGA && vermelhas.length > 0;
  /**
   * Aplica a data sugerida: novo início e o fim ajustado para manter a mesma duração em dias úteis.
   * GRAVA: só os campos do formulário (ainda não salva a alocação).
   */
  const usarSugestao = () => {
    if (!sugestao) return;
    f.set('inicio', sugestao);
    f.set('fim', fimAposDiasUteis(sugestao, duracao));
  };

  // [PV-9] O SALVAR DA ALOCAÇÃO: cria ou atualiza. A notificação à pessoa é SIMULADA. TODO(API): POST ou PUT de alocação.
  /** Valida tudo e grava a alocação (nova ou editada). */
  const salvar = () => {
    if (!f.validarTudo() || bloqueado) return;
    // GRAVA: cria ou atualiza a alocação. Number() porque o campo devolve texto.
    // TODO(API): trocar por POST/PUT de alocação.
    d.salvar('alocacoes', { ...v, carga: Number(v.carga), id: alocacao?.id ?? novoId('alo'), projetoId: projeto.id });
    // SIMULADO: o protótipo não envia notificação de verdade para a pessoa.
    avisar(alocacao ? 'Alocação atualizada.' : `${pessoa?.nome} alocada como ${v.papel}. A pessoa foi notificada.`);
    onFechar();
  };

  return (
    <Modal aberto onFechar={onFechar} tamanho="md" titulo={alocacao ? 'Editar alocação' : 'Alocar pessoa'} descricao={projeto.nome}
      rodape={<><Button variante="secundario" onClick={onFechar}>Cancelar</Button><Button onClick={salvar} disabled={bloqueado}>{alocacao ? 'Salvar' : 'Alocar'}</Button></>}>
      {/* noValidate: quem valida é o useFormulario, não o navegador. */}
      <form onSubmit={(e) => { e.preventDefault(); salvar(); }} noValidate className="space-y-4">
        {/*
          * Ao editar, a pessoa fica travada (disabled) e a lista mostra só ela.
          * Cada opção diz, em texto, o pico da pessoa no período do projeto (semáforo), para ajudar a escolher.
          */}
        <Select label="Pessoa" required placeholder="Escolha um profissional" value={v.pessoaId} error={f.erros.pessoaId} disabled={!!alocacao}
          onChange={(e) => f.set('pessoaId', e.target.value)} onBlur={() => f.blur('pessoaId')}
          opcoes={(alocacao ? d.pessoas.filter((p) => p.id === alocacao.pessoaId) : disponiveis).map((p) => ({ valor: p.id, rotulo: `${p.nome} · ${p.area || 'sem área'} · ${ROTULO_NIVEL[picoNoPeriodo(p, projeto.inicio, projeto.entrega, d, alocacao?.id).nivel].toLowerCase()} no período` }))} />
        <Select label="Papel no projeto" required placeholder="Selecione o papel" value={v.papel} error={f.erros.papel}
          onChange={(e) => f.set('papel', e.target.value)} onBlur={() => f.blur('papel')} opcoes={PAPEIS.map((p) => ({ valor: p, rotulo: p }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input compacto label="Início" required type="date" {...f.campo('inicio')} />
          {/* min={v.inicio}: o calendário nem oferece datas antes do início. */}
          <Input compacto label="Fim" type="date" min={v.inicio} {...f.campo('fim')} />
        </div>
        <Input compacto label="Carga semanal (horas)" required type="number" min={1} max={44} value={String(v.carga)}
          onChange={(e) => f.set('carga', Number(e.target.value))} onBlur={() => f.blur('carga')} error={f.erros.carga} />
        <AreaTexto label="Observação" placeholder="Opcional" rows={2} value={v.obs} onChange={(e) => f.set('obs', e.target.value)} />
        {/* Prévia antes × depois por semana do período (aria-live: o leitor de tela ouve a mudança). */}
        {previa.length > 0 && (
          <div className="space-y-3 rounded-xl border border-borda bg-fundo/50 p-3" aria-live="polite">
            <p className="text-[13px] font-semibold text-tinta">Carga de {pessoa!.nome.split(' ')[0]} no período</p>
            <div>
              <p className="mb-1 text-[12px] text-tinta-suave">Antes</p>
              <LinhaDeSemanas quem={pessoa!.nome} rotulo={`Carga de ${pessoa!.nome} antes desta alocação`} semanas={previa.map((s) => ({ segunda: s.segunda, ...s.antes }))} />
            </div>
            <div>
              <p className="mb-1 text-[12px] text-tinta-suave">Depois</p>
              <LinhaDeSemanas quem={pessoa!.nome} rotulo={`Carga de ${pessoa!.nome} depois desta alocação`} semanas={previa.map((s) => ({ segunda: s.segunda, ...s.depois }))} />
            </div>
          </div>
        )}
        {/* É AVISO, NÃO BLOQUEIO (§5): com semana vermelha, explica e sugere a 1ª data livre, mas deixa alocar. */}
        {vermelhas.length > 0 && (
          <Aviso tipo={bloqueado ? 'erro' : 'aviso'} titulo={bloqueado ? 'Alocação bloqueada pelo limite de carga' : 'Atenção com esta alocação'}
            acao={sugestao ? <Button tamanho="sm" variante="secundario" onClick={usarSugestao}>Usar {rotuloSemana(sugestao)} como início</Button> : undefined}>
            {pessoa!.nome.split(' ')[0]} fica acima do limite {vermelhas.length === 1 ? 'na semana de ' : 'nas semanas de '}{listarSemanas(vermelhas.map((s) => s.segunda))}.{' '}
            {sugestao
              ? <>Com {carga} h/sem, há espaço a partir de {rotuloSemana(sugestao)}.</>
              : <>Com {carga} h/sem, não há espaço nos próximos 12 meses.</>}
            {!bloqueado && ' Dá para alocar mesmo assim.'}
          </Aviso>
        )}
        {/* Botão invisível para o Enter enviar o formulário. */}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

/**
 * Junta as datas das semanas em português: "13/10", "13/10 e 20/10" ou "13/10, 20/10 e 27/10".
 * @param segundas - segundas-feiras (AAAA-MM-DD).
 * @returns o texto.
 * @example listarSemanas(['2026-10-12', '2026-10-19']) // '12/10 e 19/10'
 */
function listarSemanas(segundas: string[]): string {
  const r = segundas.map(rotuloSemana);
  return r.length <= 1 ? (r[0] ?? '') : `${r.slice(0, -1).join(', ')} e ${r[r.length - 1]}`;
}
