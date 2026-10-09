/* ============================================================================
   ABAPREFERENCIAS.TSX — ABA "PREFERÊNCIAS" DE MEU PERFIL
   O que é: escolha do tema (claro, escuro ou seguir o sistema) e da densidade das tabelas (confortável ou compacta).
   Onde é usado: app/(sistema)/perfil/page.tsx.
   Depende de: lib/tema (useTema: a mesma lógica e a mesma chave do botão de tema do topo), lib/store (useDados, Pessoa), lib/preferencias (Densidade), lib/toast, components/ui/form (Segmentado) e components/ui/basicos (Card, CardTitulo).
   Contexto: §8 (Onda 1: perfil e preferências), §9 (tema claro e escuro) e §10 (tabelas densas).
   ============================================================================ */
"use client";

import { useDados, Pessoa } from '@/lib/store';
import { useTema, Tema } from '@/lib/tema';
import { Densidade } from '@/lib/preferencias';
import { useToast } from '@/lib/toast';
import { Card, CardTitulo } from '@/components/ui/basicos';
import { Segmentado } from '@/components/ui/form';

// [PV-1] AS TRÊS ESCOLHAS DE TEMA (claro, escuro, seguir o sistema) e seus nomes. A regra de aplicar o tema fica em lib/tema.ts.
/** Textos das três escolhas de tema. */
const TEMAS: { valor: Tema; rotulo: string }[] = [
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
  { valor: 'sistema', rotulo: 'Seguir o sistema' },
];

// [PV-2] AS DUAS DENSIDADES DE TABELA (confortável e compacta) e seus nomes. O efeito está em components/ui/Tabela.tsx.
/** Textos das duas densidades. */
const DENSIDADES: { valor: Densidade; rotulo: string }[] = [
  { valor: 'confortavel', rotulo: 'Confortável' },
  { valor: 'compacta', rotulo: 'Compacta' },
];

/**
 * Aba Preferências. O tema vale na hora e fica neste navegador; a densidade fica no cadastro da pessoa.
 * @param props.pessoa - o cadastro da pessoa logada (já carregado).
 * @returns o card com as duas preferências.
 */
export default function AbaPreferencias({ pessoa }: { pessoa: Pessoa }) {
  const d = useDados();
  const avisar = useToast();
  // Mesmo hook do botão sol/lua do topo: trocar aqui muda o botão e vice-versa.
  const { tema, definir } = useTema();
  const densidade: Densidade = pessoa.densidadeTabela ?? 'confortavel';

  // [PV-3] A DENSIDADE fica no cadastro da pessoa (vale em qualquer navegador); o tema fica só neste navegador. TODO(API): PATCH nas preferências.
  /**
   * Salva a densidade escolhida no cadastro da pessoa e confirma com um aviso.
   * @param nova - a densidade escolhida.
   */
  // GRAVA: grava Pessoa.densidadeTabela na store (por pessoa, não por navegador).
  // TODO(API): PATCH nas preferências do usuário na API da PROGLOGIC.
  const escolherDensidade = (nova: Densidade) => {
    d.salvar('pessoas', { ...pessoa, densidadeTabela: nova });
    avisar(nova === 'compacta' ? 'Tabelas compactas ativadas.' : 'Tabelas confortáveis ativadas.');
  };

  return (
    <Card>
      <CardTitulo titulo="Preferências" descricao="Como o CAIS aparece para você." />
      <div className="space-y-7 p-5">
        <section aria-labelledby="pref-tema">
          <h3 id="pref-tema" className="text-sm font-semibold text-tinta">Tema</h3>
          <p className="mb-3 mt-0.5 text-[13px] text-tinta-suave">
            Muda na hora e fica guardado neste navegador. “Seguir o sistema” acompanha o tema do seu computador ou celular.
          </p>
          {/* GRAVA: lib/tema.ts guarda a escolha em localStorage['cais-tema'] (a mesma chave do botão do topo). */}
          <Segmentado rotulo="Tema" opcoes={TEMAS} valor={tema} onChange={(t) => definir(t)} />
        </section>

        <section aria-labelledby="pref-densidade">
          <h3 id="pref-densidade" className="text-sm font-semibold text-tinta">Densidade das tabelas</h3>
          <p className="mb-3 mt-0.5 text-[13px] text-tinta-suave">
            “Compacta” aproxima as linhas para caber mais itens na tela. Vale para as tabelas de Pessoas, Empresas, Trilhas e demais listas, e acompanha a sua conta em qualquer navegador.
          </p>
          <Segmentado rotulo="Densidade das tabelas" opcoes={DENSIDADES} valor={densidade} onChange={escolherDensidade} />
        </section>
      </div>
    </Card>
  );
}
