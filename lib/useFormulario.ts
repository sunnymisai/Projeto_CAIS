/* ============================================================================
   USEFORMULARIO (HOOK DE FORMULÁRIO)
   O que é: hook que guarda os valores e os erros de um formulário e mostra o erro só quando a pessoa sai do campo.
   Onde é usado: app/(sistema)/empresas/page.tsx, app/(sistema)/pessoas/page.tsx, components/projetos/Equipe.tsx e components/projetos/FormProjeto.tsx.
   Depende de: React (useState, useRef, useCallback). A função `validar` vem de quem usa o hook.
   Contexto: §11 (erro ao sair do campo), §12 (fluxos de cadastro).
   ============================================================================ */

"use client";

import { useCallback, useRef, useState } from 'react';

/**
 * Estado de formulário com a regra de UX do CAIS:
 * o erro aparece ao SAIR do campo (blur), não a cada tecla. Depois que o
 * campo foi visitado, a mensagem se atualiza enquanto a pessoa digita.
 *
 * @param inicial - valores iniciais de todos os campos.
 * @param validar - função pura que recebe os valores e devolve `{ campo: 'mensagem' }`
 *   só para os campos com erro.
 * @returns `{ valores, erros, set, blur, validarTudo, reiniciar, campo }`.
 * @example
 * const f = useFormulario({ nome: '' }, (v) => ({ nome: v.nome ? undefined : 'Informe o nome.' }));
 * <Input label="Nome" {...f.campo('nome')} />
 * if (f.validarTudo()) salvar(f.valores);
 */
export function useFormulario<T extends Record<string, unknown>>(
  inicial: T,
  validar: (v: T) => Partial<Record<keyof T, string>>
) {
  const [valores, setValores] = useState<T>(inicial);
  const [erros, setErros] = useState<Partial<Record<keyof T, string>>>({});
  // Campos que a pessoa já visitou. É ref porque não precisa redesenhar a tela ao mudar.
  const tocados = useRef<Partial<Record<keyof T, boolean>>>({});
  // Espelho dos valores para leitura nos handlers (atualizado em set/reiniciar)
  // Por quê: o state `valores` só atualiza no próximo desenho; o ref já tem o valor novo na hora.
  const atual = useRef(inicial);

  /**
   * Muda o valor de um campo.
   * @param campo - nome do campo.
   * @param valor - novo valor.
   */
  const set = useCallback(<K extends keyof T>(campo: K, valor: T[K]) => {
    atual.current = { ...atual.current, [campo]: valor };
    setValores((v) => ({ ...v, [campo]: valor }));
    // Só revalida enquanto digita se o campo já foi visitado (assim o erro não aparece na 1ª tecla).
    if (tocados.current[campo]) {
      const msg = validar(atual.current)[campo];
      setErros((e) => ({ ...e, [campo]: msg }));
    }
  }, [validar]);

  /**
   * Chamado quando a pessoa sai do campo: marca como visitado e mostra o erro (se houver).
   * @param campo - nome do campo.
   */
  const blur = useCallback((campo: keyof T) => {
    tocados.current[campo] = true;
    const msg = validar(atual.current)[campo];
    setErros((e) => ({ ...e, [campo]: msg }));
  }, [validar]);

  /** Valida tudo (no envio). Devolve true se não houver erro. */
  const validarTudo = useCallback(() => {
    const e = validar(atual.current);
    setErros(e);
    // Marca todos como visitados: a partir daqui, corrigir um campo já apaga o erro dele.
    Object.keys(atual.current).forEach((k) => { tocados.current[k as keyof T] = true; });
    // Mensagem vazia ou undefined = sem erro.
    return Object.values(e).every((x) => !x);
  }, [validar]);

  /**
   * Volta o formulário a um estado limpo (ex.: ao abrir o modal para outro item).
   * @param v - novos valores iniciais.
   */
  const reiniciar = useCallback((v: T) => { atual.current = v; setValores(v); setErros({}); tocados.current = {}; }, []);

  /**
   * Atalho para ligar um Input: value, onChange, onBlur e error.
   * @param nome - nome do campo.
   * @param mascara - opcional; formata o texto a cada tecla (ex.: mascaraCNPJ de lib/utils.ts).
   * @example <Input {...f.campo('cnpj', mascaraCNPJ)} />
   */
  const campo = <K extends keyof T>(nome: K, mascara?: (s: string) => string) => ({
    value: String(valores[nome] ?? ''),
    onChange: (ev: { target: { value: string } }) => set(nome, (mascara ? mascara(ev.target.value) : ev.target.value) as T[K]),
    onBlur: () => blur(nome),
    error: erros[nome],
  });

  return { valores, erros, set, blur, validarTudo, reiniciar, campo };
}
