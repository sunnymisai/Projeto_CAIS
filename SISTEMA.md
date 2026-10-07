# CAIS — Sistema (Administrador, Empresa e Profissional)

Front-end em **Next.js 16 + React 19 + Tailwind v4**, seguindo o design system e o deck do projeto.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

**Testes de navegador** (com o `npm run dev` aberto): `node testes/navegador/<teste>.mjs`, por exemplo `node testes/navegador/d02-minhas-trilhas.mjs` `d03-player-e-quiz.mjs`, `d04-minhas-tarefas.mjs` ou `paineis-todos-perfis.mjs` (o painel de cada perfil). Casos de lógica sem navegador: `node --experimental-strip-types lib/permissoes.casos.ts` e `lib/quiz.casos.ts`. Eles abrem um Chrome sem janela, entram com as contas de demonstração e conferem a tela. O perfil temporário do Chrome fica em `testes/navegador/.perfis/`, que o git ignora.

**Contas de demonstração** (todas com a senha `Cais@2026`). Na tela de login, os botões "Entrar como" (Administrador, Profissional e Empresa) preenchem e-mail e senha das três primeiras contas abaixo; a Patrícia só entra digitando:

| Perfil | E-mail | O que enxerga |
|---|---|---|
| Administrador | `admin@cais.com.br` | tudo |
| Profissional (Ana Souza) | `ana.souza@cais.example` | projetos em que está alocada; move só as próprias tarefas |
| Empresa Vértice (Marcos Vieira) | `marcos@vertice.example` | só os projetos da Vértice; só comenta |
| Empresa Aurora (Patrícia Melo) | `patricia@aurora.example` | só os projetos da Aurora; só comenta |

**Senhas (SIMULADAS, NUNCA PARA PRODUÇÃO).** Toda pessoa ativa do seed entra com `Cais@2026` até trocar a senha. As senhas trocadas ficam em texto puro no `localStorage` (chave `cais-senhas-demo`), acessadas só por `definirSenha(email, senha)` e `conferirSenha(email, senha)` em `lib/auth.tsx`. As regras de senha (8 caracteres, uma maiúscula, um número) ficam em `lib/senha.ts` (`regrasDaSenha`, `senhaValida`). Os botões "Entrar como" sempre preenchem `Cais@2026`: depois que a pessoa troca a senha, digite a nova. O login confere o cadastro salvo (`lerPessoasSalvas` em `lib/store.tsx`) e só deixa entrar quem está com status "ativo".

## Rotas

| Rota | Tela |
|---|---|
| `/` | Homepage pública: apresenta o CAIS à empresa (topo, pilares, como funciona, perguntas e formulário de interesse simulado) |
| `/login` | Login (redireciona para `?voltar=`, só caminho interno, ou `/painel`) |
| `/recuperar-senha` | Recuperação de senha SIMULADA em 3 passos: e-mail → "link enviado" (botão de demonstração "Abrir o link recebido") → `?token=demo&email=...` com nova senha e regras em tempo real. A mensagem de sucesso é a mesma exista ou não o e-mail |
| `/primeiro-acesso?convite=<pessoaId>` | Primeiro acesso por convite (SIMULADO): mostra nome e e-mail, pede senha com regras em tempo real e aceite dos termos/LGPD; ao salvar ativa a pessoa e entra no `/painel`. Convite inexistente, usado ou de pessoa inativa mostra erro com botão para o login. O link é copiado na ficha de pessoa (status "convidado") |
| `/painel` | Painel que muda com o perfil: administrador (trilhas, prazos, projetos, carga); profissional (minhas trilhas e a próxima etapa, as 5 próximas tarefas, carga da semana e histórico de entregas de 8 semanas); empresa (andamento dos projetos próprios, quem está no time, entregas feitas/pendentes/atrasadas e progresso da trilha do time; versão de apresentação, aprofundada no E01) |
| `/empresas` | Lista e ficha de empresa (CNPJ validado, CEP via ViaCEP) |
| `/pessoas` | Lista e ficha de pessoa (campos por perfil, convite, inativar) |
| `/trilhas` e `/trilhas/[id]` | Lista e editor de trilha (etapas, público, progresso). Cada etapa tem o painel "Conteúdo" (texto e endereço) e, no quiz, o editor de perguntas (alternativas, correta por radio, nota mínima e tentativas). Publicar exige quiz completo e grava `publicadaEm` só na primeira vez. As etapas reordenam por setas ou arrastando a alça |
| `/projetos` e `/projetos/[id]` | Lista, ficha, equipe e tarefas (quadro, lista, cronograma) |
| `/design-system` | Documentação viva dos componentes |
| `/acessos` | Admin: tabela de contas (pessoa, e-mail/login, perfil, empresa, status, último acesso) com filtros e menu por linha (reenviar convite, redefinir senha para `Cais@2026`, mudar perfil com explicação do que ganha e perde, inativar/reativar) e o quadro "O que cada perfil pode fazer", gerado de `ROTAS_POR_PERFIL` e `podeFazer` |
| `/carga` | Admin: carga da equipe ("Em construção") |
| `/minhas-trilhas` | Profissional e empresa: "Continue de onde parou" (próxima etapa em destaque) e as trilhas agrupadas por alcance, com progresso, nota e prazo (no prazo, perto, vencido) |
| `/minhas-trilhas/[id]` | Detalhe da trilha para quem a cumpre: etapas concluídas, atual e bloqueadas (com o motivo), botão Começar/Continuar (fixo no rodapé no celular). Trilha fora do público, em rascunho ou inexistente vai para `/sem-permissao` |
| `/minhas-trilhas/[id]/etapa/[etapaId]` | Player da etapa: texto, vídeo e áudio nativos (com estado de erro), PDF/apresentação/link em nova aba, "Marcar como concluída", anterior/próxima (próxima só depois de concluir) e o quiz (uma pergunta por vez no celular, todas no desktop; nota, nota mínima, revisão de cada resposta, "Tentar de novo" com as alternativas embaralhadas, "Fale com a coordenação" sem tentativas). Etapa bloqueada aberta pela URL volta ao detalhe com `?bloqueada=` explicando o motivo. Ao concluir a última etapa, tela de parabéns |
| `/minhas-tarefas` | Só profissional: as tarefas em que é responsável, de todos os projetos, agrupadas em Atrasadas, Hoje, Esta semana (até domingo) e Depois, mais "Concluídas recentemente" (últimos 7 dias, recolhida). Filtros de projeto e prioridade, contagem no rodapé. Clicar abre o detalhe da tarefa por cima (`?tarefa=`), e mudar o Status move a tarefa no quadro |
| `/perfil` | Meu perfil, para os três perfis, com abas: **Dados** (nome, telefone e cargo editáveis; e-mail e perfil somente leitura; resumo de área, nível, carga e habilidades para o profissional), **Preferências** (tema claro/escuro/seguir o sistema e densidade das tabelas) e **Segurança** (trocar senha) |
| `/sem-permissao` e 404 | Páginas de erro (a 404 tem link "Ir para a página inicial") |

