# Revisão H01 dos blocos F e G (08/10/2026)

Feita sobre o `main` em `d82b596` (blocos A a G). **Nada foi corrigido ainda**: o H01 pede que o time escolha o que corrigir.

## Verificações automáticas

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` · `npm run lint` · `npm run build` | ✓ sem erro (19 rotas) |
| `lib/permissoes.casos.ts` · `quiz` · `metricas` · `carga` · `anexos` | ✓ 69/69 · 29/29 · 32/32 · 25/25 · 17/17 |
| `testes/auditar-comentarios.mjs` | ✓ 0 pontos |
| Testes de navegador `d02` a `d04`, `e01`, `e02`, `f02` a `f04`, `g01` a `g03`, `paineis-todos-perfis` | ✓ todos passam |
| `testes/navegador/h01-varredura.mjs`: 121 combinações de conta e rota (inclui `/carga`, aba Arquivos, Equipe e painel com período na URL) | ✓ ver abaixo |

A varredura mede: para onde a rota leva (permissões), botões e links sem nome, campos sem rótulo, foco visível em 30 Tabs, rolagem lateral em 375 px e erros no console. **Nenhum problema em nenhuma das 121 combinações.** Conferências de código: nenhum `console.log`, nenhum acesso direto ao `localStorage` nas telas e nenhum hex novo (só a paleta de avatares e um texto de exemplo do quiz, que é conteúdo).

## Tabela rota × critério (telas dos blocos F e G)

✓ ok · ◐ parcial · — não se aplica

| Tela | 1 Estados | 2 375 px | 3 Teclado | 4 aria/gráfico | 5 Cores | 6 Permissões | 7 Comentários | 8 Sem log | 9 Console |
|---|---|---|---|---|---|---|---|---|---|
| `/carga` | ✓ carregando, vazio, vazio do filtro e com dado | ✓ (cards) | ✓ (célula, linha e painel por teclado) | ✓ (aria-label por célula, legenda) | ✓ tokens | ✓ só admin | ✓ | ✓ | ✓ |
| Modal "Alocar pessoa" (prévia) | ✓ | ✓ | ✓ | ✓ (`aria-live`) | ✓ | ✓ só admin | ✓ | ✓ | ✓ |
| Aba Equipe (indicador de carga) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ empresa não vê carga | ✓ | ✓ | ✓ |
| Painéis com filtro de período (3 perfis) | ✓ vazio do período explica | ✓ | ✓ | ✓ gráficos com resumo em texto | ✓ | ✓ | ✓ | ✓ | ✓ |
| Quadro "Ao vivo" | — | ✓ | ✓ | ✓ aviso `aria-live` educado | ✓ | ✓ | ✓ | ✓ | ✓ |
| Anexos da tarefa | ✓ | ✓ | ✓ anexar e remover só pelo teclado | ✓ | ✓ | ✓ admin, profissional nas próprias, empresa só vê | ✓ | ✓ | ✓ |
| Aba Arquivos | ✓ carregando, vazio, vazio do filtro, com dado | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ficha de pessoa (Disponibilidade) e "Minha carga" | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Problemas, do mais grave ao menos grave

**Bloqueia:** nenhum.

**Atrapalha**
1. **No sábado e no domingo, `cargaDaPessoa` devolve 0.** Ela usa `ocupacaoNoDia(hoje)`, e fim de semana não é dia útil. Confirmado: 45 h alocadas dão 45 numa quinta e 0 num sábado. Zera a coluna "Carga semanal" de `/pessoas`, a dica "Hoje alocada em N h" da ficha e o aviso de sobrecarga do topo. Quem abrir a demonstração no fim de semana vai achar que ninguém está sobrecarregado.
   *Proposta:* em `lib/store.tsx`, usar o primeiro dia útil a partir de hoje (sábado e domingo olham a segunda-feira seguinte). Um caso novo em `lib/carga.casos.ts` cobre.

**Cosmético / limitação**
2. **Tempo real simulado: quem grava por último vence.** Cada aba grava o conjunto inteiro de dados. Se duas abas mexem em tarefas diferentes quase ao mesmo tempo, a edição da primeira pode ser sobrescrita antes de o evento chegar. É uma limitação da simulação com `localStorage`; com o WebSocket e a API o servidor resolve. Já está comentado em `lib/tempoReal.ts`.
   *Proposta:* só registrar no `SISTEMA.md` (feito na seção do G02).
3. **Filtro de período: o "Personalizado" não acompanha o botão Voltar.** O estado dos campos de data é lido uma vez ao abrir; se a pessoa voltar no navegador para um período que é um atalho (por exemplo 30 dias), os campos de data continuam abertos.
   *Proposta:* sincronizar o estado com o período da URL num efeito em `FiltroPeriodo.tsx`.
4. **Data sugerida no modal de alocação pode passar da entrega do projeto.** Ela mantém a duração em dias úteis, como o prompt do F04 pede. Já estava no registro como decisão do time.
5. **Feriados contam como dia útil e projeto pausado conta na carga** (`TODO(PROGLOGIC)` em `lib/carga.ts`).
6. **Pendências herdadas do H01 dos blocos C, D e E** (nenhuma foi corrigida): Elisa abrindo projeto de fora pela URL vê o aviso da trilha em vez de `/sem-permissao`; fundo do Modal com hex fixo; `themeColor` sem comentário da exceção; `dark:text-[#14161F]` em 5 componentes e `#B9A7FF` na barra lateral.

## O que não foi verificado

Contraste e aparência no tema escuro com olhos humanos (só a classe do tema foi conferida), uso com leitor de tela de verdade, arrastar de arquivo com o mouse (a escolha por botão foi testada com arquivo de verdade) e o tempo real entre navegadores diferentes (a simulação só vale no mesmo navegador).
