# Mapa do código do CAIS

> **Arquivo gerado.** Não edite à mão: rode `node testes/mapa-do-codigo.mjs` depois de mexer nos comentários `[PV-n]` do código.

## Como usar

1. Ache o arquivo na lista abaixo (está agrupado por pasta, na ordem alfabética).
2. Leia os pontos numerados: cada um diz **o que controla** e **como mudar**.
3. No código, procure pelo número com a busca do editor: `[PV-3]` (o número recomeça em 1 em cada arquivo, então busque dentro do arquivo certo).

Um **ponto vital de alteração** é um lugar onde alguém mexeria para mudar uma regra, um texto, uma cor, uma rota, um limite ou uma ligação com a API. A "linha" é onde o comentário estava quando o mapa foi gerado e pode se deslocar um pouco depois; o número `[PV-n]` é o que vale.

Arquivos `.json` não aceitam comentário, por isso os pontos deles estão descritos aqui, no fim.

## app/ (telas e rotas)

### `app/(sistema)/acessos/page.tsx`
*tela de gestão de acessos (só administrador): quem tem conta, perfil, empresa, status e último acesso; ações de reenviar convite, redefinir senha, mudar perfil e inativar/reativar; e o quadro "O que cada perfil pode fazer".*

1. OS NOMES E AS CORES DOS STATUS da pessoa (Convidado, Ativo, Inativo) na tabela e no filtro. Cor sempre com texto. _(linha 30)_
2. QUANTAS PESSOAS POR PÁGINA na tabela de acessos: 10. _(linha 34)_
3. O ÚLTIMO ACESSO de cada pessoa (SIMULADO): vem do navegador, registrado no login (lib/auth.tsx). _(linha 56)_
4. OS FILTROS E A ORDEM DA TABELA: busca por nome ou e-mail (sem acento), perfil, status e empresa, em ordem alfabética por nome. _(linha 62)_
5. A TRAVA DO ÚLTIMO ADMINISTRADOR: quando só resta um ativo, ele não pode ser rebaixado nem inativado (travaria o sistema). _(linha 78)_
6. O REENVIO DE CONVITE (SIMULADO): só copia o link de primeiro acesso; nenhum e-mail é enviado. TODO(API): a API reenvia o e-mail. _(linha 82)_
7. A REDEFINIÇÃO DE SENHA: grava a senha temporária de demonstração (SENHA_DEMO). SIMULADO: nunca para produção. TODO(API): senha aleatória enviada por e-mail, com troca obrigatória. _(linha 94)_
8. INATIVAR E REATIVAR: só troca o status; nada é excluído (§11), e alocações, tarefas e trilhas ficam no histórico. _(linha 104)_
9. O MENU DE AÇÕES de cada linha: Reenviar convite (convidado), Redefinir senha (ativo), Mudar perfil (não inativo, nem a própria pessoa, nem o último admin), Reativar (inativo) ou Inativar (qualquer não admin). _(linha 172)_

### `app/(sistema)/carga/page.tsx`
*a tela do semáforo de carga para o admin: uma matriz com os profissionais ativos nas linhas e as semanas nas colunas, cada célula com o nível da semana (pico do dia mais cheio). Cada linha abre a contribuição de cada projeto, e cada célula abre um painel lateral com os dias e as alocações. No celular, a matriz vira cards com as próximas 4 semanas.*

1. AS QUANTIDADES DE SEMANAS que a matriz oferece (4, 8 ou 12). Opção nova entra aqui e no seletor "Quantas semanas mostrar". _(linha 38)_
2. QUEM APARECE NA MATRIZ: só profissionais ativos (convidado ainda não trabalha; inativo saiu da operação, §11). _(linha 70)_
3. OS FILTROS DA CARGA: nome, área, projeto (alocação que cruza o período mostrado) e "Só acima do limite" (alguma semana vermelha). _(linha 80)_
4. O CONTROLE DE PERÍODO: semana anterior, Hoje, próxima semana e quantas semanas mostrar. A primeira semana é sempre uma segunda-feira. _(linha 115)_
5. A MATRIZ DE CARGA (a partir de 768 px): cabeçalho e nomes presos na rolagem; cada célula é um botão que abre o painel da semana. No celular vira um card por pessoa com as 4 primeiras semanas. _(linha 142)_
6. A LINHA DE UMA PESSOA: nome, área e limite semanal, as células por semana e a quebra por projeto (uma sub-linha por alocação). _(linha 203)_
7. O PAINEL LATERAL DE UMA SEMANA: pico e nível do semáforo, a ocupação de cada dia útil e as alocações ativas, com o link para a equipe do projeto. _(linha 270)_

### `app/(sistema)/design-system/page.tsx`
*a documentação viva do design system do CAIS: cada componente aparece funcionando, com todos os seus estados.*

1. A TABELA DE TOKENS da documentação: os hex são só para exibir; a cor real vem de app/globals.css e os dois precisam ser atualizados juntos. Hoje o tema escuro de Erro e de Névoa aqui difere do globals.css: confira. _(linha 33)_
2. OS ATALHOS DO TOPO da página: cada id precisa existir como id de uma <Secao>, senão o link não rola. _(linha 51)_
3. O BLOCO PADRÃO de cada seção da documentação. Componente novo do design system entra como nova <Secao> e ganha um atalho em SECOES. _(linha 59)_

### `app/(sistema)/empresas/page.tsx`
*tela de cadastro de empresas parceiras (lista com filtros + ficha em modal).*

1. OS STATUS DA EMPRESA (Em negociação, Ativa, Encerrada), nomes e cores, vêm de lib/metricas.ts e são os mesmos do painel da empresa. _(linha 29)_
2. AS OPÇÕES DE SEGMENTO do filtro e da ficha. TODO(API): podem vir do servidor. _(linha 33)_
3. AS OPÇÕES DE PORTE da ficha (Pequeno, Médio, Grande). _(linha 37)_
4. QUANTAS EMPRESAS POR PÁGINA na tabela: 8. _(linha 39)_
5. A FICHA ABERTA POR LINK: ?abrir=<id> (vem da busca do topo e de outras telas) abre a ficha da empresa; id que não existe não abre nada. _(linha 66)_
6. A BUSCA E OS FILTROS: nome fantasia ou razão social (sem acento) ou CNPJ só com dígitos, mais status e segmento; ordem alfabética. _(linha 76)_
7. OS VALORES DE UMA EMPRESA NOVA: status "em negociação" e data de entrada hoje. _(linha 185)_
8. AS REGRAS DA EMPRESA (§11): CNPJ válido e único, CEP com 8 dígitos, site começando com https://, e-mail do contato único no sistema todo (ele vira o login do perfil Empresa). _(linha 211)_
9. A BUSCA DE CNPJ: ao sair do campo, com o CNPJ válido, consulta a BrasilAPI (e, se ela falhar, a CNPJ.ws; serviços públicos externos com dados da Receita) e preenche só os campos ainda vazios: razão social, nome fantasia, CEP, logradouro, número e cidade/UF. Falha nunca bloqueia o cadastro. _(linha 251)_
10. A BUSCA DE CEP: ao sair do campo consulta o ViaCEP (serviço público externo) e preenche logradouro e cidade/UF, que continuam editáveis. Falha nunca bloqueia o cadastro. _(linha 303)_
11. O SALVAR DA EMPRESA: valida tudo, grava com id novo "emp" se for cadastro. SIMULADO: espera 350 ms. TODO(API): POST ou PUT na API da PROGLOGIC. _(linha 341)_
12. A EXCLUSÃO DA EMPRESA: o botão só aparece para empresa sem projetos e não apaga em cascata (pessoas vinculadas ficam apontando para uma empresa que não existe mais). _(linha 369)_

### `app/(sistema)/layout.tsx`
*a casca (menu lateral + topo + área de conteúdo) de todas as telas internas, e o "porteiro" que barra quem não está logado ou cujo perfil não pode abrir a rota (lib/permissoes.ts).*

1. A CASCA PROTEGIDA de todas as telas internas (menu, topo e conteúdo). A proteção roda só no navegador: não é segurança real, é experiência de uso. TODO(API): a segurança vem do back-end. _(linha 37)_
2. A SESSÃO ABERTA ACOMPANHA O CADASTRO: conta inativada encerra a sessão na hora; perfil, nome ou e-mail alterados são copiados para a sessão. _(linha 68)_
3. O PORTEIRO DAS ROTAS: sem sessão vai para /login?voltar=<tela pedida> (ou ?aviso=inativa); perfil sem permissão (podeAcessar) vai para /sem-permissao. _(linha 95)_
4. A TELA "VERIFICANDO ACESSO": enquanto a sessão carrega ou o redirecionamento não acontece, nunca aparece a casca. A condição precisa bater com a do porteiro acima. _(linha 114)_
5. A TRAVA DA TRILHA OBRIGATÓRIA (§12): profissional com trilha pendente só abre /painel e /minhas-trilhas. Liga e desliga em EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO (lib/permissoes.ts). _(linha 129)_
6. O ESTADO DE ERRO DE TODAS AS TELAS: se a store não leu os dados, mostra o erro no lugar da página, com "Tentar de novo" e "Voltar aos dados de demonstração" (este APAGA o que estava salvo). A trilha pendente também bloqueia aqui. _(linha 159)_

### `app/(sistema)/minhas-tarefas/page.tsx`
*as tarefas em que a pessoa logada é responsável, de todos os projetos, agrupadas por prazo (Atrasadas, Hoje, Esta semana, Depois) e as concluídas recentemente (recolhidas), com filtros de projeto e prioridade. Clicar abre o detalhe da tarefa por cima da lista (?tarefa= na URL, como no quadro).*

1. OS GRUPOS ABERTOS DA TELA, na ordem: Atrasadas, Hoje, Esta semana e Depois. A regra de qual tarefa cai em qual grupo está em agruparMinhasTarefas (lib/metricas.ts). _(linha 37)_
2. QUAIS TAREFAS SÃO "MINHAS": as que têm a pessoa como responsável, dentro do que o perfil enxerga (lib/escopo.ts). _(linha 73)_
3. O DETALHE só abre se a tarefa do ?tarefa= for da própria pessoa: uma URL digitada não abre tarefa alheia. _(linha 94)_
4. ABRIR E FECHAR O DETALHE mexe só no ?tarefa= da URL, com replace (não enche o histórico do "voltar") e sem rolar a lista. _(linha 96)_
5. O TEXTO E A COR DO PRAZO de cada tarefa: Concluída em dd/mm (verde), Atrasada há N dias (vermelho), Vence hoje (âmbar), Amanhã ou a data (neutro). _(linha 210)_
6. O ITEM DA LISTA: um botão com título, projeto (faixa lateral e bolinha na cor do quadro), prazo, prioridade e checklist. Alvo de toque de pelo menos 44 px. _(linha 226)_

### `app/(sistema)/minhas-trilhas/[id]/etapa/[etapaId]/page.tsx`
*uma etapa da trilha para quem a cumpre: o conteúdo (texto, vídeo, áudio, PDF, apresentação, link) ou o quiz, o botão "Marcar como concluída", anterior/próxima e, ao terminar a última etapa, a tela de parabéns.*

1. O PLAYER DE UMA ETAPA: mostra o conteúdo (ou o quiz), conclui a etapa e libera a próxima. Terminar a última mostra a tela de parabéns. _(linha 38)_
2. O PORTEIRO DA ETAPA: fora do público vai para /sem-permissao; etapa inexistente volta ao detalhe da trilha; etapa adiante da atual vai ao detalhe com ?bloqueada= (que explica o motivo). _(linha 62)_
3. A CONCLUSÃO DE ETAPA SEM QUIZ: grava o progresso (concluirEtapa só avança se for a etapa atual). Na última etapa abre os parabéns. _(linha 117)_
4. O ENVIO DO QUIZ: grava as tentativas e a nota (registrarTentativa, lib/quiz.ts); se aprovado, conclui a etapa e libera a próxima. _(linha 128)_

### `app/(sistema)/minhas-trilhas/[id]/page.tsx`
*uma trilha vista por quem a cumpre: alcance, prazo, progresso e a lista de etapas com o estado de cada uma (concluída, atual, bloqueada) e o motivo do bloqueio; botão "Começar"/"Continuar" (fixo no rodapé no celular).*

1. O DETALHE DA TRILHA para quem a cumpre. Trilha fora do público, em rascunho ou inexistente leva a /sem-permissao (a mesma resposta nos três casos, para não revelar quais trilhas existem). _(linha 36)_
2. O BOTÃO PRINCIPAL: "Começar" se nada foi feito, "Continuar" se já começou; some quando a trilha termina. No celular ele vai para a barra fixa do rodapé. _(linha 76)_
3. AS ETAPAS SÃO FEITAS EM ORDEM: antes da atual = concluída, a atual e as seguintes = bloqueadas (com o motivo escrito). _(linha 126)_
4. AS TENTATIVAS MOSTRADAS NA ETAPA DE QUIZ: o limite da etapa ou, se não houver, TENTATIVAS_PADRAO (lib/trilhas.ts). _(linha 129)_

### `app/(sistema)/minhas-trilhas/page.tsx`
*as trilhas que a pessoa logada recebe, com "Continue de onde parou" no topo e a lista agrupada por alcance (geral, empresa, profissional).*

1. A ORDEM DOS GRUPOS na tela (§4): trilha geral, depois a da empresa e por último a do profissional. Grupo sem trilha não aparece. _(linha 32)_
2. O "CONTINUE DE ONDE PAROU": a primeira trilha não concluída; a lista já vem com o prazo mais curto primeiro (trilhasDaPessoaDetalhadas). _(linha 82)_
3. O DESTAQUE DO TOPO: trilha, próxima etapa e botão; o texto muda entre "Comece por aqui" e "Continue de onde parou". A faixa usa a cor do alcance da trilha. _(linha 125)_

### `app/(sistema)/painel/page.tsx`
*a tela inicial do sistema. Só escolhe qual painel mostrar conforme o perfil de quem está logado ("o painel muda conforme quem olha", §6).*

1. QUAL PAINEL CADA PERFIL VÊ: admin, empresa ou profissional (components/paineis/). Os painéis leem o período da URL, por isso o Suspense é obrigatório. _(linha 26)_

### `app/(sistema)/perfil/page.tsx`
*a tela /perfil, igual para os três perfis, com abas: Dados, Preferências e Segurança.*

