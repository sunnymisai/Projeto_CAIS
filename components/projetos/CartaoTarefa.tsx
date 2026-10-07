"use client";

import { DragEvent } from 'react';
import { Clock, CheckSquare, MessageSquare, AlignLeft, CircleCheck } from 'lucide-react';
import { Avatar, EtiquetaTarefa } from '@/components/ui/basicos';
import { useDados, Tarefa } from '@/lib/store';
import { cx, dataCurta, diasEntre, hojeISO } from '@/lib/utils';

/** Cartão do quadro: etiquetas, título e selos (prazo, checklist, comentários, responsável). */
export default function CartaoTarefa({ tarefa, concluida, arrastando, onAbrir, onDragStart, onDragEnd }: {
  tarefa: Tarefa; concluida: boolean; arrastando: boolean;
  onAbrir: () => void; onDragStart: (e: DragEvent) => void; onDragEnd: () => void;
}) {
  const d = useDados();
  const resp = d.pessoa(tarefa.responsavelId);
  const feitos = tarefa.checklist.filter((c) => c.feito).length;
  const dias = diasEntre(hojeISO(), tarefa.prazo);
  const atrasada = !concluida && dias < 0;
  const perto = !concluida && dias >= 0 && dias <= 2;

  const prazoCls = concluida ? 'bg-sucesso text-white dark:text-[#14161F]'
    : atrasada ? 'bg-erro text-white dark:text-[#14161F]'
    : perto ? 'bg-aviso/15 text-aviso'
    : 'text-tinta-suave';
  const prazoTexto = concluida ? `Feita ${dataCurta(tarefa.concluidaEm ?? tarefa.prazo)}` : atrasada ? `Atrasada, ${dataCurta(tarefa.prazo)}` : dataCurta(tarefa.prazo);

  return (
    <div
      data-cartao={tarefa.id}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onAbrir}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir(); } }}
      role="button"
      tabIndex={0}
      aria-label={`${tarefa.titulo}. ${prazoTexto}. Responsável: ${resp?.nome ?? 'ninguém'}.`}
      className={cx(
        'group cursor-grab select-none rounded-xl border border-borda bg-superficie p-3 shadow-[0_1px_0_rgba(20,22,31,0.06)] transition-[box-shadow,transform,opacity,border-color] duration-150',
        'hover:border-primaria/40 hover:shadow-card active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/60',
        arrastando && 'rotate-[1.5deg] opacity-40'
      )}
    >
      {tarefa.etiquetas.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">{tarefa.etiquetas.map((e) => <EtiquetaTarefa key={e} nome={e} compacta />)}</div>
      )}
      <p className={cx('text-sm font-medium leading-snug text-tinta', concluida && 'text-tinta-suave')}>{tarefa.titulo}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold', prazoCls)}>
          {concluida ? <CircleCheck className="h-3 w-3" aria-hidden /> : <Clock className="h-3 w-3" aria-hidden />}{prazoTexto}
        </span>
        {tarefa.checklist.length > 0 && (
          <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
            feitos === tarefa.checklist.length ? 'bg-sucesso/12 text-sucesso' : 'text-tinta-suave')}>
            <CheckSquare className="h-3 w-3" aria-hidden />{feitos}/{tarefa.checklist.length}
          </span>
        )}
        {tarefa.comentarios.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-tinta-suave"><MessageSquare className="h-3 w-3" aria-hidden />{tarefa.comentarios.length}</span>
        )}
        {tarefa.descricao && <AlignLeft className="h-3 w-3 text-tinta-fraca" aria-label="Tem descrição" />}
        <span className="ml-auto">{resp && <Avatar nome={resp.nome} tamanho={24} />}</span>
      </div>
    </div>
  );
}
