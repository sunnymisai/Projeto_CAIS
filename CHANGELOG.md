# Changelog do CAIS

Cada entrada lista o que foi criado, modificado e removido.

## Painel da empresa para a apresentação (branch `feat/painel-empresa`)
- Criado: `components/paineis/Bloco.tsx` (moldura de bloco com os estados e o link "Ver todas", agora compartilhada pelos painéis), `testes/navegador/paineis-todos-perfis.mjs` (o painel de cada perfil abre com conteúdo, também em 375 px).
- Modificado: `components/paineis/PainelEmpresa.tsx` (era "Em construção"; agora andamento dos projetos, quem está no time, entregas e trilha do time; o E01 aprofunda), `components/paineis/PainelProfissional.tsx` (usa o `Bloco` compartilhado), `SISTEMA.md`.
- Pendência: o deck fala em "entregas aprovadas", mas não existe aprovação; hoje "Pronto" conta como entregue (`TODO(PROGLOGIC)`).

## Ajustes visuais para a apresentação (branch `fix/login-visual`)
- Modificado: `next.config.ts` (`devIndicators: false`: some a bolinha "N" do Next no `npm run dev`), `components/LoginForm.tsx` (os botões "Entrar como" ficam um embaixo do outro, com largura total; em três colunas o ícone de Administrador e Profissional encolhia até sumir).

## Bloco D: profissional (branch `feat/profissional`)

### D05: painel do profissional
- Modificado: `components/paineis/PainelProfissional.tsx` (era "Em construção"; agora os quatro blocos do §6 com estados por bloco), `lib/metricas.ts` (`inicioDaSemana`, `cargaDaSemana`, `entregasPorSemana`) e `lib/metricas.casos.ts` (19 casos), `lib/seed.ts` (5 entregas antigas da Ana; o Portal de pedidos e a alocação dela começam em d(-42)), `SISTEMA.md`.
- Pendência: teste de navegador automático do D05 (`testes/navegador/d05-...`), feito à mão nesta versão.

### D04: minhas tarefas do profissional
- Criado: `agruparMinhasTarefas`, `fimDaSemana` e `DIAS_CONCLUIDA_RECENTE` em `lib/metricas.ts`, `lib/metricas.casos.ts` (9 casos), `testes/navegador/d04-minhas-tarefas.mjs` (24 conferências).
- Modificado: `app/(sistema)/minhas-tarefas/page.tsx` (era "Em construção"; agora grupos por prazo, concluídas recolhidas, filtros, contagem, detalhe por cima com `?tarefa=` e os quatro estados), `lib/seed.ts` (4 tarefas novas da Ana no Portal de pedidos: atrasada, hoje, esta semana e concluída; a chave continua `cais-dados-v2`, então quem tem dados salvos precisa de "Restaurar dados de demonstração" para vê-las), `SISTEMA.md`.

### D03: player de etapa e quiz com nota mínima e tentativas
- Criado: `lib/quiz.ts` (`corrigirQuiz`, `resultadoDoQuiz`, `embaralhar`, `tentativasUsadas`, `concluirEtapa`, `registrarTentativa`; funções puras), `lib/quiz.casos.ts` (27 casos), `components/trilhas/ConteudoEtapa.tsx` (conteúdo por tipo, com estados de demonstração e de erro), `components/trilhas/QuizEtapa.tsx` (quiz acessível: radiogroup nativo, uma pergunta por vez no celular, resultado, revisão, nova tentativa embaralhada), `testes/navegador/d03-player-e-quiz.mjs` (32 conferências).
- Modificado: `app/(sistema)/minhas-trilhas/[id]/etapa/[etapaId]/page.tsx` (era provisório; agora é o player), `app/(sistema)/minhas-trilhas/[id]/page.tsx` (aviso de etapa bloqueada com `?bloqueada=`), `lib/tipos.ts` (`progresso.quizzes`: tentativas e nota por quiz), `lib/permissoes.ts` (`EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO = true`) e `lib/permissoes.casos.ts`, `components/PrimeiroAcessoForm.tsx` (profissional com trilha obrigatória pendente vai para `/minhas-trilhas`), `eslint.config.mjs` (ignora os perfis temporários dos testes), `SISTEMA.md`.

### D02: minhas trilhas e detalhe da trilha
- Criado: `app/(sistema)/minhas-trilhas/[id]/page.tsx` (detalhe com estados das etapas, motivo do bloqueio e botão fixo no rodapé no celular), `app/(sistema)/minhas-trilhas/[id]/etapa/[etapaId]/page.tsx` (player provisório até o D03), `components/trilhas/PrazoTrilha.tsx` (selo de prazo com ícone e texto; `textoDoPrazo` para o painel do D05), `classesBotao()` em `components/button.tsx` (link com cara de botão), `hrefEtapa` em `lib/trilhas.ts`, `testes/navegador/cdp.mjs` e `testes/navegador/d02-minhas-trilhas.mjs` (teste de aceite no Chrome headless, 25 conferências).
- Modificado: `app/(sistema)/minhas-trilhas/page.tsx` (era "Em construção"; agora "Continue de onde parou", grupos por alcance e os quatro estados), `lib/metricas.ts` (`publicoDaTrilha` inclui o perfil Empresa na trilha geral e na da sua empresa), `lib/permissoes.casos.ts` (65 casos), `lib/seed.ts` (a Ana entrou no Nivelamento, 2 de 5), `app/layout.tsx` (`viewportFit: cover`, para a área segura do iPhone), `.gitignore` (perfis temporários dos testes), `SISTEMA.md`.

