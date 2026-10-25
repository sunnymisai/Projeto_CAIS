/* ============================================================================
   EDITORTEMA.TSX — EDITOR DE TEMA (MODAL)
   O que é: modal para criar ou editar um tema personalizado: nome, cores por grupo (claro e escuro), prévia ao vivo isolada e avisos de contraste.
   Onde é usado: app/(sistema)/temas/page.tsx.
   Depende de: components/ui (Modal, form, basicos), components/button, components/input, components/temas (CampoCor, PreviaTema) e lib/temas (GRUPOS_COR, paletaDoTema, validarTema).
   Contexto: docs/temas-contrato.md (tela do administrador: duplicar e editar, prévia ao vivo, avisos, salvar e restaurar); §9 (design system) e §11 (erro ao sair do campo).
   ============================================================================ */
"use client";

import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/button';
import Input from '@/components/input';
import { Segmentado, SecaoForm } from '@/components/ui/form';
import { Aviso } from '@/components/ui/basicos';
import CampoCor from '@/components/temas/CampoCor';
import PreviaTema from '@/components/temas/PreviaTema';
import CampoLogo from '@/components/temas/CampoLogo';
import { GRUPOS_COR, paletaDoTema, validarTema, type IdentidadeTema, type Tema } from '@/lib/temas';

// [PV-1] O LIMITE do nome do tema (em caracteres). Mude aqui para permitir nomes maiores ou menores.
/** Tamanho máximo do nome do tema. */
const NOME_MAX = 40;

// [PV-2] O LIMITE do nome da empresa (em caracteres), igual ao que lib/temas.ts aceita ao ler do navegador.
/** Tamanho máximo do nome da empresa na identidade. */
const NOME_EMPRESA_MAX = 40;

/** Os dois modos que o botão claro/escuro alterna; o editor edita os dois. */
const MODOS = [{ valor: 'claro', rotulo: 'Modo claro' }, { valor: 'escuro', rotulo: 'Modo escuro' }] as const;

/**
 * Editor de tema em modal.
 * O rascunho vive só aqui dentro: nada muda no sistema até o botão "Salvar tema" chamar `onSalvar`.
 * `key` na chamada (id do tema) recria o editor do zero ao trocar de tema.
 * @param tema tema a editar (para um tema novo, passe a cópia feita por `duplicarTema`).
 * @param novo true quando o tema ainda não foi salvo (muda o título e o texto do botão).
 * @param onFechar chamada ao cancelar ou fechar (Esc, ×, clique fora).
 * @param onSalvar chamada com o tema final (nome já sem espaços nas pontas).
 * @returns o modal do editor.
 * @example <EditorTema key={t.id} tema={t} novo={false} onFechar={fechar} onSalvar={(x) => d.salvarTema(x)} />
 */
