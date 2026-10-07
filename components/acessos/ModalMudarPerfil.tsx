/* ============================================================================
   MODALMUDARPERFIL.TSX — CONFIRMAÇÃO DE MUDANÇA DE PERFIL
   O que é: modal que deixa o administrador escolher o novo perfil de uma pessoa (e a empresa, quando o perfil é Empresa) e explica o que ela passa a ver e o que perde, antes de confirmar.
   Onde é usado: app/(sistema)/acessos/page.tsx (ação "Mudar perfil").
   Depende de: lib/store (useDados, Pessoa), lib/toast, lib/permissoes (mudancaDeAcesso, rótulos), lib/metricas (ROTULO_PERFIL), components/ui/Modal, components/ui/form (Select, Segmentado), components/ui/basicos (Aviso) e components/button.
   Contexto: §3 (perfis), §11 (Empresa exige empresa vinculada; inativar em vez de excluir) e §15 item 3 (gestão de acessos).
   ============================================================================ */
"use client";

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useDados, Pessoa } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { ROTULO_DAS_ROTAS, ROTULO_DAS_ACOES, mudancaDeAcesso } from '@/lib/permissoes';
import { ROTULO_PERFIL } from '@/lib/metricas';
import type { Perfil } from '@/lib/tipos';
import Modal from '@/components/ui/Modal';
import { Select, Segmentado } from '@/components/ui/form';
import { Aviso } from '@/components/ui/basicos';
import Button from '@/components/button';

// O que cada perfil enxerga DENTRO dos projetos (o escopo de dados).
// ⚠️ ATENÇÃO: espelha lib/escopo.ts; se aquela regra mudar, atualize estes textos.
const ESCOPO: Record<Perfil, string> = {
  admin: 'vê todos os projetos, empresas e pessoas',
  empresa: 'vê só os projetos da empresa vinculada',
  profissional: 'vê só os projetos em que está alocado',
};

/**
 * Modal de mudança de perfil.
 * @param props.pessoa - a pessoa que muda de perfil.
 * @param props.onFechar - chamada ao cancelar ou depois de confirmar.
 * @returns o modal.
 */
