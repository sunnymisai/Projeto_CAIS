/* ============================================================================
   PESSOASDAEMPRESA.TSX — ABA "PESSOAS" DA FICHA DA EMPRESA
   O que é: lista as pessoas com perfil Empresa vinculadas à empresa e os profissionais alocados nos projetos dela, e permite vincular uma pessoa (que passa a ter perfil Empresa).
   Onde é usado: app/(sistema)/empresas/page.tsx (ficha da empresa, aba Pessoas).
   Depende de: lib/store (useDados, Empresa, Pessoa), lib/toast, lib/permissoes (mudancaDeAcesso e rótulos), lib/metricas (ROTULO_PERFIL), components/ui/basicos, components/ui/form (Select) e components/button.
   Contexto: §11 (perfil Empresa exige empresa vinculada), §15 item 3 (Pessoas e Empresas → Vínculo pessoa-empresa → Gestão de acessos).
   ============================================================================ */
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus, Users } from 'lucide-react';
import { useDados, Empresa, Pessoa } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { ROTULO_DAS_ROTAS, mudancaDeAcesso } from '@/lib/permissoes';
import { ROTULO_PERFIL } from '@/lib/metricas';
import { Avatar, Aviso, Etiqueta, EstadoVazio } from '@/components/ui/basicos';
import { Select } from '@/components/ui/form';
import Button from '@/components/button';

// [PV-1] Os nomes e as cores do status da pessoa (Convidado, Ativo, Inativo) mostrados na lista.
const STATUS = { convidado: 'Convidado', ativo: 'Ativo', inativo: 'Inativo' } as const;
const TOM = { convidado: 'aviso', ativo: 'sucesso', inativo: 'neutro' } as const;

/**
 * Linha de pessoa (avatar, nome, e-mail e uma etiqueta ou texto à direita).
 * @param props.p - a pessoa.
 * @param props.extra - conteúdo à direita.
 */
function Linha({ p, extra }: { p: Pessoa; extra: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 border-b border-borda py-2.5 last:border-b-0">
      <Avatar nome={p.nome} tamanho={32} />
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-tinta">{p.nome}</span><span className="block truncate text-[12px] text-tinta-suave">{p.email}</span></span>
      {extra}
    </li>
  );
}

/**
 * Conteúdo da aba Pessoas.
 * @param props.empresa - a empresa da ficha.
 * @returns as duas listas e o painel "Vincular pessoa".
 */
