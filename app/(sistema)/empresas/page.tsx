"use client";

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Building2, Globe, Loader2 } from 'lucide-react';
import { useDados, Empresa } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { useFormulario } from '@/lib/useFormulario';
import { CabecalhoPagina, BarraFiltros } from '@/components/shell/Pagina';
import Button from '@/components/button';
import Input from '@/components/input';
import { Select, SecaoForm } from '@/components/ui/form';
import { Card, Etiqueta, EstadoVazio, EsqueletoLista, Paginacao, Avatar, Aviso } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import Modal from '@/components/ui/Modal';
import { cnpjValido, EMAIL_REGEX, hojeISO, mascaraCEP, mascaraCNPJ, mascaraTelefone, normalizar, novoId, soDigitos, dataBR } from '@/lib/utils';

const STATUS = { negociacao: 'Em negociação', ativa: 'Ativa', encerrada: 'Encerrada' } as const;
const TOM = { negociacao: 'aviso', ativa: 'sucesso', encerrada: 'neutro' } as const;
const SEGMENTOS = ['Agronegócio', 'Educação', 'Financeiro', 'Indústria', 'Logística', 'Saúde', 'Serviços', 'Tecnologia', 'Varejo'];
const PORTES = ['Pequeno', 'Médio', 'Grande'];
const POR_PAGINA = 8;

export default function PaginaEmpresas() {
  return <Suspense><Empresas /></Suspense>;
}

