# Projeto_CAIS

**CAIS: "onde empresas, pessoas e projetos atracam."** Uma plataforma para formar, alocar e acompanhar:
onboarding por trilhas (com etapas, quiz e prazo), gestão dos projetos que as empresas parceiras trazem e
painéis que mostram como tudo está andando, cada perfil pelo seu ângulo.

Front-end do projeto da Residência Técnica PROGLOGIC (2º período de ADS), feito em
**Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4**. O back-end (API, banco e
autenticação de verdade) é da PROGLOGIC: aqui os dados ficam no navegador (`localStorage`) e todo
ponto que muda com a API está marcado no código com `TODO(API)`.

## Perfis

| Perfil | O que faz |
|---|---|
| **Administrador** | Opera o programa: cadastra empresas e pessoas, monta e publica trilhas, cria projetos, aloca pessoas e acompanha tudo pelos painéis. |
| **Empresa** (parceira) | Vê só os próprios projetos, quem está alocado neles, as entregas e o progresso da trilha do time. |
| **Profissional** | Cumpre as trilhas (com quiz), vê os projetos em que está, move as próprias tarefas e acompanha o próprio painel. Funciona no celular. |

## Como rodar

```bash
npm install
npm run dev        # abre em http://localhost:3000
```

Contas de demonstração (senha **`Cais@2026`** para todas): `admin@cais.com.br`, `ana.souza@cais.example`
(profissional), `marcos@vertice.example` e `patricia@aurora.example` (empresa). Na tela de login, os
botões "Entrar como" preenchem e-mail e senha.

## Onde está cada coisa

| Arquivo / pasta | Para quê |
|---|---|
| [`SISTEMA.md`](SISTEMA.md) | O que já existe: rotas, permissões por perfil, contas, o que ainda é simulado e onde ligar a API. |
| [`CHANGELOG.md`](CHANGELOG.md) | O que foi criado, modificado e removido em cada etapa. |
| [`CLAUDE.md`](CLAUDE.md) | Padrões do time: arquitetura, design system, quatro estados de tela, acessibilidade e **padrão de comentários**. |
| [`docs/ONDE-PARAMOS.md`](docs/ONDE-PARAMOS.md) | Situação de cada bloco de trabalho, como retomar, pendências e decisões tomadas. |
| [`docs/prompts/`](docs/prompts/) | Os prompts que guiam o desenvolvimento, bloco a bloco (comece pelo `00-GUIA.md`). |
| [`docs/contexto-cais.md`](docs/contexto-cais.md) | Resumo do deck oficial do projeto (regras de produto, perfis, telas). |
| `app/` | As páginas (rotas). As telas internas ficam em `app/(sistema)/`, protegidas por perfil. |
| `components/` | Componentes; os do design system ficam em `components/ui/`. |
| `lib/` | Regras e cálculos em funções puras (permissões, trilhas, quiz, métricas) e a camada de dados (`store.tsx`). |
| `testes/` | Testes de navegador (Chrome sem janela) e a auditoria do padrão de comentários. |

## Verificações

```bash
npx tsc --noEmit                                         # tipos
npm run lint                                             # lint
npm run build                                            # build de produção
node --experimental-strip-types lib/permissoes.casos.ts  # casos de lógica (também quiz e metricas)
node testes/auditar-comentarios.mjs                      # padrão de comentários: 0 pontos antes de todo push
node testes/navegador/paineis-todos-perfis.mjs           # teste de navegador (com o npm run dev aberto)
```
