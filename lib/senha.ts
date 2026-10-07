/* ============================================================================
   SENHA (REGRAS DE SENHA)
   O que é: funções puras que dizem se uma senha cumpre as regras do CAIS e quais regras faltam.
   Onde é usado: components/RecuperarSenhaForm.tsx (recuperação de senha), components/PrimeiroAcessoForm.tsx (primeiro acesso) e components/ui/RegrasSenha.tsx (a lista de regras na tela); a troca de senha de /perfil (C07) também usa.
   Depende de: nada (sem React, para rodar em Node).
   Contexto: §12 (fluxo 1: o profissional define a senha no primeiro acesso) e §15 item 1; §7 (a regra de verdade é do back-end).
   ============================================================================ */

/*
 * ⚠️ ATENÇÃO: estas regras são só conveniência de interface (feedback na hora).
 * Quem decide de verdade se a senha é aceita é o back-end da PROGLOGIC (§7).
 * TODO(API): trocar por regras vindas da política de senha da API.
 */

/** Uma regra de senha: o texto mostrado na tela e se a senha digitada já cumpre. */
export interface RegraSenha {
  /** Texto da regra, ex.: "Pelo menos 8 caracteres". */
  texto: string;
  /** true quando a senha digitada cumpre a regra. */
  cumprida: boolean;
}

/**
 * Confere a senha contra cada regra e devolve a lista (sempre as mesmas regras, na mesma ordem).
 * @param senha - a senha digitada (pode estar vazia: nesse caso nenhuma regra está cumprida).
 * @returns as três regras: mínimo de 8 caracteres, uma letra maiúscula e um número.
 * @example regrasDaSenha('cais2026') // [{ texto: 'Pelo menos 8 caracteres', cumprida: true }, { ...maiúscula, cumprida: false }, { ...número, cumprida: true }]
 */
export function regrasDaSenha(senha: string): RegraSenha[] {
  return [
    { texto: 'Pelo menos 8 caracteres', cumprida: senha.length >= 8 },
    // [A-ZÀ-Ý]: aceita maiúscula com acento (ex.: "Á"); \d é qualquer dígito de 0 a 9.
    { texto: 'Uma letra maiúscula', cumprida: /[A-ZÀ-Ý]/.test(senha) },
    { texto: 'Um número', cumprida: /\d/.test(senha) },
  ];
}

/**
 * Diz se a senha cumpre TODAS as regras.
 * @param senha - a senha digitada.
 * @returns true se nenhuma regra ficou pendente.
 * @example senhaValida('Cais@2026') // true
 */
export function senhaValida(senha: string): boolean {
  return regrasDaSenha(senha).every((r) => r.cumprida);
}