function Empresas() {
  const d = useDados();
  const params = useSearchParams();
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [segmento, setSegmento] = useState('');
  const [pagina, setPagina] = useState(1);
  const abrirId = params.get('abrir');
  const daUrl = abrirId && d.pronto ? d.empresa(abrirId) ?? null : null;
  const [editando, setEditando] = useState<Empresa | 'nova' | null>(null);


  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim());
    return d.empresas
      .filter((e) => !status || e.status === status)
      .filter((e) => !segmento || e.segmento === segmento)
      .filter((e) => !q || normalizar(e.nomeFantasia + e.razaoSocial).includes(q) || soDigitos(e.cnpj).includes(soDigitos(q) || '#'))
      .sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia));
  }, [d.empresas, busca, status, segmento]);

  // Filtro mudou e a página ficou fora do alcance? volta para a última válida
  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(filtradas.length / POR_PAGINA)));
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const temFiltro = busca || status || segmento;

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Empresas" descricao="Quem traz os projetos. Projetos e trilhas da empresa dependem deste cadastro."
        acao={<Button onClick={() => setEditando('nova')}><Plus className="h-4 w-4" aria-hidden />Nova empresa</Button>} />

      <BarraFiltros>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-fraca" aria-hidden />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou CNPJ" aria-label="Buscar empresas"
            className="h-10 w-full rounded-lg border border-borda bg-superficie pl-9 pr-3 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
        </div>
        <div className="w-44"><Select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Todos os status" opcoes={Object.entries(STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))} /></div>
        <div className="w-44"><Select aria-label="Filtrar por segmento" value={segmento} onChange={(e) => setSegmento(e.target.value)} placeholder="Todos os segmentos" opcoes={SEGMENTOS.map((s) => ({ valor: s, rotulo: s }))} /></div>
        {temFiltro && <Button variante="fantasma" tamanho="sm" onClick={() => { setBusca(''); setStatus(''); setSegmento(''); }}>Limpar filtros</Button>}
      </BarraFiltros>

      <Card>
        {!d.pronto ? <EsqueletoLista /> : filtradas.length === 0 ? (
          temFiltro
            ? <EstadoVazio icone={<Search className="h-6 w-6" />} titulo="Nenhuma empresa com esses filtros" descricao="Tente outro termo de busca ou limpe os filtros para ver todas." acao={<Button variante="secundario" onClick={() => { setBusca(''); setStatus(''); setSegmento(''); }}>Limpar filtros</Button>} />
            : <EstadoVazio icone={<Building2 className="h-6 w-6" />} titulo="Nenhuma empresa cadastrada" descricao="Cadastre a primeira empresa parceira para criar projetos e trilhas para ela." acao={<Button onClick={() => setEditando('nova')}><Plus className="h-4 w-4" />Nova empresa</Button>} />
        ) : (
          <>
            <Tabela rotulo="Lista de empresas">
              <thead><tr><Th>Empresa</Th><Th>Contato</Th><Th>Segmento</Th><Th className="text-center">Projetos</Th><Th>Status</Th></tr></thead>
              <tbody>
                {visiveis.map((e) => {
                  const n = d.projetos.filter((p) => p.empresaId === e.id).length;
                  return (
                    <Tr key={e.id} onClick={() => setEditando(e)}>
                      <Td>
                        <button className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 rounded-lg" onClick={(ev) => { ev.stopPropagation(); setEditando(e); }}>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primaria-suave font-space text-sm font-bold text-primaria">{e.nomeFantasia[0]}</span>
                          <span><span className="block font-semibold">{e.nomeFantasia}</span><span className="block text-[12px] text-tinta-suave tabular-nums">{e.cnpj}</span></span>
                        </button>
                      </Td>
                      <Td><div className="flex items-center gap-2.5"><Avatar nome={e.contatoNome} tamanho={28} /><span><span className="block">{e.contatoNome}</span><span className="block text-[12px] text-tinta-suave">{e.contatoEmail}</span></span></div></Td>
                      <Td className="text-tinta-suave">{e.segmento || '—'}</Td>
                      <Td className="text-center tabular-nums">{n}</Td>
                      <Td><Etiqueta tom={TOM[e.status]} ponto>{STATUS[e.status]}</Etiqueta></Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Tabela>
            <div className="px-4 py-3"><Paginacao pagina={paginaAtual} total={filtradas.length} porPagina={POR_PAGINA} onChange={setPagina} rotuloItem="empresas" /></div>
          </>
        )}
      </Card>

      {/* A ficha abre pelo clique ou direto pela URL (?abrir=id, vindo da busca global) */}
      {(editando ?? daUrl) && (
        <FormEmpresa key={editando === 'nova' ? 'nova' : (editando ?? daUrl)!.id} empresa={editando === 'nova' ? null : (editando ?? daUrl)!}
          onFechar={() => { setEditando(null); if (daUrl) router.replace('/empresas'); }} />
      )}
    </div>
  );
}

type ValEmpresa = Omit<Empresa, 'id'>;
const VAZIA: ValEmpresa = { razaoSocial: '', nomeFantasia: '', cnpj: '', segmento: '', porte: '', site: '', cep: '', logradouro: '', numero: '', cidadeUf: '', contatoNome: '', contatoEmail: '', contatoTelefone: '', contatoCargo: '', status: 'negociacao', dataEntrada: hojeISO() };

function FormEmpresa({ empresa, onFechar }: { empresa: Empresa | null; onFechar: () => void }) {
  const d = useDados();
  const avisar = useToast();
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState('');

  const validar = useCallback((v: ValEmpresa) => {
    const e: Partial<Record<keyof ValEmpresa, string>> = {};
    if (!v.razaoSocial.trim()) e.razaoSocial = 'Informe a razão social.';
    if (!v.nomeFantasia.trim()) e.nomeFantasia = 'Informe o nome fantasia.';
    if (!v.cnpj) e.cnpj = 'Informe o CNPJ.';
    else if (!cnpjValido(v.cnpj)) e.cnpj = 'CNPJ inválido. Confira os 14 dígitos.';
    else if (d.empresas.some((x) => soDigitos(x.cnpj) === soDigitos(v.cnpj) && x.id !== empresa?.id)) e.cnpj = 'Já existe uma empresa com este CNPJ.';
    if (v.cep && soDigitos(v.cep).length !== 8) e.cep = 'O CEP tem 8 dígitos.';
    if (v.site && !/^https?:\/\/.+\..+/.test(v.site)) e.site = 'Use o endereço completo, com https://';
    if (!v.contatoNome.trim()) e.contatoNome = 'Informe o nome do contato.';
    if (!v.contatoEmail.trim()) e.contatoEmail = 'Informe o e-mail do contato.';
    else if (!EMAIL_REGEX.test(v.contatoEmail)) e.contatoEmail = 'Use um e-mail no formato nome@empresa.com.';
    else if ([...d.empresas.filter((x) => x.id !== empresa?.id).map((x) => x.contatoEmail), ...d.pessoas.filter((p) => p.empresaId !== empresa?.id).map((p) => p.email)]
      .some((m) => m.toLowerCase() === v.contatoEmail.toLowerCase())) e.contatoEmail = 'Este e-mail já está em uso. Ele será o login do perfil Empresa.';
    return e;
  }, [d.empresas, d.pessoas, empresa]);

  const f = useFormulario<ValEmpresa>(empresa ? { ...empresa } : VAZIA, validar);

  // CEP preenche o endereço, mas os campos continuam editáveis (slide 16)
  const buscarCep = async () => {
    f.blur('cep');
    const cep = soDigitos(f.valores.cep);
    if (cep.length !== 8) return;
    setBuscandoCep(true); setAvisoCep('');
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const j = await r.json();
      if (j.erro) setAvisoCep('CEP não encontrado. Preencha o endereço manualmente.');
      else {
        f.set('logradouro', j.logradouro || f.valores.logradouro);
        f.set('cidadeUf', `${j.localidade} / ${j.uf}`);
      }
    } catch {
      setAvisoCep('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.');
    }
    setBuscandoCep(false);
  };

  const salvar = async () => {
    if (!f.validarTudo()) { avisar('Revise os campos destacados antes de salvar.', 'erro'); return; }
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 350));
    d.salvar('empresas', { ...f.valores, id: empresa?.id ?? novoId('emp') });
    avisar(empresa ? 'Empresa atualizada.' : `${f.valores.nomeFantasia} cadastrada.`);
    onFechar();
  };

  const nProjetos = empresa ? d.projetos.filter((p) => p.empresaId === empresa.id).length : 0;

  return (
    <Modal aberto onFechar={onFechar} tamanho="lg" titulo={empresa ? empresa.nomeFantasia : 'Nova empresa'}
      descricao={empresa ? `${nProjetos} projeto${nProjetos === 1 ? '' : 's'} · entrou em ${dataBR(empresa.dataEntrada)}` : 'Campos com * são obrigatórios.'}
      rodape={<>
        {empresa && nProjetos === 0 && (
          <Button variante="fantasma" className="mr-auto text-erro hover:bg-erro/10 hover:text-erro" onClick={() => { d.remover('empresas', empresa.id); avisar('Empresa excluída.'); onFechar(); }}>Excluir</Button>
        )}
        <Button variante="secundario" onClick={onFechar}>Cancelar</Button>
        <Button onClick={salvar} isLoading={salvando}>{empresa ? 'Salvar alterações' : 'Salvar empresa'}</Button>
      </>}>
      <form onSubmit={(e) => { e.preventDefault(); salvar(); }} noValidate className="space-y-7">
        <SecaoForm titulo="Dados da empresa">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input compacto label="Razão social" required placeholder="Nome registrado da empresa" {...f.campo('razaoSocial')} />
            <Input compacto label="Nome fantasia" required placeholder="Como a empresa é conhecida" {...f.campo('nomeFantasia')} />
            <Input compacto label="CNPJ" required placeholder="00.000.000/0000-00" inputMode="numeric" {...f.campo('cnpj', mascaraCNPJ)} valid={!f.erros.cnpj && cnpjValido(f.valores.cnpj)} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Segmento" placeholder="Selecione" value={f.valores.segmento} onChange={(e) => f.set('segmento', e.target.value)} opcoes={SEGMENTOS.map((s) => ({ valor: s, rotulo: s }))} />
              <Select label="Porte" placeholder="Selecione" value={f.valores.porte} onChange={(e) => f.set('porte', e.target.value)} opcoes={PORTES.map((s) => ({ valor: s, rotulo: s }))} />
            </div>
            <Input compacto label="Site" placeholder="https://" icon={<Globe className="h-4 w-4" />} {...f.campo('site')} />
          </div>
        </SecaoForm>

        <SecaoForm titulo="Endereço">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr_110px]">
            <div className="relative">
              <Input compacto label="CEP" placeholder="00000-000" inputMode="numeric" {...f.campo('cep', mascaraCEP)} onBlur={buscarCep} hint={buscandoCep ? 'Buscando endereço…' : undefined} />
              {buscandoCep && <Loader2 className="absolute right-3 top-[34px] h-4 w-4 animate-spin text-primaria" aria-hidden />}
            </div>
            <Input compacto label="Logradouro" placeholder="Rua, avenida…" {...f.campo('logradouro')} />
            <Input compacto label="Número" placeholder="Nº" {...f.campo('numero')} />
          </div>
          <Input compacto label="Cidade / UF" placeholder="Preenchido pelo CEP" {...f.campo('cidadeUf')} />
          {avisoCep && <Aviso tipo="aviso">{avisoCep}</Aviso>}
        </SecaoForm>

        <SecaoForm titulo="Contato responsável">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input compacto label="Nome do contato" required placeholder="Nome completo" {...f.campo('contatoNome')} />
            <Input compacto label="E-mail do contato" required type="email" placeholder="nome@empresa.com" hint="Será o login do perfil Empresa." {...f.campo('contatoEmail')} />
            <Input compacto label="Telefone / WhatsApp" placeholder="(00) 00000-0000" inputMode="tel" {...f.campo('contatoTelefone', mascaraTelefone)} />
            <Input compacto label="Cargo" placeholder="Ex.: Gerente de TI" {...f.campo('contatoCargo')} />
          </div>
        </SecaoForm>

        <SecaoForm titulo="No programa">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Status" value={f.valores.status} onChange={(e) => f.set('status', e.target.value as Empresa['status'])} opcoes={Object.entries(STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))} />
            <Input compacto label="Data de entrada" type="date" {...f.campo('dataEntrada')} />
          </div>
        </SecaoForm>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
