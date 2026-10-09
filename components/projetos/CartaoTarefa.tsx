/* ============================================================================
   CARTAOTAREFA.TSX
   O que é: o cartão de uma tarefa dentro de uma lista do quadro kanban. Só
   pode ser arrastado por quem pode mover a tarefa; os outros veem um cadeado.
   Onde é usado: components/projetos/Quadro.tsx (um cartão por tarefa da lista).
   Depende de: lucide-react (ícones), components/ui/basicos (Avatar,
               EtiquetaTarefa), lib/store (useDados, Tarefa) e lib/utils
               (cx, dataCurta, diasEntre, hojeISO).
   Contexto: §5 Projetos (tarefa: responsável, prazo, etiquetas, checklist,
             comentários; kanban com três estados de arrastar).
   ============================================================================ */
"use client";

import { DragEvent } from 'react';
import { Clock, CheckSquare, MessageSquare, AlignLeft, CircleCheck, Lock } from 'lucide-react';
import { Avatar, EtiquetaTarefa } from '@/components/ui/basicos';
import { useDados, Tarefa } from '@/lib/store';
import { cx, dataCurta, diasEntre, hojeISO } from '@/lib/utils';

/**
 * Cartão do quadro: etiquetas, título e selos (prazo, checklist, comentários, responsável).
 *
 * O cartão não sabe arrastar sozinho: ele só repassa os eventos para o
 * Quadro, que é quem guarda o estado do arraste e grava a nova posição.
 *
 * @param tarefa a tarefa exibida.
 * @param concluida true quando o cartão está na última lista ("Pronto").
 * @param arrastavel true se quem está logado pode mover esta tarefa (lib/permissoes.ts, 'mover_tarefa').
 * @param cadeado true para mostrar o cadeado "Só o responsável pode mover" (perfil Profissional olhando tarefa de outra pessoa).
 * @param arrastando true enquanto ESTE cartão está sendo arrastado.
 * @param onAbrir abre o detalhe da tarefa (clique, Enter ou Espaço).
 * @param onDragStart chamado quando o usuário começa a arrastar o cartão.
 * @param onDragEnd chamado quando o arraste termina (soltou ou cancelou).
 * @param destaque true por alguns segundos quando OUTRA pessoa mexeu no cartão (tempo real, G02).
 * @returns o cartão clicável e arrastável.
 */
