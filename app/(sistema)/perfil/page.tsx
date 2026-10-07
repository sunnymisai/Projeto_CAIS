/* ============================================================================
   APP/(SISTEMA)/PERFIL/PAGE.TSX (MEU PERFIL E PREFERÊNCIAS)
   O que é: a tela /perfil, igual para os três perfis, com abas: Dados, Preferências e Segurança.
   Onde é usado: rota /perfil. Chega-se pelo item "Meu perfil" do menu do topo (components/shell/Topbar.tsx); liberada aos três perfis em lib/permissoes.ts (ROTAS_POR_PERFIL).
   Depende de: lib/auth (useAuth), lib/store (useDados), components/perfil (AbaDados, AbaPreferencias, AbaSeguranca), components/shell/Pagina, components/ui/basicos (Abas, Aviso, EsqueletoLista, Card).
   Contexto: §8 (Onda 1: perfil e preferências), §3 (perfis), §13 (os quatro estados).
   ============================================================================ */
// "use client": a tela usa estado das abas, a sessão e a store, que só existem no navegador
// (docs/notas-next16.md §1).
"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useDados } from '@/lib/store';
import { CabecalhoPagina } from '@/components/shell/Pagina';
import { Abas, Aviso, Card, EsqueletoLista } from '@/components/ui/basicos';
import AbaDados from '@/components/perfil/AbaDados';
import AbaPreferencias from '@/components/perfil/AbaPreferencias';
import AbaSeguranca from '@/components/perfil/AbaSeguranca';

/** As abas da tela. O id liga a aba ao painel (id="painel-<id>"), como o componente Abas espera. */
type IdAba = 'dados' | 'preferencias' | 'seguranca';
const ABAS: { id: IdAba; rotulo: string }[] = [
  { id: 'dados', rotulo: 'Dados' },
  { id: 'preferencias', rotulo: 'Preferências' },
  { id: 'seguranca', rotulo: 'Segurança' },
];

/**
 * Página Meu perfil. Os quatro estados:
 * carregando (esqueleto até a store ler os dados), erro (cadastro da sessão não encontrado),
 * vazio (só no resumo do profissional sem habilidades, dentro da aba Dados) e com dado.
 * ⚠️ ATENÇÃO: o acesso por perfil NÃO é decidido aqui, e sim em lib/permissoes.ts + layout do grupo (sistema).
 * @returns a tela com cabeçalho, abas e o painel da aba escolhida.
 */
export default function PaginaPerfil() {
  const { sessao } = useAuth();
  const d = useDados();
  const [aba, setAba] = useState<IdAba>('dados');
  // O cadastro da pessoa logada (a sessão guarda só uma cópia de nome e perfil).
  const pessoa = sessao ? d.pessoa(sessao.pessoaId) : undefined;

  return (
    <div className="mx-auto max-w-[900px] p-4 sm:p-6 lg:p-8">
      <CabecalhoPagina titulo="Meu perfil" descricao="Seus dados, preferências e segurança." />

      {/* Estado carregando: a store lê o navegador por uns instantes; nunca mostramos tela em branco. */}
      {!d.pronto ? (
        <Card><EsqueletoLista linhas={4} /></Card>
      ) : !pessoa ? (
        // Estado de erro: a sessão aponta para uma pessoa que não está mais no cadastro.
        <Aviso tipo="erro" titulo="Não encontramos o seu cadastro">
          Os seus dados não estão mais disponíveis neste navegador. Saia do sistema pelo menu do topo e entre de novo; se continuar, fale com o administrador.
        </Aviso>
      ) : (
        <div className="space-y-5">
          <Abas rotulo="Seções do perfil" abas={ABAS} ativa={aba} onChange={setAba} />
          {/* role="tabpanel" + aria-labelledby ligam o painel à aba ativa (ids definidos em Abas). */}
          <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
            {aba === 'dados' && <AbaDados pessoa={pessoa} />}
            {aba === 'preferencias' && <AbaPreferencias pessoa={pessoa} />}
            {aba === 'seguranca' && <AbaSeguranca pessoa={pessoa} />}
          </div>
        </div>
      )}
    </div>
  );
}
