# Notas do Next.js 16 para o CAIS v4

Resumo didático do que mudou no Next 16 e de como isso afeta o CAIS.
Fonte: a documentação que vem instalada em `node_modules/next/dist/docs/`
(versão 16.3.6). Quando estiver em dúvida, consulte o arquivo citado em cada seção.

> **Por que este arquivo existe?** O Next 16 tem mudanças que "quebram" código
> antigo. Muitos tutoriais na internet (e o próprio conhecimento de IAs) ainda
> mostram o jeito do Next 13/14. Antes de escrever código de rota, login ou
> redirecionamento, leia a seção correspondente aqui.

---

## 1. Server Components x Client Components

**Ideia central:** no App Router, todo componente é **Server Component** por
padrão. Ele roda no servidor, não manda JavaScript para o navegador e **não**
pode usar estado, eventos nem APIs do navegador.

Para usar `useState`, `useEffect`, `onClick`, `localStorage`, `window` ou hooks
próprios, o arquivo precisa começar com `"use client"`.

| Preciso de... | Tipo de componente |
|---|---|
| `useState`, `useEffect`, `onClick`, `onChange` | Client (`"use client"`) |
| `localStorage`, `sessionStorage`, `window` | Client |
| Hooks como `useRouter`, `usePathname`, `useSearchParams`, `useAuth()` | Client |
| Buscar dados com segredo (token de API) | Server |
| Exportar `metadata` / `generateMetadata` | Server |
| Mandar menos JavaScript ao navegador | Server |

```tsx
// components/Contador.tsx
"use client";               // <- sem isso, useState dá erro
import { useState } from "react";

export function Contador() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

```tsx
// app/exemplo/page.tsx  (Server Component: sem "use client")
import { Contador } from "@/components/Contador";

export default function Page() {
  return <main><h1>Título renderizado no servidor</h1><Contador /></main>;
}
```

**Regras que pegam iniciantes:**

- `"use client"` marca uma **fronteira**: tudo que esse arquivo importa também
  vira código de cliente.
- Props passadas de Server para Client precisam ser **serializáveis** (texto,
  número, objeto simples, array). Funções e classes não podem ser passadas.
- Um Server Component pode receber um Client Component como `children` e
  vice-versa. Essa mistura é chamada de *interleaving*.
- Providers (contextos) devem envolver só o `{children}` e ficar o mais "fundo"
  possível na árvore.

**No CAIS hoje:** os dados e a sessão ficam no `localStorage` (`lib/store.tsx`,
`lib/auth.tsx`). Por isso `app/providers.tsx`, `app/(sistema)/layout.tsx` e
todas as páginas de `app/(sistema)/` são Client Components. O `app/layout.tsx`
e o `app/page.tsx` (login) continuam como Server Components.

📖 `01-app/01-getting-started/05-server-and-client-components.md`

---

## 2. `searchParams` e `params` agora são **Promises** (quebra compatibilidade)

No Next 15 ainda dava para ler `searchParams.algo` direto (com aviso).
**No Next 16 o acesso síncrono foi removido.** Em `page.tsx` e `layout.tsx` é
obrigatório usar `await`.

Vale para: `params`, `searchParams`, `cookies()`, `headers()` e `draftMode()`.

```tsx
// ❌ Next 14 (não funciona mais)
export default function Page({ searchParams }) {
  const aba = searchParams.aba;
}

// ✅ Next 16: Server Component assíncrono
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
}) {
  const { aba } = await searchParams;
  return <p>Aba: {aba ?? "geral"}</p>;
}
```

Atalho com tipos gerados (rode `npx next typegen`):

```tsx
export default async function Page(props: PageProps<"/projetos/[id]">) {
  const { id } = await props.params;
  const query = await props.searchParams;
}
```

### Em Client Components: `useSearchParams()` + `<Suspense>`

Uma página com `"use client"` não pode ser `async`. Nela, use os hooks:

```tsx
"use client";
import { useSearchParams, useParams } from "next/navigation";

