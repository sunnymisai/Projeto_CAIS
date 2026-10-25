# Módulo de temas — contrato entre as três frentes

Documento de trabalho da branch `feat/temas`. Os três agentes seguem este contrato para não
colidirem. Leia também o `CLAUDE.md` (padrão de comentários, design system, quatro estados).

## Objetivo

O Administrador escolhe e personaliza o tema do sistema inteiro dentro do próprio sistema, e pode
atribuir um tema a cada empresa. Só o perfil Administrador acessa a tela de temas.

## Temas-base (vieram de duas imagens de referência do time)

| id | nome | lateral/painel de marca (`--noite`) | botão primário | fundo do app/home |
|---|---|---|---|---|
| `cais` | CAIS (atual) | o que já existe hoje | o que já existe hoje | o que já existe hoje |
| `quente` | Paleta quente | marrom-café ≈ `#4A3323` | marrom-café escuro ≈ `#4A3323` | creme ≈ `#F0E8DA`, cartões ≈ `#FFFDF7` |
| `carvao` | Carvão | grafite ≈ `#17171A` | quase preto ≈ `#141416` | creme ≈ `#F0E8DA`, cartões ≈ `#FFFDF7` |
| `oceano` | Oceano | azul-petróleo ≈ `#0E3B4A` | petróleo ≈ `#0E6A82` | azul-gelo ≈ `#EAF3F5`, cartões brancos |
| `floresta` | Floresta | verde-musgo ≈ `#1F3A2C` | verde-floresta ≈ `#2D5A3F` | verde-sálvia ≈ `#EEF1E6`, cartões ≈ `#FBFCF7` |
| `ameixa` | Ameixa | ameixa ≈ `#3A1830` | vinho ≈ `#7C1F49` | rosé ≈ `#F7EEF1`, cartões ≈ `#FFFBFC` |

Cada tema tem duas paletas: `claro` e `escuro`. O botão claro/escuro (`ThemeToggle`) continua valendo
e escolhe qual das duas aplicar. Os valores finos são do Agente 1; ajuste para manter contraste AA
(4,5:1 em texto) e documente o que mudou.

## Tokens que o tema controla

Todos são variáveis CSS já existentes em `app/globals.css`, mais os novos (marcados com ★).
O tema só troca o VALOR das variáveis; as classes Tailwind continuam as mesmas.

| Grupo (rótulo na tela) | Variáveis |
|---|---|
| Fundo do sistema | `--fundo`, `--superficie`, `--superficie-alt`, `--borda` |
| ★ Fundo da home | `--fundo-home` (a página pública `/` usa isto em vez de `--fundo`) |
| ★ Painéis (lateral e painel de marca do login) | `--noite`, `--noite-alt` (hoje `--color-noite`/`noite-alt` no `@theme inline`) |
| Texto | `--tinta`, `--tinta-suave`, `--tinta-fraca` |
| Marca e botões | `--primaria`, `--primaria-forte`, `--primaria-suave`, `--botao`, `--botao-hover` |
| Estados | `--sucesso`, `--aviso`, `--erro` |
| Gráficos | `--grafico-*` (opcional na tela; o tema-base pode herdar do padrão) |
| ★ Extras (Agente 3) | `--marca-clara` (lilás do item ativo do menu), `--veu` (fundo do modal), `--sobre-cor` (texto sobre `--botao`/`--primaria`; claro e escuro `#FFFFFF`), `--sobre-estado` (texto sobre selos de `--erro`/`--sucesso`; claro `#FFFFFF`, escuro `#14161F`). Já ligados ao `@theme inline` (`text-sobre-cor`, `text-sobre-estado`, `bg-veu`, `bg-fundo-home`...). |

`--marca` (`#7C5CFF`) continua sendo só do logo: o tema NÃO a altera.

## API (cada frente implementa a sua parte e consome as outras)

### `lib/temas.ts` (Agente 1, funções puras, sem React)

```ts
export type ChaveCor = '--fundo' | '--fundo-home' | '--noite' | /* ...os tokens da tabela... */ string;
export type Paleta = Record<ChaveCor, string>;           // valores em hex (#RRGGBB)
export interface Tema {
  id: string;            // 'cais' | 'quente' | 'carvao' | 'custom-<n>'
  nome: string;
  base: boolean;         // true = não pode ser apagado nem editado, só duplicado
  claro: Paleta;
  escuro: Paleta;
}
export const GRUPOS_COR: { grupo: string; chaves: { chave: ChaveCor; rotulo: string }[] }[];
export const TEMAS_BASE: Tema[];                          // cais, quente, carvao
export function paletaDoTema(tema: Tema, modo: 'claro' | 'escuro'): Paleta;
export function contraste(hexA: string, hexB: string): number;        // razão WCAG
export function validarTema(tema: Tema): { chave: ChaveCor; modo: 'claro' | 'escuro'; mensagem: string }[];
export function duplicarTema(tema: Tema, novoId: string, novoNome: string): Tema;
export function resolverTemaId(args: { padraoId: string; porEmpresa: Record<string, string>; empresaId?: string }): string;
```

