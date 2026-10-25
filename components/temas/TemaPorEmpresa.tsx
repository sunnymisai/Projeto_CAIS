/* ============================================================================
   TEMAPOREMPRESA.TSX — ATRIBUIR UM TEMA A CADA EMPRESA
   O que é: lista de empresas, cada uma com um seletor "padrão do sistema ou um tema específico".
   Onde é usado: app/(sistema)/temas/page.tsx (seção "Tema por empresa").
   Depende de: components/ui (Card, CardTitulo, EstadoVazio, form/Select), components/button, next/link e lib/temas (Tema).
   Contexto: docs/temas-contrato.md (seção "Tema por empresa"); lib/tema.tsx decide qual tema vale para cada pessoa (empresa e profissionais alocados nela).
   ============================================================================ */
"use client";

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Card, CardTitulo, EstadoVazio } from '@/components/ui/basicos';
import { Select } from '@/components/ui/form';
import { classesBotao } from '@/components/button';
import type { Tema } from '@/lib/temas';

/**
 * Seção com uma linha por empresa e um seletor de tema.
 * Não grava nada: quem chama recebe a escolha em `onAlterar` e decide (a tela chama a store).
 * @param empresas empresas a listar (id e nome).
 * @param temas todos os temas disponíveis (base + personalizados).
 * @param porEmpresa mapa empresaId → temaId das empresas que têm tema próprio.
 * @param padraoNome nome do tema padrão do sistema (aparece na primeira opção).
 * @param onAlterar chamada com o id da empresa e o id do tema escolhido, ou null para voltar ao padrão.
 * @returns o card da seção, com estado vazio quando não há empresas.
 * @example <TemaPorEmpresa empresas={d.empresas} temas={temas} porEmpresa={d.temas.porEmpresa} padraoNome="CAIS" onAlterar={…} />
 */
export default function TemaPorEmpresa({ empresas, temas, porEmpresa, padraoNome, onAlterar }: {
  empresas: { id: string; nomeFantasia: string }[]; temas: Tema[]; porEmpresa: Record<string, string>;
  padraoNome: string; onAlterar: (empresaId: string, temaId: string | null) => void;
}) {
  // [PV-1] AS OPÇÕES do seletor: a primeira (valor vazio) é "padrão do sistema"; as demais são os temas. Mude o texto da primeira opção aqui.
  const opcoes = [{ valor: '', rotulo: `Padrão do sistema (${padraoNome})` }, ...temas.map((t) => ({ valor: t.id, rotulo: t.nome }))];

  return (
    <Card>
      <CardTitulo titulo="Tema por empresa"
        descricao="A empresa e os profissionais alocados nos projetos dela veem o tema escolhido aqui. Quem não tem escolha usa o padrão do sistema." />
      {empresas.length === 0 ? (
        // Estado vazio: explica e oferece a próxima ação (§13).
        <EstadoVazio icone={<Building2 className="h-6 w-6" />} titulo="Nenhuma empresa cadastrada"
          descricao="Cadastre uma empresa para poder atribuir um tema a ela."
          acao={<Link href="/empresas" className={classesBotao({ variante: 'secundario' })}>Ir para Empresas</Link>} />
      ) : (
        <ul className="divide-y divide-borda px-5 pb-2 pt-3">
          {empresas.map((e) => {
            // Tema salvo que não existe mais (apagado): a linha cai em "padrão" em vez de mostrar um select sem opção marcada.
            const atual = porEmpresa[e.id];
            const valor = atual && temas.some((t) => t.id === atual) ? atual : '';
            return (
              // flex-col no celular: o seletor ocupa a largura toda embaixo do nome.
              <li key={e.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <span className="flex min-w-0 items-center gap-3">
                  <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primaria-suave font-space text-sm font-bold text-primaria">{e.nomeFantasia[0]}</span>
                  <span className="truncate font-semibold text-tinta">{e.nomeFantasia}</span>
                </span>
                <div className="w-full sm:w-72">
                  <Select aria-label={`Tema da empresa ${e.nomeFantasia}`} value={valor} opcoes={opcoes}
                    // GRAVA: quem chama salva a escolha na store (valor vazio = voltar ao padrão).
                    onChange={(ev) => onAlterar(e.id, ev.target.value || null)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
