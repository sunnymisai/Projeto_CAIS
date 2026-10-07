# Contexto do produto CAIS
Resumo do deck "PROJETO_CAIS" (PROGLOGIC · Residência Técnica · set/2026) e do
organograma de telas do time. Em caso de dúvida, pergunte ao time.

## §1 Produto
"Uma plataforma para formar, alocar e acompanhar." Onboarding por trilhas para
empresas e profissionais, gestão dos projetos que essas empresas trazem e
dashboards que mostram como tudo está andando. O que liga os três pilares é a
pessoa: entra por uma trilha, é alocada num projeto e o resultado aparece no painel.
- Pilar 1 Onboarding (roxo): trilhas com etapas, quiz e prazo, montadas pelo
  admin. Trilha geral, por empresa e por profissional. Progresso e nota acompanhados.
- Pilar 2 Gestão de projetos (verde): projetos pertencem a uma empresa e
  recebem profissionais alocados. Tarefas com responsável e prazo. Quadro, lista e cronograma.
- Pilar 3 Dashboards (âmbar): cada perfil vê o andamento pelo seu ângulo.
Tagline da marca: "onde empresas, pessoas e projetos atracam".

## §2 O problema
Como é hoje: material de onboarding espalhado em PDF, vídeo e e-mail; ninguém
sabe quem leu, entendeu ou ficou para trás; alocação decidida por conversa;
andamento acompanhado por planilha; nenhum lugar mostra formação e entrega lado a lado.
Como fica com o CAIS: trilha única por público, com prazo e nota; progresso
visível por pessoa, empresa e turma; alocação registrada com papel e período;
tarefa com responsável, prazo e histórico; um painel liga o que a pessoa
aprendeu ao que ela entregou. "Formação, alocação e entrega deixam o mesmo
rastro, no mesmo lugar."

## §3 Perfis
- Administrador (quem opera o programa): cria e publica trilhas, define o
  público, cadastra empresas e profissionais, cria projetos e aloca pessoas,
  acompanha tudo pelos painéis. Perfil com mais telas.
- Empresa (parceira que traz o projeto): cumpre a trilha dela, vê apenas os
  projetos próprios, acompanha o andamento, interage com o time alocado, vê o
  painel do próprio portfólio. Experiência enxuta: "entra, entende, sai".
- Profissional (quem é formado e alocado): cumpre as trilhas atribuídas,
  responde quiz e recebe nota, vê os projetos em que está, vê e move as
  próprias tarefas, acompanha o próprio progresso. Quem mais usa o sistema.
  TEM QUE FUNCIONAR NO CELULAR.