1. AS ABAS DA TELA "Meu perfil" (Dados, Preferências, Segurança). Aba nova entra aqui, no tipo IdAba e no bloco que escolhe o painel mais abaixo. _(linha 23)_

### `app/(sistema)/pessoas/page.tsx`
*tela de cadastro de pessoas dos três perfis (lista com filtros + ficha em modal).*

1. OS NOMES DOS PERFIS nesta tela. Uma única tela cadastra os três (§11). _(linha 33)_
2. OS STATUS DA PESSOA: Convidado, Ativo e Inativo. Inativo substitui a exclusão: a pessoa sai de uso e o histórico fica (§11). _(linha 36)_
3. AS OPÇÕES DE ÁREA do profissional. TODO(API): podem vir do servidor. _(linha 44)_
4. AS OPÇÕES DE NÍVEL do profissional (Estágio, Júnior, Pleno, Sênior). _(linha 48)_
5. QUANTAS PESSOAS POR PÁGINA na tabela: 8. _(linha 50)_
6. A FICHA ABERTA POR LINK: ?abrir=<id> (busca do topo, aviso de carga acima do limite e outras telas) abre a ficha da pessoa; id que não existe não abre nada. _(linha 77)_
7. A BUSCA E OS FILTROS: nome, e-mail e área (sem acento), perfil e status; ordem alfabética por nome. _(linha 86)_
8. AS REGRAS DA PESSOA (§11): nome e sobrenome, e-mail válido e único, profissional exige área e perfil Empresa exige empresa vinculada. _(linha 228)_
9. OS VALORES DE UMA PESSOA NOVA: profissional, status convidado, entrada hoje, carga máxima de 40 h por semana (padrão do §11) e convite ligado. _(linha 253)_
10. O SALVAR DA PESSOA: guarda só o que cabe no perfil (admin sem empresa; quem não é profissional fica sem área, nível, habilidades e carga). O envio do convite é SIMULADO. TODO(API): POST ou PUT e e-mail do convite. _(linha 279)_
11. INATIVAR E REATIVAR (não existe excluir): troca só o status e mantém alocações, tarefas e trilhas (§11). _(linha 311)_
12. O LINK DE CONVITE (SIMULADO): copia o endereço de /primeiro-acesso para quem envia mandar por conta própria. TODO(API): a API envia o e-mail. _(linha 326)_

### `app/(sistema)/projetos/[id]/page.tsx`
*a ficha de um projeto com quatro abas (Visão geral, Equipe, Tarefas e Arquivos), as vistas quadro/lista/cronograma e o detalhe da tarefa. A Visão geral tem o card "Próximas entregas" (prazo nos próximos 14 dias). Projeto fora do escopo do perfil (inclusive digitado na URL) manda para /sem-permissao; os botões que o perfil não pode usar são escondidos.*

1. AS ABAS DA FICHA (Visão geral, Equipe, Tarefas, Arquivos): o valor vai na URL como ?aba=. Aba nova entra aqui, nas abas do cabeçalho e no bloco que a mostra. _(linha 51)_
2. AS VISTAS DAS TAREFAS: quadro, lista e cronograma. Ficam só no estado: recarregar a página volta ao quadro. _(linha 54)_
3. A ABA PADRÃO: sem ?aba= na URL a ficha abre em Tarefas, a mais usada no dia a dia. _(linha 102)_
4. A URL COMO ESTADO: aba e tarefa aberta vão em ?aba= e ?tarefa= (replace, sem encher o histórico). Outras telas abrem a ficha já numa aba ou tarefa por esses parâmetros. _(linha 119)_
5. O ESCOPO DA FICHA: projeto que a pessoa não pode ver leva a /sem-permissao. Conveniência de tela; a segurança real é do back-end. _(linha 146)_
6. AS PERMISSÕES DOS BOTÕES DA FICHA: criar tarefa, alocar (administrador, ou a empresa nos projetos dela) e editar projeto. Cada um fica escondido, não desabilitado, para quem não pode. _(linha 156)_
7. OS FILTROS DAS TAREFAS: responsável, prioridade e etiqueta, aplicados juntos. _(linha 167)_
8. O BOTÃO PRINCIPAL DO CABEÇALHO muda com a aba: Equipe mostra "Alocar pessoa", Tarefas mostra "Nova tarefa" e a Visão geral mostra "Editar projeto". Cada um só existe para quem pode usar. _(linha 199)_
9. A VISÃO GERAL DO PROJETO: escopo, andamento, próximas entregas, tarefas por lista, status, dados e exclusão. _(linha 291)_
10. O TEMPO DECORRIDO do projeto: dias desde o início sobre a duração total, preso entre 0% e 100%. _(linha 316)_
11. O ALERTA "tempo andando mais rápido que as entregas": aparece quando o tempo passou mais de 10 pontos à frente do que está pronto e o projeto tem tarefas. _(linha 360)_
12. O STATUS DO PROJETO: só quem edita projeto troca; grava na hora, sem botão Salvar. Os outros perfis veem como texto. _(linha 407)_
13. A EXCLUSÃO DO PROJETO: apaga também tarefas e alocações, sem desfazer. A tela sugere mudar o status para Concluído. _(linha 434)_
14. A TAREFA NOVA: título, responsável (só quem está alocado), prazo e lista são obrigatórios (§5); prazo sugerido de hoje + 7 dias; entra no fim da lista e o detalhe abre logo depois. TODO(API): POST. _(linha 449)_

### `app/(sistema)/projetos/page.tsx`
*a lista de projetos em cartões, com busca e filtros, e o botão para criar um projeto novo. Mostra só os projetos do escopo do perfil (lib/escopo.ts) e esconde "Novo projeto" de quem não pode editar projeto.*

1. O ESCOPO DA LISTA: o administrador vê todos os projetos, a empresa só os dela e o profissional só aqueles em que está alocado (lib/escopo.ts). É conveniência de tela; a segurança real é do back-end. _(linha 51)_
2. QUEM CRIA PROJETO: só quem tem a permissão "editar_projeto" (lib/permissoes.ts). O botão fica escondido, não desabilitado, para os outros perfis. _(linha 57)_
3. OS FILTROS DA LISTA: empresa, status e busca por nome (sem acento). _(linha 68)_

### `app/(sistema)/trilhas/[id]/page.tsx`
*o editor de uma trilha: etapas, público e regras, progresso por pessoa, publicar/despublicar e excluir.*

1. O EDITOR DE TRILHA: toda mudança é salva na hora, sem botão Salvar. Publicar só é liberado sem pendências. Abas: Etapas, Público e regras, Progresso. _(linha 44)_
2. O SALVAR AUTOMÁTICO: toda mudança grava na hora (cada tecla do título, inclusive). TODO(API): vira PATCH e talvez precise esperar a pessoa parar de digitar. _(linha 85)_
3. A REORDENAÇÃO DAS ETAPAS por arrastar: leva a etapa para a posição de soltura e não grava se ficou no mesmo lugar. Os botões de subir e descer fazem a mesma troca de uma posição. _(linha 122)_
4. AS PENDÊNCIAS QUE IMPEDEM PUBLICAR: título, ao menos uma etapa, todas com título, empresa (alcance Empresa), pessoas (alcance Profissional) e as regras de cada quiz (lib/trilhas.ts). _(linha 145)_
5. A PUBLICAÇÃO: com pendência leva à aba do problema (procura "empresa" ou "pessoa" nas mensagens: reescrever sem essas palavras abre a aba errada); sem pendência grava a data da PRIMEIRA publicação, que não muda ao despublicar e republicar. O aviso às pessoas é SIMULADO. TODO(API). _(linha 166)_
6. O ALCANCE DA TRILHA (Geral, Empresa ou Profissional): as cores e descrições vêm de ALCANCE (lib/trilhas.ts) e quem recebe vem de publicoDaTrilha (lib/metricas.ts). _(linha 387)_
7. O PRAZO DA TRILHA (decisão da PROGLOGIC, 09/10/2026): indeterminado (prazoDias 0) ou os dias que o administrador definir; ao desligar o interruptor começa em 14 dias. O campo "Quando abre" é SIMULADO. TODO(API). _(linha 399)_
8. A NOTA EM VERMELHO na aba Progresso: nota abaixo da maior nota mínima entre os quizzes da trilha. _(linha 463)_
9. A EXCLUSÃO DA TRILHA: apaga junto o progresso de todas as pessoas, sem desfazer. _(linha 483)_

### `app/(sistema)/trilhas/page.tsx`
*a lista de trilhas de onboarding em cartões, com filtro por alcance/rascunho e o botão "Nova trilha".*

1. O FILTRO DA LISTA: Todas, Gerais, Da empresa, Do profissional (pelo alcance) ou Rascunhos (pelo status). _(linha 48)_
2. A TRILHA NOVA: nasce como rascunho, alcance geral e prazo de 7 dias; abre o editor, que salva sozinho. TODO(API): POST. _(linha 54)_
3. O TEXTO "QUEM RECEBE" do cartão: o nome da empresa, "N pessoa(s)" ou "Todos", conforme o alcance. _(linha 99)_

### `app/globals.css`

1. AS CORES DO TEMA CLARO (marca, estados, superfícies, texto, borda, sombra e gráficos). Para rebrandear, edite só os valores daqui e do .dark logo abaixo. _(linha 23)_
2. AS CORES DOS GRÁFICOS no tema claro (concluída, andamento, revisão, a fazer, não iniciada, extras). Lidas por COR_GRAFICO em components/ui/Graficos.tsx. _(linha 46)_
3. AS CORES DO TEMA ESCURO: os mesmos nomes do :root com valores para fundo escuro (a classe "dark" no <html> liga). Mudou um nome lá, mude aqui. _(linha 61)_
4. A PONTE PARA O TAILWIND: cada --color-x vira as classes bg-x, text-x e border-x e troca com o tema. Aqui também ficam as cores fixas do painel de marca (noite e pilares) e as fontes (Space Grotesk nos títulos, Archivo no resto). _(linha 95)_
5. O FUNDO, A COR DO TEXTO E A FONTE PADRÃO de todas as telas (pelos tokens), com a troca suave de tema (desligada para quem pede menos movimento). _(linha 129)_
6. AS ANIMAÇÕES DA MARCA (cartão de acesso, linhas e pontos dos três pilares, balanço do erro). Todas se desligam em prefers-reduced-motion. _(linha 138)_
7. A BARRA DE ROLAGEM FINA (classe .rolagem) das áreas que rolam: conteúdo das telas e colunas do quadro. _(linha 182)_
8. O BLOCO CINZA ANIMADO do estado "carregando" (classe .esqueleto, usada por components/ui/basicos.tsx). _(linha 191)_
9. AS ANIMAÇÕES DO MODAL (entrada) e do fundo escurecido (fade). Desligadas para quem pede menos movimento. _(linha 199)_
10. A ROLAGEM SUAVE das âncoras fica só na homepage (a que tem a classe .home-raiz) e só para quem não pediu menos movimento. _(linha 214)_

### `app/layout.tsx`
*a "moldura" HTML de todas as páginas do CAIS (<html>, <head>, <body>).*

1. O TÍTULO E A DESCRIÇÃO PADRÃO da aba do navegador. O modelo "%s · CAIS" monta o título das outras páginas (ex.: "Projetos · CAIS"). _(linha 19)_
2. A COR DA BARRA DO NAVEGADOR NO CELULAR (Névoa no tema claro, Tinta no escuro) e o viewportFit "cover", que libera a área segura do iPhone para as barras fixas. _(linha 31)_
3. O SCRIPT DO TEMA: roda antes da página aparecer para evitar o piscar. A chave "cais-tema" e os valores "escuro" e "claro" repetem os de lib/tema.ts: mude os dois juntos. Não escreva comentários dentro do texto. _(linha 49)_

### `app/login/page.tsx`
*a página da rota "/login" — tela de entrada no sistema.*

1. A PÁGINA DE LOGIN (/login): só monta a moldura e o formulário. O Suspense é obrigatório porque o LoginForm usa useSearchParams; sem ele o build falha. _(linha 29)_

### `app/not-found.tsx`
*a tela mostrada quando o endereço digitado não existe.*

1. A PÁGINA 404: o texto e os dois botões (Ir para o painel e Ir para a página inicial). Fica fora da casca do sistema, então serve a quem nem tem conta. _(linha 15)_

### `app/page.tsx`
*a página pública da raiz "/", que apresenta o CAIS para uma empresa que avalia participar do programa.*

1. O TÍTULO E A DESCRIÇÃO da homepage; o título é absoluto (ignora o modelo "· CAIS" do layout raiz). _(linha 34)_
2. A ORDEM DAS SEÇÕES DA HOMEPAGE: Hero, Problema (O programa), Pilares, Como funciona, Para sua empresa, Perfis, Perguntas e o formulário de interesse. Reordenar ou tirar uma seção exige conferir components/home/secoes.ts. _(linha 56)_

### `app/primeiro-acesso/page.tsx`
*a página da rota "/primeiro-acesso?convite=<pessoaId>" (pública, fora do grupo protegido).*

1. O TÍTULO DA ABA da página de primeiro acesso ("Primeiro acesso · CAIS"). _(linha 15)_
2. A PÁGINA DE PRIMEIRO ACESSO (/primeiro-acesso?convite=...). O Suspense é obrigatório porque o formulário lê a URL com useSearchParams. _(linha 27)_

### `app/providers.tsx`
*junta os "provedores" (contextos React) que todas as telas usam.*

1. A ORDEM DOS PROVEDORES: sessão (lib/auth.tsx), dados (lib/store.tsx) e avisos (lib/toast.tsx), de fora para dentro. Provedor novo entra aqui, e quem usa precisa ficar dentro dele. _(linha 21)_

### `app/recuperar-senha/page.tsx`
*a página da rota "/recuperar-senha" (pública, fora do grupo protegido).*

1. O TÍTULO DA ABA da recuperação de senha ("Recuperar senha · CAIS"). _(linha 16)_
2. A PÁGINA DE RECUPERAÇÃO DE SENHA (/recuperar-senha). O Suspense é obrigatório porque o formulário lê ?token= e ?email= com useSearchParams. _(linha 28)_

### `app/sem-permissao/page.tsx`
*tela de "acesso negado" para quem está logado, mas o perfil não pode abrir a página pedida.*

1. O NOME DO PERFIL mostrado na mensagem de acesso negado. _(linha 20)_
2. A TELA DE ACESSO NEGADO: fica FORA de app/(sistema) de propósito (dentro dela o layout mandaria para cá em laço). Quem decide o bloqueio é lib/permissoes.ts. _(linha 24)_

