/* ============================================================================
   APP/(SISTEMA)/EMPRESAS/PAGE.TSX
   O que é: tela de cadastro de empresas parceiras (lista com filtros + ficha em modal).
   Onde é usado: rota /empresas (protegida). Linkada pelo menu lateral (components/shell/navegacao.ts), pelo card "Empresas ativas" do painel (app/(sistema)/painel/page.tsx) e pela busca global do topo (components/shell/Topbar.tsx), que abre a ficha direto com /empresas?abrir=<id>.
   Depende de: useDados (lib/store.tsx), useToast (lib/toast.tsx), useFormulario (lib/useFormulario.ts), máscaras e validações de lib/utils.ts, rótulos do status de empresa de lib/metricas.ts (ROTULO_STATUS_EMPRESA, TOM_STATUS_EMPRESA), componentes de components/ui e components/shell, components/acessos/PessoasDaEmpresa (aba Pessoas da ficha), API pública do ViaCEP (viacep.com.br) e useSearchParams/useRouter do Next.
   Contexto: docs/contexto-cais.md §11 (Regras de cadastro), §10 (Anatomia de toda tela) e §9 (cor tem significado); docs/notas-next16.md §2 (useSearchParams + Suspense).
   ============================================================================ */
// "use client": a tela usa estado (useState), eventos (onClick) e useSearchParams,
// que só funcionam no navegador (docs/notas-next16.md §1).
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
import { Card, Etiqueta, EstadoVazio, EsqueletoLista, Paginacao, Avatar, Aviso, Abas } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import Modal from '@/components/ui/Modal';
import PessoasDaEmpresa from '@/components/acessos/PessoasDaEmpresa';
import { cnpjValido, EMAIL_REGEX, hojeISO, mascaraCEP, mascaraCNPJ, mascaraTelefone, normalizar, novoId, soDigitos, dataBR } from '@/lib/utils';
import { ROTULO_STATUS_EMPRESA, TOM_STATUS_EMPRESA } from '@/lib/metricas';

// Rótulos e cores do status de empresa (§11) vêm de lib/metricas.ts, compartilhados com o painel da empresa.
const STATUS = ROTULO_STATUS_EMPRESA;
const TOM = TOM_STATUS_EMPRESA;
// Opções fixas dos selects de segmento e porte.
// TODO(API): quando a API da PROGLOGIC existir, estas listas podem vir do servidor.
const SEGMENTOS = ['Agronegócio', 'Educação', 'Financeiro', 'Indústria', 'Logística', 'Saúde', 'Serviços', 'Tecnologia', 'Varejo'];
const PORTES = ['Pequeno', 'Médio', 'Grande'];
// Quantas empresas cabem em uma página da tabela (paginação no rodapé, §10).
const POR_PAGINA = 8;

/**
 * Página da rota /empresas.
 * Só embrulha a tela em <Suspense>: quem usa useSearchParams precisa disso,
 * senão o build do Next 16 falha (docs/notas-next16.md §2).
 * @returns a tela de empresas dentro de um limite de Suspense.
 */
export default function PaginaEmpresas() {
  return <Suspense><Empresas /></Suspense>;
}

/**
 * Tela de empresas: filtros (busca, status, segmento), tabela paginada
 * com os quatro estados (carregando, vazio, vazio por filtro, com dado) e a ficha em modal.
 * @returns o conteúdo da página.
 */
