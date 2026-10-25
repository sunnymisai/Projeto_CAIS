/* ============================================================================
   TEMAS (REGRAS PURAS)
   O que é: o catálogo de temas do CAIS (CAIS, Paleta quente, Carvão, Oceano, Floresta e Ameixa) e as funções puras que escolhem, validam, duplicam e atualizam temas. Não usa React nem navegador.
   Onde é usado: lib/store.tsx (ações de tema), lib/seed.ts (valor inicial), lib/tema.tsx (aplica o tema na página), lib/tipos.ts (tipo DadosTemas) e a tela do administrador em app/(sistema)/temas/ com components/temas/*.
   Depende de: nada em tempo de execução (só `import type`), para o Node rodar lib/temas.casos.ts direto.
   Contexto: docs/temas-contrato.md (tokens que o tema controla) e §9 (design system, contraste AA).
   ============================================================================ */

import type { Perfil } from './tipos';

/** Nome de uma variável CSS controlada pelo tema (ex.: '--fundo'). É só um texto; a lista oficial está em `GRUPOS_COR`. */
export type ChaveCor = string;

/**
 * Um conjunto de cores de um tema (uma das duas metades: claro ou escuro).
 * Valores em hexadecimal: `#RRGGBB` (ou `#RRGGBBAA` quando precisa de transparência, como `--primaria-suave`).
 */
export type Paleta = Record<ChaveCor, string>;

/** Qual das duas paletas de um tema vale agora (o botão claro/escuro escolhe). */
export type ModoTema = 'claro' | 'escuro';

/**
 * A marca da empresa cliente que o tema pode trazer (fase 2). Tudo opcional.
 * Substitui o logo do CAIS só nos cabeçalhos; o selo "Plataforma CAIS" continua fixo.
 */
export interface IdentidadeTema {
  /** Texto exibido ao lado do logo (até 40 caracteres, sem HTML). */
  nomeEmpresa?: string;
  /** Data URL (PNG/JPG/WebP/SVG) para usar sobre fundo CLARO. */
  logoClaro?: string;
  /** Data URL para usar sobre fundo ESCURO (os painéis `--noite` são sempre escuros). */
  logoEscuro?: string;
}

/** Um tema completo: nome + paleta clara + paleta escura (+ identidade da empresa, opcional). */
export interface Tema {
  /** 'cais' | 'quente' | 'carvao' | 'oceano' | 'floresta' | 'ameixa' | 'custom-<n>' */
  id: string;
  nome: string;
  /** true = não pode ser apagado nem editado, só duplicado. */
  base: boolean;
  claro: Paleta;
  escuro: Paleta;
  /** Logo e nome da empresa. Opcional; os temas-base não têm. */
  identidade?: IdentidadeTema;
}

/**
 * Tudo o que a store guarda sobre temas.
 * `personalizados` são os temas criados pelo administrador; os temas-base não ficam aqui.
 */
export interface DadosTemas {
  personalizados: Tema[];
  /** Tema do sistema inteiro (e das telas públicas). */
  padraoId: string;
  /** empresaId → temaId. Empresa que não aparece usa o `padraoId`. */
  porEmpresa: Record<string, string>;
}

/** Um aviso de `validarTema`: qual cor, em qual modo e o que está errado. */
export interface AvisoTema {
  chave: ChaveCor;
  modo: ModoTema;
  mensagem: string;
}

// [PV-1] OS GRUPOS DE COR que o tema controla (rótulo na tela do administrador + variável CSS de cada seletor). Variável nova entra aqui E em cada paleta de TEMAS_BASE (e precisa existir em app/globals.css).
/**
 * Os grupos de cor exibidos na tela de edição, na ordem da tela.
 * `--marca` (#7C5CFF) NÃO está aqui de propósito: ela é só do logo e nenhum tema altera.
 */
export const GRUPOS_COR: { grupo: string; chaves: { chave: ChaveCor; rotulo: string }[] }[] = [
  { grupo: 'Fundo do sistema', chaves: [
    { chave: '--fundo', rotulo: 'Fundo da página' },
    { chave: '--superficie', rotulo: 'Cartões e painéis' },
    { chave: '--superficie-alt', rotulo: 'Cartões em destaque' },
    { chave: '--borda', rotulo: 'Bordas' },
  ] },
  { grupo: 'Fundo da home', chaves: [
    { chave: '--fundo-home', rotulo: 'Fundo da página inicial' },
  ] },
  { grupo: 'Painéis (lateral e painel de marca do login)', chaves: [
    { chave: '--noite', rotulo: 'Lateral e painel de marca' },
    { chave: '--noite-alt', rotulo: 'Lateral (tom alternativo)' },
  ] },
  { grupo: 'Texto', chaves: [
    { chave: '--tinta', rotulo: 'Texto principal' },
    { chave: '--tinta-suave', rotulo: 'Texto secundário' },
    { chave: '--tinta-fraca', rotulo: 'Texto de apoio e ícones' },
  ] },
  { grupo: 'Marca e botões', chaves: [
    { chave: '--primaria', rotulo: 'Cor de destaque' },
    { chave: '--primaria-forte', rotulo: 'Destaque forte (hover)' },
    { chave: '--primaria-suave', rotulo: 'Fundo de destaque leve' },
    { chave: '--botao', rotulo: 'Botão primário' },
    { chave: '--botao-hover', rotulo: 'Botão primário (hover)' },
  ] },
  { grupo: 'Estados', chaves: [
    { chave: '--sucesso', rotulo: 'Sucesso' },
    { chave: '--aviso', rotulo: 'Atenção' },
    { chave: '--erro', rotulo: 'Erro' },
  ] },
];