## components/ (peças de tela)

### `components/AcessoLayout.tsx`
*o layout de duas colunas (painel de marca + cartão) compartilhado pelas telas públicas de acesso: login, recuperar senha e primeiro acesso.*

1. A DIVISÃO DAS TELAS DE ACESSO: duas colunas a partir de 1024 px (marca à esquerda, cartão à direita) e uma só abaixo disso. O ponto de quebra e a proporção estão na classe lg:grid-cols-[1.05fr_1fr]. _(linha 24)_
2. O topo da coluna do cartão: o logo (só no celular) e o botão de tema. Item novo que deva aparecer em todas as telas de acesso entra aqui. _(linha 38)_

### `components/acessos/MatrizDePermissoes.tsx`
*duas tabelas somente leitura (telas e ações por perfil), geradas direto das regras de lib/permissoes.ts, para o time e a PROGLOGIC validarem.*

1. A ORDEM DAS COLUNAS das duas tabelas: Administrador, Empresa, Profissional. _(linha 16)_
2. A MATRIZ "O que cada perfil pode fazer": só leitura, gerada de lib/permissoes.ts. Para mudar uma regra, mude lá; esta tela se atualiza sozinha. _(linha 30)_
3. A TABELA DE TELAS: uma linha por rota de ROTAS_POR_PERFIL, com Sim ou Não para cada perfil. _(linha 40)_
4. A TABELA DE AÇÕES: uma linha por ação de TODAS_AS_ACOES; "Em parte" mostra a condição escrita em CONDICAO_DA_ACAO (lib/permissoes.ts). _(linha 52)_

### `components/acessos/ModalMudarPerfil.tsx`
*modal que deixa o administrador escolher o novo perfil de uma pessoa (e a empresa, quando o perfil é Empresa) e explica o que ela passa a ver e o que perde, antes de confirmar.*

1. O TEXTO DO ESCOPO de cada perfil mostrado no modal ("vê todos os projetos...", "vê só os da empresa vinculada..."). Espelha lib/escopo.ts: mude os dois juntos. _(linha 22)_
2. Quais empresas podem ser escolhidas: as encerradas não aparecem (mesma regra de /pessoas), exceto a que a pessoa já tem. _(linha 45)_
3. A MUDANÇA DE PERFIL: o perfil Empresa exige empresa vinculada (§11); grava o novo perfil e mantém os dados de profissional guardados, para a mudança ser reversível. TODO(API): PATCH no usuário. _(linha 51)_
4. Os perfis que o administrador pode escolher e a ordem deles no modal (Profissional, Empresa, Administrador). _(linha 72)_

### `components/acessos/PessoasDaEmpresa.tsx`
*lista as pessoas com perfil Empresa vinculadas à empresa e os profissionais alocados nos projetos dela, e permite vincular uma pessoa (que passa a ter perfil Empresa).*

1. Os nomes e as cores do status da pessoa (Convidado, Ativo, Inativo) mostrados na lista. _(linha 21)_
2. OS PROFISSIONAIS ALOCADOS: calculados das alocações dos projetos da empresa (nada é guardado); lista só de leitura. _(linha 55)_
3. QUEM PODE SER VINCULADA à empresa: nem administrador (perderia o acesso total), nem pessoa inativa, nem quem já está nela. _(linha 61)_
4. O VÍNCULO: a pessoa passa a ter perfil Empresa e esta empresa (§11); os dados de profissional ficam guardados. TODO(API): PATCH no usuário. _(linha 67)_

### `components/BrandPanel.tsx`
*o painel escuro do lado esquerdo do login (só em telas grandes), com o logo, a frase da marca e o desenho dos três pilares conectados.*

1. O PAINEL DE MARCA das telas de acesso: sempre escuro nos dois temas e só aparece a partir de 1024 px (classe lg:flex). _(linha 25)_
2. A MENSAGEM do painel de marca (título e frase abaixo dele). Mude aqui para trocar o texto de todas as telas de acesso. _(linha 45)_
3. O desenho dos três pilares, o mesmo da homepage (components/marca/TresPilares.tsx). _(linha 54)_
4. O rodapé de direitos do painel; o ano vem do relógio do navegador. _(linha 59)_

### `components/button.tsx`
*botão com 4 variantes, 3 tamanhos e os estados repouso, hover, pressionado, foco, carregando e desabilitado; e classesBotao(), as mesmas classes para um <Link> que navega mas deve parecer botão.*

1. AS CORES DO BOTÃO por variante (primário, secundário, fantasma, perigo). Variante nova entra aqui e no tipo de variante da ButtonProps. _(linha 44)_
2. AS ALTURAS DO BOTÃO: sm 32 px, md 40 px e lg 48 px, com o espaçamento e a fonte de cada uma. _(linha 58)_
3. As classes do botão, também usadas em links que parecem botão. Mudar aqui muda o Button e esses links juntos. _(linha 66)_
4. O BOTÃO: com isLoading mostra o spinner, troca o texto por loadingText (padrão "Salvando…") e desabilita. Para mudar o texto padrão, é aqui. _(linha 96)_

### `components/CaisLogo.tsx`
*o símbolo (CaisMark) e o logo completo com o nome (CaisLogo), desenhados em SVG inline com os vetores do guia da marca.*

1. OS DESENHOS DO LOGO (o arco do "C" e a barra) copiados do guia da marca. Não edite os números à mão: o logo se deforma em todas as telas. _(linha 23)_
2. AS CORES DO LOGO: "auto" segue o tema (arco na cor do texto, barra na variável --marca) e "claro" é a versão negativa (branco e lilás) para fundo escuro. _(linha 32)_
3. O símbolo sozinho, sem o nome (usado, por exemplo, no selo do cartão de acesso). _(linha 54)_
4. O logo completo com o nome. As letras C, A, I e S são os quatro caminhos no fim do arquivo. _(linha 94)_

### `components/CartaoAcesso.tsx`
*o cartão arredondado (selo da marca, título e subtítulo) e o link "Voltar para o login" usados pelos passos de recuperar senha e do primeiro acesso.*

1. O VISUAL dos links de texto das telas de acesso (cor, sublinhado, foco). O login tem uma cópia própria (linkClass em LoginForm.tsx): mude as duas. _(linha 14)_
2. O CARTÃO das telas de acesso (recuperar senha e primeiro acesso): selo da marca (só no desktop), título e subtítulo. A largura máxima é 440 px. _(linha 19)_
3. O link "Voltar para o login" do rodapé dos cartões. Texto e destino (/login) valem para todos os passos. _(linha 43)_

### `components/checkbox.tsx`
*checkbox com rótulo, feito sobre um <input type="checkbox"> real com a aparência desenhada por cima.*

1. A CAIXA DE MARCAR: usa um input de verdade (teclado e leitor de tela) com o desenho por cima. Clicar no texto também marca. Cores e tamanho estão nas classes do input. _(linha 23)_

### `components/home/CabecalhoSecao.tsx`
*o trio "rótulo pequeno + título (h2) + parágrafo" que abre cada seção.*

1. O CABEÇALHO PADRÃO das seções da homepage (rótulo, h2 e descrição). Mude aqui para mudar todas. _(linha 22)_

### `components/home/ComoFunciona.tsx`
*linha do tempo em 4 passos (Empresa, Projeto, Alocação, Tarefa) e o bloco "A trilha da sua empresa".*

1. OS QUATRO NÍVEIS do §5 (Empresa, Projeto, Alocação, Tarefa) e a frase de cada um. Passo novo entra aqui; o desenho acompanha a quantidade. _(linha 12)_
2. A seção "Como funciona" (id como-funciona): título, descrição e os passos lado a lado no desktop e empilhados no celular. _(linha 21)_

### `components/home/FormularioInteresse.tsx`
*formulário em que a empresa conta o interesse em participar do programa. O envio é SIMULADO (ainda não existe API).*

1. A CHAVE DE TESTE do erro de envio: true mostra o estado de falha na tela. SIMULADO: some quando a API existir. _(linha 26)_
2. AS OPÇÕES DO CAMPO "Segmento" (opcional). Lista genérica, a PROGLOGIC pode ajustar. _(linha 49)_
3. AS REGRAS DO FORMULÁRIO: razão social, CNPJ (com dígitos verificadores), contato e e-mail são obrigatórios; o telefone, se preenchido, precisa de DDD e número. _(linha 57)_
4. O ENVIO (SIMULADO): valida, espera 700 ms e mostra o sucesso; nada é gravado. TODO(API): POST na API da PROGLOGIC com os valores do formulário. _(linha 99)_
5. A seção "Participar" (id participar), destino do botão da abertura da homepage. _(linha 147)_

### `components/home/Hero.tsx`
*a primeira dobra da página: o que é o CAIS em uma frase, os dois botões de ação e o diagrama dos três pilares.*

1. A CHAMADA PRINCIPAL da homepage (o único h1) e o texto de apoio logo abaixo. Mude aqui para trocar a mensagem de abertura. _(linha 34)_
2. OS DOIS BOTÕES da abertura: "Quero trazer minha empresa" rola até #participar (FormularioInteresse) e "Já tenho acesso" vai para /login. _(linha 44)_

### `components/home/ParaSuaEmpresa.tsx`
*explica o que a empresa vê no CAIS e mostra uma prévia ILUSTRATIVA do painel da empresa, com dados fictícios.*

1. A LISTA do que a empresa vê no painel dela (§6), lida pelo leitor de tela no lugar da prévia ilustrada. _(linha 14)_
2. OS NÚMEROS DA PRÉVIA do painel: dados FICTÍCIOS só para ilustrar (a legenda da imagem avisa isso). _(linha 23)_
3. A seção "Para sua empresa" (id empresa): o texto à esquerda e a prévia decorativa do painel à direita. _(linha 30)_

### `components/home/Perfis.tsx`
*três cards com os perfis do sistema (Administrador, Empresa e Profissional), destacando o da Empresa.*

1. OS TRÊS CARDS DE PERFIL (§3): nome, resumo, itens e ícone de cada um. A Empresa vem em destaque por ser o público da página (destaque: true). _(linha 25)_

### `components/home/Perguntas.tsx`
*lista de perguntas e respostas que abrem e fecham, feita com <details>/<summary> nativos (funciona até sem JavaScript).*

1. AS PERGUNTAS FREQUENTES (id perguntas): cada <Pergunta> é uma pergunta e a resposta dela. As respostas com TODO(PROGLOGIC) são provisórias até a confirmação. _(linha 44)_

### `components/home/Pilares.tsx`
*três cards (Onboarding, Gestão de projetos, Dashboards), cada um com o título e quatro itens do que a plataforma entrega naquele pilar.*

1. OS TRÊS PILARES (§1, §4, §5 e §6): título, itens e a cor de acento de cada um. A cor é só barra lateral e ícone; o texto usa tokens de tinta (contraste AA). _(linha 22)_

### `components/home/Problema.tsx`
*duas colunas que comparam o cenário atual de formação e acompanhamento com o que muda usando o CAIS, fechando com a ideia do rastro único.*

1. OS TEXTOS DA COLUNA "Como é hoje" (§2). Texto direto, sem números inventados. _(linha 12)_
2. OS TEXTOS DA COLUNA "Com o CAIS" (§2). _(linha 22)_
3. A seção "O programa" (id programa): título, descrição e as duas colunas. O id é o destino do link de secoes.ts. _(linha 32)_

### `components/home/RodapeHome.tsx`
*faixa escura no fim da página com a logo, o nome do programa, os links das seções e o link "Entrar".*

1. O VISUAL dos links do rodapé da homepage (sobre fundo escuro, com foco visível). _(linha 13)_
2. O NOME DO PROGRAMA no rodapé (PROGLOGIC · Residência Técnica). _(linha 30)_
3. Os links do rodapé: os mesmos de secoes.ts mais o "Entrar" (/login), que fica por último. _(linha 36)_

### `components/home/secoes.ts`
*a lista (id + rótulo) das seções que o topo e o rodapé linkam.*

1. OS LINKS DE SEÇÃO do topo e do rodapé da homepage (id e rótulo). Cada id precisa existir como id de uma seção em components/home/, senão o link não leva a lugar nenhum. _(linha 15)_

### `components/home/TopoHome.tsx`
*a barra fixa no alto da homepage: logo, âncoras das seções, botão de tema e botão "Entrar" (ou "Ir para o sistema" se já houver sessão). No celular as âncoras viram um menu que abre e fecha.*

1. O VISUAL do botão "Entrar" do topo da homepage (um link com cara de botão primário). _(linha 21)_
2. O VISUAL dos links de seção do topo (desktop e menu do celular). _(linha 26)_
3. O BOTÃO DO TOPO: sem sessão mostra "Entrar" e leva a /login; com sessão mostra "Ir para o sistema" e leva a /painel. A home não redireciona quem já está logado. _(linha 51)_
4. O menu do celular fecha com Esc (e devolve o foco ao botão que o abriu). _(linha 64)_
5. Os links de seção no desktop (a partir de 768 px); no celular viram o menu que abre e fecha logo abaixo. A lista vem de ./secoes. _(linha 101)_

### `components/input.tsx`
*campo de texto com rótulo, ícone, estados (padrão, foco, sucesso, erro, desabilitado), mensagem de ajuda/erro e mostrar/ocultar senha.*

1. AS OPÇÕES DO CAMPO DE TEXTO: rótulo, ícone, erro, sucesso (valid), dica (hint) e o modo compacto. Opção nova entra aqui. _(linha 17)_
2. AS CORES DO CAMPO por estado, nesta prioridade: erro (vermelho), sucesso (verde) e padrão (roxo ao focar). _(linha 67)_
3. O espaço à direita do texto digitado, para não passar por cima do olho da senha nem dos ícones de erro e sucesso. _(linha 75)_
4. O CAMPO em si: altura de 48 px (40 px no modo compacto), borda, foco e desabilitado. Mude as classes para mudar todos os campos do sistema. _(linha 100)_
5. O botão do olho dos campos de senha: alterna entre mostrar e ocultar o que foi digitado. _(linha 120)_

### `components/LoginForm.tsx`
*o cartão de login (e-mail, senha, "Lembrar-me"), com validação ao sair do campo, mensagens de erro claras e três botões "Entrar como" que preenchem e-mail e senha de uma conta de demonstração de cada perfil.*

