/* ============================================================================
   EQUIPE.TSX
   O que é: a aba Equipe do projeto (tabela de alocações + modal para alocar/editar).
               Editar e remover alocação só aparecem para quem pode alocar (Admin).
               O perfil Empresa não vê carga nem trilhas das pessoas (privacidade, E02).
   Onde é usado: app/(sistema)/projetos/[id]/page.tsx, na aba "Equipe".
   Depende de: lib/store (useDados: alocacoes, pessoa, cargaDaPessoa, salvar,
               remover), lib/auth (useAuth), lib/permissoes (podeFazer), lib/toast, lib/useFormulario, lib/metricas
               (trilhasDaPessoa), components/ui (Modal, form, basicos, Tabela),
               components/button, components/input e lib/utils.
   Contexto: §5 Projetos (Alocação: pessoa, papel, período, carga, trilhas;
             acima de 40 h/sem "É AVISO, NÃO BLOQUEIO") e §16 (semáforo de
             carga por período, ainda não implementado).
   ============================================================================ */
"use client";

import { useCallback, useState } from 'react';
import { UserPlus, Pencil, Trash2, TriangleAlert, Users } from 'lucide-react';
import { useDados, Alocacao, Projeto } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { podeFazer } from '@/lib/permissoes';
import { useToast } from '@/lib/toast';
import { useFormulario } from '@/lib/useFormulario';
import { trilhasDaPessoa } from '@/lib/metricas';
import Modal from '@/components/ui/Modal';
import Button from '@/components/button';
import Input from '@/components/input';
import { Select, AreaTexto } from '@/components/ui/form';
import { Avatar, Aviso, EstadoVazio } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import { cx, dataBR, novoId } from '@/lib/utils';

// Papéis possíveis de uma pessoa dentro do projeto.
const PAPEIS = ['Líder', 'Front-end', 'Back-end', 'UX', 'QA', 'Dados'];