/** Todas as variáveis que o tema controla, na ordem dos grupos (usada para limpar o que sobrou ao trocar de tema). */
export const CHAVES_DO_TEMA: ChaveCor[] = GRUPOS_COR.flatMap((g) => g.chaves.map((c) => c.chave));

// [PV-2] OS TEMAS-BASE (seis) e os valores de cada cor (claro e escuro). Para ajustar uma cor de um tema-base, mude o hex aqui; o contraste AA (4,5:1) é conferido por validarTema e por lib/temas.casos.ts.
/**
 * Os temas que vêm com o sistema (não podem ser editados nem apagados, só duplicados).
 *
 * - `cais`: os valores atuais de app/globals.css (nada muda visualmente).
 * - `quente`: lateral marrom-café (≈ #4A3323), botão marrom escuro, fundo creme.
 * - `carvao`: lateral grafite (≈ #17171A), botão quase preto, fundo creme.
 * - `oceano`: lateral azul-petróleo (#0E3B4A), botão petróleo (#0E6A82), fundo azul-gelo (#EAF3F5).
 * - `floresta`: lateral verde-musgo (#1F3A2C), botão verde-floresta (#2D5A3F), fundo verde-névoa (#EEF1E6).
 * - `ameixa`: lateral vinho (#3A1830), botão ameixa (#7C1F49), fundo rosado claro (#F7EEF1).
 *   Nos três novos, sucesso/atenção/erro seguem o mesmo critério dos temas creme (tons escuros no
 *   claro, tons claros no escuro) e nenhum gera aviso de `validarTema`.
 *
 * Ajustes de contraste em relação às imagens de referência (todos para manter 4,5:1 em texto):
 * - sucesso, atenção e erro dos temas creme ficaram mais escuros que os do CAIS, porque o creme é
 *   mais escuro que o branco e o verde/âmbar padrão não chegava a 4,5:1 sobre ele;
 * - o botão do Carvão escuro é um cinza médio (#55555F) e não o quase preto do claro: sobre um
 *   fundo grafite, um botão preto sumiria; com texto branco ele ainda passa de 7:1.
 */
