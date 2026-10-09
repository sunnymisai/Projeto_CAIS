/* ============================================================================
   CONVITE (LINK DE PRIMEIRO ACESSO)
   O que é: monta o link de convite de uma pessoa e copia texto para a área de transferência com tratamento de erro.
   Onde é usado: app/(sistema)/pessoas/page.tsx ("Copiar link de convite" na ficha), app/(sistema)/acessos/page.tsx ("Reenviar convite") e components/PrimeiroAcessoForm.tsx (lê ?convite=).
   Depende de: nada além do navegador (window.location e navigator.clipboard); sem React.
   Contexto: §11 (convite por e-mail leva ao primeiro acesso), §12 (fluxo 1) e §15 item 1.
   ============================================================================ */

// [PV-1] Formato do link de convite (/primeiro-acesso?convite=<pessoaId>). TODO(API): o convite real é um token assinado, com validade e uso único.
/**
 * Monta o link de convite de uma pessoa: `<endereço do site>/primeiro-acesso?convite=<pessoaId>`.
 * Só chamar no navegador (usa window.location).
 * @param pessoaId - id da pessoa convidada.
 * @returns o endereço completo, pronto para colar em outra aba ou mandar por mensagem.
 * @example linkDeConvite('pes_felipe') // 'http://localhost:3000/primeiro-acesso?convite=pes_felipe'
 */
// SIMULADO: o convite é o próprio id da pessoa (qualquer um que souber o id abre a tela).
// TODO(API): o convite real é um token assinado, com validade e uso único, gerado pela API da PROGLOGIC.
export function linkDeConvite(pessoaId: string): string {
  return `${window.location.origin}/primeiro-acesso?convite=${encodeURIComponent(pessoaId)}`;
}

// [PV-2] Copiar para a área de transferência, com plano B quando o navegador bloqueia; usado nos botões "Copiar link".
/**
 * Copia um texto para a área de transferência.
 * navigator.clipboard só existe em contexto seguro (https ou localhost) e a pessoa pode
 * negar a permissão; por isso a função nunca lança erro: devolve false quando não conseguiu.
 * @param texto - o que copiar.
 * @returns true se copiou; false se o navegador não deixou (a tela deve mostrar o texto para copiar à mão).
 * @example if (!(await copiarTexto(link))) avisar(`Copie manualmente: ${link}`, 'erro');
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    // Fora de contexto seguro o objeto clipboard nem existe: cai no catch abaixo.
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
