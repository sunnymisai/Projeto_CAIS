/* ============================================================================
   APP/(SISTEMA)/TEMAS/PAGE.TSX
   O que é: tela do Administrador para escolher o tema padrão do sistema, criar e editar temas personalizados e atribuir um tema a cada empresa.
   Onde é usado: rota /temas (protegida; só o perfil Administrador, ver lib/permissoes.ts). Linkada pelo menu lateral (components/shell/navegacao.ts).
   Depende de: useDados (lib/store.tsx: temas e ações), useTemaAtivo (lib/temaAtivo.tsx: lista completa e modo atual), useToast (lib/toast.tsx), lib/temas (duplicarTema, Tema), components/temas/* e components/ui/*.
   Contexto: docs/temas-contrato.md (tela do administrador); docs/contexto-cais.md §3 (perfis), §9 (design system) e §13 (quatro estados).
   ============================================================================ */
// "use client": a tela usa estado, eventos e a store, que só funcionam no navegador (docs/notas-next16.md §1).
"use client";

import { useState } from 'react';
import { Plus, Palette } from 'lucide-react';
import { useDados } from '@/lib/store';
import { useTemaAtivo } from '@/lib/temaAtivo';
import { useToast } from '@/lib/toast';
import { duplicarTema, type Tema } from '@/lib/temas';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import Button from '@/components/button';
import Modal from '@/components/ui/Modal';
import { Card, Aviso, Esqueleto, EstadoVazio, EstadoErro } from '@/components/ui/basicos';
import CartaoTema from '@/components/temas/CartaoTema';
import EditorTema from '@/components/temas/EditorTema';
import TemaPorEmpresa from '@/components/temas/TemaPorEmpresa';

/**
 * Gera o id do próximo tema personalizado: "custom-<n>", com n maior que todos os já usados.
 * Usa o maior número existente (e não a quantidade) para nunca repetir um id depois de apagar um tema.
 * @param temas todos os temas atuais.
 * @returns um id livre.
 * @example proximoIdPersonalizado([{ id: 'custom-2' }] as Tema[]) // 'custom-3'
 */
function proximoIdPersonalizado(temas: Tema[]): string {
  let maior = 0;
  for (const t of temas) {
    const m = /^custom-(\d+)$/.exec(t.id);
    if (m) maior = Math.max(maior, Number(m[1]));
  }
  return `custom-${maior + 1}`;
}

/**
 * Página da rota /temas.
 * Quatro estados: carregando (esqueletos), vazio (nenhum tema próprio ainda), com erro (a store não leu os dados) e com dado.
 * @returns o conteúdo da página.
 */
