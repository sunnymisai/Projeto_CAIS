/* ============================================================================
   APP/(SISTEMA)/PESSOAS/PAGE.TSX
   O que é: tela de cadastro de pessoas dos três perfis (lista com filtros + ficha em modal).
   Onde é usado: rota /pessoas (protegida). Linkada pelo menu lateral (components/shell/navegacao.ts), pelo card "Profissionais" do painel (app/(sistema)/painel/page.tsx) e pelo topo (components/shell/Topbar.tsx): a busca global e o aviso de sobrecarga abrem a ficha direto com /pessoas?abrir=<id>.
   Depende de: useDados (lib/store.tsx), useToast (lib/toast.tsx), useFormulario (lib/useFormulario.ts), trilhasDaPessoa (lib/metricas.ts), linhaDoTempo e segundaDaSemana (lib/carga.ts) e LinhaDeSemanas (components/ui/Semaforo.tsx) para a Disponibilidade da ficha, copiarTexto e linkDeConvite (lib/convite.ts), lib/utils.ts, tipo Perfil (lib/tipos.ts), componentes de components/ui e components/shell e useSearchParams/useRouter do Next.
   Contexto: docs/contexto-cais.md §11 (Regras de cadastro), §3 (Perfis), §10 (Anatomia de toda tela); docs/notas-next16.md §2 (useSearchParams + Suspense).
   ============================================================================ */
// "use client": a tela usa estado, eventos e useSearchParams, que só existem no navegador
// (docs/notas-next16.md §1).
"use client";

import { Suspense, useCallback, useMemo, useState, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Users, X, Mail, Link2 } from 'lucide-react';
import { useDados, Pessoa } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { useFormulario } from '@/lib/useFormulario';
import { trilhasDaPessoa } from '@/lib/metricas';
import { copiarTexto, linkDeConvite } from '@/lib/convite';
import { CabecalhoPagina, BarraFiltros } from '@/components/shell/Pagina';
import Button from '@/components/button';
import Input from '@/components/input';
import { Select, SecaoForm, Segmentado, Interruptor } from '@/components/ui/form';
import { Card, Etiqueta, EstadoVazio, EsqueletoLista, Paginacao, Avatar, Aviso } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import Modal from '@/components/ui/Modal';
import { EMAIL_REGEX, hojeISO, mascaraTelefone, normalizar, novoId, cx } from '@/lib/utils';
import type { Perfil } from '@/lib/tipos';
import { linhaDoTempo, segundaDaSemana } from '@/lib/carga';
import { LinhaDeSemanas } from '@/components/ui/Semaforo';

/** Nome de cada perfil na tela. Uma única tela cadastra os três (§11). */
const PERFIS: Record<Perfil, string> = { profissional: 'Profissional', empresa: 'Empresa', admin: 'Administrador' };
/**
 * Status de uma pessoa. "Convidado" = recebeu convite e ainda não fez o primeiro acesso.
 * "Inativo" substitui a exclusão: a pessoa some do uso, mas o histórico fica (§11).
 */
const STATUS = { convidado: 'Convidado', ativo: 'Ativo', inativo: 'Inativo' } as const;
// Cor da etiqueta por status (cor tem significado, §9): convidado pede atenção, ativo é sucesso.
const TOM = { convidado: 'aviso', ativo: 'sucesso', inativo: 'neutro' } as const;
// Opções fixas de área e nível do perfil Profissional.
// TODO(API): quando a API da PROGLOGIC existir, estas listas podem vir do servidor.
const AREAS = ['Front-end', 'Back-end', 'UX', 'QA', 'Dados', 'Gestão'];
const NIVEIS = ['Estágio', 'Júnior', 'Pleno', 'Sênior'];
// Quantas pessoas por página da tabela (paginação no rodapé, §10).
const POR_PAGINA = 8;

/**
 * Página da rota /pessoas.
 * Só embrulha a tela em <Suspense>: quem usa useSearchParams precisa disso,
 * senão o build do Next 16 falha (docs/notas-next16.md §2).
 * @returns a tela de pessoas dentro de um limite de Suspense.
 */
export default function PaginaPessoas() {
  return <Suspense><Pessoas /></Suspense>;
}

