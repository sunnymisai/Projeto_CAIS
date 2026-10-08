/* ============================================================================
   ANEXOSDATAREFA.TSX
   O que é: a área "Anexos" do detalhe da tarefa: botão de escolher arquivo,
     arrastar e soltar, a lista com ícone por tipo, tamanho legível, quem enviou e
     quando, e remover com confirmação na própria linha (Esc cancela sem fechar o detalhe). SIMULADO: guarda só os metadados do arquivo.
   Onde é usado: components/projetos/DetalheTarefa.tsx.
   Depende de: lib/anexos.ts (validarArquivo, criarAnexo, tamanhoLegivel, categoriaDoAnexo, ROTULO_CATEGORIA_UNICA),
     lib/store (useDados), lib/auth (useAuth), lib/toast (useToast), lib/utils (novoId,
     tempoRelativo, cx), components/button e components/ui/basicos (Aviso).
   Contexto: §5 (anexos da tarefa), §13 (teclado) e §7 (upload é do back-end).
   ============================================================================ */
"use client";

import { DragEvent, useRef, useState } from 'react';
import { File as IconeArquivo, FileImage, FileSpreadsheet, FileText, FileArchive, Paperclip, Trash2, Upload } from 'lucide-react';
import { useDados, Tarefa } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { categoriaDoAnexo, criarAnexo, tamanhoLegivel, validarArquivo, ROTULO_CATEGORIA_UNICA, type CategoriaAnexo } from '@/lib/anexos';
import { cx, novoId, tempoRelativo } from '@/lib/utils';
import Button from '@/components/button';
import { Aviso } from '@/components/ui/basicos';
import type { Anexo } from '@/lib/tipos';

/** Ícone de cada categoria de arquivo (a forma ajuda quem não distingue cores). */
export const ICONE_CATEGORIA: Record<CategoriaAnexo, typeof IconeArquivo> = {
  imagem: FileImage, pdf: FileText, planilha: FileSpreadsheet, documento: FileText, compactado: FileArchive, outro: IconeArquivo,
};

/**
 * Área de anexos de uma tarefa.
 * Quem pode anexar (admin; profissional na própria tarefa) vê o botão e a área de soltar;
 * quem só pode ver (Empresa) vê a lista.
 * @param props.tarefa - a tarefa.
 * @param props.podeAnexar - resultado de podeFazer(perfil, 'anexar_arquivo', ...).
 * @returns a seção de anexos.
 */