export default function PaginaTemas() {
  const d = useDados();
  const { modo, temas } = useTemaAtivo();
  const avisar = useToast();
  // Editor aberto: o tema em edição e se ele ainda é novo (cópia não salva). null = fechado.
  const [editando, setEditando] = useState<{ tema: Tema; novo: boolean } | null>(null);
  // Tema aguardando a confirmação de "Apagar". null = nenhum.
  const [apagando, setApagando] = useState<Tema | null>(null);

  // Erro de leitura dos dados: o layout já cobre a maior parte, mas a tela também explica e oferece tentar de novo (§13).
  if (d.erro) {
    return (
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <CabecalhoPagina titulo="Temas" />
        <Card><EstadoErro titulo="Não foi possível carregar os temas" descricao={d.erro} acoes={<Button onClick={d.tentarDeNovo}>Tentar de novo</Button>} /></Card>
      </div>
    );
  }

  const { padraoId, porEmpresa, personalizados } = d.temas;
  const base = temas.filter((t) => t.base);
  const padrao = temas.find((t) => t.id === padraoId) ?? temas[0];

  /**
   * Conta quantas empresas têm o tema atribuído.
   * @param id id do tema.
   * @returns quantidade de empresas.
   */
  const empresasUsando = (id: string) => Object.values(porEmpresa).filter((x) => x === id).length;

  /**
   * Abre o editor com uma CÓPIA do tema (base ou personalizado). Nada é salvo até "Criar tema".
   * @param origem tema que serve de ponto de partida.
   */
  function duplicar(origem: Tema) {
    setEditando({ tema: duplicarTema(origem, proximoIdPersonalizado(temas), `${origem.nome} (cópia)`), novo: true });
  }

  /**
   * Salva o tema do editor e fecha.
   * GRAVA: tema na store (temas.personalizados).
   * @param tema tema final vindo do editor.
   */
  function salvar(tema: Tema) {
    d.salvarTema(tema);
    avisar(`Tema "${tema.nome}" salvo.`);
    setEditando(null);
  }

  /**
   * Define o tema padrão do sistema inteiro.
   * GRAVA: temas.padraoId na store. Quem não tem tema de empresa passa a usá-lo.
   * @param tema tema escolhido.
   */
  function usarComoPadrao(tema: Tema) {
    d.definirTemaPadrao(tema.id);
    avisar(`"${tema.nome}" agora é o tema padrão.`);
  }

  /**
   * Apaga o tema confirmado.
   * APAGA: o tema personalizado; a store devolve ao padrão as empresas (e o padrão do sistema) que o usavam.
   */
  function confirmarApagar() {
    if (!apagando) return;
    d.removerTema(apagando.id);
    avisar(`Tema "${apagando.nome}" apagado.`);
    setApagando(null);
  }

  /**
   * Atribui (ou remove) o tema de uma empresa.
   * GRAVA: temas.porEmpresa na store.
   * @param empresaId empresa alterada.
   * @param temaId tema escolhido, ou null para voltar ao padrão do sistema.
   */
  function alterarEmpresa(empresaId: string, temaId: string | null) {
    d.definirTemaEmpresa(empresaId, temaId);
    const nome = d.empresas.find((e) => e.id === empresaId)?.nomeFantasia ?? 'Empresa';
    avisar(temaId ? `${nome} agora usa o tema "${temas.find((t) => t.id === temaId)?.nome ?? ''}".` : `${nome} voltou ao tema padrão.`);
  }

  // Quantas empresas serão afetadas se o tema em confirmação for apagado (aparece no aviso do modal).
  const afetadas = apagando ? empresasUsando(apagando.id) : 0;
  const apagandoOPadrao = apagando?.id === padraoId;

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Temas" descricao="As cores do sistema inteiro. Escolha o tema padrão, crie os seus e dê a cada empresa o visual dela."
        // Ação principal: começa de uma cópia do tema padrão atual.
        acao={<Button onClick={() => padrao && duplicar(padrao)} disabled={!d.pronto}><Plus className="h-4 w-4" aria-hidden />Novo tema</Button>} />

      <div className="mb-8">
        <Aviso tipo="info" titulo="O botão claro/escuro continua valendo">
          Cada tema tem duas paletas, uma clara e uma escura. A pessoa escolhe o modo no botão do topo e o tema define as cores de cada um.
        </Aviso>
      </div>

      {/* Carregando: esqueletos no formato da grade, nunca tela em branco (§13). */}
      {!d.pronto ? (
        <div role="status" aria-label="Carregando temas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <Esqueleto key={i} className="h-64 rounded-2xl" />)}
          <span className="sr-only">Carregando…</span>
        </div>
      ) : (
        <div className="space-y-10">
          <section aria-labelledby="temas-base">
            <h2 id="temas-base" className="font-space text-xl font-semibold text-tinta">Temas-base</h2>
            <p className="mb-4 mt-1 text-sm text-tinta-suave">Vêm com o sistema e não podem ser editados nem apagados. Duplique um para personalizar.</p>
            {/* [PV-1] A GRADE de cartões: 1 coluna no celular, 2 no tablet e 3 no desktop. Mude as classes grid-cols para mudar quantos cartões cabem por linha (vale para temas-base e personalizados). */}
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {base.map((t) => (
                <CartaoTema key={t.id} tema={t} modo={modo} padrao={t.id === padraoId} empresasUsando={empresasUsando(t.id)}
                  onUsarComoPadrao={() => usarComoPadrao(t)} onDuplicar={() => duplicar(t)} />
              ))}
            </ul>
          </section>

          <section aria-labelledby="temas-proprios">
            <h2 id="temas-proprios" className="font-space text-xl font-semibold text-tinta">Seus temas</h2>
            <p className="mb-4 mt-1 text-sm text-tinta-suave">Temas criados por você. Edite as cores, escolha como padrão ou atribua a uma empresa.</p>
            {personalizados.length === 0 ? (
              // Vazio: explica e oferece a próxima ação (§13).
              <Card>
                <EstadoVazio icone={<Palette className="h-6 w-6" />} titulo="Você ainda não criou nenhum tema"
                  descricao="Comece de uma cópia do tema padrão e ajuste as cores. Você vê o resultado antes de salvar."
                  acao={<Button onClick={() => padrao && duplicar(padrao)}><Plus className="h-4 w-4" aria-hidden />Criar o primeiro tema</Button>} />
              </Card>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {personalizados.map((t) => (
                  <CartaoTema key={t.id} tema={t} modo={modo} padrao={t.id === padraoId} empresasUsando={empresasUsando(t.id)}
                    onUsarComoPadrao={() => usarComoPadrao(t)} onDuplicar={() => duplicar(t)}
                    onEditar={() => setEditando({ tema: t, novo: false })} onApagar={() => setApagando(t)} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="temas-empresa">
            <h2 id="temas-empresa" className="sr-only">Tema por empresa</h2>
            <TemaPorEmpresa empresas={d.empresas} temas={temas} porEmpresa={porEmpresa} padraoNome={padrao?.nome ?? ''} onAlterar={alterarEmpresa} />
          </section>
        </div>
      )}

      {/* key = id do tema: ao abrir outro tema o editor nasce limpo, sem reaproveitar o rascunho anterior. */}
      {editando && <EditorTema key={editando.tema.id} tema={editando.tema} novo={editando.novo} onFechar={() => setEditando(null)} onSalvar={salvar} />}

      {/* Confirmação antes de apagar: explica o que acontece com quem usa o tema. */}
      <Modal aberto={apagando !== null} onFechar={() => setApagando(null)} tamanho="sm" titulo="Apagar tema?"
        descricao={apagando ? `"${apagando.nome}" será removido para sempre.` : undefined}
        rodape={<><Button variante="secundario" onClick={() => setApagando(null)}>Cancelar</Button><Button variante="perigo" onClick={confirmarApagar}>Apagar tema</Button></>}>
        <div className="space-y-3 text-sm text-tinta-suave">
          <p>Essa ação não pode ser desfeita.</p>
          {apagandoOPadrao && <Aviso tipo="aviso">Este é o tema padrão. Ao apagar, o padrão volta a ser o tema CAIS.</Aviso>}
          {afetadas > 0 && <Aviso tipo="aviso">{afetadas} {afetadas === 1 ? 'empresa usa' : 'empresas usam'} este tema e {afetadas === 1 ? 'voltará' : 'voltarão'} ao padrão do sistema.</Aviso>}
        </div>
      </Modal>
    </div>
  );
}
