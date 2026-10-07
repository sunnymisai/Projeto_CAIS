# CAIS — Sistema do perfil Administrador

Front-end em **Next.js 16 + React 19 + Tailwind v4**, seguindo o design system e o deck do projeto.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

**Acesso de demonstração:** `admin@cais.com.br` / `Cais@2026`. O botão "Preencher" na tela de login coloca esses dados.
Contas de outros perfis (`ana.souza@cais.example`, `marcos@vertice.example`, senha `Cais@2026`) são recusadas de propósito. Elas servem para testar o bloqueio de perfil.

## Rotas

| Rota | Tela |
|---|---|
| `/` | Homepage pública: apresenta o CAIS à empresa (topo, pilares, como funciona, perguntas e formulário de interesse simulado) |
| `/login` | Login (redireciona para `?voltar=`, só caminho interno, ou `/painel`) |
| `/painel` | Painel do administrador (trilhas, prazos, projetos, carga) |
| `/empresas` | Lista e ficha de empresa (CNPJ validado, CEP via ViaCEP) |
| `/pessoas` | Lista e ficha de pessoa (campos por perfil, convite, inativar) |
| `/trilhas` e `/trilhas/[id]` | Lista e editor de trilha (etapas, público, progresso) |
| `/projetos` e `/projetos/[id]` | Lista, ficha, equipe e tarefas (quadro, lista, cronograma) |
| `/design-system` | Documentação viva dos componentes |
| `/sem-permissao` e 404 | Páginas de erro (a 404 tem link "Ir para a página inicial") |

Parâmetros úteis: `/projetos/[id]?aba=equipe|tarefas|geral&tarefa=<id>` e `/empresas?abrir=<id>`.

## Onde ligar a API da PROGLOGIC

A autenticação e os dados passam por dois arquivos:

- **`lib/auth.tsx`**: troque o corpo de `autenticar()` pelo `fetch` do login e guarde o token.
- **`lib/store.tsx`**: reescreva `salvar`, `remover` e `moverTarefa` com `fetch`. As telas usam só `useDados()` e não precisam mudar.

Hoje os dados ficam no `localStorage` (chave `cais-dados-v1`). O menu do perfil tem a opção "Restaurar dados de demonstração".

## Estrutura

```
app/(sistema)/        telas internas (layout protege a rota e monta o shell)
components/home/      seções da homepage pública (Topo, Hero, Problema, Pilares, Perguntas, Formulário, Rodapé)
components/marca/     TresPilares (diagrama usado no login e na homepage)
components/ui/        design system: basicos, form, Modal, Menu, Tabela, Graficos
components/shell/     Sidebar, Topbar (busca Ctrl+K, avisos, perfil), Pagina
components/projetos/  Quadro, CartaoTarefa, DetalheTarefa, Vistas, Equipe, FormProjeto
lib/                  tipos, seed, store, auth, toast, metricas, useFormulario, utils
```

## Ainda simulado ou fora desta versão

- Envio real de convite e notificações.
- WebSocket do quadro em tempo real.
- Anexos e upload de logo e foto.
- Aba Arquivos do projeto.
- Primeiro acesso do profissional.
- Painéis dos perfis Empresa e Profissional.