export default function AnexosDaTarefa({ tarefa, podeAnexar }: { tarefa: Tarefa; podeAnexar: boolean }) {
  const d = useDados();
  const { sessao } = useAuth();
  const avisar = useToast();
  const campo = useRef<HTMLInputElement>(null);
  // Erro de validação (arquivo grande ou vazio), mostrado em vermelho acima da lista.
  const [erro, setErro] = useState('');
  // true enquanto um arquivo está sobre a área (destaque do soltar).
  const [sobre, setSobre] = useState(false);
  // Id do anexo cuja remoção está esperando confirmação (null = nenhum). A confirmação aparece na própria
  // linha, e não num segundo modal: um modal dentro do detalhe faria o Esc fechar os dois de uma vez.
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const anexos = tarefa.anexos ?? [];

  /**
   * Valida e anexa os arquivos escolhidos (pelo botão ou soltos na área).
   * SIMULADO: guarda só os metadados; o conteúdo do arquivo é descartado.
   * GRAVA: a lista de anexos da tarefa na store.
   * @param arquivos - os arquivos do navegador.
   */
  const anexar = (arquivos: FileList | File[]) => {
    if (!podeAnexar || !sessao) return;
    const lista = [...arquivos];
    // Valida um a um: os bons entram, o primeiro ruim vira a mensagem de erro.
    const novos: Anexo[] = [];
    let primeiroErro = '';
    for (const a of lista) {
      const e = validarArquivo(a);
      if (e) { primeiroErro ||= e; continue; }
      novos.push(criarAnexo(a, sessao.pessoaId, novoId('anx')));
    }
    setErro(primeiroErro);
    if (novos.length) {
      // GRAVA: acrescenta os metadados dos arquivos novos à lista de anexos da tarefa.
      d.salvar('tarefas', { ...tarefa, anexos: [...anexos, ...novos] });
      avisar(novos.length === 1 ? `Arquivo "${novos[0].nome}" anexado.` : `${novos.length} arquivos anexados.`);
    }
    // Limpa o campo: escolher o mesmo arquivo de novo precisa disparar o evento outra vez.
    if (campo.current) campo.current.value = '';
  };

  /** Soltou arquivos na área: anexa. preventDefault impede o navegador de abrir o arquivo. */
  const aoSoltar = (e: DragEvent) => { e.preventDefault(); setSobre(false); anexar(e.dataTransfer.files); };

  /**
   * Remove o anexo confirmado.
   * APAGA: tira o anexo da tarefa (só o metadado; não há arquivo guardado).
   * @param a - o anexo.
   */
  const remover = (a: Anexo) => {
    d.salvar('tarefas', { ...tarefa, anexos: anexos.filter((x) => x.id !== a.id) });
    avisar(`Anexo "${a.nome}" removido.`);
    setRemovendoId(null);
  };
  /**
   * Cancela a confirmação e devolve o foco à lixeira do mesmo anexo (o teclado não perde o lugar).
   * @param id - id do anexo.
   */
  const cancelar = (id: string) => {
    setRemovendoId(null);
    setTimeout(() => document.querySelector<HTMLElement>(`[data-remover-anexo="${id}"]`)?.focus(), 0);
  };

  return (
    <section aria-labelledby="anexos-titulo">
      <h3 id="anexos-titulo" className="mb-2 flex items-center gap-2 font-space text-[15px] font-semibold text-tinta"><Paperclip className="h-4 w-4" aria-hidden />Anexos · {anexos.length}</h3>

      {podeAnexar && (
        // Área de soltar. O input de arquivo é nativo (escondido): o botão "Escolher arquivo" o aciona,
        // então anexar funciona só com teclado (Tab até o botão, Enter) e também arrastando.
        <div onDragOver={(e) => { e.preventDefault(); setSobre(true); }} onDragLeave={() => setSobre(false)} onDrop={aoSoltar}
          className={cx('mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors', sobre ? 'border-primaria bg-primaria-suave' : 'border-borda bg-fundo/40')}>
          <Upload className="h-5 w-5 shrink-0 text-tinta-fraca" aria-hidden />
          <p className="min-w-0 flex-1 text-[13px] text-tinta-suave">Arraste arquivos até aqui ou escolha no computador. Até 10 MB cada.</p>
          <input ref={campo} type="file" multiple className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => e.target.files && anexar(e.target.files)} />
          <Button variante="secundario" tamanho="sm" onClick={() => campo.current?.click()}>Escolher arquivo</Button>
        </div>
      )}
      {/* SIMULADO: só os dados do arquivo (nome, tipo, tamanho, quem enviou e quando) são guardados. */}
      {podeAnexar && <p className="mb-3 text-[12px] text-tinta-fraca">Protótipo: o arquivo em si não é guardado, só os dados dele.</p>}
      {erro && <div className="mb-3"><Aviso tipo="erro" titulo="Não foi possível anexar">{erro}</Aviso></div>}

      {anexos.length === 0 ? (
        <p className="text-[13px] text-tinta-suave">{podeAnexar ? 'Nenhum anexo ainda.' : 'Esta tarefa não tem anexos.'}</p>
      ) : (
        <ul className="divide-y divide-borda rounded-xl border border-borda">
          {anexos.map((a) => {
            const categoria = categoriaDoAnexo(a.nome, a.tipo);
            const Icone = ICONE_CATEGORIA[categoria];
            const autor = d.pessoa(a.autorId);
            return (
              <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                <Icone className="h-5 w-5 shrink-0 text-tinta-suave" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-tinta">{a.nome}</span>
                  <span className="block truncate text-[12px] text-tinta-suave">{ROTULO_CATEGORIA_UNICA[categoria]} · {tamanhoLegivel(a.tamanho)} · {autor?.nome ?? 'Alguém'} · {tempoRelativo(a.data)}</span>
                </span>
                {podeAnexar && (removendoId === a.id ? (
                  // Confirmação na linha: o foco vai para "Cancelar" (o gesto seguro); Esc cancela e NÃO fecha o detalhe
                  // (stopPropagation impede o Modal de ouvir o mesmo Esc).
                  <span role="group" aria-label={`Confirmar a remoção de ${a.nome}`} className="flex shrink-0 items-center gap-1.5"
                    onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); cancelar(a.id); } }}>
                    <span className="hidden text-[12px] text-tinta-suave sm:inline">Remover?</span>
                    <Button variante="secundario" tamanho="sm" autoFocus onClick={() => cancelar(a.id)}>Cancelar</Button>
                    {/* APAGA: remove o anexo (só o metadado). */}
                    <Button variante="perigo" tamanho="sm" onClick={() => remover(a)}>Remover anexo</Button>
                  </span>
                ) : (
                  <button type="button" data-remover-anexo={a.id} onClick={() => setRemovendoId(a.id)} aria-label={`Remover o anexo ${a.nome}`}
                    className="rounded-lg p-1.5 text-tinta-fraca hover:bg-erro/10 hover:text-erro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erro/40"><Trash2 className="h-4 w-4" aria-hidden /></button>
                ))}
              </li>
            );
          })}
        </ul>
      )}

    </section>
  );
}