1. OS TEXTOS DA TELA DE LOGIN: título, rótulos, mensagens de erro (senha errada, conta inativa, convite pendente) e o texto dos botões de demonstração. Troque o texto aqui, não no meio do JSX. _(linha 28)_
2. OS LINKS da tela: "Esqueceu a senha?" vai para /recuperar-senha; "Criar conta" ainda é "#" porque o cadastro só existe por convite (/primeiro-acesso). TODO(API). _(linha 58)_
3. OS BOTÕES "ENTRAR COMO" (só no protótipo): um por perfil, usando a primeira conta daquele perfil em CONTAS_DEMO (lib/auth.tsx). Apagar quando a API real entrar. _(linha 68)_
4. AS REGRAS DO FORMULÁRIO de login: e-mail obrigatório e no formato certo (EMAIL_REGEX), senha obrigatória. _(linha 81)_
5. PARA ONDE O LOGIN LEVA: o endereço de ?voltar= (só caminho interno, nunca "//" nem /login, para não abrir outro site nem entrar em laço) ou /painel. _(linha 128)_
6. O ENVIO DO LOGIN: valida, chama entrar() de lib/auth.tsx e, se der certo, vai para o destino. TODO(API): a chamada real fica em lib/auth.tsx. _(linha 156)_
7. A MENSAGEM de cada motivo de recusa: conta inativa, convite não ativado ou e-mail/senha incorretos. Motivo novo da API entra aqui. _(linha 202)_
8. A mensagem de falha de rede ou servidor (diferente de senha errada). _(linha 207)_

### `components/marca/TresPilares.tsx`
*o desenho em SVG que liga Onboarding → Projetos → Dashboards, com as linhas sendo "desenhadas" ao abrir a página.*

1. OS TRÊS PONTOS do diagrama (§1): nome, cor, posição (x, y) e atraso da animação de cada pilar. Usado no painel de marca do login e na abertura da homepage. _(linha 12)_

### `components/paineis/Bloco.tsx`
*a moldura de um bloco de painel (cartão com título, link no canto e os estados carregando e erro) e o link "Ver todas".*

1. Os três estados de um bloco: carregando, erro ou pronto. O vazio e o "com dado" ficam com o conteúdo de cada bloco. _(linha 15)_
2. O link do canto dos blocos ("Ver todas" é o texto padrão). Cada painel passa a tela de destino e, se quiser, outro texto. _(linha 19)_
3. A MOLDURA de todo bloco dos painéis: título, link do canto e os estados carregando (esqueleto) e erro (cadastro da sessão não encontrado). O texto do erro está aqui. _(linha 30)_

### `components/paineis/PainelAdmin.tsx`
*a tela inicial do admin, com números e gráficos de formação, alocação e entregas do programa.*

1. AS CORES dos gráficos de trilha (verde = concluída, roxo = em andamento, cinza = não iniciada), vindas de COR_GRAFICO. A tela /trilhas usa as mesmas. _(linha 36)_
2. O PAINEL DO ADMINISTRADOR (/painel): 4 cartões de número, o bloco "No período" e cinco cartões de detalhe. Tudo é recalculado dos dados; nada é guardado. _(linha 45)_
3. O QUE É TAREFA ATRASADA no painel: prazo vencido e fora da última coluna. É a mesma regra de progressoProjeto (lib/metricas.ts): mude nos dois. _(linha 74)_
4. TAREFAS POR ETAPA: conta pela POSIÇÃO da coluna (1ª a 4ª) e não pelo id; os rótulos são os padrão do §5 (A fazer, Fazendo, Revisão, Pronto). _(linha 92)_
5. PRÓXIMOS PRAZOS: tarefas abertas com prazo de hoje em diante, da mais urgente para a menos, e só as 5 primeiras (slice(0, 5)). _(linha 103)_
6. A CARGA DA SEMANA ATUAL por profissional, da maior para a menor ocupação: horas do dia mais cheio, limite (cargaMax) e nível do semáforo (lib/carga.ts). _(linha 122)_
7. OS 4 CARTÕES DE NÚMERO do topo (empresas ativas, profissionais, projetos em andamento, tarefas atrasadas): rótulo, valor, apoio, ícone, para onde o clique leva e a cor. _(linha 136)_
8. O BLOCO "No período": o filtro de período e os dois gráficos que ele muda (evolução da turma e tarefas concluídas por empresa). _(linha 199)_
9. O SELO DE DIAS dos próximos prazos: âmbar quando faltam 3 dias ou menos, neutro no resto; mostra "hoje" ou "Nd". _(linha 296)_
10. O CARTÃO "Alocação e carga": divide a lista ao meio em duas colunas e a barra cheia vale 50 h (maximoEscala). Passar do limite é aviso, não bloqueio (§5). _(linha 363)_

### `components/paineis/PainelEmpresa.tsx`
*o painel do perfil Empresa com os quatro blocos do §6: andamento dos projetos próprios, quem está alocado e em quê (com período e as horas por semana no projeto dela), entregas aprovadas pela empresa × aguardando a aprovação dela por projeto e o progresso da trilha do time. O cabeçalho mostra o nome fantasia e o status da empresa no programa.*

1. O QUE É ENTREGUE E APROVADA (decisão da PROGLOGIC, 09/10/2026): entregue = tarefa em Revisão ou Pronto; aprovada = a empresa registrou a aprovação no detalhe da tarefa. _(linha 51)_
2. AS ÚLTIMAS ENTREGAS do período: aprovadas com data dentro do filtro, as mais recentes primeiro. _(linha 57)_
3. QUAIS TRILHAS aparecem em "Trilha do time": só as publicadas, com alcance "empresa" e da empresa desta pessoa. _(linha 62)_
4. O ANDAMENTO dos projetos da empresa: percentual pronto, tarefas prontas e atrasadas (progressoProjeto, lib/metricas.ts). Cada linha leva à ficha do projeto. _(linha 84)_
5. AS HORAS DO TIME: a empresa vê as horas semanais de cada pessoa NO PROJETO DELA (decisão da PROGLOGIC, 09/10/2026), nunca a soma nem os outros projetos da pessoa. O recorte vem de alocacoesVisiveis (lib/escopo.ts). _(linha 117)_
6. AS ENTREGAS por projeto: aprovadas × aguardando a aprovação da empresa × em produção (entregasDoProjeto), a lista "Aguardando a sua aprovação" (até 4) e as últimas entregas do período (até 4). _(linha 150)_
7. O PROGRESSO DA TRILHA do time: concluíram, em andamento e não iniciaram, por trilha da empresa (resumoTrilha). _(linha 227)_

### `components/paineis/PainelProfissional.tsx`
*o painel do perfil Profissional com os quatro blocos do §6: minhas trilhas e progresso, minhas tarefas e prazos, minha carga da semana e meu histórico de entregas; saudação com o primeiro nome e a data de hoje.*

1. A CARGA DAS PRÓXIMAS 8 SEMANAS a partir da atual (linhaDoTempo, lib/carga.ts); a primeira é "esta semana". O limite vem do cargaMax da pessoa (padrão 40 h). _(linha 56)_
2. O HISTÓRICO DE ENTREGAS: semanas do período escolhido, só com as tarefas concluídas dentro dele (entregasPorSemana, lib/metricas.ts). _(linha 64)_
3. OS NÚMEROS DE TRILHAS: concluídas, em andamento, prazo perto e vencido. As regras de prazo estão em lib/metricas.ts (situacaoDoPrazo). _(linha 75)_
4. AS 5 PRÓXIMAS TAREFAS: abertas, na ordem de Minhas tarefas (atrasadas, hoje, esta semana, depois). _(linha 81)_
5. O TEXTO E A COR DO PRAZO de cada tarefa: "Atrasada há N dias" (vermelho), "Vence hoje" (âmbar), "Amanhã" ou a data (neutro). _(linha 148)_
6. O BLOCO DE CARGA: nível desta semana (do dia mais cheio), as próximas 8 semanas e a quebra por projeto (F04, lib/carga.ts). _(linha 170)_

### `components/perfil/AbaDados.tsx`
*formulário com nome, telefone e cargo editáveis; e-mail e perfil aparecem como somente leitura. Para o profissional, mostra também o resumo da atuação (área, nível, carga máxima e habilidades), que só o administrador edita.*

1. AS REGRAS DOS DADOS: o nome precisa de nome e sobrenome (mesma regra de /pessoas); telefone e cargo são livres. _(linha 55)_
2. O SALVAR DOS DADOS: grava só nome, telefone e cargo e atualiza o nome na sessão (para o topo mudar na hora). TODO(API): PATCH no perfil do usuário. _(linha 70)_
3. O QUE A PESSOA NÃO EDITA aqui: e-mail (é o login) e perfil de acesso; só o administrador muda. Campo novo somente leitura entra neste bloco. _(linha 112)_

### `components/perfil/AbaPreferencias.tsx`
*escolha do tema (claro, escuro ou seguir o sistema) e da densidade das tabelas (confortável ou compacta).*

1. AS TRÊS ESCOLHAS DE TEMA (claro, escuro, seguir o sistema) e seus nomes. A regra de aplicar o tema fica em lib/tema.ts. _(linha 17)_
2. AS DUAS DENSIDADES DE TABELA (confortável e compacta) e seus nomes. O efeito está em components/ui/Tabela.tsx. _(linha 25)_
3. A DENSIDADE fica no cadastro da pessoa (vale em qualquer navegador); o tema fica só neste navegador. TODO(API): PATCH nas preferências. _(linha 44)_

### `components/perfil/AbaSeguranca.tsx`
*formulário de troca de senha (senha atual, nova senha com regras em tempo real e confirmação).*

1. AS REGRAS DA TROCA DE SENHA: senha atual preenchida, nova dentro das regras (lib/senha.ts) e diferente da atual, confirmação igual. _(linha 38)_
2. A TROCA DE SENHA: confere a senha atual, grava a nova e limpa o formulário. SIMULADO (texto puro no navegador, nunca para produção). TODO(API): a API confere a senha atual. _(linha 57)_

### `components/PrimeiroAcessoForm.tsx`
*o cartão da tela /primeiro-acesso. Mostra nome e e-mail do convidado (somente leitura), pede nova senha com confirmação e o aceite dos termos e da LGPD; ao salvar, ativa a pessoa e abre a sessão.*

1. AS REGRAS DO PRIMEIRO ACESSO: senha dentro das regras (lib/senha.ts), confirmação igual e aceite dos termos marcado. _(linha 67)_
2. OS ESTADOS DE ERRO DO CONVITE: sem ?convite=, id que não existe, conta já ativa e conta inativa. Cada um tem o seu título e a sua explicação. _(linha 108)_
3. A ATIVAÇÃO DA CONTA: grava a senha, passa a pessoa para ativa, abre a sessão e vai para o painel. TODO(API): vira um POST com o token do convite. _(linha 119)_
4. PARA ONDE O PRIMEIRO ACESSO LEVA: profissional com trilha obrigatória pendente vai para Minhas trilhas (se a trava estiver ligada); os demais, para o painel. _(linha 143)_
5. O ACEITE dos termos de uso e da política de privacidade (LGPD), obrigatório. TODO(PROGLOGIC): os textos e os endereços oficiais ainda não existem. _(linha 166)_

### `components/projetos/AnexosDaTarefa.tsx`
*a área "Anexos" do detalhe da tarefa: botão de escolher arquivo, arrastar e soltar, a lista com ícone por tipo, tamanho legível, quem enviou e quando, e remover com confirmação na própria linha (Esc cancela sem fechar o detalhe). SIMULADO: guarda só os metadados do arquivo.*

1. O ÍCONE DE CADA TIPO de arquivo (imagem, PDF, planilha, documento, compactado, outro). A categoria vem de lib/anexos.ts. _(linha 25)_
2. O ANEXAR: valida cada arquivo (validarArquivo, lib/anexos.ts), grava só os metadados na tarefa e mostra o primeiro erro. SIMULADO: o conteúdo do arquivo é descartado. TODO(API): upload real. _(linha 53)_
3. A REMOÇÃO do anexo, com confirmação na própria linha (um segundo modal faria o Esc fechar os dois). Apaga só o metadado. _(linha 84)_

### `components/projetos/ArquivosDoProjeto.tsx`
*a aba "Arquivos" do projeto: todos os anexos das tarefas do projeto, com filtro por tipo e link para a tarefa de origem. SIMULADO: só metadados.*

1. OS ARQUIVOS DO PROJETO: todos os anexos das tarefas (anexosDoProjeto, lib/anexos.ts), só das tarefas que a pessoa já enxerga. _(linha 36)_
2. O FILTRO POR TIPO: só oferece as categorias que existem neste projeto, mais "Todos". _(linha 38)_

### `components/projetos/CartaoTarefa.tsx`
*o cartão de uma tarefa dentro de uma lista do quadro kanban. Só pode ser arrastado por quem pode mover a tarefa; os outros veem um cadeado.*

1. O CARTÃO DO QUADRO: etiquetas, título e selos (prazo, checklist, aprovada, comentários, responsável). Não arrasta sozinho: repassa os eventos ao Quadro. _(linha 20)_
2. QUANDO O PRAZO É "ATRASADO" E "PERTO": atrasada = prazo vencido e fora da última lista; perto = vence hoje ou nos próximos 2 dias. _(linha 47)_
3. AS CORES DO SELO DE PRAZO, por prioridade: concluída (verde), atrasada (vermelho), perto (âmbar) e normal (cinza). O texto do selo segue a mesma ordem. _(linha 53)_
4. O SELO "Aprovada": aparece quando a empresa aprovou a entrega (aprovadaEm). Ícone e texto, nunca só cor. _(linha 118)_

### `components/projetos/cores.ts`
*a paleta de fundos que o usuário escolhe para o quadro de um projeto.*

1. AS CORES DE FUNDO DO QUADRO (roxo, verde, âmbar, azul, rosa, tinta): nome, gradiente e cor sólida. Renomear ou apagar uma chave manda os projetos que a usam para o roxo. _(linha 10)_
2. O PLANO B DA COR: chave desconhecida cai no roxo, para o quadro nunca ficar sem fundo. _(linha 33)_

### `components/projetos/DetalheTarefa.tsx`
*o painel (modal) com todos os dados de uma tarefa. Admin edita na hora; os outros perfis veem os campos como TEXTO somente leitura (a regra está em lib/permissoes.ts). Comentar fica liberado a quem enxerga o projeto; comentário de quem é do perfil Empresa ganha a etiqueta "Empresa". A empresa aprova a entrega (tarefa em Revisão ou Pronto) numa seção própria.*