export default function EditorTema({ tema, novo, onFechar, onSalvar }: {
  tema: Tema; novo: boolean; onFechar: () => void; onSalvar: (tema: Tema) => void;
}) {
  // Rascunho editável: cópia do tema recebido. O original só muda quando a pessoa salva.
  const [rascunho, setRascunho] = useState<Tema>(tema);
  // Qual das duas paletas está à mostra nos campos e na prévia.
  const [modo, setModo] = useState<'claro' | 'escuro'>('claro');
  // O erro do nome só aparece depois de sair do campo ou de tentar salvar (§11).
  const [nomeTocado, setNomeTocado] = useState(false);

  const nomeVazio = rascunho.nome.trim() === '';
  const paleta = paletaDoTema(rascunho, modo);

  // Avisos de contraste e de hex inválido. Recalcula só quando o rascunho muda.
  const avisos = useMemo(() => validarTema(rascunho), [rascunho]);
  // Avisos do modo à mostra por chave (vão como dica no campo certo) e total do outro modo.
  const avisoDaChave = useMemo(() => {
    const mapa: Record<string, string> = {};
    for (const a of avisos) if (a.modo === modo && !mapa[a.chave]) mapa[a.chave] = a.mensagem;
    return mapa;
  }, [avisos, modo]);
  const noOutroModo = avisos.filter((a) => a.modo !== modo).length;

  /**
   * Troca o valor de UMA cor no modo à mostra.
   * @param chave variável CSS, ex.: '--fundo'.
   * @param valor novo hex.
   */
  function mudarCor(chave: string, valor: string) {
    setRascunho((r) => ({ ...r, [modo]: { ...r[modo], [chave]: valor } }));
  }

  /**
   * Troca UM campo da identidade da empresa (nome ou um dos logos). Valor vazio remove o campo.
   * @param campo qual campo da identidade muda.
   * @param valor novo valor, ou `undefined`/'' para limpar.
   */
  function mudarIdentidade(campo: keyof IdentidadeTema, valor: string | undefined) {
    setRascunho((r) => ({ ...r, identidade: { ...r.identidade, [campo]: valor || undefined } }));
  }

  /**
   * Salva o rascunho. Sem nome, mostra o erro em vez de salvar.
   * Os avisos de contraste NÃO bloqueiam (contrato): a pessoa decide.
   * A identidade só vai junto se tiver algo preenchido (tema sem marca própria fica sem o campo e mostra o CAIS).
   */
  function salvar() {
    if (nomeVazio) { setNomeTocado(true); return; }
    const { identidade, ...resto } = rascunho;
    const temMarca = !!(identidade?.nomeEmpresa?.trim() || identidade?.logoClaro || identidade?.logoEscuro);
    onSalvar({ ...resto, nome: rascunho.nome.trim(), ...(temMarca ? { identidade: { ...identidade, nomeEmpresa: identidade?.nomeEmpresa?.trim() || undefined } } : {}) });
  }

  return (
    <Modal aberto onFechar={onFechar} tamanho="xl"
      titulo={novo ? 'Novo tema' : `Editar tema: ${tema.nome}`}
      descricao="A prévia ao lado mostra o resultado. O sistema só muda quando você salva."
      rodape={<>
        {/* Descartar volta o rascunho ao que abriu (o tema original ou a cópia recém-feita). */}
        <Button variante="fantasma" onClick={() => { setRascunho(tema); setNomeTocado(false); }}>Descartar alterações</Button>
        <Button variante="secundario" onClick={onFechar}>Cancelar</Button>
        <Button onClick={salvar}>{novo ? 'Criar tema' : 'Salvar tema'}</Button>
      </>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Input compacto label="Nome do tema" required maxLength={NOME_MAX} value={rascunho.nome}
            onChange={(e) => setRascunho((r) => ({ ...r, nome: e.target.value }))} onBlur={() => setNomeTocado(true)}
            error={nomeTocado && nomeVazio ? 'Dê um nome ao tema para reconhecê-lo na lista.' : undefined} />

          <Segmentado rotulo="Modo que está sendo editado" opcoes={[...MODOS]} valor={modo} onChange={setModo} />

          {/* Avisos de contraste: texto + ícone (Aviso), nunca só cor. Não bloqueiam o salvar. */}
          {avisos.length > 0 && (
            <Aviso tipo="aviso" titulo={`${avisos.length} ${avisos.length === 1 ? 'ponto de atenção' : 'pontos de atenção'} neste tema`}>
              Você pode salvar mesmo assim, mas texto com pouco contraste é difícil de ler.
              {noOutroModo > 0 && <> {noOutroModo} {noOutroModo === 1 ? 'aviso está' : 'avisos estão'} no {modo === 'claro' ? 'modo escuro' : 'modo claro'}.</>}
              <ul className="mt-2 list-disc space-y-0.5 pl-5">
                {avisos.slice(0, 6).map((a, i) => <li key={i}>{a.modo === 'claro' ? 'Claro' : 'Escuro'}: {a.mensagem}</li>)}
                {avisos.length > 6 && <li>E mais {avisos.length - 6}.</li>}
              </ul>
            </Aviso>
          )}

          {/* [PV-3] A IDENTIDADE DA EMPRESA no tema (nome e logos). Aparece no topo da lateral, no painel de marca do login e no topo da home; o selo "Plataforma CAIS" continua fixo e nenhum tema o troca. O limite do nome está em NOME_EMPRESA_MAX e o dos arquivos em lib/temas.ts (LOGO_MAX_BYTES, LOGO_TIPOS). */}
          <SecaoForm titulo="Identidade da empresa">
            <p className="text-[13px] text-tinta-suave">
              Opcional. O logo e o nome entram no lugar do logo do CAIS nos cabeçalhos. O selo “Plataforma CAIS” continua sempre visível.
            </p>
            <Input compacto label="Nome da empresa (ao lado do logo)" maxLength={NOME_EMPRESA_MAX} value={rascunho.identidade?.nomeEmpresa ?? ''}
              onChange={(e) => mudarIdentidade('nomeEmpresa', e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoLogo rotulo="Logo para fundo claro" fundo="claro" valor={rascunho.identidade?.logoClaro} onChange={(v) => mudarIdentidade('logoClaro', v)} />
              <CampoLogo rotulo="Logo para fundo escuro" fundo="escuro" valor={rascunho.identidade?.logoEscuro} onChange={(v) => mudarIdentidade('logoEscuro', v)} orientacaoCompleta={false} />
            </div>
          </SecaoForm>

          {/* [PV-4] OS CAMPOS DE COR vêm de GRUPOS_COR (lib/temas.ts): para ganhar ou perder um campo, mude lá; esta tela só desenha a lista. */}
          {GRUPOS_COR.map((g) => (
            <SecaoForm key={g.grupo} titulo={g.grupo}>
              <div className="grid gap-4 sm:grid-cols-2">
                {g.chaves.map((c) => (
                  <CampoCor key={`${modo}-${c.chave}`} rotulo={c.rotulo} valor={paleta[c.chave] ?? ''}
                    onChange={(v) => mudarCor(c.chave, v)} aviso={avisoDaChave[c.chave]} />
                ))}
              </div>
            </SecaoForm>
          ))}
        </div>

        {/* lg:sticky: a prévia acompanha a rolagem dos campos no desktop. No celular fica depois dos campos. */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-tinta-suave">Prévia ao vivo ({modo === 'claro' ? 'claro' : 'escuro'})</p>
          <PreviaTema paleta={paleta} nome={rascunho.nome || 'sem nome'} modo={modo} identidade={rascunho.identidade} />
          <p className="mt-2 text-[12px] text-tinta-suave">Só esta amostra usa as cores em edição. O resto do sistema continua como está.</p>
        </div>
      </div>
    </Modal>
  );
}
