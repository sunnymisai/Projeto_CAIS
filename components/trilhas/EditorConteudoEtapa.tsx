/* ============================================================================
   EDITORCONTEUDOETAPA.TSX
   O que é: o painel que abre embaixo de uma etapa no editor de trilha: texto e
     endereço do conteúdo e, se a etapa for quiz, o editor de perguntas
     (adicionar, remover, reordenar, alternativas e marcação da correta).
   Onde é usado: app/(sistema)/trilhas/[id]/page.tsx (aba Etapas, botão "Conteúdo").
   Depende de: components/input.tsx, components/ui/form.tsx (AreaTexto),
     components/button.tsx, components/ui/basicos.tsx (Etiqueta), lib/utils
     (novoId, cx), lib/tipos.ts (Etapa, Pergunta) e lucide-react.
   Contexto: §4 (etapa contém conteúdo e, opcionalmente, quiz; nota mínima e tentativas).
   ============================================================================ */
"use client";

import { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, X, ListChecks } from 'lucide-react';
import Input from '@/components/input';
import Button from '@/components/button';
import { AreaTexto } from '@/components/ui/form';
import { Etiqueta } from '@/components/ui/basicos';
import { cx, novoId } from '@/lib/utils';
import type { Etapa, Pergunta } from '@/lib/tipos';

// [PV-1] A REGRA DO ENDEREÇO do conteúdo da etapa: precisa começar com http:// ou https:// e ter um ponto no domínio.
/** Endereço aceito no conteúdo: começa com http:// ou https:// e tem um ponto no domínio. */
const URL_REGEX = /^https?:\/\/[^\s/]+\.[^\s]+$/;

/** Letras das alternativas (A, B, C...), só para mostrar; o dado guarda o índice. */
const LETRAS = 'ABCDEFGH';
// [PV-2] O MÁXIMO DE ALTERNATIVAS por pergunta: 6 (o deck não fixa; cabe na tela do celular). As letras A a H são só para mostrar.
/** Máximo de alternativas por pergunta (o deck não fixa; 6 cabe na tela do celular). */
const MAX_ALTERNATIVAS = 6;

// [PV-3] A PERGUNTA NOVA do quiz: nasce com duas alternativas em branco e nenhuma marcada como correta.
/**
 * Pergunta nova, já com duas alternativas em branco e nenhuma correta (-1).
 * @returns a pergunta.
 */
const perguntaNova = (): Pergunta => ({ id: novoId('q'), enunciado: '', alternativas: ['', ''], correta: -1 });

/**
 * Painel de conteúdo de uma etapa.
 * Não guarda nada sozinho: cada mudança sobe por `onChange` e quem chama salva a trilha
 * (o editor salva na hora, sem botão "Salvar").
 * @param props.etapa a etapa sendo editada.
 * @param props.numero posição da etapa (1 = primeira), usada nos rótulos.
 * @param props.onChange recebe só os campos que mudaram.
 * @param props.id id do painel (o botão que abre usa em aria-controls).
 * @returns o painel.
 * @example <EditorConteudoEtapa id="conteudo-et_1" etapa={e} numero={1} onChange={(p) => setEtapa(0, p)} />
 */