1. AS ETIQUETAS-ATALHO oferecidas no detalhe da tarefa; o campo "Nova etiqueta" cria outras. A cor de cada uma está em components/ui/basicos.tsx (FIXAS). _(linha 35)_
2. AS PERMISSÕES DO DETALHE (editar, excluir, mover, comentar), todas por podeFazer (lib/permissoes.ts). Quem não pode editar vê os campos como texto. O "mover" precisa concordar com o Quadro. _(linha 72)_
3. A APROVAÇÃO DA ENTREGA (decisão da PROGLOGIC, 09/10/2026): só a empresa dona do projeto aprova, e só com a tarefa em Revisão ou Pronto. Desfazer apaga a data e quem aprovou. _(linha 81)_
4. QUEM ANEXA ARQUIVO: o administrador em qualquer tarefa, o profissional só nas próprias; a empresa só vê a lista. _(linha 97)_
5. QUEM PODE SER RESPONSÁVEL: os alocados no projeto mais o responsável atual (mesmo que já tenha saído da equipe). _(linha 102)_
6. O SALVAR DO DETALHE: não há botão Salvar; cada campo grava ao mudar. TODO(API): vira PATCH da tarefa. _(linha 106)_
7. A SEÇÃO "Aprovação da entrega": aparece com a tarefa em Revisão ou Pronto (ou já aprovada). Só a empresa vê o botão; os outros perfis veem o estado. _(linha 224)_
8. O STATUS é o "mover para..." do celular, no lugar de arrastar: o administrador sempre, o profissional só nas próprias tarefas. _(linha 288)_
9. A EXCLUSÃO DA TAREFA: em dois passos, só para quem pode excluir; apaga também checklist e comentários. TODO(API): DELETE da tarefa. _(linha 344)_

### `components/projetos/Equipe.tsx`
*a aba Equipe do projeto (tabela de alocações + modal para alocar/editar). Editar e remover alocação só aparecem para quem pode alocar (Admin). A Empresa aloca o time nos projetos dela e vê as horas por pessoa; só o admin vê o semáforo e as trilhas das pessoas (privacidade).*

1. OS PAPÉIS possíveis de uma pessoa no projeto (Líder, Front-end, Back-end, UX, QA, Dados). Papel novo entra nesta lista. _(linha 40)_
2. QUEM ALOCA (decisão da PROGLOGIC, 09/10/2026): o administrador em qualquer projeto e a empresa nos projetos dela, por podeFazer "alocar". Para os outros, os botões nem aparecem. _(linha 62)_
3. PRIVACIDADE: a empresa vê as horas de cada pessoa neste projeto, mas não o semáforo nem as trilhas (somariam projetos e trilhas de outros clientes). Só o administrador vê os dois. _(linha 68)_
4. O FORMULÁRIO DE ALOCAÇÃO: escolher pessoa, papel, período e carga semanal, com a prévia do semáforo antes de gravar. _(linha 156)_
5. AS REGRAS DA ALOCAÇÃO: pessoa, papel, início e carga (mínimo 1 h) obrigatórios; fim opcional (vazio vale a entrega do projeto). Não há carga máxima: é aviso, não bloqueio (§5). _(linha 168)_
6. OS VALORES INICIAIS de uma alocação nova: o período do projeto e 20 h por semana. _(linha 186)_
7. QUEM PODE SER ALOCADO: profissionais não inativos que ainda não estão na equipe deste projeto. _(linha 192)_
8. A TRAVA DE SOBRECARGA: com BLOQUEAR_SOBRECARGA (lib/carga.ts) ligada, o botão Alocar recusa semana vermelha. Hoje está desligada (§5: aviso, não bloqueio). _(linha 210)_
9. O SALVAR DA ALOCAÇÃO: cria ou atualiza. A notificação à pessoa é SIMULADA. TODO(API): POST ou PUT de alocação. _(linha 223)_

### `components/projetos/FormProjeto.tsx`
*o modal de criar ou editar um projeto.*

1. AS OPÇÕES DO CAMPO "Tipo" do projeto (opcional). Tipo novo entra nesta lista. _(linha 32)_
2. AS REGRAS DO PROJETO (§5 e §11): nome e empresa sempre; contato, descrição, datas e líder só fora do rascunho; a entrega não pode vir antes do início. _(linha 56)_
3. OS VALORES INICIAIS de um projeto novo: começa hoje, entrega em 60 dias, prioridade média e fundo roxo. _(linha 77)_
4. QUEM PODE SER O CONTATO: o contato principal da empresa mais as pessoas de perfil Empresa ligadas a ela. Só aparece depois de escolher a empresa. _(linha 85)_
5. QUEM PODE SER LÍDER: profissionais com status ativo. _(linha 92)_
6. A CRIAÇÃO DO PROJETO: nasce como Planejado com as 4 listas padrão (COLUNAS_PADRAO, lib/seed.ts) e abre direto na aba Equipe. TODO(API): POST do projeto. _(linha 115)_

### `components/projetos/Quadro.tsx`
*o quadro kanban de um projeto (listas + cartões com arrastar e soltar), com o indicador "Ao vivo" e o destaque do cartão que outra pessoa mexeu (tempo real simulado, G02). Respeita o perfil: só quem pode mover arrasta, e os botões de criar cartão/lista e de editar lista só existem para quem pode usá-los.*

1. O QUADRO KANBAN: listas lado a lado no desktop e abas no celular, arrastar e soltar nativo (HTML5), criar cartão e gerenciar listas. _(linha 29)_
2. AS PERMISSÕES DO QUADRO: tudo passa por podeFazer (lib/permissoes.ts). Os botões de criar cartão e de editar lista só aparecem para quem tem a permissão; o detalhe da tarefa precisa concordar com esta regra. _(linha 61)_
3. O TEMPO REAL: quando OUTRA aba mexe numa tarefa deste projeto, o cartão fica destacado por 2,5 s e o aviso "Fulano moveu... para ..." aparece ao lado de "Ao vivo". SIMULADO entre abas. _(linha 79)_
4. A ÚLTIMA LISTA É "PRONTO" (tarefa concluída). Isso vale também para o selo do cartão, o prazo do detalhe e a data de conclusão gravada ao mover (lib/store.tsx). _(linha 105)_
5. O CÁLCULO DA POSIÇÃO ao arrastar: o cartão cai antes do primeiro cartão cujo meio está abaixo do mouse; se nenhum, vai para o fim da lista. _(linha 119)_
6. A SOLTURA: confere de novo a permissão mover_tarefa e grava com moverTarefa (renumera a lista). Só avisa quando troca de lista. TODO(API). _(linha 159)_
7. AS REGRAS DE EXCLUIR LISTA: só lista vazia e o quadro precisa ficar com pelo menos duas listas (uma de trabalho e a última, "Pronto"). _(linha 257)_
8. ONDE ENTRA UMA LISTA NOVA: antes da última, para "Pronto" continuar sendo a última. _(linha 333)_
9. A CRIAÇÃO RÁPIDA DE CARTÃO: título, responsável e prazo são obrigatórios (§5); prazo sugerido = hoje + 7 dias; nasce com prioridade média; o responsável é escolhido entre os alocados no projeto. _(linha 372)_

### `components/projetos/Vistas.tsx`
*as vistas alternativas ao quadro: Lista (tabela) e Cronograma (barras no tempo).*

1. A COR DO STATUS nas vistas: a última lista é sempre verde; as demais usam as 3 primeiras cores de TONS_COLUNA (components/ui/Graficos.tsx). _(linha 22)_
2. A VISTA EM LISTA: a mesma tarefa em tabela, ordenável por prazo (padrão), prioridade e status. Clicar na linha abre o detalhe. _(linha 39)_
3. A ORDEM DE PRIORIDADE ao ordenar: alta primeiro, depois média e baixa. _(linha 52)_
4. O CRONOGRAMA: uma barra por tarefa sobre a janela do projeto, com a linha de "hoje" e a da entrega prevista. Rola na horizontal no celular. _(linha 130)_
5. A JANELA DO CRONOGRAMA: começa no menor entre o início do projeto e o início estimado das tarefas e termina no maior entre a entrega e os prazos. _(linha 148)_
6. O INÍCIO ESTIMADO DA BARRA (SIMULADO): a tarefa não tem data de início, então conta 1 dia por item do checklist, no mínimo 3, antes do prazo. _(linha 198)_

### `components/RecuperarSenhaForm.tsx`
*o cartão da tela /recuperar-senha. Passo 1: e-mail. Passo 2: "e-mail enviado" (com o botão de demonstração que abre o link). Passo 3: nova senha e confirmação, com as regras em tempo real.*

1. A REGRA DO E-MAIL do passo 1: obrigatório e no formato nome@empresa.com. _(linha 34)_
2. O ENVIO DO LINK (simulado: espera 700 ms). A resposta é igual exista ou não a conta, para ninguém descobrir quem é cadastrado. TODO(API): pedir o e-mail à API. _(linha 57)_
3. AS REGRAS DA NOVA SENHA: dentro das regras de lib/senha.ts e confirmação igual. _(linha 142)_
4. A TROCA DE SENHA: grava a nova senha (a antiga deixa de valer), avisa e volta ao login. TODO(API): vira PATCH com o token do link. _(linha 159)_
5. QUAL PASSO ABRIR: com ?token= aceita só "demo" e e-mail válido (simulado, vira a validação da API) e mostra a nova senha; senão, link inválido. Sem token, passo 1 ou 2. _(linha 234)_

### `components/shell/EmConstrucao.tsx`
*o cabeçalho de uma página mais um estado vazio "Em construção", usado pelas telas que ainda serão feitas nos próximos blocos.*

1. O bloco "Em construção" (ícone, título e descrição) para tela ainda não entregue. Hoje nenhuma rota usa; fica pronto para o próximo bloco novo. _(linha 12)_
2. A página completa "Em construção": cabeçalho padrão mais o bloco. Para uma tela nova provisória, use este componente na page.tsx. _(linha 26)_

### `components/shell/navegacao.ts`
*a lista (agrupada) de telas que aparecem no menu lateral, com endereço, rótulo, ícone e os perfis que enxergam cada item.*

1. O MENU LATERAL: grupos, rótulos, ícones, endereços e quais perfis veem cada item. Tela nova precisa ser registrada aqui (e em lib/permissoes.ts, que é quem barra o acesso). _(linha 13)_
2. A ORDEM do menu de cada perfil é a ordem desta lista; por isso "Projetos" aparece duas vezes (depois de Carga para admin e empresa, depois de Minhas tarefas para o profissional). _(linha 45)_
3. A empresa abre a mesma tela de Minhas trilhas, só com outro nome no menu ("Trilha da empresa"). Para mudar o nome que ela vê, é aqui. _(linha 50)_

### `components/shell/Pagina.tsx`
*cabeçalho da página (trilha de navegação, título, descrição e ação principal) e a barra de filtros que fica acima do conteúdo.*

1. O CABEÇALHO PADRÃO de toda tela interna: título (o único h1), descrição, ação principal à direita e caminho de volta (breadcrumb). Mude aqui para mudar todas as telas. _(linha 15)_
2. Onde ficam os filtros de uma lista: sempre acima do conteúdo e quebrando linha no celular (§10). _(linha 56)_

### `components/shell/Sidebar.tsx`
*o menu de navegação à esquerda, que marca a tela atual; no celular vira uma gaveta que abre por cima do conteúdo. Mostra só os itens do perfil da sessão.*

1. O nome de cada perfil mostrado no menu lateral (a mesma lista existe no Topbar e em lib/metricas.ts: ROTULO_PERFIL). _(linha 22)_
2. O filtro do menu por perfil: tira os itens que o perfil não vê e os grupos que ficaram vazios. É o que faz cada perfil ter o seu menu. _(linha 39)_
3. O conteúdo do menu é montado uma vez e usado nas duas versões: fixa no desktop (a partir de 1024 px) e gaveta no celular. _(linha 46)_
4. O logo do topo do menu leva ao painel (a tela inicial do sistema). Se a tela inicial mudar, troque este endereço. _(linha 52)_
5. Como o item ativo do menu é marcado: o endereço atual é o do item ou uma subpágina dele (/projetos/x mantém "Projetos" destacado). _(linha 72)_

### `components/shell/Topbar.tsx`
*a faixa no alto de toda tela logada, com busca global (Ctrl+K), avisos (atrasos e sobrecarga), troca de tema e menu do perfil. Busca e avisos só mostram o que o perfil da sessão pode ver (lib/escopo.ts e lib/permissoes.ts). No perfil Empresa, o nome da empresa aparece ao lado do avatar.*

1. O nome do perfil mostrado na etiqueta do topo (Administrador, Empresa, Profissional). _(linha 31)_
2. No perfil Empresa, o nome fantasia da empresa aparece ao lado do avatar, para o cliente ver em nome de quem está no sistema. _(linha 45)_
3. Os atalhos da busca: Ctrl+K (Cmd+K no Mac) sempre, e a barra "/" fora de campos de texto. Para mudar o atalho, é aqui. _(linha 67)_
4. A BUSCA GLOBAL: só a partir de 2 letras, no máximo 8 resultados, em projetos, empresas, pessoas e trilhas, respeitando o que o perfil pode ver. TODO(API): vira chamada ao servidor. _(linha 83)_
5. Ao escolher um resultado ou aviso: limpa a busca e navega para o endereço. Empresas e pessoas abrem a ficha com ?abrir=<id>. _(linha 111)_
6. OS AVISOS DO SINO: tarefa atrasada (para todos os perfis, só nos projetos que a pessoa vê) e profissional acima do limite de horas (só para o admin). Aviso novo entra aqui. _(linha 115)_
7. O item "Restaurar dados de demonstração" do menu do perfil: volta ao seed e APAGA o que foi editado. Só existe no protótipo. _(linha 272)_
8. O item "Sair": apaga a sessão e vai para /login (replace, para o Voltar não reabrir a tela de dentro). _(linha 280)_

### `components/shell/TrilhaPendente.tsx`
*tela mostrada no lugar de uma rota bloqueada enquanto o profissional tem trilha obrigatória pendente, com botão para a trilha.*

1. O texto do bloqueio gentil quando a trava da trilha obrigatória impede abrir uma tela (título e explicação). Quem decide bloquear é lib/permissoes.ts. _(linha 15)_
2. Para onde o bloqueio leva: /minhas-trilhas. Troque o endereço se a tela das trilhas mudar de lugar. _(linha 27)_