`validarTema` avisa (não bloqueia): texto sobre fundo abaixo de 4,5:1, botão com texto branco abaixo
de 4,5:1, hex inválido. Escreva `lib/temas.casos.ts` no mesmo estilo dos outros `*.casos.ts`.

### Dados e store (Agente 1, em `lib/store.tsx`)

- Novo campo `temas` dentro de `Dados`: `{ personalizados: Tema[]; padraoId: string; porEmpresa: Record<string, string> }`.
- Valor inicial: `{ personalizados: [], padraoId: 'cais', porEmpresa: {} }`.
- NÃO apague dados existentes do navegador: leitura antiga sem `temas` recebe o valor inicial
  (não precisa trocar a `CHAVE`; se achar que precisa, explique o porquê e atualize a regra de
  `formatoValido`).
- Ações em `useDados()`: `salvarTema(tema)`, `removerTema(id)`, `definirTemaPadrao(id)`,
  `definirTemaEmpresa(empresaId, id | null)`. Remover um tema em uso cai para `cais` (padrão) ou
  volta a empresa ao padrão. Marque com `// GRAVA:` / `// APAGA:`.
- Lista completa de temas = `TEMAS_BASE` + `dados.temas.personalizados`.

### `lib/tema.tsx` (Agente 1, provider e hook)

- `TemaProvider` (montado em `app/providers.tsx`, dentro do `DadosProvider` e do auth).
- `useTema()` devolve `{ tema: Tema; modo: 'claro' | 'escuro'; temas: Tema[] }`.
- Qual tema vale: perfil Administrador e telas públicas (login, home) usam `padraoId`; pessoa de
  perfil Empresa usa o tema da sua empresa; profissional usa o tema da empresa em que está alocado
  (pegue o da primeira alocação ativa; sem alocação, `padraoId`). Use `resolverTemaId`.
- Aplicar = gravar as variáveis em `document.documentElement.style` (`setProperty`) e limpar as que
  não pertencem mais ao tema. Rodar de novo ao trocar de tema OU de modo claro/escuro.
- Anti-piscada: ao lado do script de modo escuro em `app/layout.tsx`, guarde o último mapa de
  variáveis aplicado numa chave própria do `localStorage` (ex.: `cais-tema-aplicado`) e reaplique-o
  antes da primeira pintura. Tudo dentro de try/catch (localStorage pode falhar).

### Tela do administrador (Agente 2)

- Rota `app/(sistema)/temas/page.tsx`, registrada em `components/shell/navegacao.ts` (seção
  "Produto" ou "Cadastros", perfil Administrador) e liberada só ao Administrador em
  `lib/permissoes.ts` (+ casos em `lib/permissoes.casos.ts`; os casos existentes devem continuar
  passando).
- Componentes em `components/temas/`. Use só `components/ui/*` e tokens; se faltar uma variação,
  melhore o componente do design system.
- Funcionalidades: lista de temas (base + personalizados) com cartão de prévia; escolher o padrão
  do sistema; duplicar e editar (nome + seletores de cor por grupo da tabela acima, com campo
  hexadecimal e `<input type="color">`, editando claro e escuro); prévia ao vivo isolada (um bloco
  de amostra que aplica as variáveis só dentro dele, via `style`, SEM mudar o sistema até salvar);
  avisos de `validarTema`; salvar, apagar (só personalizados) e restaurar; seção "Tema por empresa"
  com uma lista de empresas e um seletor (padrão do sistema ou um tema específico).
- Quatro estados (carregando, vazio, erro, com dado) e acessibilidade do `CLAUDE.md`.
- Documente os componentes novos na página `/design-system`.

### Cobertura do sistema inteiro (Agente 3)

- Em `app/globals.css`: crie `--fundo-home` e `--noite`/`--noite-alt` como variáveis em `:root` e
  `.dark` (valores = o visual atual, para NADA mudar visualmente), e ligue-as ao `@theme inline`
  (`--color-noite: var(--noite)` etc.). Faça `--fundo-home` valer no fundo da home (`app/page.tsx` e
  `components/home/*`).
- Varra o projeto atrás de cor fixa fora dos tokens (`#hex`, `rgb(`, `bg-[#...]`, `text-[#...]`,
  `dark:text-[#14161F]` em 5 componentes, `#B9A7FF` no item ativo da `Sidebar`, painéis em
  `components/paineis/*`, `components/home/*`, `BrandPanel`, `Sidebar`, `Topbar`, login) e troque por
  token. O que for cor de DADO ou identidade (logo `--marca`, `--color-pilar-*`, avatares, capas de
  projeto em `components/projetos/cores.ts`, gráficos `--grafico-*`) pode ficar, mas liste no
  relatório o que deixou e por quê.
