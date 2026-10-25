/* ============================================================================
   CAMPOCOR.TSX — CAMPO DE COR (SELETOR + HEXADECIMAL)
   O que é: um campo para editar UMA cor do tema: o seletor nativo (<input type="color">) e um campo de texto com o hexadecimal, sempre sincronizados.
   Onde é usado: components/temas/EditorTema.tsx (um campo por variável de cor) e a seção "Temas" do /design-system.
   Depende de: react (useId, useState), components/input (Input) e lib/utils (cx).
   Contexto: docs/temas-contrato.md (tela do administrador); §9 (design system) e §11 (erro aparece ao sair do campo).
   ============================================================================ */
"use client";

import { useId, useState } from 'react';
import Input from '@/components/input';
import { cx } from '@/lib/utils';

// [PV-1] O FORMATO ACEITO de cor: #RRGGBB (seis dígitos hexadecimais). Para aceitar também #RGB ou rgba(), mude esta expressão e a conversão do seletor em `paraSeletor`.
/** Expressão que reconhece um hexadecimal completo, ex.: #7052F2. */
const HEX_COMPLETO = /^#[0-9a-fA-F]{6}$/;

/**
 * Converte o valor do campo para o que o seletor nativo aceita.
 * O <input type="color"> só entende #rrggbb em minúsculas; qualquer outra coisa
 * (campo em edição, hex inválido) vira preto só para o seletor não quebrar.
 * @param valor texto atual do campo hexadecimal.
 * @returns um #rrggbb válido.
 * @example paraSeletor('#7052F2') // '#7052f2'
 */
function paraSeletor(valor: string): string {
  return HEX_COMPLETO.test(valor) ? valor.toLowerCase() : '#000000';
}

/**
 * Campo de cor com seletor e hexadecimal.
 * O texto sobe para quem chamou a cada tecla (o aviso de contraste do tema acompanha
 * a digitação), mas a mensagem de erro do formato só aparece ao sair do campo (§11).
 * @param rotulo nome da cor, ex.: "Fundo do app"; também nomeia o seletor para o leitor de tela.
 * @param valor cor atual (hex; pode estar incompleta enquanto a pessoa digita).
 * @param onChange chamada com o novo texto (do seletor ou do campo).
 * @param aviso mensagem de contraste vinda de validarTema (opcional); aparece como dica abaixo do campo (o texto da mensagem já diz o problema, não só a cor).
 * @returns o campo completo.
 * @example <CampoCor rotulo="Texto principal" valor="#14161F" onChange={(v) => mudar('--tinta', v)} />
 */
export default function CampoCor({ rotulo, valor, onChange, aviso }: {
  rotulo: string; valor: string; onChange: (valor: string) => void; aviso?: string;
}) {
  const id = useId();
  // Só mostramos "formato inválido" depois que a pessoa saiu do campo.
  const [tocou, setTocou] = useState(false);
  const invalido = !HEX_COMPLETO.test(valor);

  /**
   * Trata a digitação: garante o "#" na frente e tira o que não é dígito hexadecimal.
   * @param texto o que a pessoa digitou ou colou.
   */
  function digitou(texto: string) {
    // Tira espaços e o "#" para refazê-lo: assim "7052f2" e "#7052f2" valem igual.
    const limpo = texto.trim().replace(/^#/, '');
    onChange(limpo === '' ? '' : `#${limpo}`);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-hex`} className="text-[13px] font-medium text-tinta">{rotulo}</label>
      <div className="flex items-start gap-2">
        {/* O seletor nativo é acessível e abre a paleta do sistema operacional. A amostra não depende só da cor: o hex ao lado diz o valor. */}
        <input type="color" value={paraSeletor(valor)} onChange={(e) => onChange(e.target.value.toUpperCase())}
          aria-label={`${rotulo}: seletor de cor`}
          className={cx('h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-borda bg-superficie p-1',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria/50')} />
        <div className="min-w-0 flex-1">
          <Input compacto id={`${id}-hex`} value={valor} maxLength={7} spellCheck={false} autoComplete="off"
            onChange={(e) => digitou(e.target.value)} onBlur={() => setTocou(true)}
            error={tocou && invalido ? 'Use o formato #RRGGBB, com seis dígitos.' : undefined}
            hint={aviso} className="font-mono uppercase" />
        </div>
      </div>
    </div>
  );
}
