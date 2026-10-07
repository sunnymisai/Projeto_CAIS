"use client";

import { Suspense, useCallback, useMemo, useState, KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Users, X, Mail } from 'lucide-react';
import { useDados, Pessoa } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { useFormulario } from '@/lib/useFormulario';
import { trilhasDaPessoa } from '@/lib/metricas';
import { CabecalhoPagina, BarraFiltros } from '@/components/shell/Pagina';
import Button from '@/components/button';
import Input from '@/components/input';
import { Select, SecaoForm, Segmentado, Interruptor } from '@/components/ui/form';
import { Card, Etiqueta, EstadoVazio, EsqueletoLista, Paginacao, Avatar, Aviso } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import Modal from '@/components/ui/Modal';
import { EMAIL_REGEX, hojeISO, mascaraTelefone, normalizar, novoId, cx } from '@/lib/utils';
import type { Perfil } from '@/lib/tipos';

const PERFIS: Record<Perfil, string> = { profissional: 'Profissional', empresa: 'Empresa', admin: 'Administrador' };
const STATUS = { convidado: 'Convidado', ativo: 'Ativo', inativo: 'Inativo' } as const;
const TOM = { convidado: 'aviso', ativo: 'sucesso', inativo: 'neutro' } as const;
const AREAS = ['Front-end', 'Back-end', 'UX', 'QA', 'Dados', 'Gestão'];
const NIVEIS = ['Estágio', 'Júnior', 'Pleno', 'Sênior'];
const POR_PAGINA = 8;

export default function PaginaPessoas() {
  return <Suspense><Pessoas /></Suspense>;
}