export default function CartaoTarefa({ tarefa, concluida, arrastando, arrastavel, cadeado, onAbrir, onDragStart, onDragEnd, destaque = false }: {
  tarefa: Tarefa; concluida: boolean; arrastando: boolean; arrastavel: boolean; cadeado: boolean; destaque?: boolean;
  onAbrir: () => void; onDragStart: (e: DragEvent) => void; onDragEnd: () => void;
}) {
  const d = useDados();
  const resp = d.pessoa(tarefa.responsavelId);
  const feitos = tarefa.checklist.filter((c) => c.feito).length;
  // Dias que faltam até o prazo: negativo = já passou, 0 = vence hoje.
  const dias = diasEntre(hojeISO(), tarefa.prazo);
  // Tarefa concluída nunca conta como atrasada nem "perto do prazo".
  const atrasada = !concluida && dias < 0;
  // "Perto" = vence hoje ou nos próximos 2 dias: selo amarelo de alerta.
  const perto = !concluida && dias >= 0 && dias <= 2;

  /*
   * Cor do selo de prazo, por prioridade: concluída (verde) > atrasada
   * (vermelho) > perto (amarelo) > normal (cinza). No tema escuro o texto
   * vira tinta escura (dark:text-[#14161F]) para manter contraste.
   */
  const prazoCls = concluida ? 'bg-sucesso text-white dark:text-[#14161F]'
    : atrasada ? 'bg-erro text-white dark:text-[#14161F]'
    : perto ? 'bg-aviso/15 text-aviso'
    : 'text-tinta-suave';
  // Texto do selo segue a mesma ordem; concluída mostra quando foi feita.
  const prazoTexto = concluida ? `Feita ${dataCurta(tarefa.concluidaEm ?? tarefa.prazo)}` : atrasada ? `Atrasada, ${dataCurta(tarefa.prazo)}` : dataCurta(tarefa.prazo);

  return (
    <div
      // data-cartao é lido pelo Quadro no dragover para achar os cartões da lista.
      data-cartao={tarefa.id}
      // Atributo HTML nativo que deixa o elemento ser arrastado. Só liga para quem
      // pode mover: sem ele o navegador nem começa o arraste (e o clique segue abrindo o detalhe).
      draggable={arrastavel}
      onDragStart={arrastavel ? onDragStart : undefined}
      onDragEnd={arrastavel ? onDragEnd : undefined}
      onClick={onAbrir}
      // Acessibilidade: como é uma div com role="button", Enter e Espaço
      // precisam abrir o detalhe como um botão de verdade faria.
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir(); } }}
      role="button"
      tabIndex={0}
      aria-label={`${tarefa.titulo}. ${prazoTexto}.${tarefa.aprovadaEm ? ' Entrega aprovada pela empresa.' : ''} Responsável: ${resp?.nome ?? 'ninguém'}.${cadeado ? ' Só o responsável pode mover.' : ''}`}
      /*
       * cursor-grab/active:cursor-grabbing: mãozinha de "pegar" o cartão (só se for arrastável;
       * senão cursor-pointer, porque o cartão continua clicável).
       * select-none: evita selecionar texto ao arrastar.
       * Enquanto arrasta, o cartão original fica inclinado e transparente
       * (rotate + opacity-40): é o estado "arrastando" pedido na §5.
       */
      className={cx(
        'group select-none rounded-xl border border-borda bg-superficie p-3 shadow-[0_1px_0_rgba(20,22,31,0.06)] transition-[box-shadow,transform,opacity,border-color] duration-150',
        arrastavel ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        'hover:border-primaria/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60',
        arrastando && 'rotate-[1.5deg] opacity-40',
        // Destaque do tempo real: anel roxo; o pulso só acontece com motion-safe (quem pediu menos
        // movimento no sistema, prefers-reduced-motion, vê só o anel parado).
        destaque && 'ring-2 ring-primaria motion-safe:animate-pulse'
      )}
    >
      {/* Etiquetas só aparecem se a tarefa tiver alguma (não deixa faixa vazia). */}
      {tarefa.etiquetas.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">{tarefa.etiquetas.map((e) => <EtiquetaTarefa key={e} nome={e} compacta />)}</div>
      )}
      {/* Título fica mais apagado quando a tarefa já está concluída. */}
      <p className={cx('text-sm font-medium leading-snug text-tinta', concluida && 'text-tinta-suave')}>{tarefa.titulo}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {/* Selo de prazo: ícone de "check" se concluída, relógio nos outros casos. */}
        <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold', prazoCls)}>
          {concluida ? <CircleCheck className="h-3 w-3" aria-hidden /> : <Clock className="h-3 w-3" aria-hidden />}{prazoTexto}
        </span>
        {/* Selo do checklist (feitos/total); fica verde quando tudo foi feito. */}
        {tarefa.checklist.length > 0 && (
          <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
            feitos === tarefa.checklist.length ? 'bg-sucesso/12 text-sucesso' : 'text-tinta-suave')}>
            <CheckSquare className="h-3 w-3" aria-hidden />{feitos}/{tarefa.checklist.length}
          </span>
        )}
        {/* Selo "Aprovada": a empresa aprovou a entrega (ícone + texto, nunca só a cor). */}
        {tarefa.aprovadaEm && (
          <span className="inline-flex items-center gap-1 rounded-md bg-sucesso/12 px-1.5 py-0.5 text-[11px] font-semibold text-sucesso" title={`Aprovada pela empresa em ${dataCurta(tarefa.aprovadaEm)}`}>
            <CircleCheck className="h-3 w-3" aria-hidden />Aprovada
          </span>
        )}
        {/* Contador de comentários, só se houver algum. */}
        {tarefa.comentarios.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tinta-suave"><MessageSquare className="h-3 w-3" aria-hidden />{tarefa.comentarios.length}</span>
        )}
        {/* Ícone discreto avisando que a tarefa tem descrição. */}
        {tarefa.descricao && <AlignLeft className="h-3 w-3 text-tinta-fraca" aria-label="Tem descrição" />}
        {/* Cadeado: avisa por ícone e por texto (aria-label e title) que só o responsável move.
          * role="img" faz o aria-label valer para leitores de tela. */}
        {cadeado && <span className="ml-auto inline-flex text-tinta-fraca" title="Só o responsável pode mover"><Lock className="h-3.5 w-3.5" role="img" aria-label="Só o responsável pode mover" /></span>}
        {/* ml-auto empurra o avatar do responsável para a direita do cartão. */}
        <span className={cadeado ? 'ml-1' : 'ml-auto'}>{resp && <Avatar nome={resp.nome} tamanho={24} />}</span>
      </div>
    </div>
  );
}
