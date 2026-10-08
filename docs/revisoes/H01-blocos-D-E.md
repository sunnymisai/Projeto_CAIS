# Revisão H01 dos blocos D e E (08/10/2026)

Feita sobre o `main` em `1bb2fd6` (blocos A a E). **Nada foi corrigido ainda**: o H01 pede que o time escolha o que corrigir.

## Verificações automáticas

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | ✓ sem erro |
| `npm run lint` | ✓ sem erro |
| `npm run build` | ✓ 19 rotas geradas |
| `lib/permissoes.casos.ts` · `lib/quiz.casos.ts` · `lib/metricas.casos.ts` | ✓ 65/65 · 27/27 · 23/23 |
| `testes/auditar-comentarios.mjs` | ✓ 0 pontos |
| Testes de navegador `d02`, `d03`, `d04`, `e01`, `e02`, `paineis-todos-perfis` | ✓ todos passam |
| `testes/navegador/h01-varredura.mjs` (novo): 6 contas × 24 rotas = 105 combinações | ✓ ver abaixo |

A varredura mede, em cada combinação: para onde a rota leva, botões e links sem nome, campos sem rótulo, gráficos SVG sem texto, foco visível em 30 Tabs, rolagem lateral em 375 px e erros no console. **Nenhuma combinação teve problema** nesses itens.

## Tabela rota × critério (telas dos blocos D e E)

✓ ok · ◐ parcial · — não se aplica

| Rota | 1 Estados | 2 375 px | 3 Teclado | 4 aria/gráfico | 5 Cores | 6 Permissões | 7 Comentários | 8 Sem log | 9 Console |
|---|---|---|---|---|---|---|---|---|---|
| `/minhas-trilhas` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/minhas-trilhas/[id]` | ✓ (vazio não ocorre: trilha sem etapa não publica) | ✓ | ✓ | ✓ | ✓ | ✓ fora do público → `/sem-permissao` | ✓ | ✓ | ✓ |
| `/minhas-trilhas/[id]/etapa/[etapaId]` | ✓ (erro de mídia com "Abrir em nova aba") | ✓ | ✓ | ✓ | ✓ | ✓ etapa travada volta ao detalhe | ✓ | ✓ | ✓ |
| `/minhas-tarefas` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ só profissional | ✓ | ✓ | ✓ |
| `/painel` (profissional) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/painel` (empresa) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Marcos só Vértice, Patrícia só Aurora | ✓ | ✓ | ✓ |
| `/projetos/[id]` (visão da empresa) | ✓ | ✓ | ✓ | ✓ | ◐ (overlay do Modal, item 2) | ✓ sem carga; Aurora → `/sem-permissao` | ✓ | ✓ | ✓ |
| `/trilhas/[id]` (editor de quiz) | ✓ | — (tela do admin) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Permissões conferidas com as 6 contas (anônimo, admin, Ana, Elisa, Marcos, Patrícia): todas as rotas levam para onde devem.

## Problemas, do mais grave ao menos grave

**Bloqueia:** nenhum.

**Atrapalha:** nenhum novo.

**Cosmético**
1. **Elisa (trilha obrigatória pendente) abrindo um projeto fora do escopo pela URL** vê o aviso "Conclua sua trilha de boas-vindas" em vez de `/sem-permissao`. Nenhum dado do projeto aparece (não é vazamento), mas a resposta é diferente da dos outros perfis. Causa: o layout troca a página pelo bloqueio da trilha, e o redirecionamento de escopo mora dentro da página do projeto.
   *Proposta:* no `app/(sistema)/layout.tsx`, conferir o escopo de `/projetos/[id]` antes de mostrar o bloqueio da trilha (ou mover essa checagem para o layout).
2. **Overlay do Modal com hex solto:** `bg-[#0B0C12]/55` em `components/ui/Modal.tsx:133`.
   *Proposta:* criar o token `--veu` (claro e escuro) e usar `bg-veu`.
3. **`themeColor` em hex** em `app/layout.tsx:42-43`: é exceção necessária (metadado do navegador não entende variável CSS).
   *Proposta:* deixar como está e citar a exceção num comentário (hoje não há).
4. **Pendências cosméticas do H01 do bloco C** continuam: `dark:text-[#14161F]` em 5 componentes (token `--sobre-cor`), `#B9A7FF` na barra lateral (token `--marca-clara`) e paletas fixas de avatar (`CORES_AVATAR`) e de capa de projeto.

## O que não foi verificado

Contraste e aparência no tema escuro com olhos humanos (só a classe do tema foi conferida), uso com leitor de tela de verdade e o teclado dentro do quiz além do que o `d03-player-e-quiz.mjs` já cobre.

## Pendências que já estavam no registro (não são do H01)

- Teste de navegador automático do D05 (painel do profissional).
- Botão do admin para liberar nova tentativa de quiz.
