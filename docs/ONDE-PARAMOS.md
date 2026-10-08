# Onde paramos (CAIS v4)

Registro para retomar o trabalho. Atualizado em **08/10/2026**, durante o bloco G (G01 e G02 feitos nas branches `feat/filtros-periodo` e `feat/tempo-real`).
Os prompts originais estão em [`docs/prompts/`](prompts/) e o guia de uso deles em [`docs/prompts/00-GUIA.md`](prompts/00-GUIA.md).

## Situação dos prompts

| Bloco | Prompts | Situação | Último commit |
|---|---|---|---|
| A · Fundação | A01 a A06 | ✅ feito, no `main` | `b824e34` |
| B · Homepage | B01 a B04 | ✅ feito, no `main` | `c82712d` |
| C · Perfis e acesso | C01 a C08 + revisão H01 | ✅ feito, no `main` | `c8e097a` |
| D · Profissional | D01 a D05 | ✅ feito, no `main` | `ef7633b` |
| E · Empresa | E01, E02 | ✅ feito, no `main` | `1bb2fd6` |
| F · Semáforo de carga | F01 a F04 | ✅ feito, no `main` | `4222081` |
| G · Lacunas do deck | G01, G02, G03 | 🔨 G01 e G02 feitos (branch `feat/tempo-real`, que já contém a `feat/filtros-periodo`); não estão no `main`; **próximo: G03** | ver `git log feat/tempo-real` |
| H · Revisão | H01 | 🔁 rodar ao fim de cada bloco. A dos blocos D e E foi feita: relatório em [`docs/revisoes/H01-blocos-D-E.md`](revisoes/H01-blocos-D-E.md) (branch `revisao/h01-blocos-d-e`), esperando o time escolher o que corrigir | `8b5466c` |

Fora dos prompts, já no `main`:
- `b553e8d`: some a bolinha "N" do Next no `npm run dev`; os botões "Entrar como" do login ficam um embaixo do outro, com ícone.
- `9d1c03f`: **painel da Empresa em versão de apresentação** (andamento dos projetos, quem está no time, entregas e trilha do time). O **E01 deve partir dele** e aprofundar, não recomeçar do zero.

## Como retomar amanhã

