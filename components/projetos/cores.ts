/* ============================================================================
   CORES.TS
   O que é: a paleta de fundos que o usuário escolhe para o quadro de um projeto.
   Onde é usado: components/projetos/Quadro.tsx (fundo do kanban),
                 components/projetos/FormProjeto.tsx (seletor "Fundo do quadro")
                 e app/(sistema)/projetos/page.tsx (capa dos cartões de projeto).
   Depende de: nada (só constantes de cor).
   Contexto: §5 Projetos (quadro kanban) e §9 Design system e marca.
   ============================================================================ */
/* Fundos de quadro, como os "planos de fundo" do Trello.
   São gradientes escuros o bastante para o texto branco do cabeçalho. */
/**
 * Paleta de fundos do quadro, indexada pela chave da cor.
 *
 * A chave (ex.: 'roxo') é o que fica salvo em `projeto.cor`.
 * - `nome`: rótulo acessível mostrado no seletor do formulário.
 * - `fundo`: gradiente usado como `background` do quadro.
 * - `solida`: cor única equivalente, para lugares onde gradiente não cabe.
 *
 * ⚠️ ATENÇÃO: renomear ou apagar uma chave faz projetos já salvos com ela
 * cair no fallback roxo de `corQuadro` (o dado no localStorage não muda).
 */
export const CORES_QUADRO: Record<string, { nome: string; fundo: string; solida: string }> = {
  roxo: { nome: 'Roxo maré', fundo: 'linear-gradient(135deg, #5B3FD4 0%, #7C5CFF 55%, #9B82FF 100%)', solida: '#6A4AF0' },
  verde: { nome: 'Verde atracado', fundo: 'linear-gradient(135deg, #065F46 0%, #059669 60%, #10B981 100%)', solida: '#047857' },
  ambar: { nome: 'Âmbar', fundo: 'linear-gradient(135deg, #92400E 0%, #D97706 60%, #F5A524 100%)', solida: '#B45309' },
  azul: { nome: 'Azul', fundo: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #60A5FA 100%)', solida: '#2563EB' },
  rosa: { nome: 'Rosa', fundo: 'linear-gradient(135deg, #831843 0%, #BE185D 60%, #EC4899 100%)', solida: '#BE185D' },
  tinta: { nome: 'Tinta', fundo: 'linear-gradient(135deg, #0B0C12 0%, #14161F 55%, #2A2E42 100%)', solida: '#14161F' },
};

/**
 * Devolve as cores de um quadro a partir da chave salva no projeto.
 * Se a chave não existir (dado antigo ou digitado errado), usa o roxo,
 * para o quadro nunca ficar sem fundo.
 * @param c chave da cor (ex.: 'verde').
 * @returns objeto `{ nome, fundo, solida }`.
 * @example
 * corQuadro('verde').fundo // gradiente verde
 * corQuadro('inexistente').nome // 'Roxo maré'
 */
export const corQuadro = (c: string) => CORES_QUADRO[c] ?? CORES_QUADRO.roxo;
