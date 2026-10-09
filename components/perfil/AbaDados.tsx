/* ============================================================================
   ABADADOS.TSX — ABA "DADOS" DE MEU PERFIL
   O que é: formulário com nome, telefone e cargo editáveis; e-mail e perfil aparecem como somente leitura. Para o profissional, mostra também o resumo da atuação (área, nível, carga máxima e habilidades), que só o administrador edita.
   Onde é usado: app/(sistema)/perfil/page.tsx.
   Depende de: lib/store (useDados, Pessoa), lib/auth (useAuth.atualizarSessao), lib/toast, lib/useFormulario, lib/utils (mascaraTelefone), lib/metricas (ROTULO_PERFIL), components/ui/basicos, components/input e components/button.
   Contexto: §8 (Onda 1: perfil e preferências), §11 (e-mail é o login e é único) e §3 (perfis).
   ============================================================================ */
"use client";

import { ReactNode, useCallback, useState } from 'react';
import { Lock } from 'lucide-react';
import { useDados, Pessoa } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { useFormulario } from '@/lib/useFormulario';
import { mascaraTelefone } from '@/lib/utils';
import { ROTULO_PERFIL } from '@/lib/metricas';
import { Avatar, Card, CardTitulo, Etiqueta } from '@/components/ui/basicos';
import Input from '@/components/input';
import Button from '@/components/button';

/** Valores editáveis do formulário. */
type Valores = { nome: string; telefone: string; cargo: string };

/**
 * Item "somente leitura" (rótulo, valor e explicação) com o cadeado.
 * @param props.rotulo - nome do campo.
 * @param props.children - o valor.
 * @param props.explicacao - por que não dá para editar aqui.
 * @returns o bloco de leitura.
 */
function SomenteLeitura({ rotulo, children, explicacao }: { rotulo: string; children: ReactNode; explicacao: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[13px] font-medium text-tinta">
        {rotulo}<Lock className="h-3 w-3 text-tinta-fraca" aria-hidden /><span className="sr-only">(somente leitura)</span>
      </dt>
      <dd className="mt-1.5 text-sm text-tinta">{children}</dd>
      <p className="mt-1 text-[12px] text-tinta-suave">{explicacao}</p>
    </div>
  );
}

/**
 * Aba Dados: edita nome, telefone e cargo e mostra o resto como leitura.
 * @param props.pessoa - o cadastro da pessoa logada (já carregado).
 * @returns os cards da aba.
 */