export function Filtro() {
  const busca = useSearchParams();
  const aba = busca.get("aba") ?? "geral";   // ?aba=equipe
  const { id } = useParams<{ id: string }>(); // /projetos/[id]
}
```

⚠️ Se a página é pré-renderizada (estática), quem usa `useSearchParams` **deve
ficar dentro de um `<Suspense>`**. Sem isso, o `npm run build` dá o erro
*"useSearchParams() should be wrapped in a suspense boundary"*.

```tsx
// app/page.tsx (como o CAIS já faz com o LoginForm)
import { Suspense } from "react";
<Suspense fallback={null}><LoginForm /></Suspense>
```

**No CAIS:** `components/LoginForm.tsx` lê `?voltar=` com `useSearchParams`.
As telas também usam `/projetos/[id]?aba=...&tarefa=...` e `/empresas?abrir=...`.

📖 `01-app/03-api-reference/03-file-conventions/page.md`,
`01-app/03-api-reference/04-functions/use-search-params.md`,
`01-app/02-guides/upgrading/version-16.md` (seção *Async Request APIs*)

---

## 3. `redirect`: mandar o usuário para outra rota

Existem três ferramentas. Escolha conforme **onde** o código roda:

| Situação | Use |
|---|---|
| Durante a renderização (Server ou Client Component), Server Action, Route Handler | `redirect("/rota")` de `next/navigation` |
| Dentro de um evento (`onClick`, `onSubmit`) num Client Component | `useRouter().push()` ou `.replace()` |
| Redirecionamento fixo, sem lógica (ex.: `/antigo` → `/novo`) | `redirects` no `next.config.ts` |
| Antes da página carregar, olhando cookie/cabeçalho | `NextResponse.redirect()` no `proxy.ts` |

```tsx
// Server Component
import { redirect } from "next/navigation";

export default async function Page() {
  const logado = false;
  if (!logado) redirect("/");   // não precisa de "return": redirect "lança" e para tudo
}
```

```tsx
// Client Component, num evento
"use client";
import { useRouter } from "next/navigation";

const router = useRouter();
function aoEntrar() {
  router.replace("/painel");    // replace = não deixa voltar para o login com o botão "voltar"
}
```

**Pegadinhas:**

- `redirect()` funciona **lançando um erro especial**. Então, **não** o chame
  dentro de um `try { }`, porque o `catch` vai engolir o redirecionamento.
  Chame depois do `try/catch`.
- `redirect()` **não** funciona dentro de um `onClick`. Nesse caso, use `useRouter`.
- Status HTTP: `redirect` usa **307** (temporário), `permanentRedirect` usa
  **308**, e Server Action com formulário usa **303**.

**No CAIS:** o login e o `app/(sistema)/layout.tsx` usam `router.replace(...)`
dentro de `useEffect`, porque a sessão só existe no navegador.

📖 `01-app/03-api-reference/04-functions/redirect.md`,
`01-app/02-guides/redirecting.md`

---

## 4. Rotas públicas e protegidas

Não existe um "arquivo mágico" que protege rotas. A proteção vem de **onde** a
verificação é feita. O Next 16 recomenda camadas:

1. **Checagem otimista** (rápida): no `proxy.ts` (ver seção 6), lendo só o
   cookie de sessão. Serve para redirecionar cedo.
2. **Checagem segura**: perto dos dados, numa *Data Access Layer* (DAL). É uma
   função como `verificarSessao()` chamada por quem busca dados.
3. **Na interface**: esconder botões e menus que o perfil não pode usar.

⚠️ **Cuidado com layouts.** O layout **não renderiza de novo** quando você
navega entre páginas filhas. Por isso, uma checagem feita só no layout pode não
rodar a cada troca de rota. Além disso, o layout esconder `{children}` não
impede a página filha de ser executada. A documentação recomenda checar perto
da fonte de dados.

**Organização com grupos de rota.** Uma pasta entre parênteses, como
`(sistema)`, **não aparece na URL**. Ela serve para agrupar telas que
compartilham um layout:

```
app/
  page.tsx               → /            (pública: login)
  sem-permissao/page.tsx → /sem-permissao (pública)
  (sistema)/
    layout.tsx           → casca + verificação de acesso
    painel/page.tsx      → /painel      (protegida)
    empresas/page.tsx    → /empresas    (protegida)