/**
 * Equipe do projeto: a pessoa formada vira pessoa alocada (slide 19).
 * Colunas: pessoa, papel, período, carga e trilhas concluídas (§5). Para o perfil Empresa,
 * só pessoa, papel e período (privacidade: ver verDetalhesDaPessoa).
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
  // Só quem pode alocar (Admin) vê os botões de alocar, editar e remover. São ESCONDIDOS,
  // não desabilitados: para os outros perfis a tabela é só leitura e um botão sem uso
  // geraria dúvida (e seria anunciado como "indisponível" por leitores de tela).
  const podeAlocar = !!sessao && podeFazer(sessao.perfil, 'alocar');
  // PRIVACIDADE (E02, mesma regra do painel da empresa no E01): o perfil Empresa vê pessoa,
  // papel e período, mas NÃO a carga nem as trilhas. A carga (e a soma no title) revela quanto
  // a pessoa trabalha para OUTROS clientes; a contagem de trilhas inclui trilhas de outras empresas.
  // TODO(PROGLOGIC): confirmar se a empresa pode ver ao menos as horas no projeto dela.
  const verDetalhesDaPessoa = sessao?.perfil !== 'empresa';
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
              <thead><tr><Th>Pessoa</Th><Th>Papel</Th><Th>Período</Th>{verDetalhesDaPessoa && <><Th>Carga</Th><Th>Trilhas</Th></>}{podeAlocar && <Th className="w-24"><span className="sr-only">Ações</span></Th>}</tr></thead>
              <tbody>
                {equipe.map((a) => {
                  // Alocação de pessoa que não existe mais: pula a linha.
                  const p = d.pessoa(a.pessoaId); if (!p) return null;
                  /*
                   * Carga total = soma das alocações da pessoa em TODOS os
                   * projetos. Passar do limite dela (cargaMax, 40 h/sem por
                   * padrão) só pinta a carga de âmbar com ícone: É AVISO,
                   * NÃO BLOQUEIO (§5).
                   * ⚠️ ATENÇÃO: hoje a soma ignora o período (só descarta
                   * alocações já encerradas). Duas alocações que nem se
                   * cruzam no tempo somam como se fossem simultâneas. O
                   * semáforo de carga por período (bloco F, §16) vai
                   * corrigir isso em cargaDaPessoa, na store.
                   */
                  const total = d.cargaDaPessoa(p.id);
                  const acima = total > p.cargaMax;
                  // Trilhas concluídas das obrigatórias (coluna "Trilhas", §5).
                  const tr = trilhasDaPessoa(p.id, d);
                  return (
                    <Tr key={a.id}>
                      <Td><span className="flex items-center gap-2.5"><Avatar nome={p.nome} tamanho={32} /><span><span className="block font-semibold">{p.nome}</span><span className="block text-[12px] text-tinta-suave">{p.area} · {p.nivel}</span></span></span></Td>
                      <Td>{a.papel}</Td>
                      {/* slice(0, 5) corta o ano: "dd/mm/aaaa" vira "dd/mm". */}
                      <Td className="tabular-nums text-tinta-suave">{dataBR(a.inicio).slice(0, 5)} a {dataBR(a.fim).slice(0, 5)}</Td>
                      {/* Carga e trilhas: escondidas para o perfil Empresa (ver verDetalhesDaPessoa). */}
                      {verDetalhesDaPessoa && <>
                        <Td>
                          {/* Mostra a carga DESTE projeto; o title revela a soma de todos quando passa do limite. */}
                          <span className={cx('inline-flex items-center gap-1.5 tabular-nums', acima && 'font-semibold text-aviso')} title={acima ? `Soma de todos os projetos: ${total} h/sem` : undefined}>
                            {acima && <TriangleAlert className="h-3.5 w-3.5" aria-label="Acima do limite" />}{a.carga} h/sem
                          </span>
                        </Td>
                        {/* Âmbar quando ainda faltam trilhas obrigatórias. */}
                        <Td className={cx('tabular-nums', tr.concluidas < tr.total && 'text-aviso')}>{tr.concluidas} de {tr.total}</Td>
                      </>}
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
            {/* Legenda dos sinais da tabela (o ícone nunca aparece sem explicação); só faz sentido com as colunas de carga e trilhas. */}
            {verDetalhesDaPessoa && (
              <p className="flex items-center gap-1.5 px-4 py-3 text-[12px] text-tinta-suave">
                <TriangleAlert className="h-3.5 w-3.5 text-aviso" aria-hidden />soma de todos os projetos passa do limite da pessoa. É aviso, não bloqueio. <strong className="ml-1 text-tinta">Trilhas:</strong> quantas concluídas das atribuídas.
              </p>
            )}
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

  // Editando: parte da alocação existente. Nova: período do projeto e 20 h/sem.
  const f = useFormulario<Val>(alocacao ? { ...alocacao } : { pessoaId: '', papel: '', inicio: projeto.inicio, fim: projeto.entrega, carga: 20, obs: '' }, validar);
  const v = f.valores;
  // Quem já está no projeto não aparece de novo na lista (exceto a própria alocação em edição).
  const jaNaEquipe = new Set(d.alocacoes.filter((a) => a.projetoId === projeto.id && a.id !== alocacao?.id).map((a) => a.pessoaId));
  // Só profissionais ativos (ou convidados) que ainda não estão na equipe.
  const disponiveis = d.pessoas.filter((p) => p.perfil === 'profissional' && p.status !== 'inativo' && !jaNaEquipe.has(p.id));
  const pessoa = d.pessoa(v.pessoaId);
  /*
   * Carga total se esta alocação for salva: soma dos OUTROS projetos
   * (ignora esta alocação, para não contar duas vezes ao editar) + a carga
   * digitada agora.
   * ⚠️ ATENÇÃO: igual à tabela, não considera o período; o semáforo
   * (bloco F, §16) vai mudar este cálculo.
   */
  const totalDepois = pessoa ? d.cargaDaPessoa(pessoa.id, alocacao?.id) + (Number(v.carga) || 0) : 0;
  // Passou do limite da pessoa: mostra o Aviso abaixo, mas deixa salvar.
  const passa = pessoa && totalDepois > pessoa.cargaMax;

  /** Valida tudo e grava a alocação (nova ou editada). */
  const salvar = () => {
    if (!f.validarTudo()) return;
    // GRAVA: cria ou atualiza a alocação. Number() porque o campo devolve texto.
    // TODO(API): trocar por POST/PUT de alocação.
    d.salvar('alocacoes', { ...v, carga: Number(v.carga), id: alocacao?.id ?? novoId('alo'), projetoId: projeto.id });
    // SIMULADO: o protótipo não envia notificação de verdade para a pessoa.
    avisar(alocacao ? 'Alocação atualizada.' : `${pessoa?.nome} alocada como ${v.papel}. A pessoa foi notificada.`);
    onFechar();
  };

  return (
    <Modal aberto onFechar={onFechar} tamanho="md" titulo={alocacao ? 'Editar alocação' : 'Alocar pessoa'} descricao={projeto.nome}
      rodape={<><Button variante="secundario" onClick={onFechar}>Cancelar</Button><Button onClick={salvar}>{alocacao ? 'Salvar' : 'Alocar'}</Button></>}>
      {/* noValidate: quem valida é o useFormulario, não o navegador. */}
      <form onSubmit={(e) => { e.preventDefault(); salvar(); }} noValidate className="space-y-4">
        {/*
          * Ao editar, a pessoa fica travada (disabled) e a lista mostra só ela.
          * Cada opção já exibe a carga atual/limite para ajudar a escolher.
          */}
        <Select label="Pessoa" required placeholder="Escolha um profissional" value={v.pessoaId} error={f.erros.pessoaId} disabled={!!alocacao}
          onChange={(e) => f.set('pessoaId', e.target.value)} onBlur={() => f.blur('pessoaId')}
          opcoes={(alocacao ? d.pessoas.filter((p) => p.id === alocacao.pessoaId) : disponiveis).map((p) => ({ valor: p.id, rotulo: `${p.nome} · ${p.area} · ${d.cargaDaPessoa(p.id)}/${p.cargaMax} h` }))} />
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
        {/* É AVISO, NÃO BLOQUEIO (§5): o botão de salvar continua habilitado. */}
        {passa && (
          <Aviso tipo="aviso" titulo="Atenção com esta alocação">
            A carga total de {pessoa!.nome.split(' ')[0]} passa para {totalDepois} h por semana, acima do limite de {pessoa!.cargaMax} h. Dá para confirmar mesmo assim.
          </Aviso>
        )}
        {/* Botão invisível para o Enter enviar o formulário. */}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