### D01: conteúdo de etapa e quiz no modelo e no editor
- Criado: `components/trilhas/EditorConteudoEtapa.tsx` (texto e endereço da etapa; perguntas com alternativas, correta por radio, reordenar e remover), `Pergunta` em `lib/tipos.ts`, `TENTATIVAS_PADRAO` e `problemasDoQuiz` em `lib/trilhas.ts`, `prazoDaPessoaNaTrilha`, `situacaoDoPrazo`, `DIAS_PRAZO_PERTO` e `trilhasDaPessoaDetalhadas` em `lib/metricas.ts`.
- Modificado: `lib/tipos.ts` (`Etapa.conteudo`, `perguntas` e `tentativasMax`; `Trilha.publicadaEm`; `tentativas` no progresso; tudo opcional), `lib/seed.ts` (conteúdo em todas as etapas, 3 a 5 perguntas por quiz, `publicadaEm` com um prazo vencido, um perto e um no prazo), `lib/store.tsx` (chave `cais-dados-v1` → `cais-dados-v2`: os dados antigos do navegador são descartados), `app/(sistema)/trilhas/[id]/page.tsx` (botão "Conteúdo"/"Perguntas" por etapa, campo Tentativas, validação do quiz ao publicar, `publicadaEm` gravado na primeira publicação), `SISTEMA.md`.

## Editor de trilha: arrastar etapas (branch `feat/acessos`)
- Modificado: `app/(sistema)/trilhas/[id]/page.tsx`. A alça ⋮⋮ das etapas, que era só desenho, agora reordena por arrastar e soltar (HTML5 nativo, como o Quadro). Só a alça inicia o arrasto, para não atrapalhar a seleção de texto nos campos. Uma linha roxa mostra onde a etapa vai entrar, e a etapa arrastada fica apagada. As setas ↑↓ continuam para teclado e celular.

## Revisão H01 do bloco C (branch `feat/acessos`)
- Criado: tokens `--grafico-*` em `app/globals.css` (claro e escuro), `COR_GRAFICO` e `TONS_COLUNA` em `components/ui/Graficos.tsx`, componente `EstadoErro` em `components/ui/basicos.tsx` (documentado em `/design-system`).
- Modificado: `lib/store.tsx` (confere o formato do que lê do navegador; expõe `erro` e `tentarDeNovo()`; com erro, não grava por cima dos dados; `restaurarDemonstracao` também tira do erro), `app/(sistema)/layout.tsx` (mostra o `EstadoErro` no lugar da tela e não sincroniza a sessão com dados danificados), `components/shell/Sidebar.tsx` (logo com `aria-label` e anel de foco no botão "Fechar menu"), `components/paineis/PainelAdmin.tsx`, `app/(sistema)/trilhas/page.tsx`, `app/(sistema)/projetos/[id]/page.tsx`, `components/projetos/Vistas.tsx` e `app/(sistema)/design-system/page.tsx` (cores dos gráficos por token, trocando com o tema; o cronograma usa `color-mix` no lugar do sufixo hex "33"), `components/ui/Graficos.tsx` (a rosca aplica a cor por `style`, que aceita `var()`).
- Removido: os hex de gráfico soltos nas telas e a constante `TOM_COLUNA` do `Vistas.tsx`.

## Ajustes no login (branch `feat/acessos`)
- Modificado: `components/LoginForm.tsx` (o seletor "Entrar como…" virou três botões secundários do design system, um por perfil, que preenchem e-mail e senha; o campo de e-mail usa a máscara `mascaraEmail`), `lib/utils.ts` (`EMAIL_REGEX` mais rígido, valendo para todos os formulários: recusa acento, vírgula, ponto dobrado ou no fim, hífen na ponta do domínio e final com número; criada `mascaraEmail`, que tira espaços e passa para minúsculas), `SISTEMA.md` (contas de demonstração).
- Corrigido: `next.config.ts` ganhou `allowedDevOrigins` (127.0.0.1 e os IPs da rede). Sem isso, o Next 16 bloqueia os scripts do `npm run dev` fora do `localhost`, e o login, os botões e as validações paravam de funcionar.
- Criado: lista das contas de teste e da senha à vista, embaixo dos botões do login.
- Removido: o `EMAIL_REGEX` duplicado dentro do `LoginForm` e o uso do `Select` no login.

## Bloco C: acessos (branch `feat/acessos`)

