"use client";

import { useCallback, useRef, useState } from 'react';

/**
 * Estado de formulário com a regra de UX do CAIS:
 * o erro aparece ao SAIR do campo (blur), não a cada tecla. Depois que o
 * campo foi visitado, a mensagem se atualiza enquanto a pessoa digita.
 */
export function useFormulario<T extends Record<string, unknown>>(
  inicial: T,
  validar: (v: T) => Partial<Record<keyof T, string>>
) {
  const [valores, setValores] = useState<T>(inicial);
  const [erros, setErros] = useState<Partial<Record<keyof T, string>>>({});
  const tocados = useRef<Partial<Record<keyof T, boolean>>>({});
  // Espelho dos valores para leitura nos handlers (atualizado em set/reiniciar)
  const atual = useRef(inicial);

  const set = useCallback(<K extends keyof T>(campo: K, valor: T[K]) => {
    atual.current = { ...atual.current, [campo]: valor };
    setValores((v) => ({ ...v, [campo]: valor }));
    if (tocados.current[campo]) {
      const msg = validar(atual.current)[campo];
      setErros((e) => ({ ...e, [campo]: msg }));
    }
  }, [validar]);

  const blur = useCallback((campo: keyof T) => {
    tocados.current[campo] = true;
    const msg = validar(atual.current)[campo];
    setErros((e) => ({ ...e, [campo]: msg }));
  }, [validar]);

  /** Valida tudo (no envio). Devolve true se não houver erro. */
  const validarTudo = useCallback(() => {
    const e = validar(atual.current);
    setErros(e);
    Object.keys(atual.current).forEach((k) => { tocados.current[k as keyof T] = true; });
    return Object.values(e).every((x) => !x);
  }, [validar]);

  const reiniciar = useCallback((v: T) => { atual.current = v; setValores(v); setErros({}); tocados.current = {}; }, []);

  /** Atalho para ligar um Input: value, onChange, onBlur e error. */
  const campo = <K extends keyof T>(nome: K, mascara?: (s: string) => string) => ({
    value: String(valores[nome] ?? ''),
    onChange: (ev: { target: { value: string } }) => set(nome, (mascara ? mascara(ev.target.value) : ev.target.value) as T[K]),
    onBlur: () => blur(nome),
    error: erros[nome],
  });

  return { valores, erros, set, blur, validarTudo, reiniciar, campo };
}