```

**Como o CAIS faz hoje (front-end puro):** `app/(sistema)/layout.tsx` é um
Client Component que lê `useAuth()`. Sem sessão, ele faz
`router.replace("/?voltar=<rota>")`. Com perfil diferente de `admin`, manda para
`/sem-permissao`. Enquanto verifica, mostra o logo pulsando. Isso é aceitável
enquanto a sessão vive no `localStorage`, mas **não é segurança de verdade**:
qualquer pessoa pode editar o `localStorage`. A proteção real virá quando a API
da PROGLOGIC validar o token no servidor.

**Extras do Next 16 (experimentais):** `forbidden()` (403) e `unauthorized()`
(401), com as páginas `forbidden.tsx` e `unauthorized.tsx`. Eles exigem
`experimental.authInterrupts: true` no `next.config.ts`. Por serem
experimentais, o CAIS continua usando `/sem-permissao`.

📖 `01-app/02-guides/authentication.md` (seções *Authorization* e
*Layouts and auth checks*)

---

## 5. Metadados (título da aba, descrição, ícone)

- Exporte `metadata` (fixo) ou `generateMetadata` (dinâmico) em `layout.tsx` ou
  `page.tsx`.
- ⚠️ **Só funciona em Server Components.** Uma página com `"use client"` **não**
  pode exportar `metadata`. Se a página precisa ser Client e também ter título,
  crie um `layout.tsx` (Server) na pasta dela só para exportar o `metadata`.
- `charset` e `viewport` básicos são adicionados automaticamente. Cores de tema
  ficam no export separado `viewport`.

```tsx
// app/layout.tsx (já é assim no CAIS)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "CAIS", template: "%s · CAIS" },
  description: "Onboarding por trilhas, gestão de projetos e dashboards",
};
```

```tsx
// app/(sistema)/empresas/layout.tsx: dá título a uma página "use client"
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Empresas" };  // aba: "Empresas · CAIS"
export default function L({ children }: { children: React.ReactNode }) {
  return children;
}
```

```tsx
// Título dinâmico: note o await em params (Next 16)
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  return { title: `Projeto ${id}` };
}
```

- **Ícones por arquivo:** `app/icon.svg` vira o favicon automaticamente (o CAIS
  já usa isso no lugar do antigo `favicon.ico`).
- **Mudança no Next 16:** nas funções que geram imagens (`icon`,
  `opengraph-image`), `params` e `id` também viraram Promises.

📖 `01-app/01-getting-started/14-metadata-and-og-images.md`,
`01-app/03-api-reference/04-functions/generate-metadata.md`

---

## 6. `middleware.ts` virou `proxy.ts`

| Next 15 | Next 16 |
|---|---|
| `middleware.ts` | **`proxy.ts`** (o nome antigo está *deprecated*) |
| `export function middleware()` | **`export function proxy()`** |
| `skipMiddlewareUrlNormalize` | `skipProxyUrlNormalize` |
| podia rodar no runtime `edge` | roda **só em Node.js**, sem opção de trocar |

O arquivo fica na **raiz do projeto**, no mesmo nível da pasta `app/`. Só pode
existir **um** por projeto. Ele roda **antes** de cada requisição.

```ts
// proxy.ts (exemplo de checagem otimista; o CAIS ainda NÃO tem este arquivo)
import { NextRequest, NextResponse } from "next/server";

const publicas = ["/", "/sem-permissao"];

export function proxy(req: NextRequest) {
  const caminho = req.nextUrl.pathname;
  const token = req.cookies.get("cais-sessao")?.value;

  if (!publicas.includes(caminho) && !token) {
    const url = new URL("/", req.url);
    url.searchParams.set("voltar", caminho);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();   // segue normalmente
}

// Não roda em arquivos estáticos nem na API
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:svg|png|ico)$).*)"],
};
```

**Para que serve:** redirecionar cedo, reescrever URL, mexer em cabeçalhos.
**Para que NÃO serve:** buscar dados demorados ou substituir a verificação de
sessão completa. Ele roda até em *prefetch*, então precisa ser rápido. Por isso,
leia só o cookie.

**Por que o CAIS ainda não usa:** o `proxy` roda no servidor e só enxerga
**cookies**, não o `localStorage`. Quando o login da PROGLOGIC passar a gravar o
token num cookie, o `proxy.ts` acima passa a fazer sentido.

📖 `01-app/01-getting-started/16-proxy.md`,
`01-app/03-api-reference/03-file-conventions/proxy.md`,
`01-app/02-guides/upgrading/version-16.md` (seção *middleware to proxy*)

---

## 7. Outras mudanças do Next 16 que você vai notar

- **Turbopack é o padrão** em `next dev` e `next build`. Não precisa de flag.
- **`next lint` foi removido.** O `npm run lint` chama o `eslint` direto, com
  configuração *flat* em `eslint.config.mjs`.
- **React 19.2** vem junto.
- **Navegação mais leve:** o prefetch baixa só o que falta. Não exige mudança
  no código.
- **Rotas paralelas** (`@slot`) agora exigem um arquivo `default.tsx`.

## Cola rápida

```
Precisa de estado/evento/localStorage?      → "use client"
Ler ?aba= numa página Server?               → const { aba } = await searchParams
Ler ?aba= numa página Client?               → useSearchParams() + <Suspense>
Redirecionar ao renderizar?                 → redirect("/x")   (fora do try)
Redirecionar num clique?                    → useRouter().replace("/x")
Título da aba?                              → export const metadata (só Server)
Checar login antes da página carregar?      → proxy.ts (antigo middleware.ts)
```