### `components/ThemeToggle.tsx`
*botão redondo (sol/lua) que alterna o tema e lembra a escolha.*

1. O CLIQUE do botão de tema: escolhe o tema oposto ao atual e grava a escolha (a regra fica em lib/tema.ts). _(linha 24)_
2. O texto do botão (leitor de tela e dica) descreve a ação do clique: "Usar tema claro" ou "Usar tema escuro". _(linha 30)_
3. Os ícones do botão (sol e lua): um gira e some enquanto o outro aparece. Para outro ícone, troque Sun e Moon. _(linha 42)_

### `components/trilhas/ConteudoEtapa.tsx`
*mostra o conteúdo de uma etapa conforme o tipo: texto em parágrafos, vídeo e áudio com o player nativo do navegador, e PDF/apresentação/link como um cartão "Abrir em nova aba". Sem endereço, avisa que é conteúdo de demonstração; se o vídeo/áudio não carregar, mostra o erro e o link.*

1. O CONTEÚDO DE CADA TIPO DE ETAPA: texto e quiz mostram só os parágrafos; vídeo e áudio usam o player do navegador (com aviso se o arquivo não carregar); PDF, apresentação e link externo viram um cartão com "Abrir em nova aba". _(linha 53)_
2. O AVISO DE ETAPA DE TEXTO SEM TEXTO ("Conteúdo de demonstração"): no protótipo a pessoa pode concluir a etapa mesmo assim. _(linha 69)_

### `components/trilhas/EditorConteudoEtapa.tsx`
*o painel que abre embaixo de uma etapa no editor de trilha: texto e endereço do conteúdo e, se a etapa for quiz, o editor de perguntas (adicionar, remover, reordenar, alternativas e marcação da correta).*

1. A REGRA DO ENDEREÇO do conteúdo da etapa: precisa começar com http:// ou https:// e ter um ponto no domínio. _(linha 23)_
2. O MÁXIMO DE ALTERNATIVAS por pergunta: 6 (o deck não fixa; cabe na tela do celular). As letras A a H são só para mostrar. _(linha 29)_
3. A PERGUNTA NOVA do quiz: nasce com duas alternativas em branco e nenhuma marcada como correta. _(linha 33)_
4. APAGAR UMA ALTERNATIVA: o índice da correta é ajustado (some se era a removida; sobe uma posição se estava depois dela), senão a resposta certa muda sem ninguém ver. _(linha 76)_

### `components/trilhas/PrazoTrilha.tsx`
*o selo de prazo de uma trilha para a pessoa (concluída, no prazo, perto de vencer ou vencida), sempre com ícone e texto, nunca só a cor.*

1. O TEXTO E A COR DO PRAZO DA TRILHA: Concluída, Prazo indeterminado (prazoDias 0), Venceu em dd/mm, Vence hoje, Falta 1 dia, Faltam N dias e Até dd/mm. Quando fica "perto" é definido em lib/metricas.ts (DIAS_PRAZO_PERTO). _(linha 20)_

### `components/trilhas/QuizEtapa.tsx`
*o quiz de uma etapa para quem cumpre a trilha: responder (uma pergunta por vez no celular, todas no desktop), enviar, ver a nota e a revisão de cada resposta e, se reprovar com tentativas, tentar de novo com as alternativas embaralhadas.*

1. O PONTO DE QUEBRA DO QUIZ: a partir de 768 px todas as perguntas aparecem juntas; abaixo disso, uma por vez no celular. _(linha 24)_
2. O QUIZ DA ETAPA: não grava nada sozinho; ao enviar, entrega a correção e o resultado ao player, que registra a tentativa (lib/quiz.ts) e conclui a etapa se aprovado. _(linha 45)_
3. A ORDEM DAS ALTERNATIVAS: na primeira rodada, a original; nas tentativas seguintes, embaralhada com uma semente por pergunta (a ordem não pula ao redesenhar). _(linha 78)_
4. O LIMITE DE TENTATIVAS vem da etapa (tentativasMax, 0 = sem limite; a PROGLOGIC permite até 10, LIMITE_TENTATIVAS em lib/quiz.ts). Esgotadas, só a coordenação libera uma nova. _(linha 87)_
5. O RESULTADO DA TENTATIVA: aprovado, reprovado com tentativas sobrando ou reprovado sem tentativas, pela nota mínima da etapa (resultadoDoQuiz, lib/quiz.ts). _(linha 106)_
6. QUANDO O GABARITO APARECE: só quando não há mais o que tentar (aprovado ou sem tentativas); com tentativas sobrando ele tornaria a próxima tentativa decoreba. _(linha 130)_

### `components/ui/basicos.tsx`
*peças pequenas e reaproveitáveis da interface: Card, Etiqueta, Avatar, Aviso, Abas, Paginação, Progresso, Esqueleto, Estado vazio e Estado de erro.*

1. O cartão branco (borda, raio, sombra) que envolve todo bloco das telas. Para mudar o visual de TODOS os cartões, mude as classes aqui. _(linha 19)_
2. O cabeçalho padrão de um cartão: título, descrição e o link ou botão de ação no canto. _(linha 36)_
3. AS CORES DAS ETIQUETAS por tom (neutro, primária, sucesso, aviso, erro). Cor tem significado fixo no CAIS (§9): verde = sucesso, âmbar = atenção, vermelho = erro, roxo = ação. _(linha 60)_
4. A paleta das etiquetas de tarefa (estilo Trello): seis cores sólidas com contraste AA. Cor nova entra na lista. _(linha 89)_
5. Quais etiquetas conhecidas têm cor fixa (Front, UX, API, QA, Login, Gráfico, Back). Etiqueta nova da lista: acrescente aqui. _(linha 100)_
6. Como uma etiqueta ganha cor: as da lista FIXAS usam a cor combinada; as outras recebem uma cor estável calculada pelo nome. _(linha 104)_
7. A paleta das bolinhas com iniciais (avatares): cores escuras o bastante para o texto branco. _(linha 142)_
8. O visual de cada tipo de aviso (info, sucesso, aviso, erro): caixa, ícone e cor. Aviso de erro é anunciado na hora pelo leitor de tela. _(linha 199)_
9. As abas do sistema: navegáveis pelas setas do teclado, com contagem opcional. Todas as telas com abas usam este componente. _(linha 236)_
10. A paginação das listas: quantos itens por página (porPagina), a contagem do resultado e o nome do item no rodapé. _(linha 298)_
11. A barra de progresso com texto para leitor de tela. Os tons seguem o significado das cores (primária, sucesso, aviso, erro). _(linha 340)_
12. O bloco cinza animado do estado "carregando" (nunca tela em branco); a animação é a classe .esqueleto de app/globals.css. O formato é dado por quem usa, pela classe. _(linha 365)_
13. O estado vazio padrão: ícone, o que significa estar vazio e a próxima ação. Toda lista e todo bloco vazio usa este componente. _(linha 392)_
14. O estado de erro padrão: diz o que houve, em português, e oferece como tentar de novo. É o que o layout mostra quando os dados não carregam. _(linha 414)_

### `components/ui/FiltroPeriodo.tsx`
*o filtro de período dos painéis (Últimos 7, 30 e 90 dias, Este mês e Personalizado) e o hook usePeriodo, que guarda o período na URL (?de=&ate=) para o link poder ser compartilhado e reabrir no mesmo período.*

1. O período padrão dos painéis quando a URL não traz um válido: 30 dias. _(linha 23)_
2. A leitura do período na URL (?de=&ate=). URL sem período, com data malformada ou com fim antes do início volta ao padrão. Precisa de <Suspense> na página. _(linha 29)_
3. Trocar o período grava na URL (replace, não push: o botão Voltar não passa por cada período). É o que faz o link ser compartilhável. _(linha 47)_
4. A validação do "Personalizado": o fim não pode vir antes do início; com erro, o período não é aplicado. _(linha 78)_
5. Os atalhos do filtro (7, 30 e 90 dias, Este mês, Personalizado) e seus nomes. O significado de cada um está em lib/metricas.ts (ultimosDias, esteMes). _(linha 101)_

### `components/ui/form.tsx`
*Select, Área de texto, Controle segmentado, Interruptor e Seção de formulário, com os mesmos estados do Campo (padrão, foco, erro, desabilitado).*

1. O visual base de todos os campos de formulário (borda, foco, desabilitado). Mude aqui para mudar Select e Área de texto juntos; o Input fica em components/input.tsx. _(linha 21)_
2. As cores do estado do campo: normal e erro (borda vermelha). O sucesso é só do Input. _(linha 25)_
3. O select nativo estilizado (acessível e bom no celular), com rótulo, erro e dica. Todo "Escolha..." do sistema é este componente. _(linha 80)_
4. A caixa de texto de várias linhas, com rótulo, erro e dica (rows define a altura inicial). _(linha 125)_
5. O controle de escolha única entre poucas opções (perfil, período, vista), acessível como grupo de rádios. _(linha 148)_
6. O liga/desliga acessível (role="switch"), com rótulo e descrição. Usado em prazo indeterminado, preferências e interruptores de formulário. _(linha 180)_
7. O bloco com título que agrupa campos dentro de um formulário longo (cadastros de pessoa e empresa). _(linha 209)_

### `components/ui/Graficos.tsx`
*gráficos simples feitos em SVG/HTML puro (barra empilhada, legenda, rosca, barras com limite e colunas), leves e acessíveis: cada gráfico tem um resumo em texto para leitor de tela e usa as cores dos tokens do tema.*

1. AS CORES DOS GRÁFICOS (concluída, andamento, revisão, a fazer, não iniciada...) como variáveis CSS que trocam com o tema. Os valores ficam em app/globals.css (--grafico-*). _(linha 23)_
2. A cor de cada lista do quadro por POSIÇÃO (A fazer, Fazendo, Revisão, azul, rosa). A última lista ("Pronto") usa COR_GRAFICO.concluida. _(linha 41)_
3. A barra horizontal dividida em segmentos (trilhas, entregas). Tem resumo em texto para leitor de tela. _(linha 49)_
4. A legenda dos gráficos: bolinha de cor, nome e número. Cor nunca aparece sozinha. _(linha 73)_
5. O gráfico de rosca (SVG próprio, sem biblioteca) com número no centro. _(linha 92)_
6. Barras com linha de limite (a carga de cada pessoa do painel do admin). Aceita o nível do semáforo (texto e cor) ao lado do número. _(linha 133)_
7. As colunas verticais simples (tarefas por lista, entregas por semana). A altura máxima vem do parâmetro altura. _(linha 178)_

### `components/ui/Menu.tsx`
*caixinha de opções que abre abaixo de um botão e fecha com Esc ou com um clique fora dela.*

1. O menu suspenso (menu do perfil, ações de linha): abre pelo botão, fecha com Esc ou clique fora. alinhar, largura e flutuante controlam posição e tamanho. _(linha 15)_
2. Um item do menu suspenso (com ícone e o modo "perigo" em vermelho). Todo item de menu do sistema é este componente. _(linha 94)_

### `components/ui/Modal.tsx`
*caixa de diálogo que abre por cima da tela, com título, conteúdo rolável e rodapé de ações (e foco do teclado preso dentro dela).*

1. O MODAL padrão: prende o foco, fecha com Esc ou clique fora, devolve o foco a quem abriu e trava a rolagem. "lateral" vira painel pela direita. Todo diálogo do sistema usa este componente. _(linha 19)_
2. Trava a rolagem da página enquanto o modal está aberto (e destrava ao fechar). _(linha 82)_
3. As larguras do modal: sm, md (padrão), lg e xl. Para um tamanho novo, acrescente aqui e no tipo da prop tamanho. _(linha 129)_
4. O fundo escurecido do modal (veil). Clicar nele fecha o modal. Cor em hex fixo: item cosmético pendente da revisão H01 (virar token). _(linha 140)_

### `components/ui/RegrasSenha.tsx`
*lista que mostra, enquanto a pessoa digita, quais regras da senha já foram cumpridas (ícone E texto, nunca só cor).*

1. A lista de regras da senha com ícone e texto (cumprida ou pendente). As regras em si vêm de lib/senha.ts (regrasDaSenha); aqui só o visual. _(linha 13)_

### `components/ui/Semaforo.tsx`
*as peças visuais do semáforo de carga: o indicador de um nível (pílula com ícone e %), a fileira de semanas e a legenda dos quatro níveis.*

1. O ÍCONE de cada nível do semáforo (círculo vazio, check, alerta, triângulo). A forma muda junto com a cor para quem não distingue cores. _(linha 19)_
2. As cores de fundo e texto de cada tom do semáforo (mesmas das etiquetas do design system). _(linha 22)_
3. O texto lido pelo leitor de tela e mostrado no tooltip ("113%, acima do limite"). Mude aqui para mudar o texto de todas as células. _(linha 31)_
4. A pílula do semáforo (ícone + percentual, e o nome do nível no modo normal). É a peça usada em /carga, aba Equipe, painéis e ficha. _(linha 52)_
5. A fileira de semanas com a data da segunda acima de cada indicador; com onSelecionar vira botões. Usada no modal de alocação, nos painéis e na ficha. _(linha 80)_
6. A legenda dos quatro níveis; as faixas de % são lidas de LIMIARES (lib/carga.ts), então mudam sozinhas. _(linha 118)_

### `components/ui/Tabela.tsx`
*peças de tabela (Tabela, Th, Td, Tr) com cabeçalho fixo, linhas com destaque ao passar o mouse e rolagem horizontal no celular.*

1. A tabela padrão: rolagem horizontal própria (a página não rola de lado) e rótulo para leitor de tela. Toda lista de dados usa Tabela, Th, Td e Tr. _(linha 21)_
2. A densidade das tabelas (confortável ou compacta) vem da preferência da pessoa; muda o espaçamento de todas as linhas. _(linha 34)_
3. O cabeçalho de coluna (fica fixo no topo da rolagem). Mude as classes para mudar o visual de todos os cabeçalhos. _(linha 46)_
4. A linha da tabela: com onClick vira clicável (cursor e destaque ao passar o mouse). _(linha 69)_

## lib/ (regras e dados)

### `lib/anexos.ts`
*funções puras dos anexos da tarefa (G03): validar o arquivo escolhido, criar o metadado, escrever o tamanho de forma legível, descobrir a categoria (para o ícone e o filtro) e juntar os anexos de um projeto.*