// ⚠️ ATENÇÃO: os valores do tema `cais` devem ficar IGUAIS aos de :root e .dark em app/globals.css. Se mudar lá, mude aqui (e vice-versa), senão o tema padrão "mexe" nas cores ao carregar.
export const TEMAS_BASE: Tema[] = [
  {
    id: 'cais', nome: 'CAIS', base: true,
    claro: {
      '--fundo': '#F6F7FB', '--superficie': '#FFFFFF', '--superficie-alt': '#F1F2F8', '--borda': '#E1E3EC',
      '--fundo-home': '#F6F7FB',
      '--noite': '#14161F', '--noite-alt': '#1B1D2A',
      '--tinta': '#14161F', '--tinta-suave': '#5B6075', '--tinta-fraca': '#8A8FA3',
      '--primaria': '#7052F2', '--primaria-forte': '#5B3FD4', '--primaria-suave': '#EEEAFF',
      '--botao': '#7052F2', '--botao-hover': '#5B3FD4',
      '--sucesso': '#047857', '--aviso': '#B45309', '--erro': '#DC3545',
    },
    escuro: {
      '--fundo': '#14161F', '--superficie': '#1C1F2B', '--superficie-alt': '#242838', '--borda': '#2E3244',
      '--fundo-home': '#14161F',
      '--noite': '#14161F', '--noite-alt': '#1B1D2A',
      '--tinta': '#ECEDF3', '--tinta-suave': '#A3A8BC', '--tinta-fraca': '#6E7389',
      '--primaria': '#8F74FF', '--primaria-forte': '#A48FFF', '--primaria-suave': '#8F74FF24',
      '--botao': '#7052F2', '--botao-hover': '#6A4AF0',
      '--sucesso': '#34D399', '--aviso': '#FBBF24', '--erro': '#F87171',
    },
  },
  {
    id: 'quente', nome: 'Paleta quente', base: true,
    claro: {
      '--fundo': '#F0E8DA', '--superficie': '#FFFDF7', '--superficie-alt': '#EAE0CF', '--borda': '#D9CDB8',
      '--fundo-home': '#F0E8DA',
      '--noite': '#4A3323', '--noite-alt': '#3A281B',
      '--tinta': '#2B1E14', '--tinta-suave': '#6B5646', '--tinta-fraca': '#9C8B7A',
      '--primaria': '#7A4A2A', '--primaria-forte': '#5E3920', '--primaria-suave': '#F1E1CB',
      '--botao': '#4A3323', '--botao-hover': '#392619',
      '--sucesso': '#046A4C', '--aviso': '#9A4408', '--erro': '#B42335',
    },
    escuro: {
      '--fundo': '#1E1610', '--superficie': '#2A2018', '--superficie-alt': '#352A20', '--borda': '#4A3C2E',
      '--fundo-home': '#1E1610',
      '--noite': '#3A281B', '--noite-alt': '#4A3323',
      '--tinta': '#F3EADB', '--tinta-suave': '#C9B9A3', '--tinta-fraca': '#8C7B68',
      '--primaria': '#E0A878', '--primaria-forte': '#EDBE94', '--primaria-suave': '#E0A87824',
      '--botao': '#7A4A2A', '--botao-hover': '#8E5933',
      '--sucesso': '#34D399', '--aviso': '#FBBF24', '--erro': '#F87171',
    },
  },
  {
    id: 'carvao', nome: 'Carvão', base: true,
    claro: {
      '--fundo': '#F0E8DA', '--superficie': '#FFFDF7', '--superficie-alt': '#EAE0CF', '--borda': '#D9CDB8',
      '--fundo-home': '#F0E8DA',
      '--noite': '#17171A', '--noite-alt': '#222226',
      '--tinta': '#17171A', '--tinta-suave': '#5A5650', '--tinta-fraca': '#8F8A80',
      '--primaria': '#2F2F36', '--primaria-forte': '#17171A', '--primaria-suave': '#E6DFD0',
      '--botao': '#141416', '--botao-hover': '#2A2A2F',
      '--sucesso': '#046A4C', '--aviso': '#9A4408', '--erro': '#B42335',
    },
    escuro: {
      '--fundo': '#121214', '--superficie': '#1B1B1F', '--superficie-alt': '#25252A', '--borda': '#35353C',
      '--fundo-home': '#121214',
      '--noite': '#17171A', '--noite-alt': '#222226',
      '--tinta': '#F2EEE6', '--tinta-suave': '#B5B1A8', '--tinta-fraca': '#77746D',
      '--primaria': '#E6E1D6', '--primaria-forte': '#FFFFFF', '--primaria-suave': '#E6E1D624',
      '--botao': '#55555F', '--botao-hover': '#6A6A76',
      '--sucesso': '#34D399', '--aviso': '#FBBF24', '--erro': '#F87171',
    },
  },
  {
    id: 'oceano', nome: 'Oceano', base: true,
    claro: {
      '--fundo': '#EAF3F5', '--superficie': '#FFFFFF', '--superficie-alt': '#DDEBEF', '--borda': '#C5D9DF',
      '--fundo-home': '#EAF3F5',
      '--noite': '#0E3B4A', '--noite-alt': '#0A2E3A',
      '--tinta': '#0B2530', '--tinta-suave': '#46606B', '--tinta-fraca': '#7E96A0',
      '--primaria': '#0E7490', '--primaria-forte': '#0B5B72', '--primaria-suave': '#D6EEF3',
      '--botao': '#0E6A82', '--botao-hover': '#0A5568',
      '--sucesso': '#046A4C', '--aviso': '#9A4408', '--erro': '#B42335',
    },
    escuro: {
      '--fundo': '#0A1B22', '--superficie': '#10272F', '--superficie-alt': '#16333D', '--borda': '#234652',
      '--fundo-home': '#0A1B22',
      '--noite': '#071F28', '--noite-alt': '#0E3B4A',
      '--tinta': '#E6F2F5', '--tinta-suave': '#9FBAC4', '--tinta-fraca': '#6A8793',
      '--primaria': '#4FC3DC', '--primaria-forte': '#7DD3E8', '--primaria-suave': '#4FC3DC24',
      '--botao': '#0E6A82', '--botao-hover': '#117893',
      '--sucesso': '#34D399', '--aviso': '#FBBF24', '--erro': '#F87171',
    },
  },
  {
    id: 'floresta', nome: 'Floresta', base: true,
    claro: {
      '--fundo': '#EEF1E6', '--superficie': '#FBFCF7', '--superficie-alt': '#E3E8D8', '--borda': '#CCD4BC',
      '--fundo-home': '#EEF1E6',
      '--noite': '#1F3A2C', '--noite-alt': '#162C21',
      '--tinta': '#17261D', '--tinta-suave': '#4F6157', '--tinta-fraca': '#86968B',
      '--primaria': '#2F6B45', '--primaria-forte': '#22533A', '--primaria-suave': '#DCEBD9',
      '--botao': '#2D5A3F', '--botao-hover': '#214530',
      '--sucesso': '#046A4C', '--aviso': '#9A4408', '--erro': '#B42335',
    },
    escuro: {
      '--fundo': '#0F1A14', '--superficie': '#16241C', '--superficie-alt': '#1D2F25', '--borda': '#2E4638',
      '--fundo-home': '#0F1A14',
      '--noite': '#12261B', '--noite-alt': '#1B3527',
      '--tinta': '#E8F0E6', '--tinta-suave': '#A9BDAF', '--tinta-fraca': '#72877A',
      '--primaria': '#8FD19E', '--primaria-forte': '#B2E3BC', '--primaria-suave': '#8FD19E24',
      '--botao': '#2F6B47', '--botao-hover': '#3A8058',
      '--sucesso': '#34D399', '--aviso': '#FBBF24', '--erro': '#F87171',
    },
  },
  {
    id: 'ameixa', nome: 'Ameixa', base: true,
    claro: {
      '--fundo': '#F7EEF1', '--superficie': '#FFFBFC', '--superficie-alt': '#F0E1E7', '--borda': '#E0CBD4',
      '--fundo-home': '#F7EEF1',
      '--noite': '#3A1830', '--noite-alt': '#2B1124',
      '--tinta': '#2A1421', '--tinta-suave': '#6A4A5D', '--tinta-fraca': '#9D8190',
      '--primaria': '#9D2A5E', '--primaria-forte': '#7C1F49', '--primaria-suave': '#F8DCE8',
      '--botao': '#7C1F49', '--botao-hover': '#62183A',
      '--sucesso': '#046A4C', '--aviso': '#9A4408', '--erro': '#B42335',
    },
    escuro: {
      '--fundo': '#1A0F17', '--superficie': '#261623', '--superficie-alt': '#321D2E', '--borda': '#4A2E44',
      '--fundo-home': '#1A0F17',
      '--noite': '#2B1124', '--noite-alt': '#3A1830',
      '--tinta': '#F5E9EF', '--tinta-suave': '#CDB1C1', '--tinta-fraca': '#8E7283',
      '--primaria': '#F0A3C4', '--primaria-forte': '#F7BFD8', '--primaria-suave': '#F0A3C424',
      '--botao': '#9D2A5E', '--botao-hover': '#B03670',
      '--sucesso': '#34D399', '--aviso': '#FBBF24', '--erro': '#F87171',
    },
  },
];