## Permissões por perfil

As regras ficam em funções puras, sem React, e podem ser testadas com Node:

- `lib/permissoes.ts`: `podeAcessar(perfil, caminho)` (prefixo mais longo vence; rota não listada = só admin) e `podeFazer(perfil, acao, contexto)`.
- `lib/escopo.ts`: filtros pela sessão (`projetosVisiveis`, `tarefasVisiveis`, `alocacoesVisiveis`, `empresasVisiveis`, `pessoasVisiveis`, `podeVerProjeto`).
- `lib/permissoes.casos.ts`: 62 casos (inclui a guarda da trilha obrigatória e a leitura das regras para a tela Acessos). Rode `node --experimental-strip-types lib/permissoes.casos.ts`.

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

**Guarda da trilha obrigatória (§12).** `temTrilhaObrigatoriaPendente(pessoaId, dados)` (em `lib/permissoes.ts`) diz se o profissional ainda tem etapa obrigatória por concluir numa trilha geral publicada. Com `EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO = true` (ligada no D03), o layout de `(sistema)` bloqueia as rotas fora de `/painel` e `/minhas-trilhas*` ("Conclua sua trilha de boas-vindas para liberar o sistema"), e o primeiro acesso de um profissional leva direto para `/minhas-trilhas`. No seed, a Elisa (Boas-vindas em 3 de 5) fica presa até passar no quiz.

**Tema e preferências.** `lib/tema.ts` é o único código que lê, aplica e grava o tema (chave `cais-tema`; "seguir o sistema" = sem chave). O botão sol/lua (`ThemeToggle`) e a aba Preferências usam o mesmo hook `useTema()`, então ficam sincronizados. O `<script>` inline de `app/layout.tsx` continua necessário (aplica o tema antes da hidratação, sem piscar) e repete a chave e os valores de propósito. A densidade das tabelas fica no cadastro da pessoa (`Pessoa.densidadeTabela`) e é lida por `lib/preferencias.ts` na `Tabela`.

**Conta inativa.** Duas barreiras: (1) o login (`lib/auth.tsx`) recusa conta inativa com mensagem clara (só depois de conferir a senha, para não revelar o status de contas alheias); (2) o layout de `(sistema)` encerra a sessão de quem foi inativado com o sistema aberto e leva ao `/login?aviso=inativa`. O mesmo layout copia perfil, nome e e-mail do cadastro para a sessão (assim "mudar perfil" vale na hora). O último acesso fica em `cais-ultimo-acesso` (SIMULADO).

