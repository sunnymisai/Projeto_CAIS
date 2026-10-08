/* ============================================================================
   ARQUIVOSDOPROJETO.TSX
   O que é: a aba "Arquivos" do projeto: todos os anexos das tarefas do projeto, com
     filtro por tipo e link para a tarefa de origem. SIMULADO: só metadados.
   Onde é usado: app/(sistema)/projetos/[id]/page.tsx (aba "Arquivos").
   Depende de: lib/anexos.ts (anexosDoProjeto, categoriaDoAnexo, tamanhoLegivel,
     ROTULO_CATEGORIA), lib/store (useDados), lib/utils (tempoRelativo, cx),
     components/projetos/AnexosDaTarefa.tsx (ICONE_CATEGORIA), components/ui/form
     (Segmentado), components/ui/basicos (EstadoVazio, Esqueleto, Card) e lucide-react.
   Contexto: §5 (aba Arquivos do projeto), §13 (quatro estados) e §7 (upload é do back-end).
   ============================================================================ */
"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Paperclip, SearchX } from 'lucide-react';
import { useDados } from '@/lib/store';
import { anexosDoProjeto, categoriaDoAnexo, tamanhoLegivel, ROTULO_CATEGORIA, type CategoriaAnexo } from '@/lib/anexos';
import { tempoRelativo } from '@/lib/utils';
import { ICONE_CATEGORIA } from './AnexosDaTarefa';
import { Segmentado } from '@/components/ui/form';
import { Card, EstadoVazio, Esqueleto } from '@/components/ui/basicos';
import Button from '@/components/button';

/**
 * Aba Arquivos de um projeto.
 * Os quatro estados: carregando (esqueleto), vazio (o projeto não tem anexo), vazio do filtro
 * (com "Mostrar todos") e com dado. Só mostra anexos das tarefas que a pessoa já enxerga
 * (a ficha do projeto só abre para quem pode ver o projeto).
 * @param props.projetoId - id do projeto.
 * @returns a lista de arquivos.
 */
export default function ArquivosDoProjeto({ projetoId }: { projetoId: string }) {
  const d = useDados();
  const [filtro, setFiltro] = useState<'todos' | CategoriaAnexo>('todos');
  const todos = useMemo(() => anexosDoProjeto(projetoId, d), [projetoId, d]);
  // Só oferece filtro das categorias que existem neste projeto (e "Todos").
  const categorias = [...new Set(todos.map((x) => categoriaDoAnexo(x.anexo.nome, x.anexo.tipo)))];
  const visiveis = filtro === 'todos' ? todos : todos.filter((x) => categoriaDoAnexo(x.anexo.nome, x.anexo.tipo) === filtro);

  // Carregando (§13): esqueleto até a store ler os dados.
  if (!d.pronto) return <Card className="p-5"><Esqueleto className="mb-3 h-5 w-48" /><Esqueleto className="h-40 w-full" /></Card>;
  // Vazio do projeto: explica de onde vêm os arquivos.
  if (todos.length === 0) {
    return <Card><EstadoVazio icone={<Paperclip className="h-6 w-6" aria-hidden />} titulo="Nenhum arquivo neste projeto"
      descricao="Os arquivos anexados às tarefas aparecem aqui. Abra uma tarefa e use a área Anexos." /></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmentado rotulo="Filtrar por tipo de arquivo" valor={filtro} onChange={setFiltro}
          opcoes={[{ valor: 'todos', rotulo: `Todos (${todos.length})` }, ...categorias.map((c) => ({ valor: c, rotulo: ROTULO_CATEGORIA[c] }))]} />
      </div>
      <Card>
        {visiveis.length === 0 ? (
          // Vazio do filtro: oferece a saída.
          <EstadoVazio icone={<SearchX className="h-6 w-6" aria-hidden />} titulo="Nenhum arquivo deste tipo" descricao="Escolha outro tipo ou volte a mostrar todos."
            acao={<Button variante="secundario" onClick={() => setFiltro('todos')}>Mostrar todos</Button>} />
        ) : (
          <ul className="divide-y divide-borda" aria-label="Arquivos do projeto">
            {visiveis.map(({ anexo, tarefaId, tarefaTitulo }) => {
              const Icone = ICONE_CATEGORIA[categoriaDoAnexo(anexo.nome, anexo.tipo)];
              return (
                <li key={anexo.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Icone className="h-5 w-5 shrink-0 text-tinta-suave" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-tinta">{anexo.nome}</span>
                    <span className="block truncate text-[12px] text-tinta-suave">{tamanhoLegivel(anexo.tamanho)} · {d.pessoa(anexo.autorId)?.nome ?? 'Alguém'} · {tempoRelativo(anexo.data)}</span>
                  </span>
                  {/* NAVEGA: abre a tarefa de origem por cima do quadro (aba Tarefas). */}
                  <Link href={`/projetos/${projetoId}?aba=tarefas&tarefa=${tarefaId}`}
                    className="rounded text-[13px] font-semibold text-primaria hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60">
                    Tarefa: {tarefaTitulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