// [PV-3] O TEMA INICIAL do sistema: 'cais' como padrão e nenhuma empresa com tema próprio. Troque o id para outro tema-base se quiser que o sistema abra com outra aparência.
/**
 * O valor de `dados.temas` quando nada foi configurado ainda (e para quem tem dados antigos sem esse campo).
 * @returns um objeto novo a cada chamada (nada compartilhado).
 */
export function temasIniciais(): DadosTemas {
  return { personalizados: [], padraoId: 'cais', porEmpresa: {} };
}

/**
 * Devolve a paleta do tema para o modo pedido.
 * @param tema - o tema.
 * @param modo - 'claro' ou 'escuro'.
 * @example paletaDoTema(TEMAS_BASE[0], 'escuro')['--fundo'] // '#14161F'
 */
export function paletaDoTema(tema: Tema, modo: ModoTema): Paleta {
  return modo === 'escuro' ? tema.escuro : tema.claro;
}

/**
 * Lista completa de temas: os base + os personalizados.
 * @param personalizados - `dados.temas.personalizados`.
 */
export function listaDeTemas(personalizados: Tema[]): Tema[] {
  return [...TEMAS_BASE, ...personalizados];
}

/** true se o texto é `#RRGGBB` ou `#RRGGBBAA`. */
function hexValido(hex: unknown): hex is string {
  return typeof hex === 'string' && /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex);
}

/**
 * Luminância relativa de uma cor (fórmula do WCAG). Ignora a transparência.
 * @param hex - cor válida `#RRGGBB` ou `#RRGGBBAA`.
 */
function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  // Converte do espaço sRGB (o da tela) para luz linear, como manda o WCAG.
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Razão de contraste do WCAG entre duas cores (de 1 a 21). Texto normal precisa de 4,5 ou mais (AA).
 * @param hexA - uma cor `#RRGGBB`.
 * @param hexB - a outra cor.
 * @returns a razão; 0 se alguma das cores for inválida.
 * @example contraste('#000000', '#FFFFFF') // 21
 */
