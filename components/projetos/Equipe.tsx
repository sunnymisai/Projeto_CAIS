"use client";

import { useCallback, useState } from 'react';
import { UserPlus, Pencil, Trash2, TriangleAlert, Users } from 'lucide-react';
import { useDados, Alocacao, Projeto } from '@/lib/store';
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

const PAPEIS = ['Líder', 'Front-end', 'Back-end', 'UX', 'QA', 'Dados'];

/** Equipe do projeto: a pessoa formada vira pessoa alocada (slide 19). */
export default function Equipe({ projeto, alocando, setAlocando }: { projeto: Projeto; alocando: boolean; setAlocando: (v: boolean) => void }) {
  const d = useDados();
  const avisar = useToast();
  const [editando, setEditando] = useState<Alocacao | null>(null);
  const equipe = d.alocacoes.filter((a) => a.projetoId === projeto.id);

  return (
    <>
      <div className="rounded-2xl border border-borda bg-superficie">
        {equipe.length === 0 ? (
          <EstadoVazio icone={<Users className="h-6 w-6" />} titulo="Ninguém alocado ainda" descricao="Aloque as pessoas que vão trabalhar no projeto, com papel, período e carga semanal."
            acao={<Button onClick={() => setAlocando(true)}><UserPlus className="h-4 w-4" />Alocar pessoa</Button>} />
        ) : (
          <>
            <Tabela rotulo="Equipe do projeto">
              <thead><tr><Th>Pessoa</Th><Th>Papel</Th><Th>Período</Th><Th>Carga</Th><Th>Trilhas</Th><Th className="w-24"><span className="sr-only">Ações</span></Th></tr></thead>
              <tbody>
                {equipe.map((a) => {
                  const p = d.pessoa(a.pessoaId); if (!p) return null;
                  const total = d.cargaDaPessoa(p.id);
                  const acima = total > p.cargaMax;
                  const tr = trilhasDaPessoa(p.id, d);
                  return (
                    <Tr key={a.id}>
                      <Td><span className="flex items-center gap-2.5"><Avatar nome={p.nome} tamanho={32} /><span><span className="block font-semibold">{p.nome}</span><span className="block text-[12px] text-tinta-suave">{p.area} · {p.nivel}</span></span></span></Td>
                      <Td>{a.papel}</Td>
                      <Td className="tabular-nums text-tinta-suave">{dataBR(a.inicio).slice(0, 5)} a {dataBR(a.fim).slice(0, 5)}</Td>
                      <Td>
                        <span className={cx('inline-flex items-center gap-1.5 tabular-nums', acima && 'font-semibold text-aviso')} title={acima ? `Soma de todos os projetos: ${total} h/sem` : undefined}>
                          {acima && <TriangleAlert className="h-3.5 w-3.5" aria-label="Acima do limite" />}{a.carga} h/sem
                        </span>
                      </Td>
                      <Td className={cx('tabular-nums', tr.concluidas < tr.total && 'text-aviso')}>{tr.concluidas} de {tr.total}</Td>
                      <Td>
                        <div className="flex justify-end gap-0.5">
                          <button onClick={() => setEditando(a)} aria-label={`Editar alocação de ${p.nome}`} className="rounded-lg p-1.5 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => { d.remover('alocacoes', a.id); avisar(`${p.nome} saiu da equipe.`); }} aria-label={`Remover ${p.nome} da equipe`} className="rounded-lg p-1.5 text-tinta-fraca hover:bg-erro/10 hover:text-erro"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Tabela>
            <p className="flex items-center gap-1.5 px-4 py-3 text-[12px] text-tinta-suave">
              <TriangleAlert className="h-3.5 w-3.5 text-aviso" aria-hidden />soma de todos os projetos passa do limite da pessoa. É aviso, não bloqueio. <strong className="ml-1 text-tinta">Trilhas:</strong> quantas concluídas das atribuídas.
            </p>
          </>
        )}
      </div>

      {(alocando || editando) && <FormAlocacao projeto={projeto} alocacao={editando} onFechar={() => { setAlocando(false); setEditando(null); }} />}
    </>
  );
}

type Val = Omit<Alocacao, 'id' | 'projetoId'>;

function FormAlocacao({ projeto, alocacao, onFechar }: { projeto: Projeto; alocacao: Alocacao | null; onFechar: () => void }) {
  const d = useDados();
  const avisar = useToast();

  const validar = useCallback((v: Val) => {
    const e: Partial<Record<keyof Val, string>> = {};
    if (!v.pessoaId) e.pessoaId = 'Escolha quem será alocado.';
    if (!v.papel) e.papel = 'Escolha o papel no projeto.';
    if (!v.inicio) e.inicio = 'Informe o início.';
    if (v.fim && v.inicio && v.fim < v.inicio) e.fim = 'O fim não pode vir antes do início.';
    if (!v.carga || v.carga < 1) e.carga = 'Informe a carga semanal em horas.';
    return e;
  }, []);

  const f = useFormulario<Val>(alocacao ? { ...alocacao } : { pessoaId: '', papel: '', inicio: projeto.inicio, fim: projeto.entrega, carga: 20, obs: '' }, validar);
  const v = f.valores;
  const jaNaEquipe = new Set(d.alocacoes.filter((a) => a.projetoId === projeto.id && a.id !== alocacao?.id).map((a) => a.pessoaId));
  const disponiveis = d.pessoas.filter((p) => p.perfil === 'profissional' && p.status !== 'inativo' && !jaNaEquipe.has(p.id));
  const pessoa = d.pessoa(v.pessoaId);
  const totalDepois = pessoa ? d.cargaDaPessoa(pessoa.id, alocacao?.id) + (Number(v.carga) || 0) : 0;
  const passa = pessoa && totalDepois > pessoa.cargaMax;

  const salvar = () => {
    if (!f.validarTudo()) return;
    d.salvar('alocacoes', { ...v, carga: Number(v.carga), id: alocacao?.id ?? novoId('alo'), projetoId: projeto.id });
    avisar(alocacao ? 'Alocação atualizada.' : `${pessoa?.nome} alocada como ${v.papel}. A pessoa foi notificada.`);
    onFechar();
  };

  return (
    <Modal aberto onFechar={onFechar} tamanho="md" titulo={alocacao ? 'Editar alocação' : 'Alocar pessoa'} descricao={projeto.nome}
      rodape={<><Button variante="secundario" onClick={onFechar}>Cancelar</Button><Button onClick={salvar}>{alocacao ? 'Salvar' : 'Alocar'}</Button></>}>
      <form onSubmit={(e) => { e.preventDefault(); salvar(); }} noValidate className="space-y-4">
        <Select label="Pessoa" required placeholder="Escolha um profissional" value={v.pessoaId} error={f.erros.pessoaId} disabled={!!alocacao}
          onChange={(e) => f.set('pessoaId', e.target.value)} onBlur={() => f.blur('pessoaId')}
          opcoes={(alocacao ? d.pessoas.filter((p) => p.id === alocacao.pessoaId) : disponiveis).map((p) => ({ valor: p.id, rotulo: `${p.nome} · ${p.area} · ${d.cargaDaPessoa(p.id)}/${p.cargaMax} h` }))} />
        <Select label="Papel no projeto" required placeholder="Selecione o papel" value={v.papel} error={f.erros.papel}
          onChange={(e) => f.set('papel', e.target.value)} onBlur={() => f.blur('papel')} opcoes={PAPEIS.map((p) => ({ valor: p, rotulo: p }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input compacto label="Início" required type="date" {...f.campo('inicio')} />
          <Input compacto label="Fim" type="date" min={v.inicio} {...f.campo('fim')} />
        </div>
        <Input compacto label="Carga semanal (horas)" required type="number" min={1} max={44} value={String(v.carga)}
          onChange={(e) => f.set('carga', Number(e.target.value))} onBlur={() => f.blur('carga')} error={f.erros.carga} />
        <AreaTexto label="Observação" placeholder="Opcional" rows={2} value={v.obs} onChange={(e) => f.set('obs', e.target.value)} />
        {passa && (
          <Aviso tipo="aviso" titulo="Atenção com esta alocação">
            A carga total de {pessoa!.nome.split(' ')[0]} passa para {totalDepois} h por semana, acima do limite de {pessoa!.cargaMax} h. Dá para confirmar mesmo assim.
          </Aviso>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
