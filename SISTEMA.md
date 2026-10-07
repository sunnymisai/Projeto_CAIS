# CAIS — Sistema (Administrador, Empresa e Profissional)

Front-end em **Next.js 16 + React 19 + Tailwind v4**, seguindo o design system e o deck do projeto.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

**Contas de demonstração** (todas com a senha `Cais@2026`). Na tela de login, o seletor "Entrar como…" preenche e-mail e senha:

| Perfil | E-mail | O que enxerga |
|---|---|---|
| Administrador | `admin@cais.com.br` | tudo |
| Profissional (Ana Souza) | `ana.souza@cais.example` | projetos em que está alocada; move só as próprias tarefas |
| Empresa Vértice (Marcos Vieira) | `marcos@vertice.example` | só os projetos da Vértice; só comenta |
| Empresa Aurora (Patrícia Melo) | `patricia@aurora.example` | só os projetos da Aurora; só comenta |

**Senhas (SIMULADAS, NUNCA PARA PRODUÇÃO).** Toda pessoa ativa do seed entra com `Cais@2026` até trocar a senha. As senhas trocadas ficam em texto puro no `localStorage` (chave `cais-senhas-demo`), acessadas só por `definirSenha(email, senha)` e `conferirSenha(email, senha)` em `lib/auth.tsx`. As regras de senha (8 caracteres, uma maiúscula, um número) ficam em `lib/senha.ts` (`regrasDaSenha`, `senhaValida`). O seletor "Entrar como…" sempre preenche `Cais@2026`: depois que a pessoa troca a senha, digite a nova. O login confere o cadastro salvo (`lerPessoasSalvas` em `lib/store.tsx`) e só deixa entrar quem está com status "ativo".

## Rotas

| Rota | Tela |
|---|---|
| `/` | Homepage pública: apresenta o CAIS à empresa (topo, pilares, como funciona, perguntas e formulário de interesse simulado) |
| `/login` | Login (redireciona para `?voltar=`, só caminho interno, ou `/painel`) |
| `/recuperar-senha` | Recuperação de senha SIMULADA em 3 passos: e-mail → "link enviado" (botão de demonstração "Abrir o link recebido") → `?token=demo&email=...` com nova senha e regras em tempo real. A mensagem de sucesso é a mesma exista ou não o e-mail |
| `/primeiro-acesso?convite=<pessoaId>` | Primeiro acesso por convite (SIMULADO): mostra nome e e-mail, pede senha com regras em tempo real e aceite dos termos/LGPD; ao salvar ativa a pessoa e entra no `/painel`. Convite inexistente, usado ou de pessoa inativa mostra erro com botão para o login. O link é copiado na ficha de pessoa (status "convidado") |
| `/painel` | Painel que muda com o perfil: administrador (trilhas, prazos, projetos, carga); empresa e profissional ainda "Em construção" |
| `/empresas` | Lista e ficha de empresa (CNPJ validado, CEP via ViaCEP) |
| `/pessoas` | Lista e ficha de pessoa (campos por perfil, convite, inativar) |
| `/trilhas` e `/trilhas/[id]` | Lista e editor de trilha (etapas, público, progresso) |
| `/projetos` e `/projetos/[id]` | Lista, ficha, equipe e tarefas (quadro, lista, cronograma) |
| `/design-system` | Documentação viva dos componentes |
| `/carga` e `/acessos` | Admin: carga da equipe e gestão de acessos ("Em construção") |
| `/minhas-trilhas` e `/minhas-tarefas` | Empresa e profissional (trilhas) e só profissional (tarefas): "Em construção" |
| `/perfil` | Meu perfil, para os três perfis ("Em construção") |
| `/sem-permissao` e 404 | Páginas de erro (a 404 tem link "Ir para a página inicial") |

## Permissões por perfil

As regras ficam em funções puras, sem React, e podem ser testadas com Node:

- `lib/permissoes.ts`: `podeAcessar(perfil, caminho)` (prefixo mais longo vence; rota não listada = só admin) e `podeFazer(perfil, acao, contexto)`.
- `lib/escopo.ts`: filtros pela sessão (`projetosVisiveis`, `tarefasVisiveis`, `alocacoesVisiveis`, `empresasVisiveis`, `pessoasVisiveis`, `podeVerProjeto`).
- `lib/permissoes.casos.ts`: 48 casos (inclui a guarda da trilha obrigatória). Rode `node --experimental-strip-types lib/permissoes.casos.ts`.