export default function EditorConteudoEtapa({ etapa, numero, onChange, id }: {
  etapa: Etapa; numero: number; onChange: (parcial: Partial<Etapa>) => void; id: string;
}) {
  // Mostra o erro do endereço só depois que a pessoa sai do campo (§11).
  const [urlTocada, setUrlTocada] = useState(false);
  // Dados antigos podem não ter conteúdo nem perguntas: o padrão é vazio.
  const conteudo = etapa.conteudo ?? {};
  const perguntas = etapa.perguntas ?? [];
  const url = conteudo.url ?? '';
  const erroUrl = urlTocada && url.trim() && !URL_REGEX.test(url.trim()) ? 'Use um endereço completo, começando com https://' : undefined;

  /**
   * Troca a lista de perguntas inteira (sempre uma lista nova; o React só redesenha se a referência mudar).
   * GRAVA: via onChange, a trilha na store.
   */
  const setPerguntas = (nova: Pergunta[]) => onChange({ perguntas: nova });
  /** Altera campos de UMA pergunta (a de índice i). */
  const setPergunta = (i: number, parcial: Partial<Pergunta>) =>
    setPerguntas(perguntas.map((p, j) => (j === i ? { ...p, ...parcial } : p)));
  /** Troca a pergunta i com a vizinha de cima (-1) ou de baixo (+1); os botões das pontas ficam desabilitados. */
  const moverPergunta = (i: number, dir: -1 | 1) => {
    const lista = [...perguntas];
    [lista[i], lista[i + dir]] = [lista[i + dir], lista[i]];
    setPerguntas(lista);
  };
  // [PV-4] APAGAR UMA ALTERNATIVA: o índice da correta é ajustado (some se era a removida; sobe uma posição se estava depois dela), senão a resposta certa muda sem ninguém ver.
  /**
   * Remove a alternativa `a` da pergunta `i` e corrige o índice da correta:
   * se a removida era a correta, fica sem correta (-1); se estava antes dela, a correta sobe uma posição.
   * ⚠️ ATENÇÃO: sem esse ajuste, apagar a alternativa A faria a B (que vira índice 0) ficar marcada errada.
   */
  const removerAlternativa = (i: number, a: number) => {
    const p = perguntas[i];
    const correta = p.correta === a ? -1 : p.correta > a ? p.correta - 1 : p.correta;
    setPergunta(i, { alternativas: p.alternativas.filter((_, k) => k !== a), correta });
  };

  return (
    <div id={id} className="mt-3 w-full space-y-4 rounded-xl border border-borda bg-superficie p-4">
      {/* Conteúdo: texto e endereço valem para todos os tipos (no quiz, o texto é a instrução). */}
      <AreaTexto label={etapa.tipo === 'quiz' ? 'Instrução do quiz' : 'Texto da etapa'} rows={3}
        placeholder={etapa.tipo === 'quiz' ? 'Ex.: Quatro perguntas; você precisa de 70% para seguir.' : 'O que a pessoa precisa ler ou saber nesta etapa.'}
        value={conteudo.texto ?? ''} onChange={(ev) => onChange({ conteudo: { ...conteudo, texto: ev.target.value } })} />
      {/* No quiz o endereço é opcional e raro; nos outros tipos é onde está o vídeo, PDF, áudio... */}
      {etapa.tipo !== 'quiz' && (
        <Input compacto type="url" inputMode="url" label="Endereço do conteúdo" placeholder="https://"
          hint="Vídeo, PDF, áudio, apresentação ou link externo. No protótipo, o arquivo não é enviado: só o endereço."
          value={url} error={erroUrl}
          onChange={(ev) => onChange({ conteudo: { ...conteudo, url: ev.target.value.trim() } })}
          onBlur={() => setUrlTocada(true)} />
      )}

      {/* Editor do quiz (§4: quiz com nota mínima e tentativas; a nota e as tentativas ficam na linha da etapa). */}
      {etapa.tipo === 'quiz' && (
        <section aria-label={`Perguntas do quiz da etapa ${numero}`} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-tinta">Perguntas <span className="font-normal text-tinta-suave">({perguntas.length})</span></p>
          </div>

          {/* Estado vazio do quiz: explica e oferece a ação. */}
          {perguntas.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-borda px-4 py-6 text-center">
              <ListChecks className="mb-2 h-5 w-5 text-tinta-fraca" aria-hidden />
              <p className="text-sm text-tinta-suave">Este quiz ainda não tem perguntas. Ele precisa de pelo menos uma, com a resposta correta marcada, para a trilha ser publicada.</p>
            </div>
          )}

          <ol className="space-y-3">
            {perguntas.map((p, i) => (
              <li key={p.id} className="rounded-xl border border-borda bg-fundo/50 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primaria-suave text-[12px] font-bold text-primaria" aria-hidden>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Input compacto label={`Pergunta ${i + 1}`} placeholder="Escreva o enunciado" value={p.enunciado}
                      onChange={(ev) => setPergunta(i, { enunciado: ev.target.value })} />
                  </div>
                  {/* Subir/descer (desabilitados nas pontas) e remover. APAGA: remover tira a pergunta na hora. */}
                  <div className="mt-7 flex shrink-0 items-center gap-0.5">
                    <button type="button" onClick={() => moverPergunta(i, -1)} disabled={i === 0} aria-label={`Subir a pergunta ${i + 1}`} className="rounded-lg p-1.5 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/40 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => moverPergunta(i, 1)} disabled={i === perguntas.length - 1} aria-label={`Descer a pergunta ${i + 1}`} className="rounded-lg p-1.5 text-tinta-fraca hover:bg-superficie-alt hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/40 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setPerguntas(perguntas.filter((_, j) => j !== i))} aria-label={`Remover a pergunta ${i + 1}`} className="rounded-lg p-1.5 text-tinta-fraca hover:bg-erro/10 hover:text-erro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erro/40"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Alternativas: o radio marca a correta. fieldset + legend dão nome ao grupo para o leitor de tela. */}
                <fieldset className="mt-3 space-y-2 pl-8">
                  <legend className="mb-1.5 text-[12px] font-medium text-tinta-suave">Alternativas (marque a correta)</legend>
                  {p.alternativas.map((alt, a) => {
                    const ehCorreta = p.correta === a;
                    return (
                      <div key={a} className={cx('flex items-center gap-2 rounded-lg border px-2 py-1.5', ehCorreta ? 'border-sucesso/50 bg-sucesso/5' : 'border-borda bg-superficie')}>
                        {/* Radio nativo com a cor do tema (accent-[var(--primaria)]), como o checkbox "Obrigatória". */}
                        <input type="radio" name={`correta-${p.id}`} checked={ehCorreta} onChange={() => setPergunta(i, { correta: a })}
                          aria-label={`Marcar a alternativa ${LETRAS[a]} como correta`} className="h-4 w-4 shrink-0 accent-[var(--primaria)]" />
                        <span className="w-4 shrink-0 text-[12px] font-bold text-tinta-suave" aria-hidden>{LETRAS[a]}</span>
                        <input value={alt} placeholder={`Alternativa ${LETRAS[a]}`}
                          onChange={(ev) => setPergunta(i, { alternativas: p.alternativas.map((x, k) => (k === a ? ev.target.value : x)) })}
                          aria-label={`Texto da alternativa ${LETRAS[a]} da pergunta ${i + 1}`}
                          className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 text-sm text-tinta placeholder:text-tinta-fraca focus:bg-superficie focus:outline-none focus:ring-2 focus:ring-primaria/40" />
                        {/* Cor nunca sozinha: a correta também ganha a etiqueta escrita. */}
                        {ehCorreta && <Etiqueta tom="sucesso">Correta</Etiqueta>}
                        {/* Mínimo de duas alternativas: com duas, o "x" some. */}
                        {p.alternativas.length > 2 && (
                          <button type="button" onClick={() => removerAlternativa(i, a)} aria-label={`Remover a alternativa ${LETRAS[a]}`}
                            className="rounded p-1 text-tinta-fraca hover:bg-erro/10 hover:text-erro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erro/40"><X className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    );
                  })}
                  {p.alternativas.length < MAX_ALTERNATIVAS && (
                    <Button variante="fantasma" tamanho="sm" onClick={() => setPergunta(i, { alternativas: [...p.alternativas, ''] })}>
                      <Plus className="h-3.5 w-3.5" aria-hidden />Alternativa
                    </Button>
                  )}
                </fieldset>
              </li>
            ))}
          </ol>

          {/* GRAVA: acrescenta uma pergunta em branco no fim. */}
          <Button variante="secundario" tamanho="sm" onClick={() => setPerguntas([...perguntas, perguntaNova()])}>
            <Plus className="h-4 w-4" aria-hidden />Adicionar pergunta
          </Button>
        </section>
      )}
    </div>
  );
}