export function contraste(hexA: string, hexB: string): number {
  if (!hexValido(hexA) || !hexValido(hexB)) return 0;
  const la = luminancia(hexA);
  const lb = luminancia(hexB);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// [PV-4] AS REGRAS DE AVISO DE CONTRASTE: qual cor é conferida sobre qual fundo e o mínimo (4,5:1 = AA). Regra nova é só mais uma linha em CONFERENCIAS; para mudar o mínimo, mude MINIMO_AA.
/** Contraste mínimo para texto normal (WCAG AA). */
const MINIMO_AA = 4.5;

/**
 * O que `validarTema` confere: a cor `texto` sobre cada fundo da lista.
 * `--tinta-fraca` não entra: é cor de placeholder e ícone, que pede só 3:1 (e o próprio CAIS usa menos que isso).
 */
const CONFERENCIAS: { texto: ChaveCor; sobre: ChaveCor[]; rotulo: string }[] = [
  { texto: '--tinta', sobre: ['--fundo', '--superficie', '--fundo-home'], rotulo: 'o texto principal' },
  { texto: '--tinta-suave', sobre: ['--fundo', '--superficie'], rotulo: 'o texto secundário' },
  { texto: '--primaria', sobre: ['--superficie'], rotulo: 'a cor de destaque' },
  { texto: '--sucesso', sobre: ['--superficie'], rotulo: 'a cor de sucesso' },
  { texto: '--aviso', sobre: ['--superficie'], rotulo: 'a cor de atenção' },
  { texto: '--erro', sobre: ['--superficie'], rotulo: 'a cor de erro' },
];

/**
 * Confere um tema e lista os problemas. É só aviso: quem chama decide se deixa salvar.
 * Avisa de: hex inválido, texto abaixo de 4,5:1 sobre o fundo e botão com texto branco abaixo de 4,5:1.
 * @param tema - o tema a conferir (as duas paletas).
 * @returns a lista de avisos (vazia = tudo certo), sempre com a cor e o modo que causam o problema.
 * @example validarTema({ ...tema, claro: { ...tema.claro, '--botao': '#EEEEEE' } }) // aviso em '--botao' (claro)
 */
export function validarTema(tema: Tema): AvisoTema[] {
  const avisos: AvisoTema[] = [];
  for (const modo of ['claro', 'escuro'] as ModoTema[]) {
    const paleta = paletaDoTema(tema, modo);
    // Hex inválido: avisa e deixa de conferir contraste dessa cor (a conta não faria sentido).
    for (const chave of CHAVES_DO_TEMA) {
      if (!hexValido(paleta[chave])) avisos.push({ chave, modo, mensagem: 'Cor inválida: use o formato #RRGGBB, por exemplo #4A3323.' });
    }
    for (const c of CONFERENCIAS) {
      for (const fundo of c.sobre) {
        if (!hexValido(paleta[c.texto]) || !hexValido(paleta[fundo])) continue;
        const razao = contraste(paleta[c.texto], paleta[fundo]);
        if (razao < MINIMO_AA) {
          avisos.push({ chave: c.texto, modo, mensagem: `Contraste ${razao.toFixed(1).replace('.', ',')}:1 de ${c.rotulo} sobre ${fundo}; o mínimo para leitura é 4,5:1.` });
        }
      }
    }
    // Botão: o texto dele é branco, então a conta é do fundo do botão contra o branco.
    for (const chave of ['--botao', '--botao-hover']) {
      if (!hexValido(paleta[chave])) continue;
      const razao = contraste('#FFFFFF', paleta[chave]);
      if (razao < MINIMO_AA) {
        avisos.push({ chave, modo, mensagem: `Contraste ${razao.toFixed(1).replace('.', ',')}:1 do texto branco sobre o botão; o mínimo é 4,5:1. Use um tom mais escuro.` });
      }
    }
  }
  return avisos;
}

// [PV-5] OS LIMITES DO LOGO DA EMPRESA: tamanho máximo do arquivo (LOGO_MAX_BYTES), formatos aceitos (LOGO_TIPOS) e tamanho do nome (NOME_EMPRESA_MAX). O logo vira texto (data URL) dentro do localStorage, que tem cerca de 5 MB para o sistema inteiro: por isso o teto é baixo. Para aceitar logo maior, suba LOGO_MAX_BYTES (e confira o espaço do navegador).
/** Tamanho máximo do arquivo de logo: 150 KB. */
export const LOGO_MAX_BYTES = 150 * 1024;

/** Formatos de logo aceitos. SVG entra porque, dentro de `<img>`, o navegador não executa script nenhum. */
export const LOGO_TIPOS = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'] as const;

/** Tamanho máximo do nome da empresa que acompanha o logo. */
const NOME_EMPRESA_MAX = 40;

/**
 * Forma exata de um data URL de logo aceito. O prefixo fixo barra `javascript:`, `data:text/html` e
 * qualquer outro tipo; o resto só pode ser base64.
 */
const DATA_URL_LOGO = /^data:image\/(?:png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

/**
 * true se o valor é um data URL de logo seguro: texto, no formato certo e com no máximo `LOGO_MAX_BYTES`
 * depois de decodificado. Usado em tudo que vem do navegador (nunca se confia no localStorage).
 * @param valor - qualquer coisa.
 */
function logoValido(valor: unknown): valor is string {
  if (typeof valor !== 'string') return false;
  // Confere o tamanho ANTES da regex: texto gigante não chega a ser analisado. Base64 usa 4 letras para cada 3 bytes.
  if (valor.length > Math.ceil((LOGO_MAX_BYTES * 4) / 3) + 64) return false;
  if (!DATA_URL_LOGO.test(valor)) return false;
  const base64 = valor.slice(valor.indexOf(',') + 1);
  const preenchimento = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return (base64.length * 3) / 4 - preenchimento <= LOGO_MAX_BYTES;
}

/**
 * Confere um arquivo escolhido pelo administrador (tipo e tamanho) antes de ler.
 * @param arq - o arquivo (só `type` e `size` são lidos).
 * @returns a mensagem de erro em português, ou null se o arquivo serve.
 * @example validarArquivoLogo({ type: 'image/gif', size: 1000 }) // 'Formato não aceito: use PNG, JPG, WebP ou SVG.'
 */
export function validarArquivoLogo(arq: { type: string; size: number }): string | null {
  if (!(LOGO_TIPOS as readonly string[]).includes(arq.type)) return 'Formato não aceito: use PNG, JPG, WebP ou SVG.';
  if (arq.size <= 0) return 'O arquivo está vazio. Escolha outra imagem.';
  if (arq.size > LOGO_MAX_BYTES) return `A imagem tem ${Math.ceil(arq.size / 1024)} KB; o máximo é ${LOGO_MAX_BYTES / 1024} KB. Reduza a imagem e tente de novo.`;
  return null;
}

/**
 * Lê o arquivo de logo e devolve um data URL. Rejeita (com `Error` de mensagem em português) se o arquivo
 * for inválido ou a leitura falhar. Confere de novo o resultado: o tipo do arquivo vem do sistema e pode mentir.
 * @param arq - o arquivo escolhido no `<input type="file">`.
 * @returns o data URL `data:image/...;base64,...`.
 * @example const url = await lerArquivoLogo(input.files[0]);
 */
export function lerArquivoLogo(arq: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const erro = validarArquivoLogo(arq);
    if (erro) { reject(new Error(erro)); return; }
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem. Tente de novo.'));
    leitor.onload = () => {
      const url = leitor.result;
      if (logoValido(url)) resolve(url);
      else reject(new Error('A imagem não é válida. Use um PNG, JPG, WebP ou SVG de verdade.'));
    };
    leitor.readAsDataURL(arq);
  });
}