| Rota | Admin | Empresa | Profissional |
|---|---|---|---|
| `/painel`, `/projetos`, `/perfil` | sim | sim | sim |
| `/empresas`, `/pessoas`, `/trilhas`, `/design-system`, `/carga`, `/acessos` | sim | não | não |
| `/minhas-trilhas` | não | sim | sim |
| `/minhas-tarefas` | não | não | sim |

| Ação em projetos | Admin | Empresa | Profissional |
|---|---|---|---|
| Criar projeto, editar projeto, alocar, criar/editar/excluir tarefa, criar/renomear/excluir lista | sim | não | não |
| Mover tarefa (arrastar ou "Status" no detalhe) | sim | não | só as próprias |
| Comentar | sim | sim, no projeto dela | sim, no projeto em que está |

Botões sem permissão são **escondidos** (não desabilitados); campos sem permissão viram **texto** somente leitura. Tudo isso é conveniência de interface: a segurança real é do back-end da PROGLOGIC (§7). Regras ambíguas estão marcadas `// TODO(PROGLOGIC): confirmar`.

Parâmetros úteis: `/projetos/[id]?aba=equipe|tarefas|geral&tarefa=<id>` e `/empresas?abrir=<id>`.

**Guarda da trilha obrigatória (§12).** `temTrilhaObrigatoriaPendente(pessoaId, dados)` (em `lib/permissoes.ts`) diz se o profissional ainda tem etapa obrigatória por concluir numa trilha geral publicada. O layout de `(sistema)` só aplica o bloqueio ("Conclua sua trilha de boas-vindas para liberar o sistema", em qualquer rota fora de `/painel` e `/minhas-trilhas*`) quando `EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO` é `true`. Hoje é `false`: as telas de trilha do profissional nascem no bloco D, que liga a constante.

## Onde ligar a API da PROGLOGIC

A autenticação e os dados passam por dois arquivos:

- **`lib/auth.tsx`**: troque o corpo de `autenticar()` pelo `fetch` do login e guarde o token.
- **`lib/store.tsx`**: reescreva `salvar`, `remover` e `moverTarefa` com `fetch`. As telas usam só `useDados()` e não precisam mudar.

Hoje os dados ficam no `localStorage` (chave `cais-dados-v1`). O menu do perfil tem a opção "Restaurar dados de demonstração".

## Estrutura

```
app/(sistema)/        telas internas (layout protege a rota e monta o shell)
components/home/      seções da homepage pública (Topo, Hero, Problema, Pilares, Perguntas, Formulário, Rodapé)
components/marca/     TresPilares (diagrama usado no login e na homepage)
components/ui/        design system: basicos, form, Modal, Menu, Tabela, Graficos, RegrasSenha
components/           AcessoLayout (duas colunas de login, recuperar senha e primeiro acesso), CartaoAcesso, LoginForm, RecuperarSenhaForm, PrimeiroAcessoForm
components/paineis/   PainelAdmin, PainelEmpresa, PainelProfissional (o /painel escolhe pelo perfil)
components/shell/     Sidebar (menu filtrado por perfil), Topbar (busca Ctrl+K e avisos com escopo, perfil), Pagina, EmConstrucao
components/projetos/  Quadro, CartaoTarefa, DetalheTarefa, Vistas, Equipe, FormProjeto
lib/                  tipos, seed, store, auth, senha, convite, permissoes, escopo, toast, metricas, useFormulario, utils
```

## Ainda simulado ou fora desta versão

- Envio real de convite e notificações.
- WebSocket do quadro em tempo real.
- Anexos e upload de logo e foto.
- Aba Arquivos do projeto.
- Envio real do convite: hoje só se copia o link (o "token" do convite é o próprio id da pessoa).
- Textos oficiais dos termos de uso e da política de privacidade (LGPD) do primeiro acesso.
- Trava da trilha obrigatória desligada (`EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO = false`) até o bloco D.
- Painéis dos perfis Empresa e Profissional (hoje "Em construção").
- Telas `/carga`, `/acessos`, `/minhas-trilhas`, `/minhas-tarefas` e `/perfil` (hoje "Em construção").
- Permissão no servidor: as regras de perfil só existem no navegador.