export default function ModalMudarPerfil({ pessoa, onFechar }: { pessoa: Pessoa; onFechar: () => void }) {
  const d = useDados();
  const avisar = useToast();
  const [novo, setNovo] = useState<Perfil>(pessoa.perfil);
  const [empresaId, setEmpresaId] = useState(pessoa.empresaId);
  const [erro, setErro] = useState('');
  const mudou = novo !== pessoa.perfil;
  const m = mudancaDeAcesso(pessoa.perfil, novo);
  // Empresas encerradas não aparecem: não faz sentido vincular alguém a elas (mesma regra de /pessoas).
  const empresas = d.empresas.filter((e) => e.status !== 'encerrada' || e.id === empresaId);
  // Mudando de empresa (perfil Empresa → outra empresa): a pessoa perde os projetos da anterior.
  const trocaEmpresa = novo === 'empresa' && pessoa.perfil === 'empresa' && empresaId !== pessoa.empresaId;

  /** Confirma: valida a empresa (§11) e grava. */
  const confirmar = () => {
    // §11: o perfil Empresa só existe com empresa vinculada.
    if (novo === 'empresa' && !empresaId) { setErro('Escolha a empresa: o perfil Empresa exige empresa vinculada.'); return; }
    // GRAVA: troca o perfil (e a empresa, quando é Empresa) da pessoa na store.
    // Os dados de profissional (área, nível, carga, habilidades) e a empresa antiga FICAM guardados de
    // propósito, para a mudança ser reversível ("voltar para Profissional" não perde nada).
    // TODO(PROGLOGIC): confirmar se mudar de perfil deve limpar os campos que não se aplicam ao novo perfil.
    // TODO(API): PATCH no usuário na API; a sessão aberta da pessoa só reflete na próxima chamada.
    d.salvar('pessoas', { ...pessoa, perfil: novo, empresaId: novo === 'empresa' ? empresaId : pessoa.empresaId });
    avisar(`${pessoa.nome.split(' ')[0]} agora tem o perfil ${ROTULO_PERFIL[novo]}.`);
    onFechar();
  };

  return (
    <Modal aberto onFechar={onFechar} tamanho="md" titulo="Mudar perfil"
      descricao={`${pessoa.nome} · hoje: ${ROTULO_PERFIL[pessoa.perfil]}`}
      rodape={<><Button variante="secundario" onClick={onFechar}>Cancelar</Button>
        <Button onClick={confirmar} disabled={!mudou && !trocaEmpresa && pessoa.empresaId === empresaId}>Confirmar mudança</Button></>}>
      <div className="space-y-5">
        <Segmentado rotulo="Novo perfil" valor={novo} onChange={(p) => { setNovo(p); setErro(''); }}
          opcoes={(['profissional', 'empresa', 'admin'] as Perfil[]).map((p) => ({ valor: p, rotulo: ROTULO_PERFIL[p] }))} />
        {/* Empresa obrigatória no perfil Empresa (§11). */}
        {novo === 'empresa' && (
          <Select label="Empresa vinculada" required placeholder="Selecione a empresa" value={empresaId}
            onChange={(e) => { setEmpresaId(e.target.value); setErro(''); }} error={erro}
            hint="A pessoa só verá os projetos desta empresa." opcoes={empresas.map((e) => ({ valor: e.id, rotulo: e.nomeFantasia }))} />
        )}

        {/* O que muda: sempre em texto e ícone, nunca só cor. */}
        {mudou || trocaEmpresa ? (
          <div className="space-y-3 text-sm">
            <p className="text-tinta">Depois da mudança, {pessoa.nome.split(' ')[0]} {ESCOPO[novo]}.</p>
            <Lista titulo="Passa a ver" tipo="ganha" itens={[...m.passaAVer.map((r) => ROTULO_DAS_ROTAS[r]), ...m.ganha.map((a) => `Ação: ${ROTULO_DAS_ACOES[a]}`)]} />
            <Lista titulo="Deixa de ver ou de fazer" tipo="perde" itens={[...m.deixaDeVer.map((r) => ROTULO_DAS_ROTAS[r]), ...m.perde.map((a) => `Ação: ${ROTULO_DAS_ACOES[a]}`)]} />
            {trocaEmpresa && <Aviso tipo="aviso">Deixa de ver os projetos da empresa atual e passa a ver os da nova.</Aviso>}
            {pessoa.perfil === 'profissional' && novo !== 'profissional' && (
              <Aviso tipo="aviso">Área, nível, carga e habilidades ficam guardadas e voltam se a pessoa retornar a Profissional. As alocações atuais continuam no histórico dos projetos.</Aviso>
            )}
            <Aviso tipo="info">Se a pessoa estiver com o sistema aberto, o novo perfil vale no próximo carregamento da tela.</Aviso>
          </div>
        ) : (
          <p className="text-sm text-tinta-suave">Escolha um perfil diferente do atual para ver o que muda.</p>
        )}
      </div>
    </Modal>
  );
}

/**
 * Lista com ícone (+ ou −) e texto; vazia mostra "Nada muda".
 * @param props.titulo - cabeçalho da lista.
 * @param props.tipo - 'ganha' (ícone de mais) ou 'perde' (ícone de menos).
 * @param props.itens - os textos.
 */
function Lista({ titulo, tipo, itens }: { titulo: string; tipo: 'ganha' | 'perde'; itens: string[] }) {
  const Icone = tipo === 'ganha' ? Plus : Minus;
  return (
    <div>
      <p className="mb-1 text-[12px] font-bold uppercase tracking-wide text-tinta-suave">{titulo}</p>
      {itens.length === 0 ? <p className="text-tinta-suave">Nada muda aqui.</p> : (
        <ul className="space-y-1">
          {itens.map((i) => (
            <li key={i} className={`flex items-center gap-2 ${tipo === 'ganha' ? 'text-sucesso' : 'text-erro'}`}>
              <Icone className="h-4 w-4 shrink-0" aria-hidden /><span className="text-tinta">{i}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