1. Limite de tamanho por arquivo anexado: 10 MB. Mude este cálculo (e os textos das telas) para aceitar arquivos maiores. _(linha 20)_
2. Nomes das categorias de arquivo (Imagens, PDFs...) usados no filtro da aba Arquivos. _(linha 27)_
3. Como um arquivo vira categoria (imagem, PDF, planilha...), pelo tipo MIME ou pela extensão. Extensão nova: acrescente na lista da categoria. _(linha 62)_
4. A validação de upload: recusa arquivo vazio ou acima do limite, com mensagem em português dizendo como corrigir. _(linha 80)_
5. O que é guardado de um anexo: SÓ nome, tipo, tamanho, autor e data (nunca o conteúdo). TODO(API): guardar a url do upload. _(linha 93)_

### `lib/auth.tsx`
*guarda quem está logado (a sessão), oferece entrar(), iniciarSessao(), atualizarSessao() e sair() e guarda as SENHAS SIMULADAS (definirSenha e conferirSenha). !!! SIMULADO, NUNCA PARA PRODUÇÃO !!! As senhas ficam em TEXTO PURO no localStorage ('cais-senhas-demo'), só para o protótipo funcionar sem back-end. Guardar, conferir e trocar senha é responsabilidade do back-end da PROGLOGIC (§7). Nada daqui pode ir para produção.*

1. Senha inicial de TODA conta ativa do seed ("Cais@2026"). Mudar aqui muda a senha de demonstração e o texto da tela de login. _(linha 57)_
2. Contas de demonstração do login (botões "Entrar como" e a lista na tela). Conta nova no botão: acrescente aqui e a pessoa em seed.ts. _(linha 61)_
3. Chave onde a sessão fica no navegador. Trocar o nome desloga todo mundo e exige ajustar os testes e o script de tema. _(linha 77)_
4. Chave das senhas trocadas (texto puro, SÓ para o protótipo). TODO(API): apagar; a senha passa a existir só no back-end, com hash. _(linha 81)_
5. Conferência da senha do login: vale a senha trocada ou, se nunca trocou, SENHA_DEMO. TODO(API): quem confere é a API. _(linha 122)_
6. Regras do login, nesta ordem: senha certa, pessoa existe, conta inativa, convite pendente. Latência simulada de 700 ms. Aqui entra o fetch da API. _(linha 170)_
7. Onde a sessão é gravada: localStorage com "Lembrar-me", senão sessionStorage. TODO(API): guardar o token que a API devolver. _(linha 238)_
8. Fluxo do login: autentica, registra o último acesso e grava a sessão. Os três perfis entram; o que cada um vê é decidido em lib/permissoes.ts. _(linha 270)_
9. Abre a sessão SEM pedir senha: só pode ser usada depois de uma prova de identidade (hoje, o fim do primeiro acesso por convite). _(linha 291)_
10. Logout: apaga a sessão dos dois armazenamentos. TODO(API): avisar a API para invalidar o token. _(linha 333)_

### `lib/carga.ts`
*a regra do semáforo de carga em funções puras: quanto da semana de cada pessoa está ocupado, dia a dia, levando em conta QUANDO cada alocação acontece (e não só se ela existe).*

1. ONDE MUDAR AS CORES DO SEMÁFORO: os limites em % que separam folga (até 75), no limite (até 100) e acima do limite. Vale para /carga, painéis, alocação e ficha. _(linha 42)_
2. Projeto pausado conta na carga da pessoa? Hoje sim. TODO(PROGLOGIC): confirmar. Troque para false para pausado deixar de ocupar a agenda. _(linha 53)_
3. Acima do limite é AVISO ou BLOQUEIO? Hoje false (aviso, §5). Com true, o modal de alocação recusa quando alguma semana fica vermelha. _(linha 58)_
4. Até quantos dias à frente a sugestão de "primeira data livre" procura antes de desistir (365). _(linha 65)_
5. Os textos dos quatro níveis ("Livre", "Com folga", "No limite", "Acima do limite") que aparecem em todas as telas do semáforo. _(linha 72)_
6. A cor semântica de cada nível (cinza, verde, âmbar, vermelho). Cor sempre vem junto de ícone e texto. _(linha 81)_
7. Regra de dia útil (segunda a sexta). TODO(PROGLOGIC): feriados ainda contam como dia útil; é aqui que entraria uma lista de feriados. _(linha 110)_
8. Quem entra no semáforo: pessoa inativa e pessoa com limite de horas 0 ficam fora. Mudar aqui muda quem aparece em /carga. _(linha 207)_
9. Quais alocações ocupam a agenda: projeto concluído não conta; pausado depende de CONTAR_PAUSADOS. É o filtro de toda a conta de carga. _(linha 217)_
10. A CONTA DA CARGA: soma das horas semanais das alocações ativas no dia ÷ limite da pessoa, em %. Duas alocações que não se cruzam no tempo não se somam. _(linha 251)_
11. A semana vale pelo PICO (o dia mais cheio), não pela média. Também calcula as horas proporcionais por projeto. Mudar aqui muda todos os níveis do semáforo. _(linha 274)_
12. A sugestão de "usar dd/mm como início" do modal de alocação: primeira data em que a carga nova cabe sem passar de 100% em nenhum dia útil. _(linha 365)_

### `lib/convite.ts`
*monta o link de convite de uma pessoa e copia texto para a área de transferência com tratamento de erro.*

1. Formato do link de convite (/primeiro-acesso?convite=<pessoaId>). TODO(API): o convite real é um token assinado, com validade e uso único. _(linha 9)_
2. Copiar para a área de transferência, com plano B quando o navegador bloqueia; usado nos botões "Copiar link". _(linha 23)_

### `lib/escopo.ts`
*funções puras que filtram os dados (projetos, tarefas, alocações, empresas, pessoas) para mostrar só o que a pessoa logada pode ver.*

1. REGRA CENTRAL de visibilidade de projetos: admin vê todos; empresa os da própria empresa; profissional os em que está alocado. Mudar aqui muda todas as telas. _(linha 27)_
2. Pergunta aberta: o profissional continua vendo o projeto depois que a alocação dele terminou? Hoje continua. _(linha 45)_
3. Porteiro de /projetos/[id] digitado na URL: quem não vê o projeto vai para /sem-permissao. _(linha 52)_
4. Quais tarefas cada perfil vê (as dos projetos visíveis). TODO(PROGLOGIC): confirmar se o profissional vê as tarefas dos colegas. _(linha 65)_
5. Quais empresas cada perfil vê (a empresa vê a própria; o profissional, as dos projetos dele). TODO(PROGLOGIC): confirmar. _(linha 90)_
6. Quais pessoas cada perfil vê (busca do topo e listas). TODO(PROGLOGIC): confirmar se a empresa vê nome e contato dos profissionais alocados. _(linha 109)_

### `lib/metricas.ts`
*funções puras que calculam as entregas por projeto (painel da empresa), público, situação e prazo das trilhas (inclusive a visão do profissional), progresso dos projetos, os grupos de "Minhas tarefas", a carga da semana e o histórico de entregas, e rótulos/cores de status e prioridade.*

1. QUEM RECEBE CADA TRILHA: geral = todos os profissionais e empresas ativos; da empresa = alocados nos projetos dela e as contas da própria empresa; do profissional = os escolhidos. Muda os números do admin. _(linha 18)_
2. Quando a pessoa está não iniciada, em andamento ou concluída numa trilha (pelo número de etapas concluídas). _(linha 48)_
3. O PRAZO DA TRILHA por pessoa: a data mais recente entre a publicação e a entrada da pessoa, mais os dias. prazoDias 0 = prazo indeterminado (sem data). TODO(PROGLOGIC): confirmar de onde conta. _(linha 92)_
4. Quantos dias antes do fim o prazo vira "perto" (aviso âmbar): 3. _(linha 116)_
5. Classifica o prazo em no prazo, perto (3 dias ou menos) ou vencido. É o que pinta o selo de prazo das trilhas. _(linha 120)_
6. O que as telas do profissional mostram de cada trilha (progresso, próxima etapa, prazo). A ordem: abertas por prazo mais curto, concluídas por último. _(linha 154)_
7. Andamento do projeto: tarefa "pronta" = está na ÚLTIMA lista do quadro; "atrasada" = não pronta e com prazo vencido. Mesma regra do quadro e dos painéis. _(linha 196)_
8. Em quais listas a empresa pode aprovar uma entrega: as DUAS últimas (Revisão e Pronto no quadro padrão); em quadro curto, só a última. _(linha 216)_
9. ENTREGAS DO PAINEL DA EMPRESA: aprovadas (a empresa aprovou) × aguardando a aprovação dela × em produção. Mudar aqui muda o gráfico e os números. _(linha 233)_
10. Janela de "Próximas entregas" da Visão geral do projeto: 14 dias. _(linha 254)_
11. Nome de cada perfil em português (Administrador, Empresa, Profissional) usado em menus, tabelas e etiquetas. _(linha 278)_
12. Nomes e cores dos status de empresa (Em negociação, Ativa, Encerrada), usados em /empresas e no cabeçalho do painel da empresa. _(linha 282)_
13. Nomes e cores dos status de projeto (Planejado, Em andamento, Pausado, Concluído). _(linha 295)_
14. Nomes e cores das prioridades de tarefa (Baixa, Média, Alta). _(linha 300)_
15. Por quantos dias uma tarefa concluída ainda aparece em "Concluídas recentemente" de Minhas tarefas: 7. _(linha 311)_
16. Os grupos de Minhas tarefas: Atrasadas, Hoje, Esta semana (até domingo), Depois e Concluídas recentemente. É aqui que se muda o agrupamento. _(linha 339)_
17. O histórico de entregas do profissional: tarefas concluídas por semana, nas últimas N semanas ou nas semanas do período do filtro. _(linha 428)_
18. Trilhas concluídas no período (cada pessoa que terminou uma trilha conta uma vez, pela data concluidaEm). Alimenta o painel do admin. _(linha 507)_
19. "Turma: evolução ao longo do tempo" do painel do admin: trilhas concluídas por semana do período. _(linha 529)_
20. Tarefas concluídas no período somadas por empresa (painel do admin). _(linha 546)_
21. Entregas aprovadas pela empresa num projeto dentro do período (painel da empresa). _(linha 568)_
22. Os atalhos do filtro de período (7, 30 e 90 dias, este mês): é aqui que se muda o que cada atalho significa. _(linha 586)_
23. Descobre qual atalho do filtro um período da URL representa (para marcar a opção certa ao abrir um link compartilhado). _(linha 608)_

### `lib/permissoes.ts`
*funções puras que dizem quais rotas cada perfil abre (podeAcessar) e quais ações cada perfil pode fazer (podeFazer).*

1. QUEM ABRE CADA TELA: a lista de rotas por perfil. Tela nova precisa entrar aqui (rota fora da lista é só do admin) e no menu (components/shell/navegacao.ts). _(linha 19)_
2. Porteiro das rotas: o prefixo mais longo vence e a fronteira é de segmento ("/painelx" não casa com "/painel"). Usado pelo layout de (sistema). _(linha 47)_
3. A tabela de AÇÕES por perfil (o que cada um pode fazer nos projetos). Ação nova entra no tipo Acao, aqui, em ROTULO_DAS_ACOES, TODAS_AS_ACOES e CONDICAO_DA_ACAO. _(linha 97)_
4. Criar, editar e excluir tarefa, editar lista e editar projeto: só o administrador. Para liberar para outro perfil, tire a ação deste grupo. _(linha 108)_
5. ALOCAR: o admin em qualquer projeto e a EMPRESA nos projetos dela (decisão da PROGLOGIC, 09/10/2026). O profissional não aloca. _(linha 119)_
6. APROVAR ENTREGA: só a empresa dona do projeto (decisão da PROGLOGIC, 09/10/2026); admin e profissional só veem o estado. _(linha 127)_
7. MOVER TAREFA: admin move qualquer uma; profissional só as próprias; empresa não move. É a mesma regra do quadro e do detalhe da tarefa. _(linha 133)_
8. COMENTAR: qualquer perfil que enxerga o projeto (a empresa comenta no dela; o profissional, onde está). _(linha 144)_
9. ANEXAR E REMOVER ARQUIVO: admin em qualquer tarefa; profissional só nas próprias; empresa só vê. _(linha 153)_
10. A TRAVA DA TRILHA OBRIGATÓRIA: com true, o profissional com etapa obrigatória pendente numa trilha geral só abre o painel e Minhas trilhas. Com false, a trava some. _(linha 168)_
11. Quem fica preso pela trava: trilha GERAL publicada com etapa obrigatória ainda não concluída. Mudar a definição aqui muda quem é barrado. _(linha 179)_
12. As telas que continuam abertas para quem está preso pela trava (hoje /minhas-trilhas e /painel). _(linha 205)_
13. Nomes das telas na tabela "O que cada perfil pode fazer" da tela /acessos. Tela nova: acrescente aqui também. _(linha 223)_
14. Nomes das ações na tabela de permissões de /acessos. _(linha 243)_
15. A ordem das ações na tabela de /acessos. Ação nova precisa entrar nesta lista. _(linha 258)_
16. O texto da condição ("só as próprias tarefas", "só nos projetos da própria empresa") que aparece na tabela de /acessos. _(linha 291)_

### `lib/preferencias.ts`
*hook que devolve a densidade das tabelas escolhida pela pessoa logada (confortável ou compacta).*

1. Densidade das tabelas (confortável ou compacta): vem do cadastro da pessoa. Para mudar o padrão de quem nunca escolheu, troque o "confortavel" no fim. _(linha 18)_

### `lib/quiz.ts`
*funções puras que corrigem um quiz, decidem o resultado (aprovado, reprovado com ou sem tentativas), embaralham alternativas para uma nova tentativa e calculam o progresso novo (concluir etapa, registrar tentativa).*

