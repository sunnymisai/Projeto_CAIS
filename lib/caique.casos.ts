/* ============================================================================
   CASOS DE TESTE DO CAIQUE
   O que é: script simples (sem biblioteca de testes) que confere idTrilhaDoCaminho, sugestoesCaique,
     validarPergunta, montarContextoTrilha, historicoParaEnvio, validarPedido e montarRespostaSimulada.
   Onde é usado: rodado à mão no terminal; nenhuma tela importa este arquivo.
   Depende de: lib/caique.ts (import com extensão .ts para o Node achar o módulo).
   Contexto: prompts I02 e I06 em docs/prompts.
   Como rodar: node --experimental-strip-types lib/caique.casos.ts
   ============================================================================ */

import {
  idTrilhaDoCaminho, sugestoesCaique, validarPergunta, montarRespostaSimulada, montarContextoTrilha,
  historicoParaEnvio, validarPedido, LIMITE_PERGUNTA, LIMITE_HISTORICO, LIMITE_TEXTO_ETAPA, LIMITE_ETAPAS,
  type MensagemCaique,
} from './caique.ts';
import type { Trilha } from './tipos.ts';

// Trilha de exemplo: uma etapa de texto longo e um quiz (cujas perguntas NÃO podem ir para a IA).
const trilha = {
  id: 't1', titulo: 'React', descricao: 'Base de React', alcance: 'geral', empresaId: '', pessoaIds: [], status: 'publicada', prazoDias: 30,
  etapas: [
    { id: 'e1', titulo: 'Leitura', tipo: 'texto', obrigatoria: true, notaMinima: 0, conteudo: { texto: 'x'.repeat(LIMITE_TEXTO_ETAPA + 100) } },
    { id: 'e2', titulo: 'Quiz', tipo: 'quiz', obrigatoria: true, notaMinima: 70, conteudo: { texto: 'gabarito secreto' }, perguntas: [{ id: 'p1' }] },
  ],
} as unknown as Trilha;
const contexto = montarContextoTrilha(trilha);
const muitasEtapas = montarContextoTrilha({ ...trilha, etapas: Array.from({ length: LIMITE_ETAPAS + 5 }, () => trilha.etapas[0]) });

const mensagens: MensagemCaique[] = Array.from({ length: 15 }, (_, i) => ({ id: `m${i}`, papel: i % 2 ? 'caique' : 'usuario', texto: `msg ${i}`, hora: '10:00' }));
const historico = historicoParaEnvio(mensagens);

const pedidoValido = { pergunta: ' Oi ', trilha: contexto, historico: [] };
const resultadoValido = validarPedido(pedidoValido);

const casos: { porque: string; obtido: unknown; esperado: unknown }[] = [
  { porque: '/minhas-trilhas/t1 é a trilha t1', obtido: idTrilhaDoCaminho('/minhas-trilhas/t1'), esperado: 't1' },
  { porque: 'a etapa também pertence à trilha', obtido: idTrilhaDoCaminho('/minhas-trilhas/t1/etapa/e2'), esperado: 't1' },
  { porque: '/trilhas/t9 (admin e empresa) é a trilha t9', obtido: idTrilhaDoCaminho('/trilhas/t9'), esperado: 't9' },
  { porque: 'a lista /trilhas não tem trilha aberta', obtido: idTrilhaDoCaminho('/trilhas'), esperado: undefined },
  { porque: 'outra tela não tem trilha', obtido: idTrilhaDoCaminho('/painel'), esperado: undefined },
  { porque: 'sem trilha não há sugestões (o CAIQUE só fala da trilha)', obtido: sugestoesCaique().length, esperado: 0 },
  { porque: 'com trilha: 4 sugestões e a primeira cita o título', obtido: sugestoesCaique('React')[0].includes('React') && sugestoesCaique('React').length === 4, esperado: true },
  { porque: 'pergunta vazia é recusada', obtido: validarPergunta('   '), esperado: 'Escreva a sua pergunta.' },
  { porque: 'pergunta normal é aceita', obtido: validarPergunta('Como funciona o quiz?'), esperado: null },
  { porque: 'pergunta no limite é aceita', obtido: validarPergunta('a'.repeat(LIMITE_PERGUNTA)), esperado: null },
  { porque: 'pergunta acima do limite é recusada', obtido: validarPergunta('a'.repeat(LIMITE_PERGUNTA + 1)) !== null, esperado: true },
  { porque: 'a resposta simulada cita a trilha e a pergunta', obtido: montarRespostaSimulada(' Oi ', 'React').includes('"React"') && montarRespostaSimulada(' Oi ', 'React').includes('"Oi"'), esperado: true },
  { porque: 'o contexto leva o título da trilha', obtido: contexto.titulo, esperado: 'React' },
  { porque: 'o texto da etapa é cortado no limite', obtido: contexto.etapas[0].texto?.length, esperado: LIMITE_TEXTO_ETAPA },
  { porque: 'o quiz NÃO leva texto para a IA', obtido: contexto.etapas[1].texto, esperado: undefined },
  { porque: 'o quiz NÃO leva as perguntas para a IA', obtido: 'perguntas' in contexto.etapas[1], esperado: false },
  { porque: 'etapas além do limite são cortadas', obtido: muitasEtapas.etapas.length, esperado: LIMITE_ETAPAS },
  { porque: `o histórico vai com no máximo ${LIMITE_HISTORICO} mensagens`, obtido: historico.length, esperado: LIMITE_HISTORICO },
  { porque: 'o histórico guarda as mais recentes', obtido: historico[historico.length - 1].texto, esperado: 'msg 14' },
  { porque: 'o histórico leva só papel e texto', obtido: Object.keys(historico[0]).join(','), esperado: 'papel,texto' },
  { porque: 'pedido válido passa e a pergunta chega aparada', obtido: 'pedido' in resultadoValido && resultadoValido.pedido.pergunta, esperado: 'Oi' },
  { porque: 'pedido sem corpo é recusado', obtido: 'erro' in validarPedido(null), esperado: true },
  { porque: 'pedido com pergunta vazia é recusado', obtido: 'erro' in validarPedido({ ...pedidoValido, pergunta: '  ' }), esperado: true },
  { porque: 'pedido sem trilha é recusado', obtido: 'erro' in validarPedido({ pergunta: 'Oi' }), esperado: true },
  { porque: 'pedido com histórico grande demais é recusado', obtido: 'erro' in validarPedido({ ...pedidoValido, historico: mensagens }), esperado: true },
  { porque: 'histórico com papel estranho é recusado', obtido: 'erro' in validarPedido({ ...pedidoValido, historico: [{ papel: 'sistema', texto: 'x' }] }), esperado: true },
];

// Roda os casos e imprime OK/FALHOU com o porquê (mesmo formato dos outros .casos.ts).
let falhas = 0;
for (const c of casos) {
  const ok = c.obtido === c.esperado;
  if (!ok) falhas++;
  console.log(`${ok ? 'OK    ' : 'FALHOU'} ${c.porque}${ok ? '' : ` (obtido: ${String(c.obtido)}, esperado: ${String(c.esperado)})`}`);
}
console.log(`\n${casos.length - falhas} de ${casos.length} casos passaram.`);
if (falhas > 0) process.exit(1);