export default function AbaDados({ pessoa }: { pessoa: Pessoa }) {
  const d = useDados();
  const { atualizarSessao } = useAuth();
  const avisar = useToast();
  const [salvando, setSalvando] = useState(false);

  // [PV-1] AS REGRAS DOS DADOS: o nome precisa de nome e sobrenome (mesma regra de /pessoas); telefone e cargo são livres.
  /**
   * Regras: o nome precisa de nome e sobrenome (mesma regra de /pessoas); telefone e cargo são livres.
   * useCallback mantém a mesma função entre renders, pois o useFormulario depende dela.
   * @param v - valores atuais.
   * @returns a mensagem de cada campo com erro.
   */
  const validar = useCallback((v: Valores) => {
    const e: Partial<Record<keyof Valores, string>> = {};
    if (!v.nome.trim()) e.nome = 'Informe o seu nome completo.';
    else if (v.nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome.';
    return e;
  }, []);
  const f = useFormulario<Valores>({ nome: pessoa.nome, telefone: pessoa.telefone, cargo: pessoa.cargo }, validar);

  // [PV-2] O SALVAR DOS DADOS: grava só nome, telefone e cargo e atualiza o nome na sessão (para o topo mudar na hora). TODO(API): PATCH no perfil do usuário.
  /**
   * Salva os três campos no cadastro e atualiza o nome na sessão (para o topo mudar na hora).
   * @param ev - evento de envio do <form>.
   */
  const salvar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!f.validarTudo()) return;
    setSalvando(true);
    // SIMULADO: espera 350 ms para fingir a resposta da API.
    await new Promise((r) => setTimeout(r, 350));
    const nome = f.valores.nome.trim();
    // GRAVA: atualiza só nome, telefone e cargo; e-mail, perfil e status ficam como estavam.
    // TODO(API): PATCH no perfil do usuário na API da PROGLOGIC.
    d.salvar('pessoas', { ...pessoa, nome, telefone: f.valores.telefone, cargo: f.valores.cargo.trim() });
    // GRAVA: a sessão guarda uma cópia do nome (mostrada no topo); sem isto ela ficaria desatualizada.
    atualizarSessao({ nome });
    avisar('Seus dados foram salvos.');
    setSalvando(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardTitulo titulo="Seus dados" descricao="Nome, telefone e cargo podem ser alterados por você." />
        <div className="flex items-center gap-4 px-5 pt-5">
          <Avatar nome={f.valores.nome || pessoa.nome} tamanho={64} />
          <div>
            <p className="font-space text-lg font-semibold text-tinta">{f.valores.nome || pessoa.nome}</p>
            <Etiqueta tom="primaria">{ROTULO_PERFIL[pessoa.perfil]}</Etiqueta>
          </div>
        </div>
        <form onSubmit={salvar} noValidate className="space-y-6 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input compacto label="Nome completo" required placeholder="Nome e sobrenome" autoComplete="name" disabled={salvando} {...f.campo('nome')} />
            </div>
            <Input compacto label="Telefone / WhatsApp" placeholder="(00) 00000-0000" inputMode="tel" autoComplete="tel" disabled={salvando} {...f.campo('telefone', mascaraTelefone)} />
            <Input compacto label="Cargo ou função" placeholder="Ex.: Desenvolvedor" autoComplete="organization-title" disabled={salvando} {...f.campo('cargo')} />
          </div>
          {/* dl: lista de "termo e descrição", a marcação certa para pares rótulo e valor. */}
          <dl className="grid gap-4 border-t border-borda pt-5 sm:grid-cols-2">
            {/* [PV-3] O QUE A PESSOA NÃO EDITA aqui: e-mail (é o login) e perfil de acesso; só o administrador muda. Campo novo somente leitura entra neste bloco. */}
            <SomenteLeitura rotulo="E-mail" explicacao="O e-mail é o seu login. Só o administrador pode mudá-lo.">
              <span className="break-all">{pessoa.email}</span>
            </SomenteLeitura>
            <SomenteLeitura rotulo="Perfil de acesso" explicacao="O perfil define o que você enxerga no sistema. Só o administrador altera.">
              {ROTULO_PERFIL[pessoa.perfil]}
            </SomenteLeitura>
          </dl>
          <div className="flex justify-end">
            <Button type="submit" isLoading={salvando} loadingText="Salvando…">Salvar alterações</Button>
          </div>
        </form>
      </Card>

      {/* Resumo só do profissional: o administrador é quem edita estes campos (em /pessoas). */}
      {pessoa.perfil === 'profissional' && (
        <Card>
          <CardTitulo titulo="Sua atuação no programa" descricao="Somente leitura: quem edita estes dados é o administrador." />
          <dl className="grid gap-4 p-5 sm:grid-cols-3">
            <div><dt className="text-[13px] font-medium text-tinta-suave">Área</dt><dd className="mt-1 text-sm font-semibold text-tinta">{pessoa.area || '—'}</dd></div>
            <div><dt className="text-[13px] font-medium text-tinta-suave">Nível</dt><dd className="mt-1 text-sm font-semibold text-tinta">{pessoa.nivel || '—'}</dd></div>
            <div><dt className="text-[13px] font-medium text-tinta-suave">Carga máxima</dt><dd className="mt-1 text-sm font-semibold text-tinta">{pessoa.cargaMax} h por semana</dd></div>
            <div className="sm:col-span-3">
              <dt className="text-[13px] font-medium text-tinta-suave">Habilidades</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {/* Estado vazio da lista: explica em vez de deixar o espaço em branco. */}
                {pessoa.habilidades.length === 0
                  ? <span className="text-sm text-tinta-suave">Nenhuma habilidade cadastrada ainda. Peça ao administrador para incluí-las.</span>
                  : pessoa.habilidades.map((h) => <Etiqueta key={h} tom="primaria">{h}</Etiqueta>)}
              </dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  );
}