function Pessoas() {
  const d = useDados();
  const params = useSearchParams();
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [perfil, setPerfil] = useState<Perfil | 'todos'>('todos');
  const [status, setStatus] = useState('');
  const [pagina, setPagina] = useState(1);
  const abrirId = params.get('abrir');
  const daUrl = abrirId && d.pronto ? d.pessoa(abrirId) ?? null : null;
  const [editando, setEditando] = useState<Pessoa | 'nova' | null>(null);


  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim());
    return d.pessoas
      .filter((p) => perfil === 'todos' || p.perfil === perfil)
      .filter((p) => !status || p.status === status)
      .filter((p) => !q || normalizar(p.nome + ' ' + p.email + ' ' + p.area).includes(q))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [d.pessoas, busca, perfil, status]);

  // Filtro mudou e a página ficou fora do alcance? volta para a última válida
  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(filtradas.length / POR_PAGINA)));
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const contagem = (p: Perfil) => d.pessoas.filter((x) => x.perfil === p).length;

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Pessoas" descricao="Profissionais em formação, contatos das empresas e administradores."
        acao={<Button onClick={() => setEditando('nova')}><Plus className="h-4 w-4" aria-hidden />Nova pessoa</Button>} />

      <BarraFiltros>
        <Segmentado rotulo="Filtrar por perfil" valor={perfil} onChange={setPerfil}
          opcoes={[{ valor: 'todos', rotulo: `Todos ${d.pessoas.length}` }, { valor: 'profissional', rotulo: `Profissionais ${contagem('profissional')}` }, { valor: 'empresa', rotulo: `Empresa ${contagem('empresa')}` }, { valor: 'admin', rotulo: `Admin ${contagem('admin')}` }]} />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-fraca" aria-hidden />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome, e-mail ou área" aria-label="Buscar pessoas"
            className="h-10 w-full rounded-lg border border-borda bg-superficie pl-9 pr-3 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
        </div>
        <div className="w-40"><Select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Todos os status" opcoes={Object.entries(STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))} /></div>
      </BarraFiltros>

      <Card>
        {!d.pronto ? <EsqueletoLista /> : filtradas.length === 0 ? (
          <EstadoVazio icone={<Users className="h-6 w-6" />} titulo="Ninguém por aqui" descricao="Nenhuma pessoa corresponde aos filtros. Ajuste a busca ou cadastre alguém novo."
            acao={<Button onClick={() => setEditando('nova')}><Plus className="h-4 w-4" />Nova pessoa</Button>} />
        ) : (
          <>
            <Tabela rotulo="Lista de pessoas">
              <thead><tr><Th>Pessoa</Th><Th>Perfil</Th><Th>Área ou empresa</Th><Th>Carga semanal</Th><Th>Trilhas</Th><Th>Status</Th></tr></thead>
              <tbody>
                {visiveis.map((p) => {
                  const carga = d.cargaDaPessoa(p.id);
                  const tr = trilhasDaPessoa(p.id, d);
                  return (
                    <Tr key={p.id} onClick={() => setEditando(p)} className={cx(p.status === 'inativo' && 'opacity-60')}>
                      <Td>
                        <button onClick={(e) => { e.stopPropagation(); setEditando(p); }} className="flex items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
                          <Avatar nome={p.nome} tamanho={34} />
                          <span><span className="block font-semibold">{p.nome}</span><span className="block text-[12px] text-tinta-suave">{p.email}</span></span>
                        </button>
                      </Td>
                      <Td><Etiqueta tom={p.perfil === 'admin' ? 'primaria' : 'neutro'}>{PERFIS[p.perfil]}</Etiqueta></Td>
                      <Td className="text-tinta-suave">{p.perfil === 'empresa' ? d.empresa(p.empresaId)?.nomeFantasia : p.perfil === 'profissional' ? `${p.area} · ${p.nivel}` : p.cargo}</Td>
                      <Td>{p.perfil === 'profissional'
                        ? <span className={cx('tabular-nums font-semibold', carga > p.cargaMax ? 'text-aviso' : 'text-tinta')}>{carga} <span className="font-normal text-tinta-suave">/ {p.cargaMax} h</span></span>
                        : <span className="text-tinta-fraca">—</span>}</Td>
                      <Td>{p.perfil === 'profissional' && tr.total ? <span className="tabular-nums">{tr.concluidas} de {tr.total}</span> : <span className="text-tinta-fraca">—</span>}</Td>
                      <Td><Etiqueta tom={TOM[p.status]} ponto>{STATUS[p.status]}</Etiqueta></Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Tabela>
            <div className="px-4 py-3"><Paginacao pagina={paginaAtual} total={filtradas.length} porPagina={POR_PAGINA} onChange={setPagina} rotuloItem="pessoas" /></div>
          </>
        )}
      </Card>

      {/* A ficha abre pelo clique ou direto pela URL (?abrir=id, vindo da busca global) */}
      {(editando ?? daUrl) && (
        <FormPessoa key={editando === 'nova' ? 'nova' : (editando ?? daUrl)!.id} pessoa={editando === 'nova' ? null : (editando ?? daUrl)!}
          onFechar={() => { setEditando(null); if (daUrl) router.replace('/pessoas'); }} />
      )}
    </div>
  );
}

type ValPessoa = Omit<Pessoa, 'id'> & { convite: boolean; novaHabilidade: string };

function FormPessoa({ pessoa, onFechar }: { pessoa: Pessoa | null; onFechar: () => void }) {
  const d = useDados();
  const avisar = useToast();
  const [salvando, setSalvando] = useState(false);

  const validar = useCallback((v: ValPessoa) => {
    const e: Partial<Record<keyof ValPessoa, string>> = {};
    if (!v.nome.trim()) e.nome = 'Informe o nome completo.';
    else if (v.nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome.';
    if (!v.email.trim()) e.email = 'Informe o e-mail.';
    else if (!EMAIL_REGEX.test(v.email)) e.email = 'Use um e-mail no formato nome@email.com.';
    else if (d.pessoas.some((p) => p.email.toLowerCase() === v.email.toLowerCase() && p.id !== pessoa?.id)) e.email = 'Este e-mail já está cadastrado. Cada pessoa tem um e-mail único.';
    if (v.perfil === 'profissional' && !v.area) e.area = 'Escolha a área de atuação.';
    if (v.perfil === 'empresa' && !v.empresaId) e.empresaId = 'Obrigatória no perfil Empresa.';
    return e;
  }, [d.pessoas, pessoa]);

  const f = useFormulario<ValPessoa>(
    pessoa ? { ...pessoa, convite: false, novaHabilidade: '' }
      : { nome: '', email: '', telefone: '', cargo: '', perfil: 'profissional', status: 'convidado', dataEntrada: hojeISO(), area: '', nivel: '', cargaMax: 40, habilidades: [], empresaId: '', convite: true, novaHabilidade: '' },
    validar);
  const v = f.valores;

  const addHabilidade = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const h = v.novaHabilidade.trim();
    if (h && !v.habilidades.includes(h)) f.set('habilidades', [...v.habilidades, h]);
    f.set('novaHabilidade', '');
  };

  const salvar = async () => {
    if (!f.validarTudo()) { avisar('Revise os campos destacados antes de salvar.', 'erro'); return; }
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 350));
    const { convite, ...resto } = v;
    const dados = { ...resto } as Partial<ValPessoa>;
    delete dados.novaHabilidade;
    delete dados.convite;
    const limpo: Pessoa = {
      ...(dados as Omit<Pessoa, 'id'>), id: pessoa?.id ?? novoId('pes'),
      empresaId: v.perfil === 'admin' ? '' : v.empresaId,
      ...(v.perfil !== 'profissional' ? { area: '', nivel: '', habilidades: [], cargaMax: 0 } : {}),
    };
    d.salvar('pessoas', limpo);
    avisar(convite && !pessoa ? `${v.nome.split(' ')[0]} cadastrada. Convite enviado para ${v.email}.` : pessoa ? 'Cadastro atualizado.' : 'Pessoa cadastrada.');
    onFechar();
  };

  const alternarAtivo = () => {
    if (!pessoa) return;
    const novo = pessoa.status === 'inativo' ? 'ativo' : 'inativo';
    d.salvar('pessoas', { ...pessoa, status: novo });
    avisar(novo === 'inativo' ? `${pessoa.nome} foi inativada. O histórico continua preservado.` : `${pessoa.nome} foi reativada.`);
    onFechar();
  };

  const carga = pessoa ? d.cargaDaPessoa(pessoa.id) : 0;

  return (
    <Modal aberto onFechar={onFechar} tamanho="lg" titulo={pessoa ? pessoa.nome : 'Nova pessoa'}
      descricao={pessoa ? `${PERFIS[pessoa.perfil]} · ${pessoa.email}` : 'Uma tela para os três perfis. Os campos mudam conforme o perfil.'}
      rodape={<>
        {pessoa && pessoa.perfil !== 'admin' && (
          <Button variante="fantasma" className="mr-auto" onClick={alternarAtivo}>{pessoa.status === 'inativo' ? 'Reativar' : 'Inativar'}</Button>
        )}
        <Button variante="secundario" onClick={onFechar}>Cancelar</Button>
        <Button onClick={salvar} isLoading={salvando}>{pessoa ? 'Salvar alterações' : 'Salvar pessoa'}</Button>
      </>}>
      <form onSubmit={(e) => { e.preventDefault(); salvar(); }} noValidate className="space-y-7">
        <SecaoForm titulo="Perfil de acesso">
          <Segmentado rotulo="Perfil de acesso" valor={v.perfil} onChange={(p) => f.set('perfil', p)}
            opcoes={[{ valor: 'profissional', rotulo: 'Profissional' }, { valor: 'empresa', rotulo: 'Empresa' }, { valor: 'admin', rotulo: 'Administrador' }]} />
          <p className="text-[13px] text-tinta-suave">
            {v.perfil === 'profissional' && 'Cumpre trilhas, é alocado em projetos e move as próprias tarefas. A empresa é opcional.'}
            {v.perfil === 'empresa' && 'Vê apenas os projetos da empresa vinculada e interage com o time alocado.'}
            {v.perfil === 'admin' && 'Acesso completo ao programa. Não tem vínculo com empresa.'}
          </p>
        </SecaoForm>

        <SecaoForm titulo="Dados pessoais">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input compacto label="Nome completo" required placeholder="Nome e sobrenome" {...f.campo('nome')} />
            <Input compacto label="E-mail" required type="email" placeholder="nome@email.com" {...f.campo('email')} />
            <Input compacto label="Telefone / WhatsApp" placeholder="(00) 00000-0000" inputMode="tel" {...f.campo('telefone', mascaraTelefone)} />
            <Input compacto label="Cargo ou função" placeholder="Ex.: Desenvolvedor" {...f.campo('cargo')} />
            <Input compacto label="Data de entrada" type="date" {...f.campo('dataEntrada')} />
            <Select label="Status" value={v.status} onChange={(e) => f.set('status', e.target.value as Pessoa['status'])} opcoes={Object.entries(STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))} />
          </div>
        </SecaoForm>

        {/* Área reservada com altura mínima: o formulário não pula na troca de perfil */}
        <div className="min-h-[196px]">
          {v.perfil === 'profissional' && (
            <SecaoForm titulo="Só aparece no perfil profissional" className="animate-fade-in">
              <div className="grid gap-4 sm:grid-cols-3">
                <Select label="Área" required placeholder="Selecione" value={v.area} onChange={(e) => f.set('area', e.target.value)} onBlur={() => f.blur('area')} error={f.erros.area} opcoes={AREAS.map((a) => ({ valor: a, rotulo: a }))} />
                <Select label="Nível" placeholder="Selecione" value={v.nivel} onChange={(e) => f.set('nivel', e.target.value)} opcoes={NIVEIS.map((a) => ({ valor: a, rotulo: a }))} />
                <Input compacto label="Carga máxima (h/sem)" type="number" min={4} max={44} value={String(v.cargaMax)} onChange={(e) => f.set('cargaMax', Number(e.target.value))}
                  hint={pessoa ? `Hoje alocada em ${carga} h` : undefined} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="hab" className="text-[13px] font-medium text-tinta">Habilidades</label>
                <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-borda bg-superficie px-2 py-1.5 focus-within:border-primaria focus-within:ring-4 focus-within:ring-primaria/25">
                  {v.habilidades.map((h) => (
                    <span key={h} className="inline-flex items-center gap-1 rounded-md bg-primaria-suave py-0.5 pl-2 pr-1 text-[12px] font-semibold text-primaria">
                      {h}
                      <button type="button" aria-label={`Remover ${h}`} onClick={() => f.set('habilidades', v.habilidades.filter((x) => x !== h))} className="rounded p-0.5 hover:bg-primaria/15"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  <input id="hab" value={v.novaHabilidade} onChange={(e) => f.set('novaHabilidade', e.target.value)} onKeyDown={addHabilidade}
                    placeholder={v.habilidades.length ? '' : 'Digite e tecle Enter'} className="min-w-28 flex-1 bg-transparent px-1 text-sm text-tinta placeholder:text-tinta-fraca focus:outline-none" />
                </div>
              </div>
            </SecaoForm>
          )}
          {v.perfil !== 'admin' && (
            <SecaoForm titulo="Vínculo e acesso" className={cx('animate-fade-in', v.perfil === 'profissional' && 'mt-7')}>
              <Select label="Empresa vinculada" required={v.perfil === 'empresa'} placeholder={v.perfil === 'empresa' ? 'Selecione a empresa' : 'Sem vínculo'}
                value={v.empresaId} onChange={(e) => f.set('empresaId', e.target.value)} onBlur={() => f.blur('empresaId')} error={f.erros.empresaId}
                hint={v.perfil === 'empresa' ? 'A pessoa só verá os projetos desta empresa.' : undefined}
                opcoes={d.empresas.filter((e) => e.status !== 'encerrada').map((e) => ({ valor: e.id, rotulo: e.nomeFantasia }))} />
            </SecaoForm>
          )}
          {v.perfil === 'admin' && (
            <div className="animate-fade-in"><Aviso tipo="info" titulo="Perfil com acesso total">Administradores veem e editam todos os cadastros, trilhas e projetos.</Aviso></div>
          )}
        </div>

        {!pessoa && (
          <div className="rounded-xl border border-borda p-4">
            <Interruptor ligado={v.convite} onChange={(x) => f.set('convite', x)} rotulo="Enviar convite por e-mail ao salvar"
              descricao="O link leva ao primeiro acesso, onde a pessoa define a senha." />
            {v.convite && v.email && EMAIL_REGEX.test(v.email) && (
              <p className="mt-3 flex items-center gap-2 text-[13px] text-tinta-suave"><Mail className="h-4 w-4" aria-hidden />O convite será enviado para <strong className="text-tinta">{v.email}</strong></p>
            )}
          </div>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
