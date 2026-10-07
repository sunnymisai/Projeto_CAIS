# Changelog do CAIS

Cada entrada lista o que foi criado, modificado e removido.

## Bloco C: três perfis (branch `feat/tres-perfis`)

### C01: regras de permissão e escopo (só `lib/`)
- Criado: `lib/permissoes.ts` (`ROTAS_POR_PERFIL`, `podeAcessar`, `podeFazer`), `lib/escopo.ts` (`projetosVisiveis`, `podeVerProjeto`, `tarefasVisiveis`, `alocacoesVisiveis`, `empresasVisiveis`, `pessoasVisiveis`) e `lib/permissoes.casos.ts` (34 casos; rode `node --experimental-strip-types lib/permissoes.casos.ts`).
- Modificado: `tsconfig.json` ganhou `allowImportingTsExtensions` (só os arquivos acima usam `import ... from './x.ts'`, para o Node achar os módulos).
- Nenhuma tela foi alterada. Regras ambíguas estão marcadas `// TODO(PROGLOGIC): confirmar`.

### C02: login dos três perfis e proteção de rota
- Modificado: `lib/auth.tsx` (sem bloqueio de perfil; `CONTA_DEMO` virou `CONTAS_DEMO` com as 4 contas: admin, Ana, Marcos/Vértice e Patrícia/Aurora; motivo `perfil` removido), `components/LoginForm.tsx` (seletor "Entrar como…" no lugar de "Preencher"; mensagem de perfil sem acesso removida), `app/(sistema)/layout.tsx` (usa `podeAcessar`), `app/sem-permissao/page.tsx` (explica o motivo; botões "Voltar ao painel" e "Entrar com outra conta").
- Removido: o bloqueio `perfil !== admin` e a mensagem "perfil sem acesso".
- Pendência: `/painel` mostra o painel do admin para Empresa e Profissional até o C03.

## Bloco B: homepage pública (branch `feat/homepage`)

### Criado
- `components/marca/TresPilares.tsx`: diagrama dos três pilares (props `tamanho`, `animado`, `className`), usado no login e na homepage.
- `components/home/secoes.ts`: lista de âncoras (id + rótulo) usada pelo topo e pelo rodapé.
- `components/home/TopoHome.tsx`: topo fixo com logo, âncoras, tema, "Entrar" / "Ir para o sistema" e menu do celular acessível pelo teclado.
- `components/home/Hero.tsx`: abertura com "formar, alocar e acompanhar", dois botões e o diagrama dos pilares.
- `components/home/CabecalhoSecao.tsx`: rótulo + título (h2) + descrição, repetido em todas as seções.
- `components/home/Problema.tsx` (#programa), `Pilares.tsx`, `ComoFunciona.tsx` (#como-funciona), `ParaSuaEmpresa.tsx` (#empresa, com prévia ilustrativa de dados fictícios), `Perfis.tsx`.
- `components/home/Perguntas.tsx` (#perguntas, `<details>`), `FormularioInteresse.tsx` (#participar, envio SIMULADO) e `RodapeHome.tsx`.
- `app/login/page.tsx`: a tela de login (B01).
- `CHANGELOG.md`.

### Modificado
- `app/page.tsx`: deixou de ser o login e virou a homepage (Server Component com metadados), composta pelas seções.
- `components/LoginForm.tsx` (B01): `?voltar=` só aceita caminho interno e nunca `/login`.
- `app/not-found.tsx` (B01): link "Ir para a página inicial".
- `components/BrandPanel.tsx`: usa `TresPilares` em vez do SVG próprio (visual igual).
- `app/globals.css`: rolagem suave só na homepage (`html:has(.home-raiz)`), desligada com `prefers-reduced-motion`.
- `SISTEMA.md`: rotas `/` (homepage) e `/login`, estrutura de pastas.

### Removido
- O SVG da "Constelação" e a constante `PILARES` de dentro do `BrandPanel` (agora vivem em `TresPilares`).
- O login da raiz `/` (movido para `/login`, B01).

### Pendências
- `TODO(API)`: o formulário de interesse não envia nada de verdade.
- `TODO(PROGLOGIC)`: confirmar os textos das perguntas frequentes e a lista de segmentos.
