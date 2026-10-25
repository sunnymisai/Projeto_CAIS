/* ============================================================================
   CASOS DE TESTE DOS TEMAS
   O que é: script simples (sem biblioteca de testes) que confere as funções de
     lib/temas.ts: contraste, validação, duplicação, escolha do tema e as atualizações de `dados.temas`.
   Onde é usado: rodado à mão no terminal; nenhuma tela importa este arquivo.
   Depende de: lib/temas.ts (import com extensão .ts para o Node achar o módulo).
   Contexto: docs/temas-contrato.md (API de lib/temas.ts).
   Como rodar: node --experimental-strip-types lib/temas.casos.ts
   ============================================================================ */

import {
  CHAVES_DO_TEMA, LOGO_MAX_BYTES, TEMAS_BASE, contraste, definirDaEmpresaNosTemas, definirPadraoNosTemas, duplicarTema,
  empresaDoTema, logoDoTema, nomeDaMarca, normalizarTemas, paletaDoTema, removerDosTemas, resolverTemaId, salvarNosTemas,
  sanitizarIdentidade, temasIniciais, validarArquivoLogo, validarTema,
} from './temas.ts';
import type { Tema } from './temas.ts';

const [cais, quente] = TEMAS_BASE;

/** Tema personalizado de teste (cópia do quente com outro id). */
const custom = duplicarTema(quente, 'custom-1', 'Meu tema');
// Estado com um tema personalizado, usado como padrão e por uma empresa (para testar a remoção em uso).
const emUso = definirDaEmpresaNosTemas(definirPadraoNosTemas(salvarNosTemas(temasIniciais(), custom), 'custom-1'), 'emp_a', 'custom-1');
const semEle = removerDosTemas(emUso, 'custom-1');
// Tema com botão claro demais e hex quebrado, para os avisos.
const ruim = { ...custom, claro: { ...custom.claro, '--botao': '#EEEEEE', '--fundo': 'azul' } };
const avisosRuim = validarTema(ruim);
// Casos do tema por empresa: dados mínimos para empresaDoTema.
const base = {
  hoje: '2026-10-14',
  pessoas: [{ id: 'pes_e', empresaId: 'emp_a' }, { id: 'pes_p', empresaId: '' }, { id: 'pes_q', empresaId: '' }],
  alocacoes: [
    { pessoaId: 'pes_p', projetoId: 'prj_velho', inicio: '2026-01-01', fim: '2026-12-31' },
    { pessoaId: 'pes_p', projetoId: 'prj_b', inicio: '2026-10-01', fim: '2026-10-31' },
    { pessoaId: 'pes_q', projetoId: 'prj_b', inicio: '2026-11-01', fim: '2026-11-30' },
  ],
  projetos: [
    { id: 'prj_velho', empresaId: 'emp_x', status: 'concluido' },
    { id: 'prj_b', empresaId: 'emp_b', status: 'andamento' },
  ],
};

// Casos da identidade da empresa (fase 2): logos de teste e um tema que os usa.
const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const SVG = 'data:image/svg+xml;base64,PHN2Zy8+';
const GRANDE = `data:image/png;base64,${'A'.repeat(Math.ceil((LOGO_MAX_BYTES * 4) / 3) + 8)}`;
const comMarca: Tema = { ...custom, identidade: { nomeEmpresa: 'Aurora', logoClaro: PNG } };
const lidoDoNavegador = normalizarTemas({ personalizados: [{
  ...custom,
  identidade: { nomeEmpresa: '  <b>Aurora</b>  ', logoClaro: 'javascript:alert(1)', logoEscuro: SVG },
}] }).personalizados[0];