1. A CORREÇÃO do quiz: a nota é o percentual de respostas certas. Mudar aqui muda a nota de todos os quizzes. _(linha 37)_
2. O MÁXIMO de tentativas de um quiz (10, regra da PROGLOGIC). O editor da trilha e o aluno respeitam este número. _(linha 67)_
3. Quantas tentativas o quiz permite de verdade (1 a 10): sem valor usa o padrão; o antigo "0 = sem limite" vira 10. _(linha 71)_
4. A REGRA DE APROVAÇÃO: a nota IGUAL à mínima aprova; reprovado ainda pode tentar se sobrar tentativa. Define o aprovado, o pode tentar e o sem tentativas. _(linha 87)_
5. Embaralha as alternativas ao "Tentar de novo" (determinístico, por semente) para a pessoa não decorar a posição da resposta. _(linha 106)_
6. AVANÇO NA TRILHA: só a etapa atual avança, em ordem. Ao terminar a última, grava concluidaEm (alimenta os filtros de período e a evolução da turma). _(linha 152)_
7. Guarda a tentativa e a nota POR QUIZ; se aprovou, já conclui a etapa. É onde a nota entra no progresso da pessoa. _(linha 175)_

### `lib/seed.ts`
*cria o conjunto inicial de empresas, pessoas, trilhas, projetos, alocações e tarefas do protótipo.*

1. As listas padrão de todo projeto novo: A fazer, Fazendo, Revisão, Pronto. A penúltima e a última são as que aceitam aprovação da empresa. _(linha 20)_
2. OS DADOS DE DEMONSTRAÇÃO inteiros (empresas, pessoas, trilhas, projetos, alocações, tarefas). Mudou o seed de forma incompatível? Suba a CHAVE em lib/store.tsx. _(linha 33)_
3. As empresas de exemplo (ativa, em negociação, encerrada). CNPJs e domínios são fictícios. _(linha 51)_
4. As pessoas de exemplo e as CONTAS de login (admin, profissionais, empresas). O cargaMax de cada uma é o limite do semáforo. Conta nova: acrescente também em CONTAS_DEMO (lib/auth.tsx). _(linha 59)_
5. As trilhas de exemplo, com conteúdo, quizzes, prazos e datas de conclusão. As datas de publicação criam prazo vencido, perto e no prazo para a demonstração. _(linha 75)_
6. Os projetos de exemplo, um por situação (em andamento, curto, planejado), cada um de uma empresa. _(linha 162)_
7. AS ALOCAÇÕES que criam os cenários do semáforo: Bruno acima do limite, Diego (o exemplo do time) nunca vermelho, Elisa vermelha em 2 semanas, Gabriela livre. _(linha 171)_
8. As tarefas do quadro, com checklist, comentários, anexos de exemplo e as aprovações da empresa (aprovadaEm). _(linha 190)_

### `lib/senha.ts`
*funções puras que dizem se uma senha cumpre as regras do CAIS e quais regras faltam.*

1. AS REGRAS DE SENHA do sistema (8 caracteres, uma maiúscula, um número). Mudar aqui muda a lista de regras na tela e quem pode criar senha. TODO(API): vir da política da API. _(linha 23)_

### `lib/store.tsx`
*o "banco de dados" do protótipo — guarda empresas, pessoas, trilhas, projetos, alocações e tarefas e expõe ações para ler, salvar e apagar.*

1. A CHAVE DOS DADOS no navegador. Mude o número (v6 → v7) quando o formato dos dados ou o seed mudar de jeito incompatível: todo mundo volta para a demonstração. Atualize também os testes. _(linha 29)_
2. As coleções que todo conjunto de dados precisa ter. Coleção nova entra aqui, no tipo Dados (lib/tipos.ts) e no seed. _(linha 49)_
3. Confere o formato do que foi lido do navegador; dado fora do formato vira a tela de erro "Não foi possível carregar os dados". _(linha 53)_
4. Lê as pessoas direto do navegador SEM o provider (o login usa isto para saber quem existe e em que status). _(linha 70)_
5. TEMPO REAL: ao receber evento de OUTRA aba, relê os dados do navegador. A aba que publicou ignora o próprio evento (evita laço). _(linha 193)_
6. Latência simulada da API (450 ms) que faz aparecer o esqueleto de carregamento. TODO(API): trocar a leitura do localStorage por um fetch GET. _(linha 235)_
7. GRAVAR (criar ou editar) qualquer coisa: upsert por id. Salvar tarefa também publica o evento de tempo real. TODO(API): virar POST ou PATCH. _(linha 261)_
8. APAGAR qualquer coisa. Só projeto tem cascata: apagar um projeto apaga suas tarefas e alocações. TODO(API): virar DELETE. _(linha 287)_
9. MOVER TAREFA no quadro: renumera a ordem, grava concluidaEm ao entrar na última lista e APAGA a aprovação da empresa ao sair de Revisão ou Pronto. _(linha 318)_
10. O botão "Restaurar dados de demonstração": volta ao seed e também é a saída da tela de erro de dados danificados. APAGA o que foi editado. _(linha 360)_
11. As horas ATIVAS HOJE de uma pessoa (usadas em /pessoas e no aviso do topo). Em fim de semana dá 0, porque não é dia útil. Para semanas e períodos use lib/carga.ts. _(linha 386)_

### `lib/tema.ts`
*o ÚNICO lugar que sabe ler, aplicar e gravar o tema do CAIS, e o hook useTema() que mantém todos os botões de tema sincronizados.*

1. Chave do tema salvo ('cais-tema'). O script inline de app/layout.tsx repete este nome: mude os dois juntos, senão a tela pisca no tema errado. _(linha 24)_
2. Como o tema escuro é ligado: a classe .dark no <html>. As cores de cada tema ficam em app/globals.css. _(linha 54)_
3. Troca de tema: grava a escolha (ou apaga, no modo "seguir o sistema") e aplica na hora. É o ÚNICO lugar que escreve a chave do tema. _(linha 63)_

### `lib/tempoReal.ts`
*a camada de "tempo real" do quadro (§5: "tempo real via WebSocket quando um colega move um cartão"). Define o contrato CanalTempoReal e uma implementação SIMULADA que conversa entre abas do MESMO navegador.*

1. Os eventos de tempo real do quadro (tarefa movida, salva, removida, comentário novo). Evento novo: acrescente aqui e trate em components/projetos/Quadro.tsx. _(linha 28)_
2. Nome do canal entre abas (BroadcastChannel). Todas as abas do CAIS no mesmo navegador escutam este nome. _(linha 58)_
3. O CANAL SIMULADO entre abas do mesmo navegador. TODO(API): trocar por um canal com WebSocket (modelo no cabeçalho do arquivo); o resto do sistema não muda. _(linha 62)_
4. Qual canal o app usa (um por aba). Para ligar ao WebSocket da PROGLOGIC, é esta função que passa a devolver o canal novo. _(linha 90)_

### `lib/tipos.ts`
*as "formas" (interfaces TypeScript) de cada dado do sistema: empresa, pessoa, trilha, projeto, alocação, tarefa.*

1. Os três perfis do sistema. Um perfil novo exige: rotas e ações em permissoes.ts, menu em navegacao.ts, um painel e o rótulo em metricas.ts (ROTULO_PERFIL). _(linha 17)_
2. Formato de uma empresa (status, contato, endereço). Campo novo: acrescente aqui, em seed.ts e no formulário de app/(sistema)/empresas/page.tsx. _(linha 26)_
3. Formato de uma pessoa (perfil, status, área, nível). cargaMax é o limite de horas do semáforo de carga (lib/carga.ts). _(linha 52)_
4. Tipos de conteúdo de uma etapa de trilha. Tipo novo exige: ícone e rótulo em lib/trilhas.ts e tratamento em components/trilhas/ConteudoEtapa.tsx. _(linha 87)_
5. Formato de uma etapa: conteúdo (texto e endereço), quiz (perguntas, notaMinima, tentativasMax de 1 a 10) e se trava a próxima (obrigatoria). _(linha 103)_
6. Formato de uma trilha: alcance, status, prazoDias (0 = prazo indeterminado), etapas e o progresso de cada pessoa (concluidas, nota, tentativas, concluidaEm). _(linha 124)_
7. Formato de um projeto: empresa, datas, status e as listas (colunas) do quadro. Lista nova padrão: COLUNAS_PADRAO em seed.ts. _(linha 177)_
8. Formato de uma alocação: pessoa, papel, período e horas por semana. É a base do semáforo de carga (lib/carga.ts). _(linha 204)_
9. Anexo de tarefa: SÓ metadados (nome, tipo, tamanho, autor, data), nunca o conteúdo (limite do localStorage). Upload real é TODO(API). _(linha 237)_
10. Formato de uma tarefa: responsável, prazo, checklist, comentários, anexos e a aprovação da empresa (aprovadaEm/aprovadaPorId, só em Revisão ou Pronto). _(linha 258)_
11. Todos os dados juntos (o que a store guarda e o seed cria). Coleção nova entra aqui, em seed.ts, em lib/store.tsx (COLECOES e Salvavel) e pede nova chave do localStorage. _(linha 290)_

### `lib/toast.tsx`
*mostra pequenos avisos no canto da tela ("Empresa salva.", "Algo deu errado") que somem sozinhos.*

1. Quanto tempo o aviso (toast) fica na tela: 3800 ms. Mude este número para deixar mais curto ou mais longo. _(linha 44)_

### `lib/trilhas.ts`
*tabelas fixas com o rótulo e o ícone de cada tipo de etapa e o rótulo, a descrição e a cor de cada alcance de trilha; o padrão de tentativas, a validação do quiz e o endereço do player (hrefEtapa).*

1. Rótulo e ícone de cada tipo de etapa (Texto, Vídeo, PDF, Áudio, Apresentação, Link, Quiz). Tipo novo: acrescente aqui (o TypeScript cobra). _(linha 12)_
2. As três camadas de trilha (geral, da empresa, do profissional): nomes, descrições e a cor oficial de cada uma do deck (hex fixo de propósito). _(linha 29)_
3. Tentativas do quiz quando a etapa não define (3). O máximo é 10 (lib/quiz.ts). TODO(PROGLOGIC): confirmar o padrão. _(linha 43)_
4. O que impede PUBLICAR uma trilha com quiz: precisa de pelo menos uma pergunta, com enunciado, duas alternativas e a correta marcada. _(linha 51)_
5. O endereço do player de uma etapa (/minhas-trilhas/<trilha>/etapa/<etapa>); todo link para uma etapa passa por aqui. _(linha 77)_

### `lib/useFormulario.ts`
*hook que guarda os valores e os erros de um formulário e mostra o erro só quando a pessoa sai do campo.*

1. Regra de validação dos formulários: o erro aparece ao SAIR do campo (blur), não a cada tecla (§11 do deck). Mudar o comportamento aqui afeta todos os formulários. _(linha 13)_

### `lib/utils.ts`
*funções pequenas e puras de classes CSS, ids, datas, máscaras e validação usadas em todo o sistema.*

1. Geração de ids: formato prefixo_aleatório (ex.: tar_k3j9). Com a API, o servidor passa a gerar o id (TODO(API)); troque o corpo desta função. _(linha 21)_
2. O "hoje" do sistema: prazos, atrasos, semáforo de carga e filtros de período usam esta função. Para simular outra data numa demonstração, mude aqui. _(linha 34)_
3. Conta de datas AAAA-MM-DD (usa meio-dia para fugir do erro de fuso): base de prazos e do semáforo. Mudar quebra a carga e os prazos. _(linha 45)_
4. Nomes curtos dos meses (jan, fev...) que aparecem nas datas curtas das telas ("27 ago"). Para outro idioma ou abreviação, mude aqui. _(linha 72)_
5. Texto de "há N minutos/horas/dias" dos comentários e anexos; ajuste as faixas e as palavras aqui. _(linha 92)_
6. Máscaras de digitação (CNPJ, CEP e telefone): para mudar o formato mostrado ao digitar, edite estas três funções. _(linha 126)_
7. Regra oficial do dígito verificador do CNPJ, usada no cadastro de empresas e no formulário de interesse da homepage. _(linha 162)_
8. Regra do formato de e-mail de TODOS os formulários (login, recuperação, cadastros): mude aqui para aceitar ou recusar mais formatos. _(linha 191)_
9. Máscara do campo de e-mail enquanto se digita (tira espaços e passa para minúsculas); a validação do formato é a EMAIL_REGEX acima. _(linha 206)_

## Raiz do projeto (configuração)

### `next.config.ts`
*a configuração do Next.js do projeto.*

1. Lê os endereços de rede do computador a cada início do servidor (o IP muda quando a rede muda). _(linha 12)_
2. OS ENDEREÇOS LIBERADOS no npm run dev: sem eles o JavaScript não roda quando a tela é aberta por 127.0.0.1 ou pelo IP da rede (celular, outro micro). Não muda nada no build. _(linha 27)_
3. Esconde a bolinha "N" do Next no canto da tela durante o npm run dev. Erros continuam aparecendo. _(linha 34)_

### `tailwind.config.ts`
*configuração herdada do Tailwind v3. ⚠️ ATENÇÃO: no Tailwind v4 (usado aqui) este arquivo só é lido se o CSS tiver uma diretiva "@config" apontando para ele, e o projeto NÃO tem; as cores e fontes declaradas aqui NÃO estão ativas.*

1. ARQUIVO SEM EFEITO HOJE (Tailwind v4 só o lê com @config no CSS, e o projeto não tem). As cores e fontes reais ficam no @theme de app/globals.css: edite lá. _(linha 11)_

## Arquivos .json

### `package.json`

1. "scripts": comandos do projeto. `dev` abre o servidor de desenvolvimento, `build` gera a versão de produção, `lint` roda o ESLint. Para um comando novo, acrescente aqui.
2. "dependencies": bibliotecas usadas pelo app (Next, React, lucide-react). NÃO instale biblioteca nova sem combinar com o time (regra do CLAUDE.md).
3. "devDependencies": ferramentas só do desenvolvimento (TypeScript, ESLint, Tailwind). A versão do Next e a do eslint-config-next devem ficar iguais.
4. "name" e "version": identificação do projeto (`projeto_cais`). Mudar o nome não afeta o app.

### `tsconfig.json`

1. "compilerOptions.strict": TypeScript estrito. Desligar faria o compilador aceitar erros de tipo; não recomendado.
2. "compilerOptions.paths" (`@/*`): o atalho de importação. `@/lib/utils` aponta para `./lib/utils`. Mudar aqui exige mudar todos os imports.
3. "compilerOptions.allowImportingTsExtensions": permite `import ... from './metricas.ts'`. É isso que deixa os arquivos `*.casos.ts` rodarem no Node; não desligue.
4. "include" e "exclude": quais arquivos o TypeScript confere. Pasta nova de código precisa estar coberta por `**/*.ts` e `**/*.tsx`.

---

110 arquivos mapeados, 523 pontos vitais.
