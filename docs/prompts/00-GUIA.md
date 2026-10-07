# Guia dos prompts do CAIS v4

Cada arquivo `.txt` é **um prompt completo**, para colar direto no terminal do
Claude Code. Você não precisa copiar nada para dentro do projeto: os três
primeiros prompts fazem o próprio Claude Code criar o `CLAUDE.md`, o resumo do
deck e as notas do Next 16 na pasta do projeto.

## Como usar cada prompt

1. Abra o terminal **dentro da pasta do projeto** (`login_cais/`) e rode `claude`.
2. Ative o modo de planejamento: Shift+Tab até aparecer *plan mode*.
3. Abra o arquivo `.txt`, selecione tudo, copie e cole no Claude Code.
4. Leia o plano que ele apresentar. Corrija o que não fizer sentido e aprove.
5. Quando ele terminar, teste você mesmo com `npm run dev`.
6. Digite `/clear` antes do próximo prompt, para começar com contexto limpo.

Exceção: **A02 e A03** não precisam de modo de planejamento, porque só criam
arquivos com o texto que já vai no prompt.

Se o Claude Code travar num erro repetido, peça: *"pare, explique a causa em
linguagem simples e proponha duas alternativas"*.

## Ordem e dependências

| Bloco | Prompts | O que entrega | Depende de |
|---|---|---|---|
| **A · Fundação** | A01 → A06 | base compilando, `CLAUDE.md`, resumo do deck, código atual comentado | — |
| **B · Homepage** | B01 → B04 | `/` pública para a empresa-alvo, login em `/login` | A |
| **C · Perfis e acesso** | C01 → C08 | login dos três perfis, permissões, recuperação de senha, primeiro acesso, meu perfil, gestão de acessos | A, B01 |
| **D · Profissional** | D01 → D05 | quiz no editor, minhas trilhas, player, minhas tarefas, painel | C |
| **E · Empresa** | E01 → E02 | painel da empresa, projetos em leitura, comentários | C, D02 |
| **F · Semáforo de carga** | F01 → F04 | regra por período, tela "Carga da equipe", sugestão de data livre | C03 (F04 também usa D05) |
| **G · Lacunas do deck** | G01, G02, G03 | filtros por período, quadro em tempo real simulado, anexos simulados | C |
| **H · Revisão** | H01 | checklist da definição de pronto | rode ao fim de cada bloco |

Dentro de cada bloco, siga a ordem dos números. Entre blocos há alguma
liberdade. Se a prioridade for o semáforo, por exemplo, dá para rodar F01 a
F03 logo depois do C03. Nesse caso, deixe o item 4 do F04 ("Minha carga" no
painel do profissional) para depois do D05.

## Branches

Cada bloco cria a sua branch (`feat/homepage`, `feat/tres-perfis`,
`feat/profissional`...). O último prompt de cada bloco pede o merge, só
depois da sua aprovação. Assim, se algo der errado num bloco, o restante do
projeto fica intacto.

## A chave dos dados no navegador

Os prompts D01, F02 e G03 aumentam a versão da chave do `localStorage`
(`cais-dados-v1` → `v2` → `v3`...), porque mudam os dados de demonstração.
É normal os dados de teste "voltarem ao início" depois desses prompts.

## Contas de demonstração (depois do bloco C)

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@cais.com.br | Cais@2026 |
| Profissional | ana.souza@cais.example | Cais@2026 |
| Empresa (Vértice) | marcos@vertice.example | Cais@2026 |
| Empresa (Aurora) | patricia@aurora.example | Cais@2026 |