/**
 * Tela de pessoas: filtro por perfil (com contagem), busca, filtro de status,
 * tabela paginada e a ficha em modal.
 * @returns o conteúdo da página.
 */
function Pessoas() {
  const d = useDados();
  const params = useSearchParams();
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [perfil, setPerfil] = useState<Perfil | 'todos'>('todos');
  const [status, setStatus] = useState('');
  const [pagina, setPagina] = useState(1);
  // ?abrir=<id> vem do topo (busca global ou aviso de carga acima do limite).
  // Só procuramos a pessoa depois que o store carregou (d.pronto); id inexistente = nenhuma ficha.
  const abrirId = params.get('abrir');
  const daUrl = abrirId && d.pronto ? d.pessoa(abrirId) ?? null : null;
  // Qual ficha está aberta: uma pessoa existente, 'nova' (cadastro em branco) ou null (fechada).
  const [editando, setEditando] = useState<Pessoa | 'nova' | null>(null);


  // Lista filtrada e ordenada por nome. useMemo só refaz o cálculo quando os dados ou filtros mudam.
  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim());
    return d.pessoas
      // 'todos' deixa passar qualquer perfil; '' no status também significa "todos".
      .filter((p) => perfil === 'todos' || p.perfil === perfil)
      .filter((p) => !status || p.status === status)
      // A busca olha nome, e-mail e área juntos; normalizar ignora acentos e maiúsculas.
      .filter((p) => !q || normalizar(p.nome + ' ' + p.email + ' ' + p.area).includes(q))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [d.pessoas, busca, perfil, status]);

  // Filtro mudou e a página ficou fora do alcance? volta para a última válida
  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(filtradas.length / POR_PAGINA)));
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  // Conta quantas pessoas há em cada perfil, para mostrar o número no filtro segmentado.
  const contagem = (p: Perfil) => d.pessoas.filter((x) => x.perfil === p).length;

  return (
    // p-4 / sm:p-6 / lg:p-8: o respiro cresce com a tela; max-w-[1400px] evita linhas longas em monitor largo.
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Pessoas" descricao="Profissionais em formação, contatos das empresas e administradores."
        // Ação principal da tela fica no cabeçalho, sempre no mesmo lugar (§10).
        acao={<Button onClick={() => setEditando('nova')}><Plus className="h-4 w-4" aria-hidden />Nova pessoa</Button>} />

      {/* Filtros sempre visíveis acima da lista (§10). O segmentado já mostra quantos há em cada perfil. */}
      <BarraFiltros>
        <Segmentado rotulo="Filtrar por perfil" valor={perfil} onChange={setPerfil}
          opcoes={[{ valor: 'todos', rotulo: `Todos ${d.pessoas.length}` }, { valor: 'profissional', rotulo: `Profissionais ${contagem('profissional')}` }, { valor: 'empresa', rotulo: `Empresa ${contagem('empresa')}` }, { valor: 'admin', rotulo: `Admin ${contagem('admin')}` }]} />
        <div className="relative w-full sm:w-64">
          {/* pointer-events-none: a lupa fica por cima do input sem roubar o clique dele. */}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-fraca" aria-hidden />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome, e-mail ou área" aria-label="Buscar pessoas"
            className="h-10 w-full rounded-lg border border-borda bg-superficie pl-9 pr-3 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
        </div>
        <div className="w-40"><Select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Todos os status" opcoes={Object.entries(STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))} /></div>
      </BarraFiltros>

      <Card>
        {/*
          * Estados da tela: carregando (esqueleto até o store ler os dados), vazio e com dado.
          * Aqui o vazio é um só, com texto que cobre os dois casos (sem cadastro ou sem resultado no filtro).
          */}
        {!d.pronto ? <EsqueletoLista /> : filtradas.length === 0 ? (
          <EstadoVazio icone={<Users className="h-6 w-6" />} titulo="Ninguém por aqui" descricao="Nenhuma pessoa corresponde aos filtros. Ajuste a busca ou cadastre alguém novo."
            acao={<Button onClick={() => setEditando('nova')}><Plus className="h-4 w-4" />Nova pessoa</Button>} />
        ) : (
          <>
            <Tabela rotulo="Lista de pessoas">
              <thead><tr><Th>Pessoa</Th><Th>Perfil</Th><Th>Área ou empresa</Th><Th>Carga semanal</Th><Th>Trilhas</Th><Th>Status</Th></tr></thead>
              <tbody>
                {visiveis.map((p) => {
                  // Soma das horas semanais da pessoa em todos os projetos em que está alocada.
                  const carga = d.cargaDaPessoa(p.id);
                  // Progresso nas trilhas (concluídas de total) só faz sentido para profissionais.
                  const tr = trilhasDaPessoa(p.id, d);
                  return (
                    // A linha inteira abre a ficha com o mouse.
                    // Pessoa inativa continua na lista (histórico preservado), só que esmaecida (opacity-60).
                    <Tr key={p.id} onClick={() => setEditando(p)} className={cx(p.status === 'inativo' && 'opacity-60')}>
                      <Td>
                        {/*
                          * O botão é o caminho do teclado (Tab + Enter).
                          * stopPropagation impede que o clique dispare também o onClick da linha.
                          */}
                        <button onClick={(e) => { e.stopPropagation(); setEditando(p); }} className="flex items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
                          <Avatar nome={p.nome} tamanho={34} />
                          <span><span className="block font-semibold">{p.nome}</span><span className="block text-[12px] text-tinta-suave">{p.email}</span></span>
                        </button>
                      </Td>
                      <Td><Etiqueta tom={p.perfil === 'admin' ? 'primaria' : 'neutro'}>{PERFIS[p.perfil]}</Etiqueta></Td>
                      {/* A coluna muda conforme o perfil: Empresa mostra a empresa vinculada, Profissional mostra área e nível, Admin mostra o cargo. */}
                      <Td className="text-tinta-suave">{p.perfil === 'empresa' ? <LinkEmpresa empresaId={p.empresaId} /> : p.perfil === 'profissional' ? `${p.area} · ${p.nivel}` : p.cargo}</Td>
                      {/*
                        * Carga acima do máximo fica na cor de aviso (text-aviso). É alerta, não bloqueio.
                        * tabular-nums alinha os números na coluna.
                        */}
                      <Td>{p.perfil === 'profissional'
                        ? <span className={cx('tabular-nums font-semibold', carga > p.cargaMax ? 'text-aviso' : 'text-tinta')}>{carga} <span className="font-normal text-tinta-suave">/ {p.cargaMax} h</span></span>
                        : <span className="text-tinta-fraca">—</span>}</Td>
                      {/* "—" quando não se aplica: admin e empresa não fazem trilhas, e profissional sem trilha não tem total. */}
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
      {/* Prioridade: o que foi clicado (editando) vence o que veio pela URL (daUrl). */}
      {(editando ?? daUrl) && (
        // key muda quando troca a pessoa: o React recria o formulário do zero
        // em vez de reaproveitar valores da ficha anterior.
        <FormPessoa key={editando === 'nova' ? 'nova' : (editando ?? daUrl)!.id} pessoa={editando === 'nova' ? null : (editando ?? daUrl)!}
          // NAVEGA: se a ficha veio da URL, ao fechar tiramos o ?abrir= com router.replace
          // (replace, não push: o Voltar não reabre a ficha). Sem isso a ficha reabriria sozinha.
          onFechar={() => { setEditando(null); if (daUrl) router.replace('/pessoas'); }} />
      )}
    </div>
  );
}

/**
 * Nome da empresa como link para a ficha dela (/empresas?abrir=<id>).
 * stopPropagation: o clique no link não abre também a ficha da pessoa (a linha da tabela é clicável).
 * @param props.empresaId - id da empresa vinculada (pode ser vazio).
 * @returns o link, ou "—" quando não há empresa.
 */
function LinkEmpresa({ empresaId }: { empresaId: string }) {
  const d = useDados();
  const e = empresaId ? d.empresa(empresaId) : undefined;
  if (!e) return <span className="text-tinta-fraca">—</span>;
  // NAVEGA: abre a ficha da empresa.
  return <Link href={`/empresas?abrir=${e.id}`} onClick={(ev) => ev.stopPropagation()} className="rounded font-semibold text-primaria underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">{e.nomeFantasia}</Link>;
}

/**
 * Valores do formulário: a Pessoa (sem id) mais dois campos que existem só na tela:
 * convite (interruptor "enviar convite") e novaHabilidade (texto que está sendo digitado).
 * Os dois são removidos antes de gravar.
 */
type ValPessoa = Omit<Pessoa, 'id'> & { convite: boolean; novaHabilidade: string };

/**
 * Ficha da pessoa em modal: cadastra, edita, inativa ou reativa.
 * Regras do §11: uma tela para os três perfis, campos que mudam sem o formulário pular,
 * e-mail único, convite por e-mail no cadastro e inativar em vez de excluir.
 * @param pessoa pessoa a editar, ou null para cadastrar uma nova.
 * @param onFechar chamada ao cancelar, salvar ou inativar (quem chamou fecha o modal).
 * @returns o modal com o formulário.
 */
function FormPessoa({ pessoa, onFechar }: { pessoa: Pessoa | null; onFechar: () => void }) {
  const d = useDados();
  const avisar = useToast();
  const [salvando, setSalvando] = useState(false);

  /**
   * Regras de validação da ficha. Devolve { campo: mensagem } só com os campos com erro.
   * useCallback mantém a mesma função entre renders, pois o useFormulario depende dela.
   * @param v valores atuais do formulário.
   * @returns erros por campo (objeto vazio = tudo certo).
   * @example
   * validar({ ...v, nome: 'Ana' }).nome // 'Informe nome e sobrenome.'
   */
  const validar = useCallback((v: ValPessoa) => {
    const e: Partial<Record<keyof ValPessoa, string>> = {};
    if (!v.nome.trim()) e.nome = 'Informe o nome completo.';
    // Nome precisa de pelo menos duas palavras (nome e sobrenome), separadas por espaços.
    else if (v.nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome.';
    if (!v.email.trim()) e.email = 'Informe o e-mail.';
    else if (!EMAIL_REGEX.test(v.email)) e.email = 'Use um e-mail no formato nome@email.com.';
    // E-mail único (§11), sem diferenciar maiúsculas. "p.id !== pessoa?.id" ignora a própria
    // pessoa ao editar, senão ela "duplicaria" a si mesma.
    else if (d.pessoas.some((p) => p.email.toLowerCase() === v.email.toLowerCase() && p.id !== pessoa?.id)) e.email = 'Este e-mail já está cadastrado. Cada pessoa tem um e-mail único.';
    // Regras que dependem do perfil: Profissional precisa de área; Empresa precisa da empresa vinculada.
    if (v.perfil === 'profissional' && !v.area) e.area = 'Escolha a área de atuação.';
    if (v.perfil === 'empresa' && !v.empresaId) e.empresaId = 'Obrigatória no perfil Empresa.';
    return e;
  }, [d.pessoas, pessoa]);

  const f = useFormulario<ValPessoa>(
    pessoa ? { ...pessoa, convite: false, novaHabilidade: '' }
      // Pessoa nova começa como Profissional, status "convidado", data de entrada hoje,
      // carga máxima de 40 h por semana (padrão do §11) e com o convite ligado.
      : { nome: '', email: '', telefone: '', cargo: '', perfil: 'profissional', status: 'convidado', dataEntrada: hojeISO(), area: '', nivel: '', cargaMax: 40, habilidades: [], empresaId: '', convite: true, novaHabilidade: '' },
    validar);
  // Apelido curto para os valores atuais do formulário.
  const v = f.valores;

  /**
   * Adiciona a habilidade digitada como "chip" ao teclar Enter ou vírgula.
   * @param e evento de teclado do campo de habilidades.
   * @example
   * // digitar "React" e teclar Enter → habilidades: [..., 'React']
   */
  const addHabilidade = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    // preventDefault: o Enter não envia o formulário e a vírgula não é escrita no campo.
    e.preventDefault();
    const h = v.novaHabilidade.trim();
    // Ignora texto vazio e habilidade repetida.
    if (h && !v.habilidades.includes(h)) f.set('habilidades', [...v.habilidades, h]);
    f.set('novaHabilidade', '');
  };

  /**
   * Valida tudo e grava a pessoa. Se houver erro, mostra um toast e para.
   * @returns Promise vazia; ao terminar fecha a ficha.
   */
  const salvar = async () => {
    if (!f.validarTudo()) { avisar('Revise os campos destacados antes de salvar.', 'erro'); return; }
    setSalvando(true);
    // SIMULADO: espera 350 ms para fingir o tempo de resposta de uma API e mostrar o botão carregando.
    await new Promise((r) => setTimeout(r, 350));
    // Separa os campos que só existem na tela (convite e novaHabilidade) para não irem para o store.
    const { convite, ...resto } = v;
    const dados = { ...resto } as Partial<ValPessoa>;
    delete dados.novaHabilidade;
    delete dados.convite;
    // Monta o registro final conforme o perfil. O formulário guarda os campos de todos os perfis
    // enquanto o usuário troca (assim ele não perde o que digitou); na hora de gravar limpamos:
    // Admin não tem empresa, e quem não é Profissional não tem área, nível, habilidades nem carga.
    const limpo: Pessoa = {
      ...(dados as Omit<Pessoa, 'id'>), id: pessoa?.id ?? novoId('pes'),
      empresaId: v.perfil === 'admin' ? '' : v.empresaId,
      ...(v.perfil !== 'profissional' ? { area: '', nivel: '', habilidades: [], cargaMax: 0 } : {}),
    };
    // GRAVA: cria ou atualiza a pessoa no store (que persiste no localStorage).
    // TODO(API): trocar por POST/PUT na API da PROGLOGIC.
    d.salvar('pessoas', limpo);
    // SIMULADO: o envio real do convite não existe; só a mensagem diz que foi enviado.
    // TODO(API): a API deve mandar o e-mail com o link de primeiro acesso (fluxo do §12).
    avisar(convite && !pessoa ? `${v.nome.split(' ')[0]} cadastrada. Convite enviado para ${v.email}.` : pessoa ? 'Cadastro atualizado.' : 'Pessoa cadastrada.');
    onFechar();
  };

  /**
   * Inativa ou reativa a pessoa. Não existe excluir: inativar mantém o histórico
   * (alocações, tarefas, trilhas) e a pessoa pode voltar depois (§11).
   */
  const alternarAtivo = () => {
    // Só faz sentido para uma pessoa já cadastrada.
    if (!pessoa) return;
    const novo = pessoa.status === 'inativo' ? 'ativo' : 'inativo';
    // GRAVA: troca apenas o status no store; o resto do cadastro fica igual.
    d.salvar('pessoas', { ...pessoa, status: novo });
    avisar(novo === 'inativo' ? `${pessoa.nome} foi inativada. O histórico continua preservado.` : `${pessoa.nome} foi reativada.`);
    onFechar();
  };

  /**
   * Copia o link de convite da pessoa convidada (ela abre /primeiro-acesso e define a senha).
   * Se o navegador não deixar copiar (contexto sem https ou permissão negada), mostra o link no aviso para copiar à mão.
   */
  // SIMULADO: não envia e-mail nenhum; quem copia o link manda por conta própria.
  // TODO(API): a API envia o convite por e-mail; este botão vira "Reenviar convite".
  const copiarConvite = async () => {
    // Só existe para pessoa já cadastrada.
    if (!pessoa) return;
    const link = linkDeConvite(pessoa.id);
    if (await copiarTexto(link)) avisar(`Link de convite de ${pessoa.nome.split(' ')[0]} copiado.`);
    else avisar(`Não foi possível copiar automaticamente. Copie o link: ${link}`, 'erro');
  };

  // Horas já alocadas hoje: aparecem como dica no campo de carga máxima.
  const carga = pessoa ? d.cargaDaPessoa(pessoa.id) : 0;

  return (
    <Modal aberto onFechar={onFechar} tamanho="lg" titulo={pessoa ? pessoa.nome : 'Nova pessoa'}
      // Descrição do modal: na edição mostra perfil e e-mail; no cadastro explica a tela única.
      descricao={pessoa ? `${PERFIS[pessoa.perfil]} · ${pessoa.email}` : 'Uma tela para os três perfis. Os campos mudam conforme o perfil.'}
      rodape={<>
        {/*
          * Inativar/Reativar aparece só para pessoa já salva e que não seja Administrador.
          * Não há botão Excluir de propósito: o histórico precisa ficar (§11).
          */}
        {/* mr-auto empurra os botões para a esquerda, longe de Salvar, para evitar clique por engano. */}
        <div className="mr-auto flex flex-wrap gap-2">
          {pessoa && pessoa.perfil !== 'admin' && (
            <Button variante="fantasma" onClick={alternarAtivo}>{pessoa.status === 'inativo' ? 'Reativar' : 'Inativar'}</Button>
          )}
          {/* Convite só faz sentido enquanto a pessoa ainda não fez o primeiro acesso (status 'convidado'). */}
          {pessoa && pessoa.status === 'convidado' && (
            <Button variante="secundario" onClick={copiarConvite}><Link2 className="h-4 w-4" aria-hidden />Copiar link de convite</Button>
          )}
        </div>
        <Button variante="secundario" onClick={onFechar}>Cancelar</Button>
        <Button onClick={salvar} isLoading={salvando}>{pessoa ? 'Salvar alterações' : 'Salvar pessoa'}</Button>
      </>}>
      {/*
        * noValidate desliga os balões de validação do navegador: usamos as nossas mensagens.
        * preventDefault impede o recarregamento da página ao enviar com Enter.
        */}
      <form onSubmit={(e) => { e.preventDefault(); salvar(); }} noValidate className="space-y-7">
        <SecaoForm titulo="Perfil de acesso">
          {/* Trocar o perfil só muda o que aparece abaixo; os valores digitados continuam guardados no formulário. */}
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
          {/*
            * Cada bloco aparece só no perfil certo (&&). animate-fade-in suaviza a troca,
            * e a altura mínima do div acima evita que o rodapé do modal "pule".
            */}
          {v.perfil === 'profissional' && (
            <SecaoForm titulo="Só aparece no perfil profissional" className="animate-fade-in">
              <div className="grid gap-4 sm:grid-cols-3">
                <Select label="Área" required placeholder="Selecione" value={v.area} onChange={(e) => f.set('area', e.target.value)} onBlur={() => f.blur('area')} error={f.erros.area} opcoes={AREAS.map((a) => ({ valor: a, rotulo: a }))} />
                <Select label="Nível" placeholder="Selecione" value={v.nivel} onChange={(e) => f.set('nivel', e.target.value)} opcoes={NIVEIS.map((a) => ({ valor: a, rotulo: a }))} />
                {/*
                  * Carga máxima semanal: começa em 40 h (§11) e aceita de 4 a 44 h.
                  * Number() porque o input sempre devolve texto.
                  */}
                <Input compacto label="Carga máxima (h/sem)" type="number" min={4} max={44} value={String(v.cargaMax)} onChange={(e) => f.set('cargaMax', Number(e.target.value))}
                  // Na edição, a dica mostra quantas horas a pessoa já tem alocadas, para comparar com o máximo.
                  hint={pessoa ? `Hoje alocada em ${carga} h` : undefined} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="hab" className="text-[13px] font-medium text-tinta">Habilidades</label>
                {/*
                  * Caixa que parece um input, com chips dentro.
                  * focus-within: o anel de foco aparece quando o input interno recebe foco.
                  */}
                <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-borda bg-superficie px-2 py-1.5 focus-within:border-primaria focus-within:ring-4 focus-within:ring-primaria/25">
                  {v.habilidades.map((h) => (
                    <span key={h} className="inline-flex items-center gap-1 rounded-md bg-primaria-suave py-0.5 pl-2 pr-1 text-[12px] font-semibold text-primaria">
                      {h}
                      {/* aria-label diz qual habilidade o "X" remove, já que o botão não tem texto. */}
                      <button type="button" aria-label={`Remover ${h}`} onClick={() => f.set('habilidades', v.habilidades.filter((x) => x !== h))} className="rounded p-0.5 hover:bg-primaria/15"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  {/* O placeholder some quando já existe pelo menos uma habilidade, para não poluir. */}
                  <input id="hab" value={v.novaHabilidade} onChange={(e) => f.set('novaHabilidade', e.target.value)} onKeyDown={addHabilidade}
                    placeholder={v.habilidades.length ? '' : 'Digite e tecle Enter'} className="min-w-28 flex-1 bg-transparent px-1 text-sm text-tinta placeholder:text-tinta-fraca focus:outline-none" />
                </div>
              </div>
              {/* Disponibilidade (F04): o semáforo das próximas 8 semanas. Só na edição (pessoa nova não tem
                * alocação). Usa a carga máxima DO FORMULÁRIO, então mudar o limite já mostra o efeito. */}
              {pessoa && (
                <div>
                  <p className="mb-1.5 text-[13px] font-medium text-tinta">Disponibilidade nas próximas 8 semanas</p>
                  <LinhaDeSemanas quem={pessoa.nome} rotulo={`Disponibilidade de ${pessoa.nome} nas próximas 8 semanas`}
                    semanas={linhaDoTempo({ ...pessoa, cargaMax: Number(v.cargaMax) || 0 }, segundaDaSemana(hojeISO()), 8, d).map((s) => ({ segunda: s.segunda, pct: s.pct, nivel: s.nivel }))} />
                  {/* NAVEGA: a matriz completa da equipe. */}
                  <Link href="/carga" className="mt-1.5 inline-block rounded text-[13px] font-semibold text-primaria hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">Ver carga da equipe</Link>
                </div>
              )}
            </SecaoForm>
          )}
          {v.perfil !== 'admin' && (
            // mt-7 só quando a seção do profissional está acima, para manter o mesmo espaçamento entre seções.
            <SecaoForm titulo="Vínculo e acesso" className={cx('animate-fade-in', v.perfil === 'profissional' && 'mt-7')}>
              {/* Empresa vinculada: obrigatória no perfil Empresa, opcional no Profissional (§11). */}
              <Select label="Empresa vinculada" required={v.perfil === 'empresa'} placeholder={v.perfil === 'empresa' ? 'Selecione a empresa' : 'Sem vínculo'}
                value={v.empresaId} onChange={(e) => f.set('empresaId', e.target.value)} onBlur={() => f.blur('empresaId')} error={f.erros.empresaId}
                hint={v.perfil === 'empresa' ? 'A pessoa só verá os projetos desta empresa.' : undefined}
                // Empresas encerradas não aparecem: não faz sentido vincular alguém a elas.
                opcoes={d.empresas.filter((e) => e.status !== 'encerrada').map((e) => ({ valor: e.id, rotulo: e.nomeFantasia }))} />
              {/* Atalho para a ficha da empresa já salva (só quando a pessoa tem vínculo gravado). */}
              {pessoa?.empresaId && d.empresa(pessoa.empresaId) && (
                <p className="text-[13px] text-tinta-suave">Empresa atual: <LinkEmpresa empresaId={pessoa.empresaId} /></p>
              )}
            </SecaoForm>
          )}
          {/* Admin só tem dados pessoais (§11); no lugar dos campos, um aviso explica o acesso total. */}
          {v.perfil === 'admin' && (
            <div className="animate-fade-in"><Aviso tipo="info" titulo="Perfil com acesso total">Administradores veem e editam todos os cadastros, trilhas e projetos.</Aviso></div>
          )}
        </div>

        {/* O convite só aparece no cadastro novo: quem já existe já recebeu o seu. */}
        {!pessoa && (
          <div className="rounded-xl border border-borda p-4">
            <Interruptor ligado={v.convite} onChange={(x) => f.set('convite', x)} rotulo="Enviar convite por e-mail ao salvar"
              descricao="O link leva ao primeiro acesso, onde a pessoa define a senha." />
            {/* Prévia do destinatário: só aparece com o convite ligado e um e-mail em formato válido. */}
            {v.convite && v.email && EMAIL_REGEX.test(v.email) && (
              <p className="mt-3 flex items-center gap-2 text-[13px] text-tinta-suave"><Mail className="h-4 w-4" aria-hidden />O convite será enviado para <strong className="text-tinta">{v.email}</strong></p>
            )}
          </div>
        )}
        {/* Botão invisível: permite enviar com Enter, já que o Salvar fica no rodapé do modal, fora do <form>. */}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