/**
 * Limpa o nome da empresa: tira `<`, `>` e caracteres de controle (nada de HTML), apara os espaços e corta em 40.
 * @returns o nome limpo, ou undefined se não sobrou nada.
 */
function limparNomeEmpresa(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const limpo = valor.replace(/[<>\u0000-\u001F\u007F]/g, '').trim().slice(0, NOME_EMPRESA_MAX).trim();
  return limpo || undefined;
}

/**
 * Confere a identidade de um tema vinda de fora (localStorage ou tela): descarta campo de tipo errado,
 * data URL inválido ou grande demais e nome vazio. Só devolve campos bons, sem chave `undefined`.
 * @param valor - a `identidade` lida (qualquer coisa).
 * @returns a identidade limpa, ou undefined se não sobrou nenhum campo.
 * @example sanitizarIdentidade({ nomeEmpresa: ' Aurora ', logoClaro: 'javascript:x' }) // { nomeEmpresa: 'Aurora' }
 */
export function sanitizarIdentidade(valor: unknown): IdentidadeTema | undefined {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return undefined;
  const v = valor as Record<string, unknown>;
  const identidade: IdentidadeTema = {};
  const nome = limparNomeEmpresa(v.nomeEmpresa);
  if (nome) identidade.nomeEmpresa = nome;
  if (logoValido(v.logoClaro)) identidade.logoClaro = v.logoClaro;
  if (logoValido(v.logoEscuro)) identidade.logoEscuro = v.logoEscuro;
  return Object.keys(identidade).length > 0 ? identidade : undefined;
}

