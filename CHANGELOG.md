# Changelog do CAIS

Cada entrada lista o que foi criado, modificado e removido.

## Bloco C: fluxos de acesso (branch `feat/fluxos-de-acesso`)

### C05: recuperação de senha simulada
- Criado: `lib/senha.ts` (`regrasDaSenha`, `senhaValida`), `components/ui/RegrasSenha.tsx` (lista de regras com ícone e texto, aria-live educado; documentada em `/design-system`), `components/AcessoLayout.tsx` (duas colunas compartilhada), `components/RecuperarSenhaForm.tsx` e `app/recuperar-senha/page.tsx` (3 passos + estado de link inválido).
- Modificado: `lib/auth.tsx` (senhas simuladas `cais-senhas-demo` com `definirSenha` e `conferirSenha`; o login agora confere o cadastro salvo e só deixa entrar pessoa "ativa"; `SENHA_DEMO` exportada), `lib/store.tsx` (`lerPessoasSalvas`, leitura das pessoas sem o provedor, porque o AuthProvider fica fora do DadosProvider), `app/login/page.tsx` (usa `AcessoLayout`), `components/LoginForm.tsx` ("Esqueceu a senha?" leva a `/recuperar-senha`), `components/BrandPanel.tsx` (só o cabeçalho), `app/(sistema)/design-system/page.tsx` (seção de `RegrasSenha`).
- Removido: a lista `CONTAS` e a conferência de senha fixa no código.

## Bloco C: três perfis (branch `feat/tres-perfis`)

### C01: regras de permissão e escopo (só `lib/`)
- Criado: `lib/permissoes.ts` (`ROTAS_POR_PERFIL`, `podeAcessar`, `podeFazer`), `lib/escopo.ts` (`projetosVisiveis`, `podeVerProjeto`, `tarefasVisiveis`, `alocacoesVisiveis`, `empresasVisiveis`, `pessoasVisiveis`) e `lib/permissoes.casos.ts` (34 casos; rode `node --experimental-strip-types lib/permissoes.casos.ts`).
- Modificado: `tsconfig.json` ganhou `allowImportingTsExtensions` (só os arquivos acima usam `import ... from './x.ts'`, para o Node achar os módulos).
- Nenhuma tela foi alterada. Regras ambíguas estão marcadas `// TODO(PROGLOGIC): confirmar`.

### C02: login dos três perfis e proteção de rota
- Modificado: `lib/auth.tsx` (sem bloqueio de perfil; `CONTA_DEMO` virou `CONTAS_DEMO` com as 4 contas: admin, Ana, Marcos/Vértice e Patrícia/Aurora; motivo `perfil` removido), `components/LoginForm.tsx` (seletor "Entrar como…" no lugar de "Preencher"; mensagem de perfil sem acesso removida), `app/(sistema)/layout.tsx` (usa `podeAcessar`), `app/sem-permissao/page.tsx` (explica o motivo; botões "Voltar ao painel" e "Entrar com outra conta").
- Removido: o bloqueio `perfil !== admin` e a mensagem "perfil sem acesso".
- Pendência: `/painel` mostra o painel do admin para Empresa e Profissional até o C03.

### C03: menu, topo e painel por perfil
- Criado: `components/paineis/PainelAdmin.tsx` (o painel antigo, sem mudar o comportamento), `PainelEmpresa.tsx` e `PainelProfissional.tsx` (esqueletos); `components/shell/EmConstrucao.tsx`; rotas `/carga`, `/acessos`, `/minhas-trilhas`, `/minhas-tarefas` e `/perfil` (todas "Em construção").
- Modificado: `app/(sistema)/painel/page.tsx` (só escolhe o painel pelo perfil), `components/shell/navegacao.ts` (cada item tem `perfis`), `Sidebar.tsx` (filtra por perfil e mostra o perfil no rodapé), `Topbar.tsx` (Etiqueta com o perfil, "Meu perfil" no menu, busca e avisos só com o que `lib/escopo` e `podeAcessar` permitem).
- Removido: o texto fixo "Perfil Administrador" do menu e do topo.

### C04: projetos e quadro respeitando o perfil
- Modificado: `app/(sistema)/projetos/page.tsx` (só `projetosVisiveis`; "Novo projeto" só para quem pode editar projeto), `app/(sistema)/projetos/[id]/page.tsx` (projeto fora do escopo vai para `/sem-permissao`; botões de nova tarefa, alocar e editar projeto escondidos; `?tarefa=` só abre tarefa do próprio projeto), `components/projetos/Quadro.tsx` (arrastar só o permitido, listas e cartões só para quem pode), `CartaoTarefa.tsx` (cadeado "Só o responsável pode mover"), `DetalheTarefa.tsx` (campos como texto somente leitura; comentar liberado; "Status" segue a regra de mover), `Equipe.tsx` (alocar, editar e remover só para quem pode alocar).
- `SISTEMA.md`: contas, rotas e tabela de permissões.

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
