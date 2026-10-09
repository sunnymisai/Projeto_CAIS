/* ============================================================================
   APP/(SISTEMA)/ACESSOS/PAGE.TSX (GESTÃO DE ACESSOS)
   O que é: tela de gestão de acessos (só administrador): quem tem conta, perfil, empresa, status e último acesso; ações de reenviar convite, redefinir senha, mudar perfil e inativar/reativar; e o quadro "O que cada perfil pode fazer".
   Onde é usado: rota /acessos (protegida; só admin em lib/permissoes.ts). Linkada pelo menu lateral (components/shell/navegacao.ts).
   Depende de: lib/store (useDados), lib/auth (useAuth, lerUltimosAcessos, definirSenha, SENHA_DEMO), lib/convite, lib/toast, lib/utils, lib/metricas (ROTULO_PERFIL), components/acessos/*, components/ui/* e components/shell/Pagina.
   Contexto: docs/contexto-cais.md §3 (perfis), §10 (anatomia de toda tela), §11 (inativar em vez de excluir) e §15 item 3.
   ============================================================================ */
// "use client": a tela usa estado, menus e a sessão, que só existem no navegador (docs/notas-next16.md §1).
"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, KeyRound, MoreHorizontal, Link2, ShieldCheck, UserX, UserCheck, RefreshCcw } from 'lucide-react';
import { useDados, Pessoa } from '@/lib/store';
import { useAuth, lerUltimosAcessos, definirSenha, SENHA_DEMO } from '@/lib/auth';
import { copiarTexto, linkDeConvite } from '@/lib/convite';
import { useToast } from '@/lib/toast';
import { normalizar, hojeISO, tempoRelativo, cx } from '@/lib/utils';
import { ROTULO_PERFIL } from '@/lib/metricas';
import { CabecalhoPagina, BarraFiltros } from '@/components/shell/Pagina';
import Button from '@/components/button';
import { Select } from '@/components/ui/form';
import Menu, { ItemMenu } from '@/components/ui/Menu';
import Modal from '@/components/ui/Modal';
import { Card, Etiqueta, EstadoVazio, EsqueletoLista, Paginacao, Avatar, Aviso } from '@/components/ui/basicos';
import { Tabela, Th, Td, Tr } from '@/components/ui/Tabela';
import ModalMudarPerfil from '@/components/acessos/ModalMudarPerfil';
import MatrizDePermissoes from '@/components/acessos/MatrizDePermissoes';

// [PV-1] OS NOMES E AS CORES DOS STATUS da pessoa (Convidado, Ativo, Inativo) na tabela e no filtro. Cor sempre com texto.
const STATUS = { convidado: 'Convidado', ativo: 'Ativo', inativo: 'Inativo' } as const;
// Cor da etiqueta por status (§9): convidado pede atenção, ativo é sucesso, inativo é neutro. Sempre com texto.
const TOM = { convidado: 'aviso', ativo: 'sucesso', inativo: 'neutro' } as const;
// [PV-2] QUANTAS PESSOAS POR PÁGINA na tabela de acessos: 10.
const POR_PAGINA = 10;

/** Qual confirmação está aberta: redefinir senha, inativar ou mudar perfil de uma pessoa. */
type Acao = { tipo: 'senha' | 'inativar' | 'perfil'; pessoa: Pessoa };

/**
 * Página /acessos: filtros, tabela com menu de ações por linha e o quadro de permissões.
 * Os estados: carregando (esqueleto), vazio (sem pessoas ou sem resultado do filtro) e com dado.
 * @returns o conteúdo da página.
 */
