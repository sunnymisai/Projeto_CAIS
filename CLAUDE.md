@AGENTS.md

# CAIS — Memória do projeto para o Claude Code

> Lido automaticamente em toda sessão. Mantenha a primeira linha: o `next dev`
> recria o AGENTS.md, que traz avisos do Next 16.

## Quem somos e como falar com a gente

- Time de estudantes do 2º período de ADS (Residência Técnica PROGLOGIC).
- Responda sempre em português do Brasil, inclusive em comentários, nomes de
  domínio, mensagens de commit e textos da interface.
- Explique decisões como para quem está aprendendo: diga o porquê, não só o quê.

## Fontes de verdade

- `docs/contexto-cais.md`: resumo do deck oficial do projeto (regras de
  produto, perfis, telas, design system). Os prompts citam as seções dele (§N).
- `docs/notas-next16.md`: o que mudou no Next 16.
- `SISTEMA.md`: o que já existe (rotas, contas de demonstração, pendências).

## Pilha (não troque sem perguntar)

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript estrito.
- Tailwind CSS v4 configurado só pelo CSS (`app/globals.css`, `@theme inline`).
- Ícones: `lucide-react`.
- Nenhuma biblioteca nova sem perguntar antes. Arrastar-e-soltar é HTML5
  nativo, gráficos são SVG próprio, modais/menus/toasts foram escritos à mão.
  É proposital: o time precisa conseguir ler toda a lógica.
- Antes de criar rota, layout, redirect, searchParams, metadados ou
  middleware/proxy, consulte `docs/notas-next16.md` e, se preciso,
  `node_modules/next/dist/docs/`.

## Arquitetura que deve ser respeitada

- Telas internas em `app/(sistema)/`; o `layout.tsx` do grupo protege as rotas.
- Telas acessam dados SÓ por `useDados()` (`lib/store.tsx`). Nunca leia ou
  grave localStorage direto numa tela. Quando a API da PROGLOGIC chegar, só a
  store muda.
- Nada calculado é armazenado: derivados ficam em funções puras em `lib/`.
- Autenticação em `lib/auth.tsx`; toasts em `lib/toast.tsx`; formulários com
  `lib/useFormulario.ts` (erro aparece ao sair do campo, não a cada tecla).
- Componentes do design system em `components/ui/`. Se falta uma variação,
  melhore o componente, não crie estilo solto na tela.
- Tela nova: registre em `components/shell/navegacao.ts`; componente novo:
  documente na página viva `/design-system`.

## Design system (regras fixas)

- Cores só por token (`bg-superficie`, `text-tinta`, `text-primaria`,
  `bg-botao`, `text-sucesso`, `text-aviso`, `text-erro`...). Nunca hex solto em
  componente. `#7C5CFF` (token `--marca`) é só para o logo.
- Funciona nos dois temas (claro e escuro).
- Tipografia: `font-space` (Space Grotesk) em títulos, `font-archivo` no resto.
- Espaçamento na escala de 4 px do Tailwind.
- Cor tem significado: verde = sucesso, âmbar = atenção, vermelho = erro,
  roxo = ação/foco. Cor nunca aparece sozinha: sempre com texto ou ícone rotulado.

## Toda tela tem quatro estados

Carregando (esqueleto, nunca tela em branco) · Vazio (explica e oferece a
próxima ação) · Com erro (diz o que houve, em português, e como tentar de
novo) · Com dado. Sem os quatro, a tela não está pronta.

## Acessibilidade e responsividade

- Tudo alcançável pelo teclado, foco visível, ícone sozinho com aria-label.
- Contraste AA (4,5:1 em texto). Gráfico sempre com resumo em texto.
- Desktop é o caso principal; tablet não pode quebrar; celular é obrigatório
  para o perfil Profissional. A página não rola inteira: só o conteúdo rola.

## PADRÃO DE COMENTÁRIOS (obrigatório em todo código novo ou alterado)

1. Cabeçalho em todo arquivo:
   /* ============================================================================
      NOME DO ARQUIVO EM CAIXA ALTA
      O que é: uma frase.
      Onde é usado: telas/componentes que importam isto.
      Depende de: hooks, libs e arquivos necessários.
      Contexto: seção do docs/contexto-cais.md (§N), quando houver.
      ============================================================================ */
2. JSDoc em toda função, hook, componente e prop pública: o que faz,
   parâmetros, retorno e um exemplo curto quando a regra não for óbvia.
3. Comentário acima de cada bloco de lógica explicando o porquê: cada `if`,
   cálculo, `useEffect` (quando roda e o que limpa), evento e classe Tailwind
   não óbvia. Não comente linha trivial.
4. Marque efeitos colaterais com rótulos fáceis de buscar:
   `// GRAVA:` altera dados (store, storage, URL)
   `// APAGA:` remove dados (inclusive em cascata)
   `// NAVEGA:` muda de página
   `// ⚠️ ATENÇÃO:` mudar isto quebra outra parte (diga qual)
   `// TODO(API):` muda quando a API da PROGLOGIC existir
   `// SIMULADO:` comportamento fingido no protótipo
5. Não deixe código comentado "para depois": o Git guarda o histórico.
6. Pontos vitais de alteração: onde alguém mexeria para mudar uma regra, um texto,
   uma cor, uma rota, um limite ou a ligação com a API, coloque um comentário
   `[PV-n]` (`// [PV-1] ...`, `{/* [PV-1] ... */}` no JSX, `/* [PV-1] ... */` no CSS).
   O número recomeça em 1 em cada arquivo, sem buraco e sem repetição. O texto diz
   o que controla e como mudar; leia o código antes de descrever. Depois de mexer
   neles (ou em qualquer linha acima deles), regenere o mapa:
       node testes/mapa-do-codigo.mjs
   O `docs/MAPA-DO-CODIGO.md` é GERADO dos comentários: não edite à mão. Os pontos
   de `package.json` e `tsconfig.json` (que não aceitam comentário) ficam na constante
   `EXTRAS_JSON` do próprio gerador. `node testes/mapa-do-codigo.mjs --conferir`
   e a auditoria (`testes/auditar-comentarios.mjs`) acusam numeração quebrada e mapa velho.

## Verificação antes de dizer que terminou

    npx tsc --noEmit
    npm run lint
    npm run build

Depois: tema claro e escuro, largura de 375 px, navegação só por teclado e os
quatro estados das telas mexidas.

## Fluxo de trabalho

- Tarefa grande começa em modo de planejamento: apresente o plano (arquivos
  criados/alterados e por quê) e espere aprovação.
- Uma branch por tarefa (`git switch -c feat/nome-curto`). Commits pequenos em
  português: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- Ao terminar: atualize `SISTEMA.md` e acrescente uma entrada em
  `CHANGELOG.md` (crie se não existir) com o que foi criado, modificado e removido.
- Regra de negócio ambígua: pergunte em vez de inventar.