- Crie tokens novos só quando necessário (`--sobre-cor` para texto sobre botão e `--marca-clara`
  para o item ativo da barra são sugestões já citadas no `docs/ONDE-PARAMOS.md`) e adicione-os à
  tabela de tokens deste documento e ao `@theme inline`.
- Resultado esperado: trocar os valores das variáveis no console do navegador muda o sistema todo,
  sem sobrar bloco com a cor antiga.

## Regras comuns

- Português do Brasil em tudo. Padrão de comentários do `CLAUDE.md` em todo código novo ou alterado
  (cabeçalho, JSDoc, rótulos `GRAVA/APAGA/NAVEGA`, `[PV-n]` nos pontos vitais). NÃO rode scripts: o
  coordenador roda `mapa-do-codigo`, `tsc`, lint e build no fim.
- Não instale bibliotecas. Não mexa em `package.json`.
- Cada agente só edita os arquivos da sua frente. Se precisar de algo de outra frente, siga o
  contrato acima e anote no relatório final. Em arquivo compartilhado (`app/globals.css`,
  `app/providers.tsx`, `app/layout.tsx`, `lib/store.tsx`), faça edições pequenas e localizadas.
- Relatório final (curto): arquivos criados e alterados, o que ficou pendente, desvios do contrato.

---

## Identidade da empresa no tema (logo e nome) — fase 2

Decidido com o time: o tema pode trazer a marca da empresa. Ela substitui o logo do CAIS só nos
cabeçalhos; o CAIS continua visível, fixo, em outro lugar que o tema não controla.

### Dados (Armando, `lib/temas.ts`, `lib/temaAtivo.tsx`, `lib/store.tsx`, `lib/temas.casos.ts`)

```ts
export interface IdentidadeTema {
  nomeEmpresa?: string;   // texto opcional exibido ao lado do logo (até 40 caracteres, sem HTML)
  logoClaro?: string;     // data URL (PNG/JPG/WebP/SVG) para usar sobre fundo CLARO
  logoEscuro?: string;    // data URL para usar sobre fundo ESCURO (os painéis --noite são sempre escuros)
}
// Tema ganha: identidade?: IdentidadeTema   (opcional; temas-base não têm)

export const LOGO_MAX_BYTES = 150 * 1024;
export const LOGO_TIPOS = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'] as const;
export function validarArquivoLogo(arq: { type: string; size: number }): string | null; // mensagem de erro em PT-BR ou null
export function lerArquivoLogo(arq: File): Promise<string>;                              // devolve data URL; rejeita se inválido
export function logoDoTema(tema: Tema, fundo: 'claro' | 'escuro'): string | null;       // escuro: logoEscuro ?? logoClaro; claro: logoClaro ?? logoEscuro; sem nenhum: null
export function nomeDaMarca(tema: Tema): string | null;                                  // nomeEmpresa aparado, ou null
```

Regras: `normalizarTemas` e `duplicarTema` preservam `identidade`; um data URL que não comece com
`data:image/png|jpeg|webp|svg+xml;base64,` é descartado ao ler do navegador (nunca confie no que
veio do localStorage); `validarTema` não avisa sobre identidade (é opcional). Casos de teste novos
em `lib/temas.casos.ts` para tudo isso.

### Componentes (Renato, `components/marca/`, `Sidebar.tsx`, `BrandPanel.tsx`, `TopoHome.tsx`, rodapés)

- `components/marca/LogoDaMarca.tsx`: props `{ fundo: 'claro' | 'escuro'; className?: string }`.
  Lê `useTemaAtivo()`. Com logo no tema: `<img>` (nunca `dangerouslySetInnerHTML`) com `alt` = nome
  da empresa ou "Logo da empresa", altura limitada (ex.: `h-8`, `max-w` fixo, `object-contain`), e o
  `nomeDaMarca` ao lado quando houver. Sem logo: o `CaisLogo` de hoje.
- Usar `LogoDaMarca` no topo da Sidebar (`fundo="escuro"`), no painel de marca do login
  (`fundo="escuro"`) e no topo da home (`fundo` conforme o modo claro/escuro atual).
- `components/marca/SeloCais.tsx`: selo fixo "Plataforma CAIS" (símbolo + nome do CAIS, texto
  legível, contraste AA), NUNCA depende do tema. Aparece em: rodapé da Sidebar (também na gaveta do
  celular), rodapé do login (`AcessoLayout`/`BrandPanel`, o que for melhor, visível também no
  celular) e rodapé da home (`RodapeHome`). O `<title>` da aba continua "CAIS".
- Respeitar `CLAUDE.md`: tokens (sem hex solto), claro e escuro, 375 px, foco/teclado, `alt`.

### Editor (coordenador, `components/temas/*`, página `/temas`)

Campos de upload de logo (claro e escuro), nome da empresa, remover logo, mensagens de erro de
`validarArquivoLogo`, e a prévia (`PreviaTema`) mostrando o logo.