/**
 * O logo a mostrar sobre um fundo: no escuro `logoEscuro ?? logoClaro`; no claro `logoClaro ?? logoEscuro`.
 * Revalida o data URL (o tema pode ter vindo de um caminho que não passou por `sanitizarIdentidade`).
 * @param tema - o tema ativo.
 * @param fundo - o fundo onde o logo será desenhado.
 * @returns o data URL, ou null se o tema não tem logo (quem chama usa o `CaisLogo`).
 * @example logoDoTema(tema, 'escuro') // logoEscuro, ou logoClaro se não houver
 */
export function logoDoTema(tema: Tema, fundo: ModoTema): string | null {
  const { logoClaro, logoEscuro } = tema.identidade ?? {};
  const candidatos = fundo === 'escuro' ? [logoEscuro, logoClaro] : [logoClaro, logoEscuro];
  return candidatos.find(logoValido) ?? null;
}

/**
 * O nome da empresa do tema, limpo (sem HTML, aparado, até 40 caracteres).
 * @returns o texto ou null se o tema não tem nome.
 */
export function nomeDaMarca(tema: Tema): string | null {
  return limparNomeEmpresa(tema.identidade?.nomeEmpresa) ?? null;
}

/**
 * Copia um tema (base ou não) para um tema novo editável. Nada é compartilhado com o original
 * (a identidade também é copiada, não referenciada).
 * @param tema - o tema de origem.
 * @param novoId - id do novo tema (ex.: 'custom-3').
 * @param novoNome - nome do novo tema.
 * @returns o tema novo, com `base: false`.
 * @example duplicarTema(TEMAS_BASE[1], 'custom-1', 'Quente da Aurora').base // false
 */
export function duplicarTema(tema: Tema, novoId: string, novoNome: string): Tema {
  const copia: Tema = { id: novoId, nome: novoNome, base: false, claro: { ...tema.claro }, escuro: { ...tema.escuro } };
  // Só põe a chave quando o original tem identidade: tema sem marca continua sem a propriedade.
  if (tema.identidade) copia.identidade = { ...tema.identidade };
  return copia;
}

/**
 * Decide qual tema vale: o da empresa, se ela tem um escolhido, senão o padrão do sistema.
 * Não confere se o tema ainda existe (quem aplica cai no 'cais' nesse caso).
 * @param args.padraoId - tema padrão do sistema.
 * @param args.porEmpresa - empresaId → temaId.
 * @param args.empresaId - a empresa da pessoa (vazio/undefined para admin e telas públicas).
 * @example resolverTemaId({ padraoId: 'cais', porEmpresa: { emp_a: 'quente' }, empresaId: 'emp_a' }) // 'quente'
 */
export function resolverTemaId(args: { padraoId: string; porEmpresa: Record<string, string>; empresaId?: string }): string {
  const { padraoId, porEmpresa, empresaId } = args;
  return (empresaId && porEmpresa[empresaId]) || padraoId;
}

/**
 * Descobre de qual empresa vem o tema de quem está logado.
 * - Empresa: a empresa da própria pessoa.
 * - Profissional: a empresa da primeira alocação ativa hoje (projeto não concluído); sem alocação, nenhuma.
 * - Administrador (e telas públicas, sem perfil): nenhuma, vale o padrão do sistema.
 * @param args.perfil - perfil da sessão (undefined = ninguém logado).
 * @param args.pessoaId - id da pessoa logada.
 * @param args.hoje - data de hoje AAAA-MM-DD (passada de fora para a função continuar pura).
 * @param args.pessoas - as pessoas (só id e empresaId são lidos).
 * @param args.alocacoes - as alocações (pessoaId, projetoId, inicio, fim).
 * @param args.projetos - os projetos (id, empresaId, status).
 * @returns o id da empresa ou undefined.
 */
export function empresaDoTema(args: {
  perfil?: Perfil;
  pessoaId?: string;
  hoje: string;
  pessoas: { id: string; empresaId: string }[];
  alocacoes: { pessoaId: string; projetoId: string; inicio: string; fim: string }[];
  projetos: { id: string; empresaId: string; status: string }[];
}): string | undefined {
  const { perfil, pessoaId, hoje, pessoas, alocacoes, projetos } = args;
  if (!pessoaId) return undefined;
  if (perfil === 'empresa') return pessoas.find((p) => p.id === pessoaId)?.empresaId || undefined;
  if (perfil === 'profissional') {
    // Ativa = hoje cai entre início e fim (datas AAAA-MM-DD comparam bem como texto) e o projeto não acabou.
    const ativa = alocacoes.find((a) => {
      if (a.pessoaId !== pessoaId || a.inicio > hoje || a.fim < hoje) return false;
      const projeto = projetos.find((p) => p.id === a.projetoId);
      return !!projeto && projeto.status !== 'concluido';
    });
    return ativa ? projetos.find((p) => p.id === ativa.projetoId)?.empresaId || undefined : undefined;
  }
  return undefined;
}