## §4 Trilhas (Pilar 1)
Alcances (o admin escolhe ao publicar; uma pessoa pode ter trilhas das três camadas):
- Geral (roxo #7C5CFF): todas as empresas e todos os profissionais.
  Ex.: código de conduta, LGPD, como o programa funciona.
- Da empresa (verde #10B981): só pessoas ligadas àquela empresa.
  Ex.: regras internas, ferramentas e processos do cliente.
- Do profissional (âmbar #F5A524): uma pessoa ou grupo escolhido a dedo.
  Ex.: nivelamento técnico, plano de evolução individual.
O admin define: quem recebe; quando abre (na entrada ou em data marcada); até
quando (prazo); o que é obrigatório (etapa que trava o acesso); nota mínima e
tentativas no quiz; se repete (revisão periódica).
Anatomia: trilha contém etapas; etapa contém conteúdo (texto, vídeo, PDF,
áudio, apresentação, link externo) e, opcionalmente, quiz.
O profissional vê: barra de progresso; próximo passo em destaque; etapa
bloqueada explicada (por que não pode abrir ainda); prazo visível e aviso
quando está perto.

## §5 Projetos (Pilar 2)
Quatro níveis: Empresa (quem traz a demanda) → Projeto (escopo, prazo, status)
→ Alocação (quem trabalha, em que papel, período e carga) → Tarefa (trabalho do dia a dia).
Tarefa carrega: responsável e prazo (obrigatórios para criar), prioridade e
etiqueta, checklist e anexos, comentários. Três vistas: quadro, lista,
cronograma. Colunas padrão: A fazer, Fazendo, Revisão, Pronto.
Kanban: arrastar com três estados (repouso, arrastando, soltando; coluna de
destino se destaca); coluna vazia explica e oferece ação; no celular colunas
viram abas e arrastar vira "mover para..."; tempo real via WebSocket quando um
colega move um cartão.
Detalhe da tarefa abre por cima do quadro, sem trocar de página.
Permissões (a confirmar com a PROGLOGIC): Administrador acessa todos os
projetos; Profissional vê os projetos em que está e move as próprias tarefas;
Empresa vê as tarefas do projeto dela e comenta.
Equipe do projeto: colunas pessoa, papel, período, carga, trilhas (concluídas
das obrigatórias). Se a soma de todos os projetos passa de 40 h/sem, "É AVISO,
NÃO BLOQUEIO".
Criação de projeto: nasce como Planejado; abre na aba Equipe; ganha quadro com
as 4 colunas; contato só habilita depois da empresa; entrega não vem antes do
início; rascunho salva só com nome e empresa; líder escolhido por busca.

## §6 Dashboards (Pilar 3)
- Admin: trilhas (concluídas, em atraso, nunca iniciadas); projetos
  (andamento por empresa); pessoas (alocação e carga); turma (evolução ao longo do tempo).
- Empresa: andamento dos projetos próprios; quem está alocado e em quê;
  entregas aprovadas e pendentes; progresso da trilha do time dela.
- Profissional: minhas trilhas e meu progresso; minhas tarefas e meus prazos;
  minha carga da semana; meu histórico de entregas.
Escolher a forma de cada gráfico é trabalho de UI. Onda 4 inclui filtros por período.

## §7 Técnico e escopo
Back-end (Django REST, PostgreSQL, WebSocket, token, permissão por perfil) é
da PROGLOGIC. Front é do time. Dentro do escopo: interface, design system, UX,
integração com a API (erro, carregar, paginar), responsividade, acessibilidade.
Fora: banco, regras no servidor, autenticação/permissão no back, infraestrutura.
"Front-end aqui não é pintar a tela. É decidir como o sistema se comporta na
mão de quem usa."

## §8 Mapa de telas e ondas
Onda 1 Fundação: pilha, design system, login e primeiro acesso, shell, perfil e
preferências, páginas de erro e sem permissão, cadastro de empresa e profissional.
Cadastros: empresas, profissionais, vínculo pessoa-empresa, gestão de acessos.
Onda 2 Onboarding: minhas trilhas e detalhe, player de etapa e quiz, editor de
trilha e etapa, atribuição de público, painel de progresso.
Onda 3 Projetos: lista e ficha, alocação, quadro, lista e cronograma, detalhe da tarefa.
Onda 4 Dashboards: painel por perfil, biblioteca de gráficos, filtros por
período, ajustes finais de UX.

## §9 Design system e marca
Princípios: cor tem significado; uma medida só (escala); o componente manda;
documentado ao vivo. Componentes: botão, campo, select, card, tabela, modal,
aviso, etiqueta, avatar, abas, paginação, gráfico — cada um com seus estados.
Cores da marca: Roxo maré #7C5CFF, Roxo fundo #5B3FD4, Verde atracado #10B981,
Tinta #14161F, Névoa #F6F7FB. Títulos Space Grotesk; texto Archivo.
Símbolo: arco do "C" é o cais que abraça quem chega; a barra é quem atraca.

## §10 Anatomia de toda tela
Menu (sempre no mesmo lugar, marca onde você está); topo (busca, avisos,
perfil); título e ação principal; filtros sempre acima do conteúdo, nunca
escondidos; conteúdo (lista, quadro ou painel, com rolagem só aqui); rodapé da
lista (paginação e contagem). A página não rola inteira.

## §11 Regras de cadastro
Empresa: CNPJ com máscara e dígitos; CEP preenche endereço editável; e-mail do
contato único (é o login do perfil Empresa); status Em negociação, Ativa ou
Encerrada; erro ao sair do campo.
Pessoa: uma tela para os três perfis; campos mudam sem o formulário pular;
Profissional tem área, nível, carga máxima (40 h padrão) e habilidades,
empresa opcional; Empresa tem empresa vinculada obrigatória; Admin só dados
pessoais. E-mail único; convite por e-mail leva ao primeiro acesso; inativar em
vez de excluir (mantém histórico).

## §12 Fluxos de UX
1. Primeiro acesso do profissional: recebe convite → define senha → cai na
   trilha obrigatória → conclui e libera o sistema.
2. Admin publica trilha: cria → monta etapas → escolhe público → publica e avisa.
3. Alocar alguém: abre o projeto → busca o profissional → define papel e
   período → confirma e notifica.
4. Profissional no dia: vê o que é dele hoje → abre a tarefa → registra o
   avanço → move de coluna.
Regra: se um fluxo precisa de explicação, o fluxo está errado, não o usuário.

## §13 Qualidade
Quatro estados em toda tela. Responsivo (desktop principal, tablet não quebra,
celular obrigatório para o profissional). Acessível (contraste, teclado, foco
visível, ícone com rótulo). Rápido o suficiente (lista longa pagina ou
virtualiza, imagem não carrega antes da hora, ação dá retorno em menos de 1 s).

## §14 Definição de pronto
Bate com o design combinado; quatro estados; funciona no celular e no teclado;
sem erro no console; ligado à API real (no protótipo: à store); revisado por
outra pessoa do time.

## §15 Organograma de telas
0. Ponto de entrada público: HOMEPAGE (apresentação do CAIS, pilares e
   chamadas de ação). Saídas: "Entrar no sistema" → Login; "Link de convite /
   cadastro" → Primeiro acesso.
1. Autenticação e shell: Login → (Esqueci a senha) Recuperação de senha;
   Login → (Primeiro login) Primeiro acesso / definição de senha → Shell;
   Login → (Autenticado) Shell da aplicação (menu lateral + topo + perfil).
2. Dashboards por perfil (home): Painel do Administrador (governança, turmas e
   carga); Painel do Profissional (minhas trilhas, tarefas e horas); Painel da
   Empresa (projetos próprios e entregas).
3. Cadastros e governança (admin): Pessoas (formulário dinâmico, 40 h);
   Empresas (CNPJ, CEP, status); ambos → Vínculo pessoa-empresa → Gestão de
   acessos e permissões.
4. Onboarding: Editor de trilhas e etapas → Atribuição de público (geral,
   empresa ou individual) [admin]; Minhas trilhas e detalhe → Player de etapa e
   quiz (vídeo, PDF, áudio + nota mínima) [profissional].
5. Projetos e operação: Lista e ficha → Matriz de alocação da equipe (alerta
   de carga) → Quadro kanban (arrastar, tempo real) → Detalhe da tarefa
   (checklist, anexos, comentários) e Visão cronograma/Gantt. O profissional
   executa tarefas no quadro; a empresa acompanha projetos no quadro.

## §16 Pedidos adicionais do time
- Homepage pública que apresenta o programa para a empresa-alvo (ponto 0 do organograma).
- Código muito bem comentado (padrão no CLAUDE.md): o time é iniciante.
- Telas completas dos perfis Profissional e Empresa, além do Administrador.
- SEMÁFORO DE CARGA POR PERÍODO para cada colaborador em cada projeto: a
  carga é avaliada no tempo. Exemplo do time: um projeto exige 10 h/sem do
  colaborador A, começa hoje e termina em 7 dias; nesse período essa carga
  ocupa a agenda dele, mas ele pode ser alocado em outro projeto que comece
  depois, sem que as duas cargas se somem.
