# CAIQUE: como ligar a IA (Gemini)

O chat do CAIQUE já funciona sem chave: a rota devolve uma **resposta de demonstração** e o rodapé do chat
mostra "Demonstração: a IA ainda não está ligada.". Com a chave, ele responde com o Gemini.

## 1. Criar a chave (uma vez)

1. Entre em <https://aistudio.google.com/apikey> com a conta Google do time.
2. **Create API key** → escolha (ou crie) um projeto do Google Cloud → copie a chave (começa com `AIza...`).
3. Nunca cole a chave em commit, issue, print ou conversa: o repositório é público.

## 2. Pôr a chave no projeto

Na raiz do projeto, abra (ou crie) o arquivo `.env.local` (ele não vai para o Git) e acrescente:

```
GEMINI_API_KEY=cole-a-chave-aqui
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_TIMEOUT_MS=8000
```

Pare e suba de novo o `npm run dev` (o Next só lê o `.env.local` ao iniciar).

## 3. Conferir

1. Entre como `ana.souza@cais.example` (senha `Cais@2026`) e abra uma trilha em **Minhas trilhas**.
2. Abra o chat (botão redondo no canto) e pergunte algo sobre a trilha.
3. O rodapé deve dizer "O CAIQUE usa IA e pode errar..." (e não mais "Demonstração").
4. Teste automático: `node testes/navegador/l01-caique-chat.mjs` (com o `npm run dev` aberto).

Se der erro, olhe o terminal do `npm run dev`: a rota escreve `[CAIQUE] Gemini respondeu <status>`.
`400`/`403` = chave errada ou API não habilitada no projeto; `429` = limite de uso da chave; `404` = nome do modelo errado.

## Como funciona

| Peça | Arquivo | O que faz |
|---|---|---|
| Chat (tela) | `components/caique/ChatWidget.tsx` | Só conversa dentro de uma trilha; manda pergunta, trilha e últimas 10 mensagens |
| Regras e validação | `lib/caique.ts` | Monta o contexto da trilha (quiz vai **sem** perguntas e respostas) e valida o pedido |
| Rota do chat | `app/api/caique/chat/route.ts` | Guarda a chave, chama o Gemini, devolve `{ id, texto, simulada }` |
| Rota da avaliação | `app/api/caique/feedback/route.ts` | Registra o 👍/👎 |
| Gemini e prompt | `lib/caique-servidor.ts` | Prompt de sistema (só a trilha; responde em pt, en ou es) e a chamada com timeout |
| Proteções | `lib/caique-protecao.ts` | Só aceita chamada do próprio site; 20 perguntas por minuto por endereço |
| Registro | `lib/caique-logger.ts` | Uma linha por pergunta/avaliação em `logs/caique-AAAA-MM-DD.jsonl` (fora do Git) |

## Decisões do time (17/11/2026)

- O CAIQUE responde **só sobre a trilha aberta**. Fora de uma trilha o campo fica travado.
- Responde no **idioma da pergunta** (português, inglês ou espanhol; outro idioma → português).

## Pendências antes de produção

- **Isolamento por empresa no servidor:** quem entra por e-mail e senha não tem sessão no servidor (o cadastro mora
  no navegador), então a rota não sabe quem pergunta. O conteúdo da trilha também vem do navegador. Resolver quando a
  API da PROGLOGIC existir (`TODO(API)` em `app/api/caique/chat/route.ts`).
- **Limite de perguntas e logs em memória/disco:** em hospedagem com várias instâncias ou sem disco gravável
  (ex.: Vercel), troque por um contador e um banco compartilhados.
- **Conversa some ao recarregar a página** (sem persistência), como antes.