### C08: gestão de acessos e vínculo pessoa-empresa
- Criado: `components/acessos/ModalMudarPerfil.tsx`, `MatrizDePermissoes.tsx`, `PessoasDaEmpresa.tsx`.
- Modificado: `app/(sistema)/acessos/page.tsx` (era "Em construção"), `lib/auth.tsx` (recusa `inativo` e `convidado` no login, último acesso SIMULADO), `lib/permissoes.ts` (`ROTULO_DAS_ROTAS`, `ROTULO_DAS_ACOES`, `rotasDoPerfil`, `permissaoDaAcao`, `mudancaDeAcesso`) e `lib/permissoes.casos.ts` (62 casos), `app/(sistema)/layout.tsx` (encerra sessão de conta inativada e sincroniza perfil/nome), `components/LoginForm.tsx` (mensagens de conta inativa e convite pendente; `?aviso=inativa`), `components/ui/Menu.tsx` (prop `flutuante`, para não ser cortado pela rolagem da tabela), `app/(sistema)/empresas/page.tsx` (abas Dados e Pessoas na ficha), `app/(sistema)/pessoas/page.tsx` (empresa como link).
- Decisões: checagem de inativa no login E no layout; mudar perfil preserva os dados de profissional (reversível); ninguém muda o próprio perfil nem rebaixa/inativa o último admin; admin não é inativado por esta tela (igual a /pessoas).
- Pendências: `TODO(PROGLOGIC)` sobre limpar campos ao mudar de perfil.

## Bloco C: perfil e preferências (branch `feat/perfil`)

### C07: tela de perfil e preferências
- Criado: `lib/tema.ts` (chave `cais-tema`, `useTema()`, `definirTema()`; único lugar que grava o tema), `lib/preferencias.ts` (`useDensidadeTabela`), `components/perfil/AbaDados.tsx`, `AbaPreferencias.tsx`, `AbaSeguranca.tsx`.
- Modificado: `app/(sistema)/perfil/page.tsx` (era "Em construção"; agora abas e os estados carregando, erro e com dado), `components/ThemeToggle.tsx` (usa `useTema`), `app/layout.tsx` (só os comentários: o script inline continua, ligado a `lib/tema.ts`), `lib/tipos.ts` (`Pessoa.densidadeTabela`, opcional), `lib/auth.tsx` (`atualizarSessao`), `lib/metricas.ts` (`ROTULO_PERFIL`), `components/ui/Tabela.tsx` (densidade compacta por pessoa), `components/shell/EmConstrucao.tsx` (só o cabeçalho).
- Removido: a lógica de tema que estava duplicada dentro do `ThemeToggle`.

## Bloco C: fluxos de acesso (branch `feat/fluxos-de-acesso`)

### C05: recuperação de senha simulada
- Criado: `lib/senha.ts` (`regrasDaSenha`, `senhaValida`), `components/ui/RegrasSenha.tsx` (lista de regras com ícone e texto, aria-live educado; documentada em `/design-system`), `components/AcessoLayout.tsx` (duas colunas compartilhada), `components/RecuperarSenhaForm.tsx` e `app/recuperar-senha/page.tsx` (3 passos + estado de link inválido).
- Modificado: `lib/auth.tsx` (senhas simuladas `cais-senhas-demo` com `definirSenha` e `conferirSenha`; o login agora confere o cadastro salvo e só deixa entrar pessoa "ativa"; `SENHA_DEMO` exportada), `lib/store.tsx` (`lerPessoasSalvas`, leitura das pessoas sem o provedor, porque o AuthProvider fica fora do DadosProvider), `app/login/page.tsx` (usa `AcessoLayout`), `components/LoginForm.tsx` ("Esqueceu a senha?" leva a `/recuperar-senha`), `components/BrandPanel.tsx` (só o cabeçalho), `app/(sistema)/design-system/page.tsx` (seção de `RegrasSenha`).
- Removido: a lista `CONTAS` e a conferência de senha fixa no código.

### C06: primeiro acesso por convite
- Criado: `app/primeiro-acesso/page.tsx` e `components/PrimeiroAcessoForm.tsx` (nome e e-mail somente leitura, senha com `RegrasSenha`, aceite obrigatório dos termos/LGPD; estados carregando, erro e formulário), `components/CartaoAcesso.tsx` (cartão e "Voltar para o login", extraídos do `RecuperarSenhaForm`), `components/shell/TrilhaPendente.tsx` e `lib/convite.ts` (`linkDeConvite`, `copiarTexto` com tratamento de falha do clipboard).
- Modificado: `lib/auth.tsx` (`iniciarSessao`: abre a sessão sem senha no fim do convite), `lib/permissoes.ts` (`temTrilhaObrigatoriaPendente`, `rotaLiberadaComTrilhaPendente` e `EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO = false`), `lib/permissoes.casos.ts` (de 34 para 48 casos), `lib/metricas.ts` (imports com `.ts`, para o Node achar o módulo), `app/(sistema)/layout.tsx` (guarda da trilha obrigatória, desligada), `app/(sistema)/pessoas/page.tsx` ("Copiar link de convite" para status convidado), `components/RecuperarSenhaForm.tsx` (usa `CartaoAcesso`).
- Pendência: `TODO(PROGLOGIC)` para o texto dos termos/LGPD e para o que conta como "trilha obrigatória".

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