function Empresas() {
  const d = useDados();
  const params = useSearchParams();
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [segmento, setSegmento] = useState('');
  const [pagina, setPagina] = useState(1);
  // ?abrir=<id> vem da busca global do topo (Topbar). Só procuramos a empresa
  // depois que o store carregou (d.pronto); antes disso a lista ainda está vazia.
  // Se o id não existir, daUrl vira null e nenhuma ficha abre.
  const abrirId = params.get('abrir');
  const daUrl = abrirId && d.pronto ? d.empresa(abrirId) ?? null : null;
  // Qual ficha está aberta: uma empresa existente, 'nova' (cadastro em branco) ou null (fechada).
  const [editando, setEditando] = useState<Empresa | 'nova' | null>(null);


  // Lista filtrada e ordenada. useMemo evita refazer o filtro a cada render;
  // só recalcula quando os dados ou algum filtro mudam.
  const filtradas = useMemo(() => {
    // normalizar tira acentos e maiúsculas: "sao" encontra "São".
    const q = normalizar(busca.trim());
    return d.empresas
      // Filtro vazio ('') significa "todos": por isso o teste !status deixa tudo passar.
      .filter((e) => !status || e.status === status)
      .filter((e) => !segmento || e.segmento === segmento)
      // Busca por nome (fantasia ou razão social) OU por CNPJ só com dígitos.
      // O '#' é um truque: se a busca não tem números, soDigitos(q) é '' e todo CNPJ
      // "incluiria" '' — trocando por '#' (que nunca aparece em dígitos) ninguém casa por CNPJ.
      .filter((e) => !q || normalizar(e.nomeFantasia + e.razaoSocial).includes(q) || soDigitos(e.cnpj).includes(soDigitos(q) || '#'))
      .sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia));
  }, [d.empresas, busca, status, segmento]);

  // Filtro mudou e a página ficou fora do alcance? volta para a última válida
  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(filtradas.length / POR_PAGINA)));
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  // Há algum filtro ativo? Decide qual estado vazio mostrar e se aparece "Limpar filtros".
  const temFiltro = busca || status || segmento;

  return (
    // p-4 / sm:p-6 / lg:p-8: o respiro cresce com a tela; max-w-[1400px] evita linhas longas demais em monitor largo.
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Empresas" descricao="Quem traz os projetos. Projetos e trilhas da empresa dependem deste cadastro."
        // Ação principal da tela fica no cabeçalho, sempre no mesmo lugar (§10).
        acao={<Button onClick={() => setEditando('nova')}><Plus className="h-4 w-4" aria-hidden />Nova empresa</Button>} />

      {/* Filtros sempre visíveis acima do conteúdo, nunca escondidos (§10). */}
      <BarraFiltros>
        <div className="relative w-full sm:w-72">
          {/* pointer-events-none: a lupa fica por cima do input sem roubar o clique dele. */}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-fraca" aria-hidden />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou CNPJ" aria-label="Buscar empresas"
            className="h-10 w-full rounded-lg border border-borda bg-superficie pl-9 pr-3 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
        </div>
        <div className="w-44"><Select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Todos os status" opcoes={Object.entries(STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))} /></div>
        <div className="w-44"><Select aria-label="Filtrar por segmento" value={segmento} onChange={(e) => setSegmento(e.target.value)} placeholder="Todos os segmentos" opcoes={SEGMENTOS.map((s) => ({ valor: s, rotulo: s }))} /></div>
        {/* Só mostra "Limpar filtros" quando existe algo para limpar. */}
        {temFiltro && <Button variante="fantasma" tamanho="sm" onClick={() => { setBusca(''); setStatus(''); setSegmento(''); }}>Limpar filtros</Button>}
      </BarraFiltros>

      <Card>
        {/*
          * Os quatro estados da tela (§10/§13): carregando (esqueleto enquanto o store lê os dados),
          * vazio por filtro, vazio de verdade (nenhuma empresa) e com dado (tabela).
          */}
        {!d.pronto ? <EsqueletoLista /> : filtradas.length === 0 ? (
          // Diferencia "não achei com esses filtros" de "não existe nada cadastrado":
          // cada caso tem texto e próxima ação diferentes.
          temFiltro
            ? <EstadoVazio icone={<Search className="h-6 w-6" />} titulo="Nenhuma empresa com esses filtros" descricao="Tente outro termo de busca ou limpe os filtros para ver todas." acao={<Button variante="secundario" onClick={() => { setBusca(''); setStatus(''); setSegmento(''); }}>Limpar filtros</Button>} />
            : <EstadoVazio icone={<Building2 className="h-6 w-6" />} titulo="Nenhuma empresa cadastrada" descricao="Cadastre a primeira empresa parceira para criar projetos e trilhas para ela." acao={<Button onClick={() => setEditando('nova')}><Plus className="h-4 w-4" />Nova empresa</Button>} />
        ) : (
          <>
            <Tabela rotulo="Lista de empresas">
              <thead><tr><Th>Empresa</Th><Th>Contato</Th><Th>Segmento</Th><Th className="text-center">Projetos</Th><Th>Status</Th></tr></thead>
              <tbody>
                {visiveis.map((e) => {
                  // Quantos projetos a empresa tem: mostrado na coluna "Projetos".
                  const n = d.projetos.filter((p) => p.empresaId === e.id).length;
                  return (
                    // A linha inteira é clicável para quem usa mouse.
                    <Tr key={e.id} onClick={() => setEditando(e)}>
                      <Td>
                        {/*
                          * O botão dentro da linha é o caminho do teclado (Tab + Enter).
                          * stopPropagation impede que o clique dispare também o onClick da linha (abriria a ficha duas vezes).
                          */}
                        <button className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50 rounded-lg" onClick={(ev) => { ev.stopPropagation(); setEditando(e); }}>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primaria-suave font-space text-sm font-bold text-primaria">{e.nomeFantasia[0]}</span>
                          {/* tabular-nums: dígitos com a mesma largura, então os CNPJs ficam alinhados na coluna. */}
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
      {/* Prioridade: o que foi clicado (editando) vence o que veio pela URL (daUrl). */}
      {(editando ?? daUrl) && (
        // key muda quando troca a empresa: o React recria o formulário do zero
        // em vez de reaproveitar valores da ficha anterior.
        <FormEmpresa key={editando === 'nova' ? 'nova' : (editando ?? daUrl)!.id} empresa={editando === 'nova' ? null : (editando ?? daUrl)!}
          // NAVEGA: se a ficha veio da URL, ao fechar tiramos o ?abrir= com router.replace
          // (replace, não push: o botão Voltar não reabre a ficha). Sem isso a ficha reabriria sozinha.
          onFechar={() => { setEditando(null); if (daUrl) router.replace('/empresas'); }} />
      )}
    </div>
  );
}

/** Valores editáveis do formulário: a Empresa inteira, menos o id (que é gerado ao salvar). */
type ValEmpresa = Omit<Empresa, 'id'>;
// Formulário em branco para "Nova empresa": status começa em negociação e a data de entrada é hoje.
const VAZIA: ValEmpresa = { razaoSocial: '', nomeFantasia: '', cnpj: '', segmento: '', porte: '', site: '', cep: '', logradouro: '', numero: '', cidadeUf: '', contatoNome: '', contatoEmail: '', contatoTelefone: '', contatoCargo: '', status: 'negociacao', dataEntrada: hojeISO() };

/**
 * Ficha da empresa em modal: cria uma nova ou edita/exclui uma existente.
 * Aplica as regras do §11: CNPJ com máscara e dígitos, CEP que preenche endereço editável,
 * e-mail do contato único e erro mostrado ao sair do campo.
 * @param empresa empresa a editar, ou null para cadastrar uma nova.
 * @param onFechar chamada ao cancelar, salvar ou excluir (quem chamou fecha o modal).
 * @returns o modal com o formulário.
 */
function FormEmpresa({ empresa, onFechar }: { empresa: Empresa | null; onFechar: () => void }) {
  const d = useDados();
  const avisar = useToast();
  const [salvando, setSalvando] = useState(false);
  // Estados da busca de CEP: buscandoCep mostra o spinner e a dica "Buscando endereço…";
  // avisoCep guarda a mensagem quando o CEP não existe ou o ViaCEP não respondeu.
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState('');
  // Aba da ficha: 'dados' (formulário) ou 'pessoas' (vínculo pessoa-empresa, §11). Só existe para empresa já cadastrada.
  const [aba, setAba] = useState<'dados' | 'pessoas'>('dados');

  /**
   * Regras de validação da ficha. Devolve um objeto { campo: mensagem } só com os campos com erro.
   * useCallback mantém a mesma função entre renders, pois o useFormulario depende dela.
   * @param v valores atuais do formulário.
   * @returns erros por campo (objeto vazio = tudo certo).
   */
  const validar = useCallback((v: ValEmpresa) => {
    const e: Partial<Record<keyof ValEmpresa, string>> = {};
    if (!v.razaoSocial.trim()) e.razaoSocial = 'Informe a razão social.';
    if (!v.nomeFantasia.trim()) e.nomeFantasia = 'Informe o nome fantasia.';
    // CNPJ em três passos, do erro mais simples ao mais caro:
    // 1) vazio; 2) dígitos verificadores errados (cnpjValido em lib/utils.ts faz o cálculo
    // módulo 11 dos dois últimos dígitos e recusa sequências repetidas como 11.111.111/1111-11);
    // 3) já cadastrado em outra empresa. Comparamos só os dígitos para a máscara não atrapalhar.
    // "x.id !== empresa?.id" ignora a própria empresa ao editar, senão ela "duplicaria" a si mesma.
    if (!v.cnpj) e.cnpj = 'Informe o CNPJ.';
    else if (!cnpjValido(v.cnpj)) e.cnpj = 'CNPJ inválido. Confira os 14 dígitos.';
    else if (d.empresas.some((x) => soDigitos(x.cnpj) === soDigitos(v.cnpj) && x.id !== empresa?.id)) e.cnpj = 'Já existe uma empresa com este CNPJ.';
    // CEP é opcional, mas se preenchido precisa ter os 8 dígitos.
    if (v.cep && soDigitos(v.cep).length !== 8) e.cep = 'O CEP tem 8 dígitos.';
    // Site precisa começar com http:// ou https:// e ter um ponto no domínio.
    if (v.site && !/^https?:\/\/.+\..+/.test(v.site)) e.site = 'Use o endereço completo, com https://';
    if (!v.contatoNome.trim()) e.contatoNome = 'Informe o nome do contato.';
    // E-mail do contato é único no sistema inteiro (§11) porque vira o login do perfil Empresa.
    // Comparamos com os e-mails das outras empresas e das pessoas cadastradas, sem diferenciar
    // maiúsculas. Pessoas vinculadas a esta mesma empresa ficam de fora: o contato costuma
    // já existir como pessoa do perfil Empresa com o mesmo e-mail.
    if (!v.contatoEmail.trim()) e.contatoEmail = 'Informe o e-mail do contato.';
    else if (!EMAIL_REGEX.test(v.contatoEmail)) e.contatoEmail = 'Use um e-mail no formato nome@empresa.com.';
    else if ([...d.empresas.filter((x) => x.id !== empresa?.id).map((x) => x.contatoEmail), ...d.pessoas.filter((p) => p.empresaId !== empresa?.id).map((p) => p.email)]
      .some((m) => m.toLowerCase() === v.contatoEmail.toLowerCase())) e.contatoEmail = 'Este e-mail já está em uso. Ele será o login do perfil Empresa.';
    return e;
  // ⚠️ ATENÇÃO: se tirar algo desta lista de dependências, a validação passa a usar dados
  // antigos e deixa de pegar CNPJ ou e-mail duplicado recém-cadastrado.
  }, [d.empresas, d.pessoas, empresa]);

  // Ao editar, começa com uma cópia da empresa; ao criar, com o formulário em branco.
  const f = useFormulario<ValEmpresa>(empresa ? { ...empresa } : VAZIA, validar);

  /**
   * Busca o endereço no ViaCEP quando o usuário sai do campo CEP (onBlur).
   * O CEP preenche o endereço, mas os campos continuam editáveis (§11).
   * Fluxo de estados: carregando (spinner) → sucesso (preenche logradouro e cidade)
   * ou erro (aviso amarelo pedindo preenchimento manual). Nunca bloqueia o cadastro.
   * @returns Promise vazia; o resultado aparece nos campos ou no aviso.
   */
  const buscarCep = async () => {
    // Como o onBlur do input foi trocado por esta função, marcamos o campo como "tocado"
    // aqui para a validação do CEP continuar mostrando erro ao sair do campo.
    f.blur('cep');
    const cep = soDigitos(f.valores.cep);
    // CEP incompleto: nem consulta (o erro de validação já avisa o usuário).
    if (cep.length !== 8) return;
    // Liga o carregando e apaga o aviso de uma busca anterior.
    setBuscandoCep(true); setAvisoCep('');
    try {
      // Fetch externo para a API pública do ViaCEP (não é da PROGLOGIC, não precisa de token).
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const j = await r.json();
      // O ViaCEP responde 200 mesmo para CEP inexistente, só que com { erro: true }:
      // por isso o teste é no corpo da resposta, não no status HTTP.
      if (j.erro) setAvisoCep('CEP não encontrado. Preencha o endereço manualmente.');
      else {
        // GRAVA: preenche os campos do formulário, que continuam editáveis (§11).
        // Se o CEP não tiver logradouro (cidades pequenas), mantém o que o usuário já digitou.
        f.set('logradouro', j.logradouro || f.valores.logradouro);
        f.set('cidadeUf', `${j.localidade} / ${j.uf}`);
      }
    } catch {
      // Sem internet ou ViaCEP fora do ar: avisa e deixa preencher à mão.
      setAvisoCep('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.');
    }
    // Desliga o carregando nos dois caminhos (sucesso ou erro).
    setBuscandoCep(false);
  };

  /**
   * Valida tudo e salva a empresa no store.
   * Se houver erro, mostra um toast e para; os campos com erro ficam destacados.
   * @returns Promise vazia; ao terminar fecha a ficha.
   */
  const salvar = async () => {
    if (!f.validarTudo()) { avisar('Revise os campos destacados antes de salvar.', 'erro'); return; }
    setSalvando(true);
    // SIMULADO: espera 350 ms para fingir o tempo de resposta de uma API e mostrar o botão carregando.
    await new Promise((r) => setTimeout(r, 350));
    // GRAVA: cria ou atualiza a empresa no store (que persiste no localStorage).
    // Empresa nova ganha um id com prefixo "emp".
    // TODO(API): trocar por POST/PUT na API da PROGLOGIC.
    d.salvar('empresas', { ...f.valores, id: empresa?.id ?? novoId('emp') });
    avisar(empresa ? 'Empresa atualizada.' : `${f.valores.nomeFantasia} cadastrada.`);
    onFechar();
  };

  // Quantos projetos a empresa tem: aparece na descrição e decide se pode excluir.
  const nProjetos = empresa ? d.projetos.filter((p) => p.empresaId === empresa.id).length : 0;

  return (
    <Modal aberto onFechar={onFechar} tamanho="lg" titulo={empresa ? empresa.nomeFantasia : 'Nova empresa'}
      // Descrição do modal: na edição mostra o resumo; no cadastro, a legenda dos obrigatórios.
      // O cálculo do plural evita "1 projetos".
      descricao={empresa ? `${nProjetos} projeto${nProjetos === 1 ? '' : 's'} · entrou em ${dataBR(empresa.dataEntrada)}` : 'Campos com * são obrigatórios.'}
      rodape={<>
        {/*
          * Excluir só aparece para empresa sem projetos: projetos e trilhas dependem dela
          * e o store não apaga empresas em cascata.
          */}
        {empresa && nProjetos === 0 && (
          // APAGA: remove a empresa do store (e do localStorage).
          // ⚠️ ATENÇÃO: não remove em cascata. Pessoas vinculadas a esta empresa ficam com
          // empresaId apontando para uma empresa que não existe mais.
          // mr-auto empurra o botão para a esquerda, longe de Salvar, para evitar clique por engano.
          <Button variante="fantasma" className="mr-auto text-erro hover:bg-erro/10 hover:text-erro" onClick={() => { d.remover('empresas', empresa.id); avisar('Empresa excluída.'); onFechar(); }}>Excluir</Button>
        )}
        <Button variante="secundario" onClick={onFechar}>Cancelar</Button>
        <Button onClick={salvar} isLoading={salvando}>{empresa ? 'Salvar alterações' : 'Salvar empresa'}</Button>
      </>}>
      {/*
        * noValidate desliga os balões de validação do navegador: usamos as nossas mensagens.
        * preventDefault impede o recarregamento da página ao enviar com Enter.
        */}
      {/* Abas só na empresa já cadastrada: a nova ainda não tem pessoas para listar. */}
      {empresa && (
        <div className="mb-5"><Abas rotulo="Seções da empresa" ativa={aba} onChange={setAba}
          abas={[{ id: 'dados', rotulo: 'Dados' }, { id: 'pessoas', rotulo: 'Pessoas', contagem: d.pessoas.filter((p) => p.perfil === 'empresa' && p.empresaId === empresa.id).length }]} /></div>
      )}
      {empresa && aba === 'pessoas' && <div role="tabpanel" id="painel-pessoas" aria-labelledby="aba-pessoas"><PessoasDaEmpresa empresa={empresa} /></div>}
      {/* hidden (e não desmontar) mantém o que foi digitado ao trocar de aba. */}
      <form onSubmit={(e) => { e.preventDefault(); salvar(); }} noValidate className="space-y-7" hidden={aba === 'pessoas'}>
        <SecaoForm titulo="Dados da empresa">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input compacto label="Razão social" required placeholder="Nome registrado da empresa" {...f.campo('razaoSocial')} />
            <Input compacto label="Nome fantasia" required placeholder="Como a empresa é conhecida" {...f.campo('nomeFantasia')} />
            {/*
              * CNPJ: mascaraCNPJ formata enquanto digita (00.000.000/0000-00).
              * valid acende o check verde só quando não há erro E os dígitos verificadores batem.
              */}
            <Input compacto label="CNPJ" required placeholder="00.000.000/0000-00" inputMode="numeric" {...f.campo('cnpj', mascaraCNPJ)} valid={!f.erros.cnpj && cnpjValido(f.valores.cnpj)} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Segmento" placeholder="Selecione" value={f.valores.segmento} onChange={(e) => f.set('segmento', e.target.value)} opcoes={SEGMENTOS.map((s) => ({ valor: s, rotulo: s }))} />
              <Select label="Porte" placeholder="Selecione" value={f.valores.porte} onChange={(e) => f.set('porte', e.target.value)} opcoes={PORTES.map((s) => ({ valor: s, rotulo: s }))} />
            </div>
            <Input compacto label="Site" placeholder="https://" icon={<Globe className="h-4 w-4" />} {...f.campo('site')} />
          </div>
        </SecaoForm>

        <SecaoForm titulo="Endereço">
          {/* Grade com colunas de largura fixa para CEP e Número; o logradouro ocupa o resto (1fr). */}
          <div className="grid gap-4 sm:grid-cols-[160px_1fr_110px]">
            <div className="relative">
              {/*
                * O onBlur depois do spread substitui o do f.campo: ao sair do CEP, busca no ViaCEP.
                * O hint mostra "Buscando endereço…" enquanto a consulta não volta.
                */}
              <Input compacto label="CEP" placeholder="00000-000" inputMode="numeric" {...f.campo('cep', mascaraCEP)} onBlur={buscarCep} hint={buscandoCep ? 'Buscando endereço…' : undefined} />
              {/* Spinner posicionado dentro do input (top-[34px] desconta a altura do rótulo). */}
              {buscandoCep && <Loader2 className="absolute right-3 top-[34px] h-4 w-4 animate-spin text-primaria" aria-hidden />}
            </div>
            <Input compacto label="Logradouro" placeholder="Rua, avenida…" {...f.campo('logradouro')} />
            <Input compacto label="Número" placeholder="Nº" {...f.campo('numero')} />
          </div>
          <Input compacto label="Cidade / UF" placeholder="Preenchido pelo CEP" {...f.campo('cidadeUf')} />
          {/* Aviso só aparece se o ViaCEP não achou o CEP ou falhou. */}
          {avisoCep && <Aviso tipo="aviso">{avisoCep}</Aviso>}
        </SecaoForm>

        <SecaoForm titulo="Contato responsável">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input compacto label="Nome do contato" required placeholder="Nome completo" {...f.campo('contatoNome')} />
            {/* O hint lembra que este e-mail vira o login do perfil Empresa (por isso precisa ser único). */}
            <Input compacto label="E-mail do contato" required type="email" placeholder="nome@empresa.com" hint="Será o login do perfil Empresa." {...f.campo('contatoEmail')} />
            <Input compacto label="Telefone / WhatsApp" placeholder="(00) 00000-0000" inputMode="tel" {...f.campo('contatoTelefone', mascaraTelefone)} />
            <Input compacto label="Cargo" placeholder="Ex.: Gerente de TI" {...f.campo('contatoCargo')} />
          </div>
        </SecaoForm>

        <SecaoForm titulo="No programa">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Status do §11: Em negociação, Ativa ou Encerrada. */}
            <Select label="Status" value={f.valores.status} onChange={(e) => f.set('status', e.target.value as Empresa['status'])} opcoes={Object.entries(STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))} />
            <Input compacto label="Data de entrada" type="date" {...f.campo('dataEntrada')} />
          </div>
        </SecaoForm>
        {/* Botão invisível: permite enviar o formulário com Enter, já que o Salvar fica no rodapé do modal, fora do <form>. */}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