1. Abra o terminal na pasta do projeto, `Projeto_CAIS/`, e rode `npm run dev` (http://localhost:3000).
2. No navegador, menu do perfil → **"Restaurar dados de demonstração"**, para partir do seed atual.
3. Continue pelo G03 numa branch nova a partir da `feat/tempo-real` (`git switch -c feat/anexos`). Ao fim do bloco G, com aprovação: merge no `main`, auditoria de comentários com 0 pontos e `git push`.
4. Escolha com o time o que corrigir do [`docs/revisoes/H01-blocos-D-E.md`](revisoes/H01-blocos-D-E.md) e rode o H01 dos blocos F e G.
5. Ao terminar cada prompt: `npx tsc --noEmit`, `npm run lint`, `npm run build`, os casos e os testes de navegador (abaixo).

## Verificações disponíveis

```bash
# Casos de lógica (sem navegador)
node --experimental-strip-types lib/permissoes.casos.ts   # 65 casos
node --experimental-strip-types lib/quiz.casos.ts         # 29 casos
node --experimental-strip-types lib/metricas.casos.ts     # 32 casos
node --experimental-strip-types lib/carga.casos.ts        # 25 casos (semáforo de carga)

# Padrão de comentários do CLAUDE.md (cabeçalho, JSDoc, useEffect, GRAVA/APAGA/NAVEGA); rode antes de todo push
node testes/auditar-comentarios.mjs                # deve terminar com "0 ponto(s) para revisar"

# Testes de navegador (com o npm run dev aberto; usam o Chrome instalado)
node testes/navegador/d02-minhas-trilhas.mjs      # 25 conferências
node testes/navegador/d03-player-e-quiz.mjs       # 32 conferências
node testes/navegador/d04-minhas-tarefas.mjs      # 24 conferências
node testes/navegador/e01-painel-empresa.mjs      # 22 conferências
node testes/navegador/e02-empresa-projetos.mjs    # 20 conferências
node testes/navegador/f02-semaforo-painel.mjs     # 6 conferências
node testes/navegador/f03-tela-carga.mjs          # 26 conferências
node testes/navegador/f04-semaforo-alocacao.mjs   # 19 conferências
node testes/navegador/g01-filtros-periodo.mjs     # 15 conferências
node testes/navegador/g02-tempo-real.mjs          # 9 conferências (duas abas)
node testes/navegador/h01-varredura.mjs           # parte automática do H01 (6 contas × rotas)
node testes/navegador/paineis-todos-perfis.mjs    # o painel de cada perfil, desktop e 375 px
```

## Pendências conhecidas (para depois)

- **Teste de navegador automático do D05** (painel do profissional): foi conferido à mão; falta o `testes/navegador/d05-...`.
- **Revisão H01 do bloco D**: ainda não rodada.
- **Itens cosméticos da revisão H01 do bloco C** (não bloqueiam): `dark:text-[#14161F]` em 5 componentes (virar token `--sobre-cor`), `#B9A7FF` no item ativo da barra lateral (token `--marca-clara`), paletas fixas de avatares e capas de projeto.
- **Liberar nova tentativa de quiz**: quem esgota as tentativas vê "Fale com a coordenação", mas o admin ainda não tem botão para liberar.
- **"Entregas aprovadas"** (painel da empresa): não existe aprovação; hoje "Pronto" conta como aprovada e a penúltima coluna ("Revisão") como aguardando revisão (`entregasDoProjeto`). A empresa também não vê as horas de quem está no time (decisão de privacidade do E01, com `TODO(PROGLOGIC)`).
- **Semáforo de carga** (bloco F, completo): feriados ainda contam como dia útil e projeto pausado conta (`TODO(PROGLOGIC)` em `lib/carga.ts`). A data sugerida no modal de alocação mantém a duração em dias úteis e pode terminar depois da entrega do projeto. A chave do navegador agora é `cais-dados-v3`.

## Decisões tomadas pelo time (registradas com `TODO(PROGLOGIC)` no código)

- **Público das trilhas**: a pessoa de perfil Empresa cumpre a trilha geral e a da sua empresa (`publicoDaTrilha` em `lib/metricas.ts`).
- **Prazo da trilha**: conta da data mais recente entre a publicação (`publicadaEm`, gravada só na 1ª publicação) e a entrada da pessoa, mais os dias de prazo.
- **Quiz**: 3 tentativas por padrão (0 = sem limite); tentativas e nota guardadas **por quiz** (`progresso.quizzes`); a resposta certa só aparece quando a pessoa passa ou esgota as tentativas; "Tentar de novo" embaralha as alternativas.
- **Trava da trilha obrigatória ligada** (`EXIGIR_TRILHA_NO_PRIMEIRO_ACESSO = true`): profissional com etapa obrigatória pendente na trilha geral só abre o painel e Minhas trilhas. O primeiro acesso de profissional vai direto para `/minhas-trilhas`.

## Atenção na demonstração

- **Contas** (senha `Cais@2026` para todas): `admin@cais.com.br`, `ana.souza@cais.example` (profissional), `marcos@vertice.example` e `patricia@aurora.example` (empresa). Os botões "Entrar como" do login preenchem as três primeiras.
- **Elisa** (`elisa.rocha@cais.example`) fica **presa** no painel e em Minhas trilhas até passar no quiz da Boas-vindas (é a trava funcionando).
- **Patrícia (Aurora)** vê o estado vazio em "Trilha do time": a Aurora não tem trilha publicada no seed.
- Os vídeos e áudios do seed usam endereços `example.com` de mentira: o player mostra o estado de erro com "Abrir em nova aba" (comportamento esperado).
- Abra o sistema por `localhost`, `127.0.0.1` ou o IP da rede: os três funcionam (`allowedDevOrigins` em `next.config.ts`).

## Repositório

- Remoto: **https://github.com/sunnymisai/Projeto_CAIS** (branch principal `main`; antes de 07/10/2026 ela se chamava `master` localmente, e o CHANGELOG antigo ainda fala em `master`).
- As branches de cada bloco também foram enviadas (`feat/homepage`, `feat/tres-perfis`, `feat/fluxos-de-acesso`, `feat/perfil`, `feat/acessos`, `feat/profissional`, `fix/login-visual`, `feat/painel-empresa`...). Todas já estão dentro do `main`.
- Fluxo daqui para a frente: branch por bloco (`git switch -c feat/empresa`), commits pequenos, merge no `main` com aprovação e `git push`. Antes de todo push: `node testes/auditar-comentarios.mjs` com 0 pontos.