const casos: { porque: string; obtido: unknown; esperado: unknown }[] = [
  { porque: 'contraste preto sobre branco é 21:1', obtido: contraste('#000000', '#FFFFFF'), esperado: 21 },
  { porque: 'contraste não depende da ordem das cores', obtido: contraste('#4A3323', '#FFFFFF') === contraste('#FFFFFF', '#4A3323'), esperado: true },
  { porque: 'cor inválida dá contraste 0 (sem quebrar)', obtido: contraste('azul', '#FFFFFF'), esperado: 0 },
  { porque: 'são seis temas-base: os três originais seguidos de oceano, floresta e ameixa', obtido: TEMAS_BASE.map((t) => t.id).join(','), esperado: 'cais,quente,carvao,oceano,floresta,ameixa' },
  { porque: 'os temas-base têm ids únicos', obtido: new Set(TEMAS_BASE.map((t) => t.id)).size, esperado: TEMAS_BASE.length },
  { porque: 'todo tema-base tem todas as cores nos dois modos', obtido: TEMAS_BASE.every((t) => CHAVES_DO_TEMA.every((k) => t.claro[k] && t.escuro[k])), esperado: true },
  { porque: 'os temas-base não têm nenhum aviso de contraste ou de hex', obtido: TEMAS_BASE.flatMap((t) => validarTema(t).map((a) => `${t.id}/${a.modo}/${a.chave}`)).join(' | '), esperado: '' },
  { porque: 'o lateral do tema quente é marrom-café e a do carvão é grafite', obtido: `${quente.claro['--noite']}|${TEMAS_BASE[2].claro['--noite']}`, esperado: '#4A3323|#17171A' },
  { porque: 'paletaDoTema escolhe a metade certa', obtido: `${paletaDoTema(cais, 'claro')['--fundo']}|${paletaDoTema(cais, 'escuro')['--fundo']}`, esperado: '#F6F7FB|#14161F' },
  { porque: 'botão claro demais avisa (texto branco abaixo de 4,5:1)', obtido: avisosRuim.some((a) => a.chave === '--botao' && a.modo === 'claro'), esperado: true },
  { porque: 'hex inválido avisa na cor certa', obtido: avisosRuim.some((a) => a.chave === '--fundo' && a.modo === 'claro' && a.mensagem.startsWith('Cor inválida')), esperado: true },
  { porque: 'o modo escuro do tema ruim não ganha aviso à toa', obtido: avisosRuim.some((a) => a.modo === 'escuro'), esperado: false },
  { porque: 'duplicar gera tema não-base com outro id e nome', obtido: `${custom.base}|${custom.id}|${custom.nome}`, esperado: 'false|custom-1|Meu tema' },
  { porque: 'duplicar não compartilha objeto com o original', obtido: custom.claro !== quente.claro && custom.claro['--noite'] === quente.claro['--noite'], esperado: true },
  { porque: 'empresa com tema próprio usa o dela', obtido: resolverTemaId({ padraoId: 'cais', porEmpresa: { emp_a: 'quente' }, empresaId: 'emp_a' }), esperado: 'quente' },
  { porque: 'empresa sem tema próprio cai no padrão', obtido: resolverTemaId({ padraoId: 'carvao', porEmpresa: { emp_a: 'quente' }, empresaId: 'emp_b' }), esperado: 'carvao' },
  { porque: 'sem empresa (admin, telas públicas) vale o padrão', obtido: resolverTemaId({ padraoId: 'carvao', porEmpresa: { emp_a: 'quente' } }), esperado: 'carvao' },
  { porque: 'perfil empresa: a empresa é a da própria pessoa', obtido: empresaDoTema({ ...base, perfil: 'empresa', pessoaId: 'pes_e' }), esperado: 'emp_a' },
  { porque: 'profissional: pega a empresa da alocação ativa, ignorando projeto concluído', obtido: empresaDoTema({ ...base, perfil: 'profissional', pessoaId: 'pes_p' }), esperado: 'emp_b' },
  { porque: 'profissional com alocação só no futuro não tem empresa (vale o padrão)', obtido: empresaDoTema({ ...base, perfil: 'profissional', pessoaId: 'pes_q' }), esperado: undefined },
  { porque: 'admin nunca tem empresa de tema', obtido: empresaDoTema({ ...base, perfil: 'admin', pessoaId: 'pes_e' }), esperado: undefined },
  { porque: 'salvar tema-base é ignorado (só se duplica)', obtido: salvarNosTemas(temasIniciais(), { ...cais, nome: 'Outro' }).personalizados.length, esperado: 0 },
  { porque: 'salvar o mesmo id duas vezes edita, não duplica', obtido: salvarNosTemas(salvarNosTemas(temasIniciais(), custom), { ...custom, nome: 'Novo' }).personalizados.map((t) => t.nome).join(','), esperado: 'Novo' },
  { porque: 'remover tema em uso como padrão volta o padrão para cais', obtido: semEle.padraoId, esperado: 'cais' },
  { porque: 'remover tema em uso por uma empresa devolve a empresa ao padrão', obtido: Object.keys(semEle.porEmpresa).length, esperado: 0 },
  { porque: 'remover tema-base é ignorado', obtido: removerDosTemas(temasIniciais(), 'quente').padraoId, esperado: 'cais' },
  { porque: 'definir padrão com id que não existe é ignorado', obtido: definirPadraoNosTemas(temasIniciais(), 'fantasma').padraoId, esperado: 'cais' },
  { porque: 'definir padrão com tema-base funciona', obtido: definirPadraoNosTemas(temasIniciais(), 'carvao').padraoId, esperado: 'carvao' },
  { porque: 'definir tema da empresa com null remove a escolha', obtido: Object.keys(definirDaEmpresaNosTemas(emUso, 'emp_a', null).porEmpresa).length, esperado: 0 },
  { porque: 'dado antigo sem `temas` recebe o valor inicial', obtido: JSON.stringify(normalizarTemas(undefined)), esperado: JSON.stringify(temasIniciais()) },
  { porque: 'temas com formato estranho viram o valor inicial, sem quebrar', obtido: JSON.stringify(normalizarTemas({ personalizados: 'x', padraoId: 3, porEmpresa: [] })), esperado: JSON.stringify(temasIniciais()) },
  // Identidade da empresa (logo e nome).
  { porque: 'arquivo PNG pequeno é aceito', obtido: validarArquivoLogo({ type: 'image/png', size: 2048 }), esperado: null },
  { porque: 'GIF é recusado com mensagem em português', obtido: validarArquivoLogo({ type: 'image/gif', size: 2048 }), esperado: 'Formato não aceito: use PNG, JPG, WebP ou SVG.' },
  { porque: 'arquivo acima de 150 KB é recusado', obtido: validarArquivoLogo({ type: 'image/webp', size: LOGO_MAX_BYTES + 1 })?.startsWith('A imagem tem'), esperado: true },
  { porque: 'arquivo de exatamente 150 KB é aceito', obtido: validarArquivoLogo({ type: 'image/jpeg', size: LOGO_MAX_BYTES }), esperado: null },
  { porque: 'arquivo vazio é recusado', obtido: validarArquivoLogo({ type: 'image/png', size: 0 }) !== null, esperado: true },
  { porque: 'logoDoTema no escuro prefere o logo escuro', obtido: logoDoTema({ ...custom, identidade: { logoClaro: PNG, logoEscuro: SVG } }, 'escuro'), esperado: SVG },
  { porque: 'logoDoTema no claro prefere o logo claro', obtido: logoDoTema({ ...custom, identidade: { logoClaro: PNG, logoEscuro: SVG } }, 'claro'), esperado: PNG },
  { porque: 'logoDoTema no escuro usa o claro quando só ele existe', obtido: logoDoTema(comMarca, 'escuro'), esperado: PNG },
  { porque: 'logoDoTema no claro usa o escuro quando só ele existe', obtido: logoDoTema({ ...custom, identidade: { logoEscuro: SVG } }, 'claro'), esperado: SVG },
  { porque: 'tema sem identidade não tem logo (null)', obtido: logoDoTema(cais, 'claro'), esperado: null },
  { porque: 'logoDoTema nunca devolve data URL inválido, mesmo que o tema o traga', obtido: logoDoTema({ ...custom, identidade: { logoClaro: 'javascript:alert(1)' } }, 'claro'), esperado: null },
  { porque: 'nomeDaMarca apara os espaços', obtido: nomeDaMarca({ ...custom, identidade: { nomeEmpresa: '  Aurora  ' } }), esperado: 'Aurora' },
  { porque: 'nomeDaMarca vazio ou ausente é null', obtido: `${nomeDaMarca({ ...custom, identidade: { nomeEmpresa: '   ' } })}|${nomeDaMarca(cais)}`, esperado: 'null|null' },
  { porque: 'nome da empresa é cortado em 40 caracteres', obtido: nomeDaMarca({ ...custom, identidade: { nomeEmpresa: 'A'.repeat(60) } })?.length, esperado: 40 },
  { porque: 'nome da empresa não carrega HTML', obtido: nomeDaMarca({ ...custom, identidade: { nomeEmpresa: '<img src=x onerror=alert(1)>Aurora' } }), esperado: 'img src=x onerror=alert(1)Aurora' },
  { porque: 'duplicarTema preserva a identidade', obtido: duplicarTema(comMarca, 'custom-2', 'Cópia').identidade?.logoClaro, esperado: PNG },
  { porque: 'duplicarTema copia a identidade (não compartilha o objeto)', obtido: duplicarTema(comMarca, 'custom-2', 'Cópia').identidade === comMarca.identidade, esperado: false },
  { porque: 'duplicar tema sem identidade não cria a chave', obtido: 'identidade' in duplicarTema(cais, 'custom-3', 'Cópia'), esperado: false },
  { porque: 'temas-base não têm identidade', obtido: TEMAS_BASE.some((t) => t.identidade !== undefined), esperado: false },
  { porque: 'normalizarTemas descarta data URL que não é imagem base64 (javascript:)', obtido: lidoDoNavegador.identidade?.logoClaro, esperado: undefined },
  { porque: 'normalizarTemas mantém o logo válido', obtido: lidoDoNavegador.identidade?.logoEscuro, esperado: SVG },
  { porque: 'normalizarTemas limpa o HTML do nome', obtido: lidoDoNavegador.identidade?.nomeEmpresa, esperado: 'bAurora/b' },
  { porque: 'normalizarTemas descarta data:text/html', obtido: sanitizarIdentidade({ logoClaro: 'data:text/html;base64,PHNjcmlwdD4=' }), esperado: undefined },
  { porque: 'normalizarTemas descarta logo que não é base64', obtido: sanitizarIdentidade({ logoClaro: 'data:image/png;base64,<script>' }), esperado: undefined },
  { porque: 'normalizarTemas descarta logo maior que o limite', obtido: sanitizarIdentidade({ logoClaro: GRANDE }), esperado: undefined },
  { porque: 'normalizarTemas descarta campos de tipo errado', obtido: sanitizarIdentidade({ nomeEmpresa: 42, logoClaro: { x: 1 }, logoEscuro: ['a'] }), esperado: undefined },
  { porque: 'identidade que não é objeto é descartada', obtido: `${sanitizarIdentidade('texto')}|${sanitizarIdentidade(null)}|${sanitizarIdentidade([PNG])}`, esperado: 'undefined|undefined|undefined' },
  { porque: 'tema lido sem identidade válida não fica com a chave', obtido: 'identidade' in normalizarTemas({ personalizados: [{ ...custom, identidade: { logoClaro: 'x' } }] }).personalizados[0], esperado: false },
  { porque: 'normalizarTemas preserva a identidade válida inteira', obtido: JSON.stringify(normalizarTemas({ personalizados: [comMarca] }).personalizados[0].identidade), esperado: JSON.stringify({ nomeEmpresa: 'Aurora', logoClaro: PNG }) },
  { porque: 'salvarNosTemas preserva a identidade válida', obtido: salvarNosTemas(temasIniciais(), comMarca).personalizados[0].identidade?.nomeEmpresa, esperado: 'Aurora' },
  { porque: 'salvarNosTemas descarta logo inválido antes de gravar', obtido: salvarNosTemas(temasIniciais(), { ...custom, identidade: { logoClaro: 'javascript:alert(1)' } }).personalizados[0].identidade, esperado: undefined },
  { porque: 'validarTema não avisa nada sobre a identidade', obtido: validarTema(comMarca).length, esperado: validarTema(custom).length },
];

// Roda os casos e imprime OK/FALHOU com o porquê (mesmo formato de carga.casos.ts).
let falhas = 0;
for (const c of casos) {
  const ok = c.obtido === c.esperado;
  if (!ok) falhas++;
  console.log(`${ok ? 'OK    ' : 'FALHOU'} ${c.porque}${ok ? '' : ` (obtido: ${String(c.obtido)}, esperado: ${String(c.esperado)})`}`);
}
console.log(`\n${casos.length - falhas} de ${casos.length} casos passaram.`);
if (falhas > 0) process.exit(1);