export default function PaginaAcessos() {
  const d = useDados();
  const { sessao } = useAuth();
  const avisar = useToast();
  const [busca, setBusca] = useState('');
  const [perfil, setPerfil] = useState('');
  const [status, setStatus] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [pagina, setPagina] = useState(1);
  const [acao, setAcao] = useState<Acao | null>(null);

  // [PV-3] O ÚLTIMO ACESSO de cada pessoa (SIMULADO): vem do navegador, registrado no login (lib/auth.tsx).
  // Último acesso de cada pessoa. Lê o navegador só depois que a store carregou (d.pronto), quando
  // a tela já é só do navegador; antes disso mostramos o esqueleto e o servidor não diverge.
  // SIMULADO: vem do localStorage (registrado no login, lib/auth.tsx).
  const ultimos = useMemo(() => (d.pronto ? lerUltimosAcessos() : {}), [d.pronto]);

  // [PV-4] OS FILTROS E A ORDEM DA TABELA: busca por nome ou e-mail (sem acento), perfil, status e empresa, em ordem alfabética por nome.
  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim());
    return d.pessoas
      .filter((p) => !perfil || p.perfil === perfil)
      .filter((p) => !status || p.status === status)
      .filter((p) => !empresa || p.empresaId === empresa)
      .filter((p) => !q || normalizar(p.nome + ' ' + p.email).includes(q))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [d.pessoas, busca, perfil, status, empresa]);

  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(filtradas.length / POR_PAGINA)));
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const temFiltro = busca || perfil || status || empresa;
  const limpar = () => { setBusca(''); setPerfil(''); setStatus(''); setEmpresa(''); };

  // [PV-5] A TRAVA DO ÚLTIMO ADMINISTRADOR: quando só resta um ativo, ele não pode ser rebaixado nem inativado (travaria o sistema).
  // Quantos administradores ativos existem: o último não pode ser rebaixado nem inativado (travaria o sistema).
  const adminsAtivos = d.pessoas.filter((p) => p.perfil === 'admin' && p.status === 'ativo').length;

  // [PV-6] O REENVIO DE CONVITE (SIMULADO): só copia o link de primeiro acesso; nenhum e-mail é enviado. TODO(API): a API reenvia o e-mail.
  /**
   * Copia o link de convite (SIMULADO: nenhum e-mail é enviado).
   * @param p - a pessoa convidada.
   */
  // TODO(API): a API reenvia o e-mail do convite.
  const reenviarConvite = async (p: Pessoa) => {
    const link = linkDeConvite(p.id);
    if (await copiarTexto(link)) avisar(`Link de convite de ${p.nome.split(' ')[0]} copiado. Envie para a pessoa.`);
    else avisar(`Não foi possível copiar automaticamente. Copie o link: ${link}`, 'erro');
  };

  // [PV-7] A REDEFINIÇÃO DE SENHA: grava a senha temporária de demonstração (SENHA_DEMO). SIMULADO: nunca para produção. TODO(API): senha aleatória enviada por e-mail, com troca obrigatória.
  /** Confirma a redefinição de senha: grava a senha temporária. */
  // GRAVA: define a senha da pessoa como a temporária de demonstração (SIMULADO, NUNCA PARA PRODUÇÃO).
  // TODO(API): a API gera uma senha temporária aleatória, envia por e-mail e obriga a troca no próximo login.
  const confirmarSenha = (p: Pessoa) => {
    if (definirSenha(p.email, SENHA_DEMO)) avisar(`Senha de ${p.nome.split(' ')[0]} redefinida para ${SENHA_DEMO}. Avise a pessoa por um canal seguro.`);
    else avisar('Não foi possível redefinir a senha neste navegador.', 'erro');
    setAcao(null);
  };

  // [PV-8] INATIVAR E REATIVAR: só troca o status; nada é excluído (§11), e alocações, tarefas e trilhas ficam no histórico.
  /**
   * Inativa ou reativa a pessoa (nunca exclui, §11).
   * @param p - a pessoa.
   * @param novo - 'inativo' ou 'ativo'.
   */
  // GRAVA: troca só o status; alocações, tarefas e trilhas continuam no histórico.
  const mudarStatus = (p: Pessoa, novo: 'ativo' | 'inativo') => {
    d.salvar('pessoas', { ...p, status: novo });
    avisar(novo === 'inativo' ? `${p.nome} foi inativada e não consegue mais entrar. O histórico continua preservado.` : `${p.nome} foi reativada.`);
    setAcao(null);
  };

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Acessos" descricao="Quem pode entrar no CAIS, com qual perfil e a qual empresa está vinculado." />

      <BarraFiltros>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-fraca" aria-hidden />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome ou e-mail" aria-label="Buscar por nome ou e-mail"
            className="h-10 w-full rounded-lg border border-borda bg-superficie pl-9 pr-3 text-sm text-tinta placeholder:text-tinta-fraca focus:border-primaria focus:outline-none focus:ring-4 focus:ring-primaria/20" />
        </div>
        <div className="w-44"><Select aria-label="Filtrar por perfil" value={perfil} onChange={(e) => setPerfil(e.target.value)} placeholder="Todos os perfis" opcoes={Object.entries(ROTULO_PERFIL).map(([valor, rotulo]) => ({ valor, rotulo }))} /></div>
        <div className="w-40"><Select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Todos os status" opcoes={Object.entries(STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))} /></div>
        <div className="w-48"><Select aria-label="Filtrar por empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Todas as empresas" opcoes={d.empresas.map((e) => ({ valor: e.id, rotulo: e.nomeFantasia }))} /></div>
        {temFiltro && <Button variante="fantasma" tamanho="sm" onClick={limpar}>Limpar filtros</Button>}
      </BarraFiltros>

      <Card>
        {!d.pronto ? <EsqueletoLista /> : filtradas.length === 0 ? (
          temFiltro
            ? <EstadoVazio icone={<Search className="h-6 w-6" />} titulo="Ninguém com esses filtros" descricao="Tente outro termo ou limpe os filtros para ver todas as pessoas." acao={<Button variante="secundario" onClick={limpar}>Limpar filtros</Button>} />
            : <EstadoVazio icone={<KeyRound className="h-6 w-6" />} titulo="Nenhuma conta cadastrada" descricao="Cadastre pessoas em Pessoas; elas aparecem aqui com o convite e o perfil." />
        ) : (
          <>
            <Tabela rotulo="Acessos das pessoas">
              <thead><tr><Th>Pessoa</Th><Th>E-mail (login)</Th><Th>Perfil</Th><Th>Empresa</Th><Th>Status</Th><Th>Último acesso</Th><Th><span className="sr-only">Ações</span></Th></tr></thead>
              <tbody>
                {visiveis.map((p) => {
                  const ehEu = p.id === sessao?.pessoaId;
                  // Último admin ativo: não pode ser rebaixado nem inativado.
                  const ultimoAdmin = p.perfil === 'admin' && p.status === 'ativo' && adminsAtivos <= 1;
                  const emp = p.perfil !== 'admin' && p.empresaId ? d.empresa(p.empresaId) : undefined;
                  const ult = ultimos[p.id];
                  // Alocações em andamento: avisadas ao inativar.
                  const alocadoEm = d.alocacoes.filter((a) => a.pessoaId === p.id && a.fim >= hojeISO()).length;
                  return (
                    <Tr key={p.id} className={cx(p.status === 'inativo' && 'opacity-60')}>
                      <Td><div className="flex items-center gap-3"><Avatar nome={p.nome} tamanho={34} /><span className="font-semibold">{p.nome}{ehEu && <span className="ml-1.5 text-[12px] font-normal text-tinta-suave">(você)</span>}</span></div></Td>
                      <Td className="text-tinta-suave">{p.email}</Td>
                      <Td><Etiqueta tom={p.perfil === 'admin' ? 'primaria' : 'neutro'}>{ROTULO_PERFIL[p.perfil]}</Etiqueta></Td>
                      <Td>{emp
                        // NAVEGA: abre a ficha da empresa.
                        ? <Link href={`/empresas?abrir=${emp.id}`} className="rounded font-semibold text-primaria underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">{emp.nomeFantasia}</Link>
                        : <span className="text-tinta-fraca">—</span>}</Td>
                      <Td><Etiqueta tom={TOM[p.status]} ponto>{STATUS[p.status]}</Etiqueta></Td>
                      <Td className="text-tinta-suave">{ult ? <span title={new Date(ult).toLocaleString('pt-BR')}>{tempoRelativo(ult)}</span> : 'Nunca entrou'}</Td>
                      <Td>
                        {/* flutuante: a caixa do menu não é cortada pela rolagem da tabela. */}
                        <Menu flutuante gatilho={(g) => (
                          <button onClick={g.alternar} aria-expanded={g['aria-expanded']} aria-haspopup="menu" aria-label={`Ações de ${p.nome}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-tinta-suave hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50">
                            <MoreHorizontal className="h-5 w-5" aria-hidden />
                          </button>
                        )}>
                          {(fechar) => (
                            <>
                              {/* [PV-9] O MENU DE AÇÕES de cada linha: Reenviar convite (convidado), Redefinir senha (ativo), Mudar perfil (não inativo, nem a própria pessoa, nem o último admin), Reativar (inativo) ou Inativar (qualquer não admin). */}
                              {p.status === 'convidado' && <ItemMenu icone={<Link2 />} onClick={() => { fechar(); reenviarConvite(p); }}>Reenviar convite</ItemMenu>}
                              {p.status === 'ativo' && <ItemMenu icone={<RefreshCcw />} onClick={() => { fechar(); setAcao({ tipo: 'senha', pessoa: p }); }}>Redefinir senha</ItemMenu>}
                              {/* Ninguém muda o próprio perfil nem rebaixa o último admin (travaria o sistema). */}
                              {p.status !== 'inativo' && !ehEu && !ultimoAdmin && <ItemMenu icone={<ShieldCheck />} onClick={() => { fechar(); setAcao({ tipo: 'perfil', pessoa: p }); }}>Mudar perfil</ItemMenu>}
                              {p.status === 'inativo'
                                ? <ItemMenu icone={<UserCheck />} onClick={() => { fechar(); mudarStatus(p, 'ativo'); }}>Reativar</ItemMenu>
                                : p.perfil !== 'admin' && <ItemMenu perigo icone={<UserX />} onClick={() => { fechar(); setAcao({ tipo: 'inativar', pessoa: p }); }}>Inativar{alocadoEm ? '…' : ''}</ItemMenu>}
                            </>
                          )}
                        </Menu>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Tabela>
            <div className="px-4 py-3"><Paginacao pagina={paginaAtual} total={filtradas.length} porPagina={POR_PAGINA} onChange={setPagina} rotuloItem="pessoas" /></div>
          </>
        )}
      </Card>

      <MatrizDePermissoes />

      {/* Confirmações. Inativar e redefinir senha pedem confirmação porque afetam o acesso da pessoa. */}
      {acao?.tipo === 'senha' && (
        <Modal aberto onFechar={() => setAcao(null)} tamanho="sm" titulo="Redefinir senha" descricao={acao.pessoa.nome}
          rodape={<><Button variante="secundario" onClick={() => setAcao(null)}>Cancelar</Button><Button onClick={() => confirmarSenha(acao.pessoa)}>Redefinir senha</Button></>}>
          <div className="space-y-3 text-sm text-tinta">
            <p>A senha atual deixa de funcionar e passa a valer a senha temporária <strong>{SENHA_DEMO}</strong>.</p>
            <Aviso tipo="info" titulo="Ambiente de demonstração">Nenhum e-mail é enviado. No sistema real a senha temporária é gerada e enviada pela API, e a pessoa é obrigada a trocá-la.</Aviso>
          </div>
        </Modal>
      )}
      {acao?.tipo === 'inativar' && (
        <Modal aberto onFechar={() => setAcao(null)} tamanho="sm" titulo="Inativar pessoa" descricao={acao.pessoa.nome}
          rodape={<><Button variante="secundario" onClick={() => setAcao(null)}>Cancelar</Button><Button variante="perigo" onClick={() => mudarStatus(acao.pessoa, 'inativo')}>Inativar</Button></>}>
          <div className="space-y-3 text-sm text-tinta">
            <p>{acao.pessoa.nome} não conseguirá mais entrar no CAIS; se estiver com o sistema aberto, a sessão é encerrada. Nada é excluído: alocações, tarefas e trilhas continuam no histórico, e dá para reativar quando quiser.</p>
            {d.alocacoes.some((a) => a.pessoaId === acao.pessoa.id && a.fim >= hojeISO()) && (
              <Aviso tipo="aviso">Esta pessoa ainda está alocada em projetos em andamento. Considere realocar o trabalho dela.</Aviso>
            )}
          </div>
        </Modal>
      )}
      {acao?.tipo === 'perfil' && <ModalMudarPerfil pessoa={acao.pessoa} onFechar={() => setAcao(null)} />}
    </div>
  );
}