/**
 * Confere (e conserta) o que foi lido do navegador para `dados.temas`.
 * Dados antigos, sem o campo, viram o valor inicial; campo com formato estranho também.
 * @param valor - o `temas` lido (qualquer coisa).
 * @returns um `DadosTemas` sempre utilizável.
 * @example normalizarTemas(undefined) // { personalizados: [], padraoId: 'cais', porEmpresa: {} }
 */
export function normalizarTemas(valor: unknown): DadosTemas {
  const inicial = temasIniciais();
  if (typeof valor !== 'object' || valor === null) return inicial;
  const v = valor as Record<string, unknown>;
  // A identidade (logo e nome) é o único campo que vira <img src>: passa por sanitizarIdentidade, que descarta
  // data URL inválido ou grande demais vindo do localStorage, mas MANTÉM o que está certo.
  const personalizados = Array.isArray(v.personalizados)
    ? (v.personalizados as unknown[]).filter((t): t is Tema => typeof t === 'object' && t !== null
      && typeof (t as Tema).id === 'string' && typeof (t as Tema).claro === 'object' && typeof (t as Tema).escuro === 'object')
      .map(comIdentidadeLimpa)
    : [];
  const porEmpresa = typeof v.porEmpresa === 'object' && v.porEmpresa !== null && !Array.isArray(v.porEmpresa)
    ? (v.porEmpresa as Record<string, string>) : {};
  const padraoId = typeof v.padraoId === 'string' ? v.padraoId : inicial.padraoId;
  return { personalizados, padraoId, porEmpresa };
}

/**
 * Devolve o tema com a `identidade` conferida por `sanitizarIdentidade`. Se nada sobrar, a chave some
 * (em vez de ficar `identidade: undefined`).
 */
function comIdentidadeLimpa(tema: Tema): Tema {
  const { identidade, ...resto } = tema;
  const limpa = sanitizarIdentidade(identidade);
  return limpa ? { ...resto, identidade: limpa } : resto;
}

/** true se o id é de um dos temas-base. */
function ehBase(id: string): boolean {
  return TEMAS_BASE.some((t) => t.id === id);
}

/** true se o id existe (base ou personalizado). */
function existe(temas: DadosTemas, id: string): boolean {
  return ehBase(id) || temas.personalizados.some((t) => t.id === id);
}

/**
 * Cria ou substitui um tema personalizado (upsert por id). Tema-base é ignorado: só se duplica.
 * @returns os temas novos (o objeto de entrada nunca é alterado).
 */
export function salvarNosTemas(temas: DadosTemas, tema: Tema): DadosTemas {
  if (tema.base || ehBase(tema.id)) return temas;
  // Também confere a identidade ao salvar: um logo inválido nunca chega ao localStorage.
  const novo: Tema = comIdentidadeLimpa({ ...tema, base: false });
  const ja = temas.personalizados.some((t) => t.id === tema.id);
  return { ...temas, personalizados: ja ? temas.personalizados.map((t) => (t.id === tema.id ? novo : t)) : [...temas.personalizados, novo] };
}

/**
 * Apaga um tema personalizado. Se era o padrão do sistema, o padrão volta a 'cais'; empresas que o usavam
 * voltam ao padrão (a entrada some de `porEmpresa`). Tema-base não é apagado.
 */
export function removerDosTemas(temas: DadosTemas, id: string): DadosTemas {
  if (ehBase(id) || !temas.personalizados.some((t) => t.id === id)) return temas;
  const porEmpresa = Object.fromEntries(Object.entries(temas.porEmpresa).filter(([, temaId]) => temaId !== id));
  return {
    personalizados: temas.personalizados.filter((t) => t.id !== id),
    padraoId: temas.padraoId === id ? 'cais' : temas.padraoId,
    porEmpresa,
  };
}

/** Define o tema padrão do sistema. Id que não existe é ignorado. */
export function definirPadraoNosTemas(temas: DadosTemas, id: string): DadosTemas {
  return existe(temas, id) ? { ...temas, padraoId: id } : temas;
}

/**
 * Define (ou, com `null`, remove) o tema de uma empresa. Id que não existe é ignorado.
 * @example definirDaEmpresaNosTemas(temas, 'emp_vertice', 'quente')
 */
export function definirDaEmpresaNosTemas(temas: DadosTemas, empresaId: string, id: string | null): DadosTemas {
  if (id === null) {
    // APAGA: tira só a entrada dessa empresa; as outras ficam como estão.
    return { ...temas, porEmpresa: Object.fromEntries(Object.entries(temas.porEmpresa).filter(([chave]) => chave !== empresaId)) };
  }
  return existe(temas, id) ? { ...temas, porEmpresa: { ...temas.porEmpresa, [empresaId]: id } } : temas;
}