**Vínculo pessoa-empresa.** A ficha da empresa tem a aba "Pessoas" (pessoas com perfil Empresa, profissionais alocados nos projetos e "Vincular pessoa"); a ficha da pessoa mostra a empresa como link.

## Onde ligar a API da PROGLOGIC

A autenticação e os dados passam por dois arquivos:

- **`lib/auth.tsx`**: troque o corpo de `autenticar()` pelo `fetch` do login e guarde o token.
- **`lib/store.tsx`**: reescreva `salvar`, `remover` e `moverTarefa` com `fetch`. As telas usam só `useDados()` e não precisam mudar.

Hoje os dados ficam no `localStorage` (chave `cais-dados-v2`). O menu do perfil tem a opção "Restaurar dados de demonstração".

## Estrutura

```
app/(sistema)/        telas internas (layout protege a rota e monta o shell)
components/home/      seções da homepage pública (Topo, Hero, Problema, Pilares, Perguntas, Formulário, Rodapé)
components/marca/     TresPilares (diagrama usado no login e na homepage)
components/ui/        design system: basicos, form, Modal, Menu, Tabela, Graficos, RegrasSenha
components/           AcessoLayout (duas colunas de login, recuperar senha e primeiro acesso), CartaoAcesso, LoginForm, RecuperarSenhaForm, PrimeiroAcessoForm
components/paineis/   PainelAdmin, PainelEmpresa, PainelProfissional (o /painel escolhe pelo perfil)
components/shell/     Sidebar (menu filtrado por perfil), Topbar (busca Ctrl+K e avisos com escopo, perfil), Pagina, EmConstrucao
components/acessos/   ModalMudarPerfil, MatrizDePermissoes, PessoasDaEmpresa (tela /acessos e aba Pessoas da empresa)
components/perfil/    AbaDados, AbaPreferencias, AbaSeguranca (as abas de /perfil)
components/projetos/  Quadro, CartaoTarefa, DetalheTarefa, Vistas, Equipe, FormProjeto
lib/                  tipos, seed, store, auth, senha, convite, tema, preferencias, permissoes, escopo, toast, metricas, useFormulario, utils
```

## Ainda simulado ou fora desta versão

- Envio real de convite e notificações.
- WebSocket do quadro em tempo real.
- Anexos e upload de logo e foto.
- Aba Arquivos do projeto.
- Envio real do convite: hoje só se copia o link (o "token" do convite é o próprio id da pessoa).
- Textos oficiais dos termos de uso e da política de privacidade (LGPD) do primeiro acesso.
- Painéis dos perfis Empresa e Profissional (hoje "Em construção").
- Tela `/carga` (hoje "Em construção").
- Painel do profissional: o semáforo de carga (cor de atenção) entra no bloco F; falta o teste de navegador automático do D05 (conferido à mão).
- Quiz sem tentativas: a pessoa vê "Fale com a coordenação", mas ainda não existe tela para o admin liberar uma nova tentativa (`TODO(PROGLOGIC)`). Para destravar no protótipo, apague o registro do quiz em `progresso[pessoa].quizzes` ou use "Restaurar dados de demonstração".
- Vídeos e áudios do seed apontam para endereços `example.com`, que não existem: o player mostra o estado de erro com "Abrir em nova aba".
- Público das trilhas: a pessoa de perfil Empresa cumpre a trilha geral e a da sua empresa (`publicoDaTrilha` em `lib/metricas.ts`, com `TODO(PROGLOGIC)`). Por isso o Marcos e a Patrícia contam como "não iniciada" nos números do admin.
- Redefinir senha na tela Acessos grava a senha temporária `Cais@2026` sem forçar a troca no próximo login (SIMULADO).
- Permissão no servidor: as regras de perfil só existem no navegador.
- Estado "com erro" só para dados danificados no navegador: o layout de `(sistema)` mostra o `EstadoErro` (com "Tentar de novo" e "Voltar aos dados de demonstração") quando a store não consegue ler `cais-dados-v2`. Erro de rede e de servidor só existirão com a API (`TODO(API)` em `lib/store.tsx`).
- Revisão H01 do bloco C (pendências cosméticas que ficaram para depois): `dark:text-[#14161F]` em 5 componentes (virar token `--sobre-cor`), `#B9A7FF` no item ativo da barra lateral (virar token `--marca-clara`) e as paletas fixas de avatares (`components/ui/basicos.tsx`) e de capas de projeto (`components/projetos/cores.ts`), que hoje são exceção documentada.
- Conteúdo das etapas é só texto e endereço: não há envio de arquivo (vídeo, PDF, áudio). O padrão de 3 tentativas no quiz e a regra do prazo da trilha (a data mais recente entre a publicação e a entrada da pessoa, mais os dias de prazo) esperam confirmação da PROGLOGIC (`TODO(PROGLOGIC)` em `lib/trilhas.ts` e `lib/metricas.ts`).