export default function PessoasDaEmpresa({ empresa }: { empresa: Empresa }) {
  const d = useDados();
  const avisar = useToast();
  const [vinculando, setVinculando] = useState(false);
  const [escolhida, setEscolhida] = useState('');

  // Pessoas com perfil Empresa ligadas a esta empresa (inclusive convidadas e inativas: o histórico fica).
  const daEmpresa = d.pessoas.filter((p) => p.perfil === 'empresa' && p.empresaId === empresa.id);
  // Profissionais alocados em projetos desta empresa, com os projetos em que atuam (derivado das alocações).
  const projetosIds = new Set(d.projetos.filter((p) => p.empresaId === empresa.id).map((p) => p.id));
  // [PV-2] OS PROFISSIONAIS ALOCADOS: calculados das alocações dos projetos da empresa (nada é guardado); lista só de leitura.
  const alocados = d.pessoas
    .filter((p) => p.perfil === 'profissional')
    .map((p) => ({ p, projetos: d.alocacoes.filter((a) => a.pessoaId === p.id && projetosIds.has(a.projetoId)).map((a) => d.projeto(a.projetoId)?.nome).filter(Boolean) as string[] }))
    .filter((x) => x.projetos.length > 0);

  // [PV-3] QUEM PODE SER VINCULADA à empresa: nem administrador (perderia o acesso total), nem pessoa inativa, nem quem já está nela.
  // Quem pode ser vinculada: nem administrador (perderia o acesso total), nem inativa, nem quem já está aqui.
  const candidatas = d.pessoas.filter((p) => p.perfil !== 'admin' && p.status !== 'inativo' && !(p.perfil === 'empresa' && p.empresaId === empresa.id));
  const pessoa = candidatas.find((p) => p.id === escolhida);
  const m = pessoa ? mudancaDeAcesso(pessoa.perfil, 'empresa') : null;

  // [PV-4] O VÍNCULO: a pessoa passa a ter perfil Empresa e esta empresa (§11); os dados de profissional ficam guardados. TODO(API): PATCH no usuário.
  /** Confirma o vínculo: a pessoa passa a ter perfil Empresa e esta empresa (§11). */
  // GRAVA: perfil 'empresa' + empresaId desta empresa na store. Dados de profissional ficam guardados (reversível).
  // TODO(API): PATCH no usuário na API da PROGLOGIC.
  const vincular = () => {
    if (!pessoa) return;
    d.salvar('pessoas', { ...pessoa, perfil: 'empresa', empresaId: empresa.id });
    avisar(`${pessoa.nome.split(' ')[0]} vinculada a ${empresa.nomeFantasia}.`);
    setVinculando(false);
    setEscolhida('');
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="pe-empresa">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 id="pe-empresa" className="text-sm font-semibold text-tinta">Pessoas da empresa <span className="font-normal text-tinta-suave">(perfil Empresa)</span></h3>
          {!vinculando && <Button tamanho="sm" variante="secundario" onClick={() => setVinculando(true)}><UserPlus className="h-4 w-4" aria-hidden />Vincular pessoa</Button>}
        </div>

        {vinculando && (
          <div className="mb-4 space-y-3 rounded-xl border border-borda bg-superficie-alt/50 p-4">
            <Select label="Pessoa" placeholder="Escolha uma pessoa" value={escolhida} onChange={(e) => setEscolhida(e.target.value)}
              hint="Quem for vinculada passa a ter o perfil Empresa e só verá os projetos desta empresa."
              opcoes={candidatas.map((p) => ({ valor: p.id, rotulo: `${p.nome} (${ROTULO_PERFIL[p.perfil]})` }))} />
            {pessoa && m && (
              <Aviso tipo="aviso" titulo="Confira o que muda">
                {pessoa.perfil === 'empresa'
                  ? `${pessoa.nome} sai da empresa atual e deixa de ver os projetos dela.`
                  : `${pessoa.nome} muda de ${ROTULO_PERFIL[pessoa.perfil]} para Empresa. ${m.deixaDeVer.length ? `Deixa de ver: ${m.deixaDeVer.map((r) => ROTULO_DAS_ROTAS[r]).join(', ')}. ` : ''}${m.passaAVer.length ? `Passa a ver: ${m.passaAVer.map((r) => ROTULO_DAS_ROTAS[r]).join(', ')}. ` : ''}Os dados de profissional ficam guardados.`}
              </Aviso>
            )}
            <div className="flex justify-end gap-2">
              <Button tamanho="sm" variante="secundario" onClick={() => { setVinculando(false); setEscolhida(''); }}>Cancelar</Button>
              <Button tamanho="sm" onClick={vincular} disabled={!pessoa}>Vincular</Button>
            </div>
          </div>
        )}

        {daEmpresa.length === 0
          ? <EstadoVazio icone={<Users className="h-6 w-6" aria-hidden />} titulo="Nenhuma pessoa vinculada" descricao="Vincule alguém para que ela entre com o perfil Empresa e acompanhe os projetos desta empresa. Para uma pessoa nova, cadastre-a primeiro em Pessoas." />
          : <ul>{daEmpresa.map((p) => (
              <Linha key={p.id} p={p} extra={<>
                <Etiqueta tom={TOM[p.status]} ponto>{STATUS[p.status]}</Etiqueta>
                {/* NAVEGA: abre a pessoa em Pessoas. */}
                <Link href={`/pessoas?abrir=${p.id}`} className="rounded text-[13px] font-semibold text-primaria hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">Abrir</Link>
              </>} />
            ))}</ul>}
      </section>

      <section aria-labelledby="pe-alocados">
        <h3 id="pe-alocados" className="mb-2 text-sm font-semibold text-tinta">Profissionais alocados nos projetos <span className="font-normal text-tinta-suave">(somente leitura)</span></h3>
        {alocados.length === 0
          ? <p className="text-sm text-tinta-suave">Ninguém está alocado nos projetos desta empresa ainda. A alocação é feita na ficha de cada projeto.</p>
          : <ul>{alocados.map(({ p, projetos }) => <Linha key={p.id} p={p} extra={<span className="max-w-[45%] truncate text-[12px] text-tinta-suave" title={projetos.join(', ')}>{projetos.join(', ')}</span>} />)}</ul>}
      </section>
    </div>
  );
}
